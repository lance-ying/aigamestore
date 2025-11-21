#!/usr/bin/env python3
"""
Simple CLI tool to fix game bugs using natural language feedback.

Usage:
    python fix_game.py <game_dir> "<feedback_text>"
    python fix_game.py <game_dir> --feedback feedback.txt
    python fix_game.py <game_dir> --restore

Examples:
    python fix_game.py games/single_prompt_with_testing/game_1000/sample_0 "the player moves too slow"
    python fix_game.py games/single_prompt_with_testing/game_1000/sample_0 --feedback my_feedback.txt
    python fix_game.py games/single_prompt_with_testing/game_1000/sample_0 --restore
"""

import argparse
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from iterators.feedback_fix import FeedbackFixIterator

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = Path(".env")
    if env_file.exists():
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    # Remove surrounding quotes if present
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()


def create_backup(game_dir: Path) -> Path:
    """Create a timestamped backup of the game directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = game_dir.parent / f"{game_dir.name}_backup_{timestamp}"

    print(f"📁 Creating backup...")
    shutil.copytree(game_dir, backup_path)
    return backup_path


def find_latest_backup(game_dir: Path) -> Path | None:
    """Find the most recent backup for this game directory."""
    parent_dir = game_dir.parent
    backup_pattern = f"{game_dir.name}_backup_"

    backups = [d for d in parent_dir.iterdir()
               if d.is_dir() and d.name.startswith(backup_pattern)]

    if not backups:
        return None

    # Sort by timestamp in name (last part after _backup_)
    backups.sort(key=lambda x: x.name, reverse=True)
    return backups[0]


def restore_backup(game_dir: Path) -> bool:
    """Restore the most recent backup."""
    backup_path = find_latest_backup(game_dir)

    if not backup_path:
        print(f"❌ No backup found for {game_dir.name}")
        return False

    print(f"🔄 Restoring from backup: {backup_path.name}")

    # Remove current directory
    if game_dir.exists():
        shutil.rmtree(game_dir)

    # Restore from backup
    shutil.copytree(backup_path, game_dir)

    print(f"✅ Restored successfully!")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Fix game bugs using natural language feedback",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "game_dir",
        help="Path to the game directory to fix"
    )

    parser.add_argument(
        "feedback",
        nargs="?",
        help="Feedback text describing the issue (or use --feedback for file)"
    )

    parser.add_argument(
        "--feedback",
        dest="feedback_file",
        help="Path to feedback text file"
    )

    parser.add_argument(
        "--restore",
        action="store_true",
        help="Restore from the most recent backup"
    )

    parser.add_argument(
        "--model",
        default="anthropic:claude-4.5-sonnet",
        help="Model to use (default: anthropic:claude-4.5-sonnet)"
    )

    parser.add_argument(
        "--no-planning",
        action="store_true",
        help="Skip the analysis step (faster but less thorough)"
    )

    parser.add_argument(
        "--debug-prompts",
        action="store_true",
        help="Save prompts to game_dir/evaluation/prompts/"
    )

    args = parser.parse_args()

    # Validate game directory
    game_dir = Path(args.game_dir)
    if not game_dir.exists():
        print(f"❌ Error: Game directory not found: {game_dir}")
        sys.exit(1)

    if not (game_dir / "index.html").exists():
        print(f"❌ Error: No index.html found in {game_dir}")
        sys.exit(1)

    # Handle restore
    if args.restore:
        success = restore_backup(game_dir)
        sys.exit(0 if success else 1)

    # Get feedback text
    feedback_text = None
    if args.feedback_file:
        feedback_path = Path(args.feedback_file)
        if not feedback_path.exists():
            print(f"❌ Error: Feedback file not found: {feedback_path}")
            sys.exit(1)
        feedback_text = feedback_path.read_text(encoding="utf-8")
    elif args.feedback:
        feedback_text = args.feedback
    else:
        print("❌ Error: Please provide feedback text or --feedback file")
        parser.print_help()
        sys.exit(1)

    print(f"\n🎮 Game Fix Tool")
    print(f"{'=' * 60}\n")

    # Create backup
    try:
        backup_path = create_backup(game_dir)
        print(f"   Backup: {backup_path.name}\n")
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        sys.exit(1)

    # Initialize iterator
    print(f"🔍 Reading game files...")

    try:
        iterator = FeedbackFixIterator(
            model=args.model,
            temperature=0.6,
            thinking=True,
            thinking_budget=8000,
        )
    except Exception as e:
        print(f"❌ Error initializing iterator: {e}")
        sys.exit(1)

    # Send to LLM
    print(f"📤 Sending to AI for analysis...")
    print(f"   (this may take 30-60 seconds...)\n")

    try:
        result = iterator.iterate(
            game_dir=str(game_dir),
            feedback=feedback_text,
            debug_prompts=args.debug_prompts,
            use_planning=not args.no_planning,
            in_place=True,
        )
    except Exception as e:
        print(f"\n❌ Error during fix generation: {e}")
        import traceback
        traceback.print_exc()
        print(f"\n💡 Backup preserved at: {backup_path}")
        sys.exit(1)

    # Display analysis if present
    analysis = result.get("analysis")
    if analysis:
        print(f"📋 Analysis:")
        for line in analysis.strip().split('\n'):
            print(f"   {line}")
        print()

    # Display results
    num_files = result.get("num_files_updated", 0)
    updated_files = result.get("updated_files", [])

    if num_files > 0:
        print(f"✨ Applied fixes to {num_files} file(s):")
        for file in updated_files:
            print(f"   • {file}")
        print()
    else:
        print(f"⚠️  No files were updated. The AI may not have found issues to fix.\n")

    print(f"📁 Backup saved: {backup_path.name}")
    print(f"✅ Done!\n")
    print(f"{'=' * 60}")
    print(f"Try the game again. If issues persist:")
    print(f"  • Run with --restore to revert changes")
    print(f"  • Or provide more detailed feedback\n")


if __name__ == "__main__":
    main()
