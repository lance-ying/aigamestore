#!/usr/bin/env python3
"""
Self-contained script to test all games and report failures.

Usage:
    python test_all_games.py
    python test_all_games.py --output results.json
    python test_all_games.py --duration 5 --timeout 15
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import the basic test evaluator
from evaluators.basic_test.core.basic_test import test_game


def extract_title_from_metadata(metadata_path: Path) -> Optional[str]:
    """Extract title from metadata.json file, returns None if no title found."""
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Check game_info.title first
        if metadata.get('game_info', {}).get('title'):
            title = metadata['game_info']['title']
            if title and title != 'Untitled Game':
                return title
        
        # Try to parse concept for game_name
        concept = metadata.get('game_info', {}).get('concept')
        if concept:
            try:
                if isinstance(concept, str):
                    concept_data = json.loads(concept)
                else:
                    concept_data = concept
                
                if concept_data.get('game_name'):
                    return concept_data['game_name']
            except (json.JSONDecodeError, AttributeError):
                pass
        
        return None
    except Exception:
        return None


def find_game_files_path(game_dir: Path) -> Optional[Path]:
    """
    Navigate through nested structure to find actual game files.
    Structure: gamename/sample_0/game_0000/sample_0/ OR gamename/index.html
    """
    # Check if index.html exists directly
    if (game_dir / "index.html").exists():
        return game_dir
    
    # Navigate through nested structure: gamename/sample_0/game_0000/sample_0/
    sample_dirs = [d for d in game_dir.iterdir() if d.is_dir() and d.name.startswith('sample')]
    
    if not sample_dirs:
        return None
    
    sample_path = sample_dirs[0]
    game_dirs = [d for d in sample_path.iterdir() if d.is_dir() and d.name.startswith('game')]
    
    if not game_dirs:
        # Maybe index.html is at sample level
        if (sample_path / "index.html").exists():
            return sample_path
        return None
    
    game_path = game_dirs[0]
    inner_sample_dirs = [d for d in game_path.iterdir() if d.is_dir() and d.name.startswith('sample')]
    
    if not inner_sample_dirs:
        # Maybe index.html is at game level
        if (game_path / "index.html").exists():
            return game_path
        return None
    
    final_path = inner_sample_dirs[0]
    if (final_path / "index.html").exists():
        return final_path
    
    return None


def find_all_games(games_dir: str = "games", require_title: bool = False) -> List[Path]:
    """
    Find all game directories that contain an index.html file.
    
    Args:
        games_dir: Directory containing game folders
        require_title: If True, only include games with a title in metadata.json
    """
    games_path = Path(games_dir)
    if not games_path.exists():
        print(f"Error: Games directory '{games_dir}' does not exist")
        return []
    
    game_dirs = []
    
    # Look for game directories (exclude special directories)
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip special directories and backup directories
        if item.name.startswith('.') or item.name.startswith('single_prompt') or '_backup_' in item.name:
            continue
        
        # Find the actual game files path (handles nested structure)
        game_files_path = find_game_files_path(item)
        
        if game_files_path is None:
            continue
        
        # If require_title is True, check for title in metadata
        if require_title:
            metadata_path = game_files_path / "metadata.json"
            if not metadata_path.exists():
                continue
            
            title = extract_title_from_metadata(metadata_path)
            if title is None:
                continue
        
        game_dirs.append(game_files_path)
    
    return sorted(game_dirs)


def categorize_failure(result: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze test result and categorize the failure."""
    failure_info = {
        "status": "PASS",
        "reasons": [],
        "details": {}
    }
    
    # Check if test passed overall
    if result.get("test_result"):
        return failure_info
    
    failure_info["status"] = "FAIL"
    
    # Check specific failure points
    if not result.get("loaded"):
        failure_info["reasons"].append("Failed to load")
        failure_info["details"]["load_error"] = result.get("error", "Unknown load error")
        
        # Include page errors if any
        page_errors = result.get("page_errors", [])
        if page_errors:
            failure_info["details"]["page_errors"] = page_errors[:5]  # First 5 errors
        
        return failure_info
    
    # Game loaded, check start behavior
    start_info = result.get("start_on_enter", {})
    if not start_info.get("passed"):
        failure_info["reasons"].append("Start on Enter failed")
        failure_info["details"]["start_on_enter"] = {
            "phase_before": start_info.get("phase_before"),
            "phase_after": start_info.get("phase_after"),
            "phase_changed": start_info.get("phase_changed"),
            "visual_changed": start_info.get("visual_changed"),
        }
    
    # Check interaction
    interaction_info = result.get("interaction", {})
    if not interaction_info.get("passed"):
        failure_info["reasons"].append("Interaction failed")
        failure_info["details"]["interaction"] = {
            "state_changed": interaction_info.get("state_changed"),
            "visual_changed": interaction_info.get("visual_changed"),
        }
    
    # Check for page errors even if loaded
    page_errors = result.get("page_errors", [])
    if page_errors:
        failure_info["reasons"].append(f"Page errors ({len(page_errors)})")
        failure_info["details"]["page_errors"] = page_errors[:5]
    
    # Check for console errors
    console_errors = result.get("console_errors", {})
    if console_errors:
        error_msgs = console_errors.get("error", [])
        if error_msgs:
            failure_info["reasons"].append(f"Console errors ({len(error_msgs)})")
            failure_info["details"]["console_errors"] = error_msgs[:5]
    
    # Check for HTTP failures
    request_failures = result.get("request_failures", [])
    if request_failures:
        failure_info["reasons"].append(f"HTTP failures ({len(request_failures)})")
        failure_info["details"]["request_failures"] = request_failures[:3]
    
    return failure_info


def test_all_games(
    games_dir: str = "games",
    duration: int = 10,
    timeout: int = 20,
    debug: bool = False,
    verbose: bool = False,
    require_title: bool = False
) -> Dict[str, Any]:
    """Test all games and return comprehensive results."""
    
    filter_msg = " (with titles only)" if require_title else ""
    print(f"Searching for games in '{games_dir}'{filter_msg}...")
    game_dirs = find_all_games(games_dir, require_title=require_title)
    
    if not game_dirs:
        print("No games found!")
        return {"total": 0, "passed": 0, "failed": 0, "games": []}
    
    print(f"Found {len(game_dirs)} games to test\n")
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "total": len(game_dirs),
        "passed": 0,
        "failed": 0,
        "games": []
    }
    
    for idx, game_dir in enumerate(game_dirs, 1):
        game_name = game_dir.name
        game_path_str = str(game_dir)
        
        # Extract title if metadata exists
        game_title = None
        metadata_path = game_dir / "metadata.json"
        if metadata_path.exists():
            game_title = extract_title_from_metadata(metadata_path)
        
        display_name = game_title or game_name
        print(f"[{idx}/{len(game_dirs)}] Testing: {display_name}...", end=" ", flush=True)
        
        try:
            # Run the basic test
            test_result = test_game(
                game_path_str,
                duration=duration,
                timeout=timeout,
                debug=debug,
                save_dir=None  # Don't save artifacts during batch testing
            )
            
            # Categorize the result
            failure_info = categorize_failure(test_result)
            
            game_result = {
                "name": game_name,
                "title": game_title,
                "path": game_path_str,
                "status": failure_info["status"],
                "test_result": test_result.get("test_result", False),
                "loaded": test_result.get("loaded", False),
                "failure_info": failure_info
            }
            
            results["games"].append(game_result)
            
            if failure_info["status"] == "PASS":
                results["passed"] += 1
                print("✓ PASS")
            else:
                results["failed"] += 1
                print(f"✗ FAIL - {', '.join(failure_info['reasons'])}")
                
                if verbose and failure_info["details"]:
                    for key, value in failure_info["details"].items():
                        print(f"    {key}: {value}")
        
        except Exception as e:
            results["failed"] += 1
            game_result = {
                "name": game_name,
                "title": game_title,
                "path": game_path_str,
                "status": "ERROR",
                "test_result": False,
                "loaded": False,
                "failure_info": {
                    "status": "ERROR",
                    "reasons": ["Test execution error"],
                    "details": {"exception": str(e)}
                }
            }
            results["games"].append(game_result)
            print(f"✗ ERROR - {str(e)}")
    
    return results


def print_summary(results: Dict[str, Any]) -> None:
    """Print a summary of test results."""
    total = results["total"]
    passed = results["passed"]
    failed = results["failed"]
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total games tested: {total}")
    print(f"Passed: {passed} ({passed/total*100:.1f}%)")
    print(f"Failed: {failed} ({failed/total*100:.1f}%)")
    print()
    
    if failed > 0:
        print("FAILED GAMES:")
        print("-"*80)
        
        # Group failures by reason
        failure_categories: Dict[str, List[str]] = {}
        
        for game in results["games"]:
            if game["status"] != "PASS":
                reasons = game["failure_info"]["reasons"]
                display_name = game.get('title') or game['name']
                for reason in reasons:
                    if reason not in failure_categories:
                        failure_categories[reason] = []
                    failure_categories[reason].append(display_name)
        
        # Print by category
        for reason, game_names in sorted(failure_categories.items()):
            print(f"\n{reason} ({len(game_names)} games):")
            for game_name in sorted(game_names):
                print(f"  - {game_name}")
        
        print("\n" + "-"*80)
        print("\nDETAILED FAILURES:")
        print("-"*80)
        
        for game in results["games"]:
            if game["status"] != "PASS":
                display_name = game.get('title') or game['name']
                print(f"\n{display_name}:")
                if game.get('title'):
                    print(f"  Directory: {game['name']}")
                print(f"  Path: {game['path']}")
                print(f"  Reasons: {', '.join(game['failure_info']['reasons'])}")
                
                details = game['failure_info'].get('details', {})
                if details:
                    for key, value in details.items():
                        if isinstance(value, list):
                            print(f"  {key}:")
                            for item in value[:3]:  # Show first 3
                                print(f"    - {item}")
                        elif isinstance(value, dict):
                            print(f"  {key}:")
                            for k, v in value.items():
                                print(f"    {k}: {v}")
                        else:
                            print(f"  {key}: {value}")
    
    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(
        description="Test all games and report failures with detailed reasons"
    )
    parser.add_argument(
        "--games-dir",
        default="games",
        help="Directory containing game folders (default: games)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=10,
        help="Duration in seconds for interaction testing (default: 10)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="Timeout in seconds for page load (default: 20)"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file for results (optional)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug output for each test"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed failure information during testing"
    )
    parser.add_argument(
        "--require-title",
        action="store_true",
        help="Only test games that have a title in metadata.json"
    )
    
    args = parser.parse_args()
    
    # Run tests
    results = test_all_games(
        games_dir=args.games_dir,
        duration=args.duration,
        timeout=args.timeout,
        debug=args.debug,
        verbose=args.verbose,
        require_title=args.require_title
    )
    
    # Print summary
    print_summary(results)
    
    # Save to file if requested
    if args.output:
        output_path = Path(args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {output_path}")
    
    # Exit with error code if any tests failed
    sys.exit(0 if results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()

