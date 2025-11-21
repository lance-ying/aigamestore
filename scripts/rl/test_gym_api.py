#!/usr/bin/env python3
"""
Test gym_api.js functionality in the browser.

This script tests if gym_api.js is properly integrated and working,
similar to the game testing infrastructure.

Usage:
    python test_gym_api.py public/games/snake-io
"""

import argparse
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def test_gym_api(game_dir: str, timeout: int = 30000):
    """Test if gym_api.js is working in the browser."""

    game_path = Path(game_dir)
    game_name = game_path.name

    # Start HTTP server
    import http.server
    import socketserver
    import threading
    import os

    os.chdir(Path.cwd() / "public")

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = socketserver.TCPServer(("", 8765), QuietHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print(f"✓ Server started on http://localhost:8765\n")

    # Launch browser
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Collect console messages
        console_messages = []
        errors = []

        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(str(err)))

        print(f"Testing: {game_name}")
        print("="*60)

        # Load game
        url = f"http://localhost:8765/games/{game_name}/index.html"
        print(f"Loading: {url}")

        try:
            await page.goto(url, wait_until="networkidle", timeout=timeout)
            print("✓ Page loaded\n")
        except Exception as e:
            print(f"✗ Failed to load page: {e}")
            await browser.close()
            return False

        # Wait for game to initialize
        await asyncio.sleep(2)

        # Check for errors
        if errors:
            print("✗ Page errors detected:")
            for err in errors[:5]:
                print(f"  - {err}")
            print()

        # Test 1: Check if gymAPI exists
        print("Test 1: Check if window.gymAPI exists")
        try:
            gym_api_exists = await page.evaluate("typeof window.gymAPI !== 'undefined'")
            if gym_api_exists:
                print("✓ window.gymAPI found\n")
            else:
                print("✗ window.gymAPI not found")
                print("   Available window properties:", await page.evaluate(
                    "Object.keys(window).filter(k => k.includes('gym') || k.includes('API')).join(', ')"
                ))
                await browser.close()
                return False
        except Exception as e:
            print(f"✗ Error checking gymAPI: {e}\n")
            await browser.close()
            return False

        # Test 2: Check API methods
        print("Test 2: Check API methods")
        try:
            methods = await page.evaluate("""
                Object.keys(window.gymAPI).filter(k => typeof window.gymAPI[k] === 'function')
            """)
            print(f"  Found methods: {', '.join(methods)}")

            required = ['reset', 'step', 'getState', 'getInfo']
            missing = [m for m in required if m not in methods]

            if missing:
                print(f"✗ Missing required methods: {', '.join(missing)}\n")
                await browser.close()
                return False
            else:
                print("✓ All required methods present\n")
        except Exception as e:
            print(f"✗ Error checking methods: {e}\n")
            await browser.close()
            return False

        # Test 3: Test reset() - with timeout
        print("Test 3: Test reset() function")
        try:
            # Set a timeout for reset
            reset_result = await asyncio.wait_for(
                page.evaluate("""
                    new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('reset() timed out after 5 seconds'));
                        }, 5000);

                        try {
                            console.log('[TEST] Calling window.gymAPI.reset()...');
                            const result = window.gymAPI.reset();
                            console.log('[TEST] reset() returned:', result);
                            clearTimeout(timeout);
                            resolve(result);
                        } catch (err) {
                            console.error('[TEST] reset() threw error:', err);
                            clearTimeout(timeout);
                            reject(err);
                        }
                    })
                """),
                timeout=10
            )

            print(f"  reset() returned: {reset_result}")

            if isinstance(reset_result, dict):
                if 'done' in reset_result and 'reward' in reset_result:
                    print("✓ reset() works correctly\n")
                else:
                    print(f"✗ reset() returned unexpected format: {reset_result}\n")
                    await browser.close()
                    return False
            else:
                print(f"✗ reset() returned non-dict: {reset_result}\n")
                await browser.close()
                return False

        except Exception as e:
            print(f"✗ reset() failed or timed out: {e}")
            print("\n  This usually means:")
            print("  - Game initialization is not working")
            print("  - window.initializeGameLevel is not exposed")
            print("  - Game entities are not being spawned")
            print()
            await browser.close()
            return False

        # Test 4: Test getState()
        print("Test 4: Test getState() function")
        try:
            state = await page.evaluate("window.gymAPI.getState()")
            print(f"  State keys: {list(state.keys()) if isinstance(state, dict) else 'Not a dict'}")

            if isinstance(state, dict) and 'player' in state:
                print("✓ getState() works correctly\n")
            else:
                print(f"✗ getState() returned unexpected format\n")
                await browser.close()
                return False
        except Exception as e:
            print(f"✗ getState() failed: {e}\n")
            await browser.close()
            return False

        # Test 5: Test step()
        print("Test 5: Test step() function")
        try:
            step_result = await page.evaluate("""
                window.gymAPI.step({left: false, right: true, boost: false})
            """)

            print(f"  step() returned: {step_result}")

            if isinstance(step_result, dict) and all(k in step_result for k in ['reward', 'done', 'info']):
                print("✓ step() works correctly\n")
            else:
                print(f"✗ step() returned unexpected format\n")
                await browser.close()
                return False
        except Exception as e:
            print(f"✗ step() failed: {e}\n")
            await browser.close()
            return False

        # Test 6: Test getInfo()
        print("Test 6: Test getInfo() function")
        try:
            info = await page.evaluate("window.gymAPI.getInfo()")
            print(f"  Info keys: {list(info.keys()) if isinstance(info, dict) else 'Not a dict'}")

            if isinstance(info, dict):
                print("✓ getInfo() works correctly\n")
            else:
                print(f"✗ getInfo() returned unexpected format\n")
                await browser.close()
                return False
        except Exception as e:
            print(f"✗ getInfo() failed: {e}\n")
            await browser.close()
            return False

        # Summary
        print("="*60)
        print("✅ All tests passed!")
        print("="*60)
        print("\nThe gym_api.js is working correctly.")
        print("You can now use gym_wrapper.py for RL training.")
        print()

        await browser.close()
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Test gym_api.js functionality"
    )
    parser.add_argument(
        "game_dir",
        help="Path to game directory (e.g., public/games/snake-io)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30000,
        help="Timeout in milliseconds (default: 30000)"
    )

    args = parser.parse_args()

    # Check if game_dir exists
    game_dir = Path(args.game_dir)
    if not game_dir.exists():
        print(f"❌ Error: Game directory not found: {game_dir}")
        sys.exit(1)

    if not (game_dir / "gym_api.js").exists():
        print(f"❌ Error: gym_api.js not found in {game_dir}")
        print(f"   Run: python scripts/rl/add_gym_api.py {game_dir}")
        sys.exit(1)

    # Run tests
    success = asyncio.run(test_gym_api(str(game_dir), args.timeout))

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
