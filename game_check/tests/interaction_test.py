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
    if not results.get("test_result", False):
        error_messages = []
        
        # Collect errors from console logs
        if "console_logs" in results:
            # First check for error type messages
            if "error" in results["console_logs"]:
                error_messages.extend(results["console_logs"]["error"])
            
            # Also check for errors in non-error categories
            error_patterns = ["error", "undefined", "cannot read", "null", "is not defined", "typeerror"]
            for msg_type, messages in results["console_logs"].items():
                if msg_type != "error":  # Skip error type as we already processed it
                    for msg in messages:
                        if any(pattern in str(msg).lower() for pattern in error_patterns):
                            error_messages.append(f"{msg_type}: {msg}")
        
        # Also include errors from legacy console_errors field
        if "console_errors" in results:
            for err in results["console_errors"]:
                if err not in error_messages:
                    error_messages.append(err)
                    
        # Also check for structured_errors if available
        if "structured_errors" in results:
            for err in results["structured_errors"]:
                error_msg = err.get("message", "")
                if error_msg and error_msg not in error_messages:
                    error_messages.append(error_msg)
        
        # Check for specific gameState errors
        if "error" in results:
            error_text = results["error"]
            if "game did not start" in error_text.lower() or "p.gamestate" in error_text.lower():
                if error_text not in error_messages:
                    error_messages.append(error_text)
        
        # Add combined error message if we found any errors
        if error_messages:
            results["console_error_message"] = "\n".join(error_messages)
    
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