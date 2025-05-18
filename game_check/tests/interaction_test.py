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

async def test_game_interaction_async(game_path: str) -> Dict[str, Any]:
    """
    Test game interaction by starting the game and performing inputs.
    
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
        results = await browser.test_game_interaction()
    
    # Add console error message if test failed
    if not results.get("test_result", False) and "console_errors" in results:
        errors = [err for err in results["console_errors"] if "error" in err.lower()]
        if errors:
            results["console_error_message"] = "\n".join(errors)
    
    # Save results
    save_test_results(results, game_path, "interaction_test")
    
    return results

def test_game_interaction(game_path: str) -> Dict[str, Any]:
    """
    Synchronous wrapper for test_game_interaction_async.
    
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
        
    return loop.run_until_complete(test_game_interaction_async(game_path))

def report_interaction_test(results: Dict[str, Any]) -> None:
    """
    Print a report of the interaction test results.
    
    Args:
        results: Test results dictionary
    """
    summary = format_test_summary(results)
    print("\n" + "="*50)
    print("GAME INTERACTION TEST RESULTS")
    print("="*50)
    print(summary)
    print("="*50 + "\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m game_check.tests.interaction_test <game_path>")
        sys.exit(1)
        
    game_path = sys.argv[1]
    results = test_game_interaction(game_path)
    report_interaction_test(results)
    
    # Exit with appropriate status code
    sys.exit(0 if results.get("test_result", False) else 1) 