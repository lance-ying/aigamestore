"""
VLM Baseline for Game Playing

This module provides a baseline implementation for playing browser-based games
using Vision-Language Models (VLMs). Supports multiple model providers:
- OpenAI (GPT-5, GPT-4o)
- Anthropic (Claude with vision)
- Google (Gemini)
- Together AI (Llama Vision, Qwen VL)
"""

import os
import sys
import time
import base64
import argparse
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class VLMGamePlayer:
    """Vision-Language Model based game player with trace/history support."""
    
    # Supported model providers and their vision models
    SUPPORTED_MODELS = {
        "openai": ["gpt-4o", "gpt-4o-mini"],
        "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
        "google": ["gemini-2.5-flash", "gemini-2.5-flash-preview-04-17", "gemini-1.5-pro", "gemini-1.5-flash"],
        "together": ["meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo", "Qwen/Qwen2-VL-72B-Instruct"],
    }
    
    def __init__(
        self,
        model_name: str = "openai:gpt-4o",
        game_url: str = "https://aigamestore.org/play/6",
        allowed_keys: list[str] = None,
        headless: bool = True,
        max_turns: int = 100,
        turn_delay: float = 1.0,
    ):
        """
        Initialize the VLM Game Player.
        
        Args:
            model_name: Model identifier in format "provider:model" (e.g., "openai:gpt-4o")
            game_url: URL of the game to play
            allowed_keys: List of allowed keyboard keys
            headless: Whether to run browser in headless mode
            max_turns: Maximum number of turns to play
            turn_delay: Delay in seconds between turns
        """
        self.game_url = game_url
        self.allowed_keys = allowed_keys or ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]
        self.headless = headless
        self.max_turns = max_turns
        self.turn_delay = turn_delay
        
        # Parse model name
        self.provider, self.model = self._parse_model_name(model_name)
        
        # Initialize client
        self.client = self._initialize_client()
        
        # Initialize action history for trace
        self.action_history: list[Dict[str, Any]] = []
        
        # Check if this is a public_platform game
        self.is_public_platform = self._is_public_platform_game(game_url)
        
        logger.info(f"Initialized VLM Game Player with {self.provider}:{self.model}")
        if self.is_public_platform:
            logger.info("Detected public_platform game - will capture canvas only")
    
    def _is_public_platform_game(self, game_url: str) -> bool:
        """
        Check if the game URL is from the public_platform directory.
        
        Args:
            game_url: URL of the game
            
        Returns:
            True if it's a public_platform game, False otherwise
        """
        return "public_platform" in game_url
    
    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse model name into provider and model."""
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.lower(), model
        # Default to OpenAI if no provider specified
        return "openai", model_name
    
    def _initialize_client(self) -> Any:
        """Initialize the appropriate API client based on provider."""
        if self.provider == "openai":
            if OpenAI is None:
                raise ImportError("openai package required. Install: pip install openai")
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            return OpenAI(api_key=api_key)
        
        elif self.provider == "anthropic":
            if anthropic is None:
                raise ImportError("anthropic package required. Install: pip install anthropic")
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")
            return anthropic.Anthropic(api_key=api_key)
        
        elif self.provider == "google":
            if genai is None:
                raise ImportError("google-genai package required. Install: pip install google-genai")
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable not set")
            return genai.Client(api_key=api_key)
        
        elif self.provider == "together":
            if OpenAI is None:
                raise ImportError("openai package required for Together AI. Install: pip install openai")
            api_key = os.getenv("TOGETHER_API_KEY")
            if not api_key:
                raise ValueError("TOGETHER_API_KEY environment variable not set")
            return OpenAI(
                api_key=api_key,
                base_url="https://api.together.xyz/v1"
            )
        
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    
    def _build_prompt_with_history(self) -> str:
        """Build a prompt that includes the action history."""
        if not self.action_history:
            prompt = (
                f"You are an expert AI playing a game. This is the first screenshot. "
                f"Analyze the current state and decide the best action.\n\n"
            )
        else:
            prompt = (
                f"You are an expert AI playing a game. You have played {len(self.action_history)} turn(s) so far.\n"
                f"Here is the history of your actions:\n"
            )
            for i, entry in enumerate(self.action_history):
                prompt += f"Turn {i}: Action taken = {entry['action']}\n"
            prompt += f"\nNow at turn {len(self.action_history)}, analyze the current screenshot and decide the next action.\n\n"
        
        prompt += (
            f"What is the single best keyboard press to make right now?\n"
            f"Your only possible answers are: {', '.join(self.allowed_keys)}.\n"
            f"Respond with ONLY the key name and absolutely nothing else.\n"
            f"For example: ArrowUp"
        )
        return prompt
    
    def get_action_from_llm(self, image_path: str, include_history: bool = True) -> Optional[str]:
        """
        Get the next action from the VLM based on a screenshot and history.
        
        Args:
            image_path: Path to the current screenshot image
            include_history: Whether to include past screenshots in the context
            
        Returns:
            The keyboard action to take, or None if invalid/error
        """
        try:
            logger.info(f"📸 Screenshot captured. Asking the AI for the next move (turn {len(self.action_history)})...")
            
            # Build prompt with history
            prompt = self._build_prompt_with_history()
            
            # Prepare current image
            current_image_b64 = self._encode_image(image_path)
            
            action = None
            
            if self.provider == "openai" or self.provider == "together":
                # Build content with all images (history + current)
                content = []
                
                # Add history images and actions
                if include_history:
                    for i, entry in enumerate(self.action_history):
                        hist_img_b64 = self._encode_image(entry['screenshot_path'])
                        content.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{hist_img_b64}"}
                        })
                        content.append({
                            "type": "text",
                            "text": f"[Turn {i}] After this screenshot, you took action: {entry['action']}"
                        })
                
                # Add current image
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{current_image_b64}"}
                })
                content.append({"type": "text", "text": f"[Current Turn {len(self.action_history)}]\n{prompt}"})
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": content}],
                    max_tokens=10,
                )
                action = response.choices[0].message.content.strip()
            
            elif self.provider == "anthropic":
                # Build content with all images
                content = []
                
                # Add history images and actions
                if include_history:
                    for i, entry in enumerate(self.action_history):
                        hist_img_b64 = self._encode_image(entry['screenshot_path'])
                        content.append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": hist_img_b64,
                            },
                        })
                        content.append({
                            "type": "text",
                            "text": f"[Turn {i}] After this screenshot, you took action: {entry['action']}"
                        })
                
                # Add current image
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": current_image_b64,
                    },
                })
                content.append({"type": "text", "text": f"[Current Turn {len(self.action_history)}]\n{prompt}"})
                
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=10,
                    messages=[{"role": "user", "content": content}],
                )
                
                # Check for empty response
                if not response.content or not hasattr(response.content[0], "text") or not response.content[0].text:
                    logger.error(f"❌ Anthropic returned empty response. Response: {response}")
                    return None
                
                action = response.content[0].text.strip()
            
            elif self.provider == "google":
                # Build parts with all images
                parts = []
                
                # Add history images and actions
                if include_history:
                    for i, entry in enumerate(self.action_history):
                        hist_img_b64 = self._encode_image(entry['screenshot_path'])
                        parts.append(types.Part.from_bytes(
                            data=base64.b64decode(hist_img_b64),
                            mime_type="image/png"
                        ))
                        parts.append(types.Part.from_text(
                            text=f"[Turn {i}] After this screenshot, you took action: {entry['action']}"
                        ))
                
                # Add current image
                parts.append(types.Part.from_bytes(
                    data=base64.b64decode(current_image_b64),
                    mime_type="image/png"
                ))
                parts.append(types.Part.from_text(text=f"[Current Turn {len(self.action_history)}]\n{prompt}"))
                
                contents = [types.Content(role="user", parts=parts)]
                config = types.GenerateContentConfig(
                    response_mime_type="text/plain",
                    max_output_tokens=200,  # Increased significantly to account for thoughts tokens (49+) + actual output
                )
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )
                
                # Try multiple ways to extract text from response
                response_text = None
                
                # Method 1: Direct text attribute
                if hasattr(response, "text") and response.text:
                    response_text = response.text
                
                # Method 2: Extract from candidates[0].content.parts[0].text
                if not response_text:
                    candidates = getattr(response, "candidates", [])
                    if candidates and len(candidates) > 0:
                        candidate = candidates[0]
                        content = getattr(candidate, "content", None)
                        if content:
                            parts = getattr(content, "parts", [])
                            if parts and len(parts) > 0:
                                part = parts[0]
                                if hasattr(part, "text") and part.text:
                                    response_text = part.text
                
                # Check for safety blocks or errors
                if response_text is None or not response_text.strip():
                    # Check for safety filter blocks
                    prompt_feedback = getattr(response, "prompt_feedback", None)
                    if prompt_feedback:
                        block_reason = getattr(prompt_feedback, "block_reason", None)
                        if block_reason:
                            logger.warning(f"⚠️ Gemini blocked response due to: {block_reason}")
                    
                    # Check candidates for safety ratings and finish reasons
                    candidates = getattr(response, "candidates", [])
                    if candidates:
                        for i, candidate in enumerate(candidates):
                            finish_reason = getattr(candidate, "finish_reason", None)
                            safety_ratings = getattr(candidate, "safety_ratings", None)
                            if finish_reason:
                                logger.warning(f"⚠️ Candidate {i} finish_reason: {finish_reason}")
                            if safety_ratings:
                                logger.warning(f"⚠️ Candidate {i} safety_ratings: {safety_ratings}")
                    
                    # Log full response structure for debugging
                    logger.error(f"❌ Gemini returned empty/None response.")
                    logger.error(f"Response type: {type(response)}")
                    logger.error(f"Response attributes: {[attr for attr in dir(response) if not attr.startswith('_')]}")
                    if hasattr(response, "candidates") and response.candidates:
                        logger.error(f"Candidates: {response.candidates}")
                    return None
                
                action = response_text.strip()
            
            logger.info(f"🤖 AI chose action: {action}")
            
            # Validate action
            if action in self.allowed_keys:
                return action
            else:
                logger.warning(f"⚠️ LLM returned invalid action '{action}'. Skipping turn.")
                return None
        
        except Exception as e:
            logger.error(f"❌ Error calling LLM: {e}")
            return None

    def _find_canvas(self, page: Page):
        """
        Find a <canvas> element either on the main page or inside any iframe.
        
        Args:
            page: Playwright page object
            
        Returns:
            Canvas locator
            
        Raises:
            RuntimeError: If canvas not found
        """
        # Try directly on the main page
        try:
            main_canvas = page.locator("canvas").first
            main_canvas.wait_for(state="visible", timeout=1500)
            logger.info("Found canvas on main page")
            return main_canvas
        except Exception:
            pass

        # Search across all frames
        for frame in page.frames:
            try:
                frame_canvas = frame.locator("canvas").first
                frame_canvas.wait_for(state="visible", timeout=1500)
                logger.info("Found canvas in iframe")
                return frame_canvas
            except Exception:
                continue

        raise RuntimeError("Canvas element not found on page or within iframes")
    
    def play(self, screenshot_dir: str = ".", include_history: bool = True) -> Dict[str, Any]:
        """
        Play the game using the VLM.
        
        Args:
            screenshot_dir: Directory to save screenshots
            include_history: Whether to include past screenshots/actions in each LLM call
            
        Returns:
            Dictionary containing game statistics
        """
        screenshot_path = Path(screenshot_dir)
        screenshot_path.mkdir(exist_ok=True, parents=True)
        
        # Reset history for new game
        self.action_history = []
        
        stats = {
            "turns": 0,
            "valid_actions": 0,
            "invalid_actions": 0,
            "errors": 0,
            "start_time": time.time(),
            "history": [],  # Store full trace
        }
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            page = browser.new_page()
            
            try:
                logger.info(f"Loading game from {self.game_url}")
                page.goto(self.game_url, wait_until="domcontentloaded")
                
                logger.info("Locating canvas...")
                canvas = self._find_canvas(page)
                
                # Ensure canvas can receive focus
                try:
                    canvas.evaluate(
                        "el => { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0'); }"
                    )
                except Exception:
                    pass
                
                canvas.click()
                logger.info("Canvas focused and ready")
                
                # Optional: Initial setup (e.g., press Enter to start)
                canvas.press("Enter")
                time.sleep(0.5)
                
                # Main game loop
                for turn in range(self.max_turns):
                    stats["turns"] = turn + 1
                    
                    # Take screenshot
                    screenshot_file = screenshot_path / f"turn_{turn:04d}.png"
                    
                    # For public_platform games, capture only the canvas
                    # For other games, capture the full page
                    if self.is_public_platform:
                        canvas.screenshot(path=str(screenshot_file))
                    else:
                        page.screenshot(path=str(screenshot_file))
                    
                    # Get action from VLM (with history if enabled)
                    action = self.get_action_from_llm(str(screenshot_file), include_history=include_history)
                    
                    if action:
                        # Execute action
                        try:
                            canvas.press(action)
                            stats["valid_actions"] += 1
                            logger.info(f"Turn {turn + 1}: Executed {action}")
                            
                            # Record in history for future context
                            history_entry = {
                                "turn": turn,
                                "screenshot_path": str(screenshot_file),
                                "action": action,
                                "valid": True,
                            }
                            self.action_history.append(history_entry)
                            stats["history"].append(history_entry)
                            
                        except Exception as e:
                            logger.error(f"Failed to execute action {action}: {e}")
                            stats["errors"] += 1
                            
                            # Still record the failed action
                            history_entry = {
                                "turn": turn,
                                "screenshot_path": str(screenshot_file),
                                "action": action,
                                "valid": False,
                                "error": str(e),
                            }
                            self.action_history.append(history_entry)
                            stats["history"].append(history_entry)
                    else:
                        stats["invalid_actions"] += 1
                        
                        # Record invalid action
                        history_entry = {
                            "turn": turn,
                            "screenshot_path": str(screenshot_file),
                            "action": None,
                            "valid": False,
                        }
                        stats["history"].append(history_entry)
                    
                    # Wait before next turn
                    time.sleep(self.turn_delay)
                
                logger.info(f"Finished playing after {stats['turns']} turns")
                logger.info(f"Action history length: {len(self.action_history)}")
                
            except Exception as e:
                logger.error(f"Error during gameplay: {e}")
                stats["errors"] += 1
            
            finally:
                stats["end_time"] = time.time()
                stats["duration"] = stats["end_time"] - stats["start_time"]
                browser.close()
        
        return stats


def main():
    """Main entry point with CLI support."""
    parser = argparse.ArgumentParser(
        description="Play browser games using Vision-Language Models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Play with GPT-4o (with history)
  python vlm.py --model openai:gpt-4o --game-url https://aigamestore.org/play/6
  
  # Play with Claude 3.5 Sonnet (no history - each turn independent)
  python vlm.py --model anthropic:claude-3-5-sonnet-20241022 --no-history
  
  # Play with Gemini
  python vlm.py --model google:gemini-2.5-flash
  
  # Play with Together AI (Llama Vision)
  python vlm.py --model together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo
  
  # Non-headless mode with custom settings
  python vlm.py --model openai:gpt-4o --no-headless --max-turns 50 --turn-delay 2.0
        """
    )
    
    parser.add_argument(
        "--model",
        type=str,
        default="openai:gpt-4o",
        help="Model to use in format 'provider:model' (default: openai:gpt-4o)"
    )
    parser.add_argument(
        "--game-url",
        type=str,
        default="https://aigamestore.org/play/6",
        help="URL of the game to play"
    )
    parser.add_argument(
        "--allowed-keys",
        type=str,
        nargs="+",
        default=["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Enter"],
        help="List of allowed keyboard keys"
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Run browser in non-headless mode (visible)"
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=100,
        help="Maximum number of turns to play (default: 100)"
    )
    parser.add_argument(
        "--turn-delay",
        type=float,
        default=1.0,
        help="Delay in seconds between turns (default: 1.0)"
    )
    parser.add_argument(
        "--screenshot-dir",
        type=str,
        default="./screenshots",
        help="Directory to save screenshots (default: ./screenshots)"
    )
    parser.add_argument(
        "--no-history",
        action="store_true",
        help="Disable history (don't pass past screenshots/actions to the model)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Initialize player
    player = VLMGamePlayer(
        model_name=args.model,
        game_url=args.game_url,
        allowed_keys=args.allowed_keys,
        headless=not args.no_headless,
        max_turns=args.max_turns,
        turn_delay=args.turn_delay,
    )
    
    # Play game
    logger.info("Starting game...")
    if args.no_history:
        logger.info("History disabled - each turn is independent")
    else:
        logger.info("History enabled - model will see all past screenshots and actions")
    
    stats = player.play(
        screenshot_dir=args.screenshot_dir,
        include_history=not args.no_history
    )
    
    # Print statistics
    logger.info("\n" + "="*50)
    logger.info("Game Statistics:")
    logger.info(f"  Total turns: {stats['turns']}")
    logger.info(f"  Valid actions: {stats['valid_actions']}")
    logger.info(f"  Invalid actions: {stats['invalid_actions']}")
    logger.info(f"  Errors: {stats['errors']}")
    logger.info(f"  Duration: {stats['duration']:.2f} seconds")
    logger.info(f"  Success rate: {stats['valid_actions'] / max(stats['turns'], 1) * 100:.1f}%")
    logger.info(f"  History entries: {len(stats.get('history', []))}")
    logger.info("="*50)


if __name__ == "__main__":
    main()

