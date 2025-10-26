#!/usr/bin/env python3
"""
Batch fix games based on VLM evaluation results.

This script reads evaluation JSON (from batch_evaluate_gameplay.py) and 
automatically fixes games that have issues identified by the VLM evaluator.

Usage:
    uv run python batch_fix_from_evaluation.py --eval test_eval.json
    uv run python batch_fix_from_evaluation.py --eval test_eval.json --max-fixes 5
    uv run python batch_fix_from_evaluation.py --eval test_eval.json --only-failed
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import os

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


def extract_status_from_feedback(feedback: str) -> str:
    """Extract status (PASS/PARTIAL/FAIL) from feedback text."""
    feedback_upper = feedback.upper()
    
    if "**STATUS**: FAIL" in feedback_upper or "STATUS: FAIL" in feedback_upper:
        return "FAIL"
    elif "**STATUS**: PARTIAL" in feedback_upper or "STATUS: PARTIAL" in feedback_upper:
        return "PARTIAL"
    elif "**STATUS**: PASS" in feedback_upper or "STATUS: PASS" in feedback_upper:
        return "PASS"
    else:
        # Try to infer from content
        if "NOT WORK" in feedback_upper or "BROKEN" in feedback_upper or "CRITICAL" in feedback_upper:
            return "FAIL"
        elif "PARTIALLY" in feedback_upper or "SOME" in feedback_upper:
            return "PARTIAL"
        else:
            return "UNKNOWN"


def extract_issues_from_feedback(feedback: str) -> str:
    """Extract the key issues from feedback text."""
    lines = []
    
    # Look for Issues section
    if "**Issues**:" in feedback or "**Issues**" in feedback:
        in_issues = False
        for line in feedback.split('\n'):
            if "**Issues**" in line:
                in_issues = True
                continue
            elif in_issues:
                if line.startswith('**') or line.startswith('## '):
                    break
                if line.strip():
                    lines.append(line.strip())
    
    # Look for Summary section
    if "**Summary**:" in feedback or "**Summary**" in feedback:
        in_summary = False
        for line in feedback.split('\n'):
            if "**Summary**" in line:
                in_summary = True
                continue
            elif in_summary:
                if line.startswith('**') or line.startswith('## '):
                    break
                if line.strip():
                    lines.append(line.strip())
    
    # If no structured sections, return first few sentences
    if not lines:
        sentences = feedback.split('. ')[:3]
        lines = [s.strip() + '.' for s in sentences if s.strip()]
    
    return '\n'.join(lines)


def create_consolidated_feedback(game_data: Dict[str, Any]) -> str:
    """Create consolidated feedback from all evaluations for a game."""
    game_title = game_data.get('game_title', 'Unknown Game')
    evaluations = game_data.get('evaluations', [])
    
    if not evaluations:
        return "No evaluation data available."
    
    feedback_parts = [f"Game: {game_title}\n"]
    
    # Collect all issues
    all_issues = []
    pass_count = 0
    partial_count = 0
    fail_count = 0
    
    for eval_item in evaluations:
        test_mode = eval_item.get('test_mode', 'unknown')
        feedback = eval_item.get('feedback', '')
        
        status = extract_status_from_feedback(feedback)
        
        if status == "PASS":
            pass_count += 1
        elif status == "PARTIAL":
            partial_count += 1
        elif status == "FAIL":
            fail_count += 1
        
        if status in ["PARTIAL", "FAIL"]:
            issues = extract_issues_from_feedback(feedback)
            if issues:
                all_issues.append(f"[Test Mode: {test_mode}]\n{issues}")
    
    # Add summary
    feedback_parts.append(f"\nEvaluation Summary:")
    feedback_parts.append(f"- PASS: {pass_count}")
    feedback_parts.append(f"- PARTIAL: {partial_count}")
    feedback_parts.append(f"- FAIL: {fail_count}")
    
    # Add issues
    if all_issues:
        feedback_parts.append(f"\nIssues Identified:")
        for i, issue in enumerate(all_issues, 1):
            feedback_parts.append(f"\n{i}. {issue}")
    else:
        feedback_parts.append(f"\nNo specific issues identified.")
    
    return '\n'.join(feedback_parts)


def should_fix_game(game_data: Dict[str, Any], only_failed: bool = False) -> bool:
    """Determine if a game should be fixed based on evaluation results."""
    evaluations = game_data.get('evaluations', [])
    
    if not evaluations:
        return False
    
    has_issues = False
    has_failures = False
    
    for eval_item in evaluations:
        feedback = eval_item.get('feedback', '')
        status = extract_status_from_feedback(feedback)
        
        if status == "FAIL":
            has_failures = True
            has_issues = True
        elif status == "PARTIAL":
            has_issues = True
    
    if only_failed:
        return has_failures
    else:
        return has_issues


def fix_game(game_path: str, feedback: str, model: str, verbose: bool = True) -> Dict[str, Any]:
    """Fix a single game using the feedback."""
    if verbose:
        print(f"\n🔧 Fixing game: {game_path}")
        print(f"{'='*80}")
    
    try:
        # Initialize iterator
        iterator = FeedbackFixIterator(
            model=model,
            temperature=0.6,
            thinking=True,
            thinking_budget=8000,
        )
        
        if verbose:
            print(f"📤 Analyzing and generating fixes...")
        
        # Run fix
        result = iterator.iterate(
            game_dir=game_path,
            feedback=feedback,
            debug_prompts=False,
            use_planning=True,
            in_place=True,
        )
        
        return {
            "status": "success",
            "result": result
        }
        
    except Exception as e:
        if verbose:
            print(f"  ✗ Error: {e}")
        
        return {
            "status": "error",
            "error": str(e)
        }


def batch_fix_from_eval(
    eval_file: str,
    model: str = "anthropic:claude-4.5-sonnet",
    max_fixes: int = None,
    only_failed: bool = False,
    verbose: bool = True
) -> Dict[str, Any]:
    """
    Batch fix games based on evaluation results.
    
    Args:
        eval_file: Path to evaluation JSON file
        model: Model to use for fixes
        max_fixes: Maximum number of games to fix
        only_failed: Only fix games with FAIL status (not PARTIAL)
        verbose: Show progress
    """
    print("="*80)
    print("Batch Fix Games from VLM Evaluation")
    print("="*80)
    
    # Load evaluation results
    eval_path = Path(eval_file)
    if not eval_path.exists():
        print(f"Error: Evaluation file not found: {eval_file}")
        return {"games": [], "summary": {"total": 0, "fixed": 0, "errors": 0}}
    
    with open(eval_path, 'r') as f:
        eval_data = json.load(f)
    
    games = eval_data.get('games', [])
    
    if not games:
        print("No games found in evaluation file")
        return {"games": [], "summary": {"total": 0, "fixed": 0, "errors": 0}}
    
    # Filter games that need fixing
    games_to_fix = [g for g in games if should_fix_game(g, only_failed)]
    
    print(f"\nTotal games evaluated: {len(games)}")
    print(f"Games needing fixes: {len(games_to_fix)}")
    
    if only_failed:
        print(f"  (Only fixing FAILED games)")
    else:
        print(f"  (Fixing FAILED and PARTIAL games)")
    
    if max_fixes:
        games_to_fix = games_to_fix[:max_fixes]
        print(f"Limiting to first {max_fixes} games")
    
    if not games_to_fix:
        print("\n✨ No games need fixing! All games passed evaluation.")
        return {"games": [], "summary": {"total": 0, "fixed": 0, "errors": 0}}
    
    print(f"\nStarting fixes...")
    print(f"Model: {model}")
    print(f"="*80)
    
    results = []
    
    for i, game_data in enumerate(games_to_fix, 1):
        game_title = game_data.get('game_title', 'Unknown')
        game_path = game_data.get('game_path', '')
        
        print(f"\n[{i}/{len(games_to_fix)}] {game_title}")
        print(f"  Path: {game_path}")
        
        # Create consolidated feedback
        feedback = create_consolidated_feedback(game_data)
        
        if verbose:
            print(f"\n  Feedback summary:")
            preview = feedback[:200] + "..." if len(feedback) > 200 else feedback
            for line in preview.split('\n'):
                print(f"    {line}")
        
        # Fix the game
        fix_result = fix_game(game_path, feedback, model, verbose)
        
        # Store result
        result_entry = {
            "game_title": game_title,
            "game_path": game_path,
            "original_evaluation": game_data,
            "fix_result": fix_result
        }
        results.append(result_entry)
        
        # Print summary
        if fix_result['status'] == 'success':
            num_files = fix_result['result'].get('num_files_updated', 0)
            print(f"  ✓ Fixed {num_files} file(s)")
        else:
            print(f"  ✗ Fix failed: {fix_result.get('error', 'Unknown error')}")
    
    # Generate summary
    total_count = len(results)
    fixed_count = sum(1 for r in results if r['fix_result']['status'] == 'success')
    error_count = sum(1 for r in results if r['fix_result']['status'] == 'error')
    
    summary = {
        "total": total_count,
        "fixed": fixed_count,
        "errors": error_count,
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "games": results,
        "summary": summary,
        "config": {
            "eval_file": eval_file,
            "model": model,
            "only_failed": only_failed
        }
    }


def print_summary(results: Dict[str, Any]) -> None:
    """Print summary of fix results."""
    summary = results.get('summary', {})
    
    print("\n" + "="*80)
    print("FIX SUMMARY")
    print("="*80)
    print(f"\nTotal games processed: {summary.get('total', 0)}")
    print(f"Successfully fixed: {summary.get('fixed', 0)}")
    print(f"Errors: {summary.get('errors', 0)}")
    
    print("\n" + "="*80)
    print("DETAILED RESULTS")
    print("="*80)
    
    for game in results.get('games', []):
        print(f"\n{game['game_title']}")
        print(f"  Path: {game['game_path']}")
        
        fix_result = game.get('fix_result', {})
        if fix_result.get('status') == 'success':
            result_data = fix_result.get('result', {})
            num_files = result_data.get('num_files_updated', 0)
            updated_files = result_data.get('updated_files', [])
            
            print(f"  Status: ✓ FIXED")
            print(f"  Files updated: {num_files}")
            for file in updated_files:
                print(f"    • {file}")
        else:
            print(f"  Status: ✗ FAILED")
            print(f"  Error: {fix_result.get('error', 'Unknown')}")
    
    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(
        description="Batch fix games based on VLM evaluation results"
    )
    parser.add_argument(
        "--eval",
        required=True,
        help="Path to evaluation JSON file (e.g., test_eval.json)"
    )
    parser.add_argument(
        "--model",
        default="anthropic:claude-4.5-sonnet",
        help="Model to use for fixes (default: anthropic:claude-4.5-sonnet)"
    )
    parser.add_argument(
        "--max-fixes",
        type=int,
        help="Maximum number of games to fix"
    )
    parser.add_argument(
        "--only-failed",
        action="store_true",
        help="Only fix games with FAIL status (ignore PARTIAL)"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file for fix results"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress verbose output"
    )
    
    args = parser.parse_args()
    
    # Run batch fix
    results = batch_fix_from_eval(
        eval_file=args.eval,
        model=args.model,
        max_fixes=args.max_fixes,
        only_failed=args.only_failed,
        verbose=not args.quiet
    )
    
    # Print summary
    print_summary(results)
    
    # Save results
    if args.output:
        output_path = Path(args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {output_path}")
    
    sys.exit(0 if results['summary']['errors'] == 0 else 1)


if __name__ == "__main__":
    main()

