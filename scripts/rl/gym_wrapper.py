#!/usr/bin/env python3
"""
OpenAI Gym wrapper for p5.js games using Playwright browser automation.

This module provides a gymnasium-compatible interface for browser-based games,
leveraging the existing game server infrastructure.

Usage:
    from gym_wrapper import P5GameEnv

    env = P5GameEnv(game_name="snake-io")
    obs, info = env.reset()

    for _ in range(1000):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        if terminated or truncated:
            obs, info = env.reset()

    env.close()

Dependencies:
    pip install gymnasium numpy playwright
    playwright install chromium
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import gymnasium as gym
import numpy as np
from gymnasium import spaces
from playwright.async_api import async_playwright, Page, Browser


class P5GameEnv(gym.Env):
    """
    Gymnasium environment for p5.js browser-based games.

    This environment uses Playwright to control the game in a headless browser
    and provides a standard Gym interface for RL training.
    """

    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 60}

    def __init__(
        self,
        game_name: str = "snake-io",
        games_dir: str = "public/games",
        render_mode: Optional[str] = None,
        headless: bool = True,
        observation_type: str = "state",  # "state" or "pixels"
        max_episode_steps: int = 10000,
    ):
        """
        Initialize the game environment.

        Args:
            game_name: Name of the game directory in public/games/
            games_dir: Path to games directory
            render_mode: "human" or "rgb_array" for rendering
            headless: Run browser in headless mode
            observation_type: "state" for structured state, "pixels" for screenshots
            max_episode_steps: Maximum steps per episode
        """
        super().__init__()

        self.game_name = game_name
        self.games_dir = Path(games_dir)
        self.render_mode = render_mode
        self.headless = headless if render_mode != "human" else False
        self.observation_type = observation_type
        self.max_episode_steps = max_episode_steps

        # Start HTTP server for serving game files
        self._start_server_if_needed()

        # Game URL (via HTTP server, not file://)
        self.game_url = f"http://localhost:8765/games/{game_name}/index.html"

        # Playwright objects (initialized in _setup_browser)
        self.playwright = None
        self.browser = None
        self.page = None

        # Episode tracking
        self.current_step = 0
        self.episode_reward = 0

        # Define action space: [no-op, left, right, boost]
        self.action_space = spaces.Discrete(4)

        # Define observation space based on type
        if observation_type == "pixels":
            # RGB image observation
            self.observation_space = spaces.Box(
                low=0, high=255, shape=(400, 600, 3), dtype=np.uint8
            )
        else:
            # State-based observation (much faster for training)
            # This will be populated from the game's gymAPI
            # For snake-io: [player_x, player_y, player_angle, player_length,
            #                nearest_pellet_x, nearest_pellet_y, nearest_pellet_dist,
            #                nearest_enemy_x, nearest_enemy_y, nearest_enemy_dist,
            #                level, score]
            self.observation_space = spaces.Box(
                low=-np.inf, high=np.inf, shape=(12,), dtype=np.float32
            )

        # Initialize browser
        # Create a persistent event loop for async operations
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._setup_browser())

    async def _setup_browser(self):
        """Initialize Playwright and browser."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.page = await self.browser.new_page()

        # Listen for console messages and errors
        self.page.on("console", lambda msg: print(f"Browser console [{msg.type}]: {msg.text}"))
        self.page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        # Set viewport size
        await self.page.set_viewport_size({"width": 800, "height": 800})

        # Navigate to game
        await self.page.goto(self.game_url, wait_until="networkidle")

        # Wait for p5.js to load
        await self.page.wait_for_function("typeof window.p5 !== 'undefined'", timeout=10000)

        # Wait a bit for all modules to load
        await self.page.wait_for_timeout(2000)

        # Wait for game to load
        try:
            await self.page.wait_for_function("typeof window.gymAPI !== 'undefined'", timeout=15000)
        except Exception as e:
            # Debug: check what's on window
            window_props = await self.page.evaluate("Object.keys(window).filter(k => k.includes('gym') || k.includes('API') || k.includes('game'))")
            print(f"Debug - window properties containing 'gym/API/game': {window_props}")

            # Check console errors
            console_msgs = await self.page.evaluate("console.error ? 'Console available' : 'No console'")
            print(f"Debug - Console: {console_msgs}")

            raise Exception(f"gymAPI not found on window object after 15s. Available props: {window_props}")

        print(f"✓ Browser initialized for {self.game_name}")

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None) -> Tuple[np.ndarray, dict]:
        """
        Reset the environment to initial state.

        Returns:
            observation: Initial observation
            info: Additional information
        """
        super().reset(seed=seed)

        if seed is not None:
            # Set seed in browser if needed
            self.loop.run_until_complete(self.page.evaluate(f"Math.seedrandom({seed})"))

        # Reset game via gymAPI
        result = self.loop.run_until_complete(self.page.evaluate("window.gymAPI.reset()"))

        self.current_step = 0
        self.episode_reward = 0

        observation = self._get_observation()
        info = self._get_info()

        return observation, info

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, dict]:
        """
        Execute one step in the environment.

        Args:
            action: Action to take (0=no-op, 1=left, 2=right, 3=boost)

        Returns:
            observation: Next observation
            reward: Reward for this step
            terminated: Whether episode ended (win/lose)
            truncated: Whether episode was truncated (max steps)
            info: Additional information
        """
        self.current_step += 1

        # Convert action to game input
        action_map = {
            0: {"left": False, "right": False, "boost": False},  # no-op
            1: {"left": True, "right": False, "boost": False},   # left
            2: {"left": False, "right": True, "boost": False},   # right
            3: {"left": False, "right": False, "boost": True},   # boost
        }

        game_action = action_map[action]

        # Execute step in game
        result = self.loop.run_until_complete(
            self.page.evaluate(f"window.gymAPI.step({json.dumps(game_action)})")
        )

        observation = self._get_observation()
        reward = float(result.get("reward", 0))
        terminated = bool(result.get("done", False))
        truncated = self.current_step >= self.max_episode_steps
        info = self._get_info()

        self.episode_reward += reward

        return observation, reward, terminated, truncated, info

    def _get_observation(self) -> np.ndarray:
        """Get current observation from the game."""
        if self.observation_type == "pixels":
            # Take screenshot
            screenshot_bytes = self.loop.run_until_complete(
                self.page.locator("canvas").screenshot()
            )
            # Convert to numpy array
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(screenshot_bytes))
            obs = np.array(img)[:, :, :3]  # Remove alpha channel
            return obs
        else:
            # Get structured state
            state = self.loop.run_until_complete(self.page.evaluate("window.gymAPI.getState()"))
            return self._state_dict_to_array(state)

    def _state_dict_to_array(self, state: Dict[str, Any]) -> np.ndarray:
        """
        Convert state dictionary to numpy array.

        For snake-io, the state includes:
        - player position (x, y)
        - player angle
        - player length
        - nearest pellet (x, y, distance)
        - nearest enemy (x, y, distance)
        - level, score
        """
        player = state.get("player", {})
        nearest_pellet = state.get("nearestPellet", {})
        nearest_enemy = state.get("nearestEnemy", {})

        obs = np.array([
            player.get("x", 0),
            player.get("y", 0),
            player.get("angle", 0),
            player.get("length", 0),
            nearest_pellet.get("x", 0),
            nearest_pellet.get("y", 0),
            nearest_pellet.get("distance", 0),
            nearest_enemy.get("x", 0),
            nearest_enemy.get("y", 0),
            nearest_enemy.get("distance", 0),
            state.get("level", 0),
            state.get("score", 0),
        ], dtype=np.float32)

        return obs

    def _get_info(self) -> dict:
        """Get additional information from the game."""
        try:
            info = self.loop.run_until_complete(self.page.evaluate("window.gymAPI.getInfo()"))
            info["episode_step"] = self.current_step
            info["episode_reward"] = self.episode_reward
            return info
        except Exception as e:
            return {
                "episode_step": self.current_step,
                "episode_reward": self.episode_reward,
                "error": str(e)
            }

    def render(self):
        """Render the environment (for human mode)."""
        if self.render_mode == "rgb_array":
            return self._get_observation() if self.observation_type == "pixels" else None
        # In human mode, the browser window is already visible
        return None

    def _start_server_if_needed(self):
        """Start HTTP server if not already running."""
        if not hasattr(P5GameEnv, '_server') or P5GameEnv._server is None:
            import http.server
            import socketserver
            import threading
            import os

            # Change to public directory
            os.chdir(Path.cwd() / "public")

            class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
                def log_message(self, format, *args):
                    pass  # Suppress logs

            try:
                P5GameEnv._server = socketserver.TCPServer(("", 8765), QuietHTTPRequestHandler)
                P5GameEnv._server_thread = threading.Thread(target=P5GameEnv._server.serve_forever, daemon=True)
                P5GameEnv._server_thread.start()
                print(f"✓ Game server started on http://localhost:8765")
            except OSError as e:
                print(f"Warning: Could not start game server: {e}")

    def close(self):
        """Close the environment and cleanup resources."""
        if self.browser:
            self.loop.run_until_complete(self.browser.close())
        if self.playwright:
            self.loop.run_until_complete(self.playwright.stop())
        if self.loop:
            self.loop.close()
        print(f"✓ Environment closed")

    _server = None
    _server_thread = None


class GameServerMixin:
    """
    Mixin class to start/stop the game server (from fix_game_gui.py).

    This allows the Gym environment to manage the game server lifecycle.
    """

    _server = None
    _server_thread = None

    @classmethod
    def start_server(cls, port: int = 8765, games_dir: str = "public"):
        """Start the game server (if not already running)."""
        import http.server
        import socketserver
        import threading
        import os

        if cls._server is not None:
            return  # Already running

        # Change to public directory
        os.chdir(Path(games_dir))

        class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                pass

        try:
            cls._server = socketserver.TCPServer(("", port), QuietHTTPRequestHandler)
            cls._server_thread = threading.Thread(target=cls._server.serve_forever, daemon=True)
            cls._server_thread.start()
            print(f"✓ Game server started on http://localhost:{port}")
        except OSError as e:
            print(f"Warning: Could not start game server on port {port}: {e}")

    @classmethod
    def stop_server(cls):
        """Stop the game server."""
        if cls._server:
            cls._server.shutdown()
            cls._server = None
            cls._server_thread = None
            print("✓ Game server stopped")


def main():
    """Example usage of the Gym wrapper."""
    print("\n" + "="*60)
    print("P5.js Game Gym Wrapper - Test")
    print("="*60 + "\n")

    # Create environment
    env = P5GameEnv(
        game_name="snake-io",
        render_mode=None,  # Set to "human" to see the game
        observation_type="state",
        max_episode_steps=1000,
    )

    print(f"Action space: {env.action_space}")
    print(f"Observation space: {env.observation_space}\n")

    # Run a few episodes
    num_episodes = 3

    for episode in range(num_episodes):
        obs, info = env.reset()
        episode_reward = 0
        done = False
        step = 0

        print(f"Episode {episode + 1}/{num_episodes}")

        while not done and step < 500:
            # Random action
            action = env.action_space.sample()
            obs, reward, terminated, truncated, info = env.step(action)

            episode_reward += reward
            done = terminated or truncated
            step += 1

            if step % 100 == 0:
                print(f"  Step {step}, Reward: {episode_reward:.2f}, Score: {info.get('score', 0)}")

        print(f"  Episode finished: {step} steps, Total Reward: {episode_reward:.2f}\n")

    env.close()
    print("\n" + "="*60)
    print("Test completed!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
