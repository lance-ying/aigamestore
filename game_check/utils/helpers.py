import os
import json
import random
import logging
from typing import List, Dict, Any, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

def save_test_results(results: Dict[str, Any], game_path: str, test_name: str) -> str:
    """
    Save test results to a JSON file.
    
    Args:
        results: Test results dictionary
        game_path: Path to the game
        test_name: Name of the test
        
    Returns:
        Path to the saved file
    """
    # Create results directory
    results_dir = os.path.join(os.path.dirname(game_path), "game_check_results")
    os.makedirs(results_dir, exist_ok=True)
    
    # Save results to JSON file
    result_path = os.path.join(results_dir, f"{test_name}_results.json")
    with open(result_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    logging.info(f"Test results saved to {result_path}")
    return result_path

def generate_random_actions(num_actions: int = 10) -> List[str]:
    """
    Generate a sequence of random game actions using the allowed keys.
    
    Args:
        num_actions: Number of actions to generate
        
    Returns:
        List of key actions
    """
    # Define allowed keys
    allowed_keys = [
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        " ",  # Space
        "Shift",
        "q", "z", "x", "c",
        "Enter",  # Only for starting the game
        "r"  # Only for restarting the game
    ]
    
    # Generate random actions
    actions = []
    for _ in range(num_actions):
        # Add a 10% chance of NO_OP (sending a key not in the list)
        if random.random() < 0.1:
            actions.append("t")  # NO_OP key
        else:
            key = random.choice(allowed_keys)
            # Avoid using Enter/R in the middle of gameplay
            while key in ["Enter", "r"] and len(actions) > 0:
                key = random.choice(allowed_keys)
            actions.append(key)
    
    return actions

def find_html_file(game_path: str) -> str:
    """
    Find the main HTML file in the game directory.
    
    Args:
        game_path: Path to the game directory
        
    Returns:
        Path to the HTML file
    """
    # If game_path is already an HTML file, return it
    if os.path.isfile(game_path) and game_path.lower().endswith('.html'):
        return game_path
    
    # Look for index.html first
    index_path = os.path.join(game_path, "index.html")
    if os.path.exists(index_path):
        return index_path
    
    # Otherwise, look for any HTML file
    for file in os.listdir(game_path):
        if file.lower().endswith('.html'):
            return os.path.join(game_path, file)
    
    # No HTML file found
    logging.error(f"No HTML file found in {game_path}")
    return ""

def format_test_summary(results: Dict[str, Any]) -> str:
    """
    Format test results into a human-readable summary.
    
    Args:
        results: Test results dictionary
        
    Returns:
        Formatted summary string
    """
    summary = []
    
    # Add test result header
    if results.get("test_result", False):
        summary.append("✅ TEST PASSED")
    else:
        summary.append("❌ TEST FAILED")
    
    # Add error message if present
    if "error" in results:
        summary.append(f"Error: {results['error']}")
    
    # Add number of console errors if present
    if "console_errors" in results:
        errors = [err for err in results["console_errors"] if "error" in err.lower()]
        if errors:
            summary.append(f"Console errors: {len(errors)}")
            for err in errors[:3]:  # Show first few errors
                summary.append(f"  - {err}")
            if len(errors) > 3:
                summary.append(f"  - ... and {len(errors) - 3} more errors")
    
    # Add visual changes information if present
    if "visual_changes" in results:
        non_zero_diffs = [change for change in results["visual_changes"] if change.get("diff_score", 0) > 0.001]
        summary.append(f"Visual changes detected: {len(non_zero_diffs)}")
        for change in non_zero_diffs[:3]:
            diff_score = change.get('diff_score', 0)
            summary.append(f"  - {change['key']}: diff score {diff_score:.4f}")
        if len(non_zero_diffs) > 3:
            summary.append(f"  - ... and {len(non_zero_diffs) - 3} more changes")
    
    # Add information about random actions if present
    if "random_actions" in results:
        actions_with_changes = sum(1 for action in results["random_actions"] if action.get('diff_score', 0) > 0.001)
        summary.append(f"Random actions with visual changes: {actions_with_changes}/16")
    
    # Add screenshots information if present
    if "screenshots" in results:
        action_screenshots = [s for s in results["screenshots"] if "action_" in os.path.basename(s)]
        diff_screenshots = [s for s in results["screenshots"] if "diff_" in os.path.basename(s)]
        
        summary.append(f"Action screenshots saved: {len(action_screenshots)}")
        summary.append(f"Diff images generated: {len(diff_screenshots)}")
        
        # Show example filenames
        if action_screenshots:
            summary.append("Example action screenshots:")
            for screenshot in action_screenshots[:2]:
                summary.append(f"  - {os.path.basename(screenshot)}")
        
        if diff_screenshots:
            summary.append("Example diff images:")
            for diff in diff_screenshots[:2]:
                summary.append(f"  - {os.path.basename(diff)}")
    
    return "\n".join(summary) 