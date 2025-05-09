import os
import logging
import asyncio
from typing import Dict, Any

from ..browser.controller import GameBrowserController
from ..utils.helpers import save_test_results, find_html_file, format_test_summary

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

async def check_game_loads_async(game_path: str) -> Dict[str, Any]:
    """
    Check if the game loads correctly with no errors.
    
    Args:
        game_path: Path to the game directory or HTML file
        
    Returns:
        Dictionary with test results
    """
    # Find the HTML file if game_path is a directory
    if os.path.isdir(game_path):
        html_file = find_html_file(game_path)
        if not html_file:
            return {
                "test_result": False,
                "error": f"No HTML file found in {game_path}"
            }
        game_path = html_file
    
    # Run the test
    async with GameBrowserController(game_path) as browser:
        results = await browser.check_game_loads()
    
    # Add console error message if test failed and not already present
    if not results.get("test_result", False) and not "console_error_message" in results:
        # Check all console logs for error messages
        error_messages = []
        if "console_logs" in results:
            for msg_type, messages in results["console_logs"].items():
                for msg in messages:
                    if "error" in msg.lower():
                        error_messages.append(msg)
        elif "console_errors" in results:
            # Fallback to legacy field
            for err in results["console_errors"]:
                if "error" in err.lower():
                    error_messages.append(err)
                    
        if error_messages:
            results["console_error_message"] = "\n".join(error_messages)
    
    # Save results
    save_test_results(results, game_path, "load_test")
    
    return results

def check_game_loads(game_path: str) -> Dict[str, Any]:
    """
    Synchronous wrapper for check_game_loads_async.
    
    Args:
        game_path: Path to the game directory or HTML file
        
    Returns:
        Dictionary with test results
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(check_game_loads_async(game_path))

def report_load_test(results: Dict[str, Any]) -> None:
    """
    Print a report of the load test results.
    
    Args:
        results: Test results dictionary
    """
    summary = format_test_summary(results)
    print("\n" + "="*50)
    print("GAME LOAD TEST RESULTS")
    print("="*50)
    print(summary)
    print("="*50 + "\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m game_check.tests.load_test <game_path>")
        sys.exit(1)
        
    game_path = sys.argv[1]
    results = check_game_loads(game_path)
    report_load_test(results)
    
    # Exit with appropriate status code
    sys.exit(0 if results.get("test_result", False) else 1) 