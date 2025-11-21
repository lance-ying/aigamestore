#!/usr/bin/env python3
"""
Batch evaluate gameplay mechanics for all games using VLM (Vision Language Model).

This script:
1. Finds all games in the games/ directory
2. Records gameplay videos for each game
3. Uses Gemini to watch videos and evaluate if game mechanics work properly
4. Generates a comprehensive report

Usage:
    uv run python batch_evaluate_gameplay.py
    uv run python batch_evaluate_gameplay.py --games-dir games --output gameplay_eval.json
    uv run python batch_evaluate_gameplay.py --duration 10 --only-csv-games
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Add parent directory to path to allow imports from root
sys.path.insert(0, str(Path(__file__).parent.parent.parent.resolve()))

# Import VLM evaluation
from evaluators.vlm.run import evaluate_game_folder
from evaluators.vlm.gemini_api import GeminiEvaluator

# Import fix iterator
from iterators.feedback_fix import FeedbackFixIterator

# Load environment variables
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


def find_game_files_path(game_dir: Path) -> Optional[Path]:
    """
    Navigate through nested structure to find actual game files.
    Handles multiple structures:
    - gamename/index.html (flat structure, common in public/games)
    - gamename/sample_0/index.html
    - gamename/sample_0/game_0000/sample_0/index.html (nested structure)
    """
    # Check if index.html exists directly (flat structure)
    if (game_dir / "index.html").exists():
        return game_dir
    
    # Navigate through nested structure
    try:
        sample_dirs = [d for d in game_dir.iterdir() if d.is_dir() and d.name.startswith('sample')]
    except (PermissionError, OSError):
        return None
    
    if not sample_dirs:
        return None
    
    sample_path = sample_dirs[0]
    
    # Check if index.html is at sample level
    if (sample_path / "index.html").exists():
        return sample_path
    
    # Check for game_XXXX subdirectory
    try:
        game_dirs = [d for d in sample_path.iterdir() if d.is_dir() and d.name.startswith('game')]
    except (PermissionError, OSError):
        return None
    
    if not game_dirs:
        return None
    
    game_path = game_dirs[0]
    
    # Check if index.html is at game level
    if (game_path / "index.html").exists():
        return game_path
    
    # Check for inner sample directory
    try:
        inner_sample_dirs = [d for d in game_path.iterdir() if d.is_dir() and d.name.startswith('sample')]
    except (PermissionError, OSError):
        return None
    
    if not inner_sample_dirs:
        return None
    
    final_path = inner_sample_dirs[0]
    if (final_path / "index.html").exists():
        return final_path
    
    return None


def is_csv_game(game_dir: Path, games_base_dir: Path) -> bool:
    """Check if this is a CSV-generated game (has csv_game_mapping.json entry)."""
    # Look for mapping file in the games base directory
    mapping_file = games_base_dir / "csv_game_mapping.json"
    
    if not mapping_file.exists():
        # Also try in the parent directory of games_base_dir
        parent_mapping = games_base_dir.parent / "csv_game_mapping.json"
        if parent_mapping.exists():
            mapping_file = parent_mapping
        else:
            return False
    
    try:
        with open(mapping_file, 'r') as f:
            mapping = json.load(f)
        
        # Check if any mapping points to this directory
        dir_name = game_dir.name
        for original_name, info in mapping.items():
            if dir_name in info.get('directory', ''):
                return True
        return False
    except Exception:
        return False


def find_all_games(games_dir: str = "games", only_csv_games: bool = False, verbose: bool = False) -> List[Path]:
    """
    Find all game directories that contain an index.html file.
    
    Args:
        games_dir: Directory containing game folders
        only_csv_games: If True, only include CSV-generated games
        verbose: If True, print debug information
    """
    games_path = Path(games_dir)
    if not games_path.exists():
        print(f"Error: Games directory '{games_dir}' does not exist")
        return []
    
    game_dirs = []
    skipped_csv_filter = 0
    skipped_no_index = 0
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip special directories
        if item.name.startswith('.') or item.name.startswith('single_prompt') or '_backup_' in item.name:
            continue
        
        # Skip csv_game_mapping.json
        if item.name.endswith('.json'):
            continue
        
        # Find the actual game files path
        game_files_path = find_game_files_path(item)
        
        if game_files_path is None:
            skipped_no_index += 1
            continue
        
        # Filter by CSV games if requested
        if only_csv_games and not is_csv_game(item, games_path):
            skipped_csv_filter += 1
            continue
        
        game_dirs.append(game_files_path)
    
    if verbose and only_csv_games:
        print(f"Debug: Found {len(game_dirs)} games")
        print(f"Debug: Skipped {skipped_csv_filter} games (not in CSV mapping)")
        print(f"Debug: Skipped {skipped_no_index} games (no index.html)")
    
    return sorted(game_dirs)


def get_game_title(game_path: Path) -> str:
    """Try to extract game title from metadata or use directory name."""
    metadata_path = game_path / "metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Try game_info.title first
            if metadata.get('game_info', {}).get('title'):
                return metadata['game_info']['title']
            
            # Try concept.game_name
            concept = metadata.get('game_info', {}).get('concept')
            if concept:
                if isinstance(concept, str):
                    concept = json.loads(concept)
                if concept.get('game_name'):
                    return concept['game_name']
        except Exception:
            pass
    
    # Fallback to directory name
    return game_path.parent.name if game_path.name.startswith('sample') else game_path.name


async def evaluate_single_game(
    game_path: Path,
    model: str,
    duration: int,
    resolution: Optional[tuple],
    verbose: bool = False
) -> Dict[str, Any]:
    """Evaluate a single game using VLM."""
    game_title = get_game_title(game_path)
    
    if verbose:
        print(f"\n  Evaluating: {game_title}")
        print(f"  Path: {game_path}")
    
    prompt = """You are evaluating HTML5 game mechanics and gameplay quality.

Test Mode: {test_mode}
Test Description: {test_description}
Strategy: {strategy_description}
Expected Outcome: {expected_outcome}

Watch the gameplay video carefully and evaluate:

1. **Does the game load and start properly?**
   - Does the game appear and render correctly?
   - Can the player start playing?

2. **Do the controls work?**
   - Do keyboard inputs have visible effects?
   - Are controls responsive?

3. **Do the core mechanics work?**
   - Does the gameplay loop function as expected?
   - Are game objects behaving logically?
   - Does scoring/progression work?

4. **Does the gameplay make sense?**
   - Are the rules clear and consistent?
   - Is there meaningful interaction?
   - Can the player understand what to do?

5. **Are there any obvious bugs or issues?**
   - Visual glitches
   - Unresponsive elements
   - Game breaking errors

Provide a structured evaluation with:
- **Status**: PASS / FAIL / PARTIAL
- **Loading**: Did the game load? (Yes/No)
- **Controls**: Do inputs work? (Yes/No/Partially)
- **Mechanics**: Do core mechanics work? (Yes/No/Partially)
- **Playability**: Is the game playable and understandable? (Yes/No/Partially)
- **Issues**: List any specific problems observed
- **Summary**: Brief overall assessment

Be specific about what you observe in the video."""
    
    try:
        result = await evaluate_game_folder(
            str(game_path),
            prompt,
            model,
            save_video_only=False,
            debug_prompts=False,
            duration=duration,
            resolution=resolution
        )
        
        return {
            "game_title": game_title,
            "game_path": str(game_path),
            "status": "completed",
            "evaluations": result.get("evaluations", [])
        }
    
    except Exception as e:
        if verbose:
            print(f"  ✗ Error: {e}")
        
        return {
            "game_title": game_title,
            "game_path": str(game_path),
            "status": "error",
            "error": str(e),
            "evaluations": []
        }


def fix_failing_game(game_path: Path, evaluation_feedback: str, verbose: bool = False) -> Dict[str, Any]:
    """Fix a game that failed evaluation using the evaluation feedback."""
    game_title = get_game_title(game_path)
    
    # Find the actual game directory (parent if it's nested)
    if game_path.name.startswith('sample'):
        game_dir = game_path.parent
    else:
        game_dir = game_path
    
    if verbose:
        print(f"\n  Attempting to fix: {game_title}")
        print(f"  Game directory: {game_dir}")
    
    try:
        iterator = FeedbackFixIterator(
            model="anthropic:claude-4.5-sonnet",
            temperature=0.6,
            thinking=True,
            thinking_budget=8000,
        )
        
        result = iterator.iterate(
            game_dir=str(game_dir),
            feedback=evaluation_feedback,
            debug_prompts=False,
            use_planning=True,
            in_place=True,
        )
        
        num_files = result.get("num_files_updated", 0)
        updated_files = result.get("updated_files", [])
        
        if verbose:
            if num_files > 0:
                print(f"  ✓ Fixed {num_files} file(s)")
                for file in updated_files:
                    print(f"    - {file}")
            else:
                print(f"  ! No files were updated")
        
        return {
            "status": "fixed" if num_files > 0 else "no_changes",
            "num_files_updated": num_files,
            "updated_files": updated_files,
            "analysis": result.get("analysis", "")
        }
    
    except Exception as e:
        if verbose:
            print(f"  ✗ Fix failed: {e}")
        
        return {
            "status": "fix_failed",
            "error": str(e),
            "num_files_updated": 0,
            "updated_files": []
        }


async def batch_evaluate_games(
    games_dir: str = "games",
    model: str = "gemini-2.5-flash",
    duration: int = 10,
    resolution: Optional[tuple] = None,
    max_games: Optional[int] = None,
    only_csv_games: bool = False,
    verbose: bool = True,
    auto_fix: bool = False
) -> Dict[str, Any]:
    """
    Batch evaluate all games in the directory.
    
    Args:
        games_dir: Directory containing game folders
        model: Gemini model to use
        duration: Duration in seconds to record gameplay
        resolution: Optional (width, height) for video recording
        max_games: Optional limit on number of games to evaluate
        only_csv_games: If True, only evaluate CSV-generated games
        verbose: Show progress during evaluation
        auto_fix: If True, attempt to fix games that fail evaluation
    """
    print("="*80)
    print("Batch Gameplay Evaluation using VLM")
    print("="*80)
    
    # Find all games
    games = find_all_games(games_dir, only_csv_games, verbose=True)
    
    if not games:
        print(f"No games found in {games_dir}")
        if only_csv_games:
            print("\nNote: You're using --only-csv-games flag.")
            print("This filters games based on csv_game_mapping.json")
            print("Try running without --only-csv-games to evaluate all games.")
        return {"games": [], "summary": {"total": 0, "completed": 0, "errors": 0}}
    
    print(f"\nFound {len(games)} games")
    if only_csv_games:
        print("  (CSV-generated games only)")
    
    if max_games:
        games = games[:max_games]
        print(f"Limiting to first {max_games} games")
    
    print(f"\nStarting evaluation...")
    print(f"  Model: {model}")
    print(f"  Recording duration: {duration}s per test")
    if resolution:
        print(f"  Resolution: {resolution[0]}x{resolution[1]}")
    
    results = []
    
    for i, game_path in enumerate(games, 1):
        game_title = get_game_title(game_path)
        print(f"\n[{i}/{len(games)}] {game_title}")
        print(f"{'='*80}")
        
        result = await evaluate_single_game(
            game_path,
            model,
            duration,
            resolution,
            verbose
        )
        
        results.append(result)
        
        # Print brief summary
        if result['status'] == 'completed':
            eval_count = len(result.get('evaluations', []))
            print(f"  ✓ Completed ({eval_count} test modes evaluated)")
        else:
            print(f"  ✗ Failed: {result.get('error', 'Unknown error')}")
        
        # Try to auto-fix if requested and evaluation failed
        if auto_fix and result['status'] != 'completed':
            print(f"\n  Auto-fixing game...")
            
            # Collect feedback from evaluations
            evaluation_feedback = result.get('error', 'Game evaluation failed. Please fix any issues preventing the game from running properly.')
            
            # Get more detailed feedback if available
            if result.get('evaluations'):
                feedback_parts = []
                for eval_result in result.get('evaluations', []):
                    if eval_result.get('feedback'):
                        feedback_parts.append(eval_result['feedback'])
                if feedback_parts:
                    evaluation_feedback = "\n".join(feedback_parts)
            
            fix_result = fix_failing_game(game_path, evaluation_feedback, verbose)
            result['fix_result'] = fix_result
            
            if fix_result['status'] in ['fixed', 'no_changes']:
                print(f"  ✓ Fix completed")
        
        # Add small delay between games to ensure server cleanup
        if i < len(games):
            await asyncio.sleep(2)
    
    # Generate summary
    total_count = len(results)
    completed_count = sum(1 for r in results if r['status'] == 'completed')
    error_count = sum(1 for r in results if r['status'] == 'error')
    
    summary = {
        "total": total_count,
        "completed": completed_count,
        "errors": error_count,
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "games": results,
        "summary": summary,
        "config": {
            "model": model,
            "duration": duration,
            "resolution": resolution,
            "games_dir": games_dir,
            "only_csv_games": only_csv_games
        }
    }


def print_summary(results: Dict[str, Any]) -> None:
    """Print a summary of evaluation results."""
    summary = results.get('summary', {})
    
    print("\n" + "="*80)
    print("EVALUATION SUMMARY")
    print("="*80)
    print(f"\nTotal games evaluated: {summary.get('total', 0)}")
    print(f"Successfully evaluated: {summary.get('completed', 0)}")
    print(f"Errors: {summary.get('errors', 0)}")
    
    # Show brief results for each game
    print("\n" + "="*80)
    print("INDIVIDUAL RESULTS")
    print("="*80)
    
    for game in results.get('games', []):
        print(f"\n{game['game_title']}")
        print(f"  Path: {game['game_path']}")
        print(f"  Status: {game['status']}")
        
        if game['status'] == 'completed':
            evaluations = game.get('evaluations', [])
            print(f"  Tests: {len(evaluations)} modes")
            for eval_result in evaluations:
                test_mode = eval_result.get('test_mode', 'unknown')
                feedback = eval_result.get('feedback', '')
                feedback_preview = feedback[:100] + "..." if len(feedback) > 100 else feedback
                print(f"    • {test_mode}: {feedback_preview}")
        elif game['status'] == 'error':
            print(f"  Error: {game.get('error', 'Unknown')}")
    
    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(
        description="Batch evaluate game mechanics using VLM (Vision Language Model)"
    )
    parser.add_argument(
        "--games-dir",
        default="games",
        help="Directory containing game folders (default: games)"
    )
    parser.add_argument(
        "--model",
        default="gemini-2.5-flash",
        help="Gemini model to use (default: gemini-2.5-flash)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=10,
        help="Duration in seconds to record gameplay per test (default: 10)"
    )
    parser.add_argument(
        "--resolution",
        help="Video resolution as WIDTHxHEIGHT (e.g., 600x400)"
    )
    parser.add_argument(
        "--max-games",
        type=int,
        help="Maximum number of games to evaluate (optional)"
    )
    parser.add_argument(
        "--only-csv-games",
        action="store_true",
        help="Only evaluate CSV-generated games"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file for results (optional)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress verbose output during evaluation"
    )
    parser.add_argument(
        "--auto-fix",
        action="store_true",
        help="Attempt to fix games that fail evaluation"
    )
    
    args = parser.parse_args()
    
    # Parse resolution if provided
    resolution = None
    if args.resolution:
        try:
            w, h = args.resolution.split('x')
            resolution = (int(w), int(h))
        except:
            print(f"Warning: Invalid resolution format '{args.resolution}', using default")
    
    # Run batch evaluation
    results = asyncio.run(batch_evaluate_games(
        games_dir=args.games_dir,
        model=args.model,
        duration=args.duration,
        resolution=resolution,
        max_games=args.max_games,
        only_csv_games=args.only_csv_games,
        verbose=not args.quiet,
        auto_fix=args.auto_fix
    ))
    
    # Print summary
    print_summary(results)
    
    # Save to file if requested
    if args.output:
        output_path = Path(args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nDetailed results saved to: {output_path}")
    
    # Exit with error code if any evaluations failed
    sys.exit(0 if results['summary']['errors'] == 0 else 1)


if __name__ == "__main__":
    main()

