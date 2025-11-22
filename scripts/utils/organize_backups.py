#!/usr/bin/env python3
"""
Organize backup directories into a centralized location.

This script finds all directories with "backup" in their name and moves them
to a centralized backups directory, preserving their original location structure.
"""

import shutil
from pathlib import Path
from typing import List, Tuple
import sys


def find_backup_directories(root_dir: Path) -> List[Path]:
    """Find all directories with 'backup' in their name."""
    backup_dirs = []
    for item in root_dir.rglob("*backup*"):
        if item.is_dir() and "backup" in item.name.lower():
            backup_dirs.append(item)
    return sorted(backup_dirs)


def organize_backups(
    root_dir: Path,
    backup_destination: Path,
    dry_run: bool = False
) -> Tuple[int, int, List[str]]:
    """
    Move all backup directories to a centralized location.
    
    Args:
        root_dir: Root directory to search for backups
        backup_destination: Where to move backups to
        dry_run: If True, only print what would be done without moving
    
    Returns:
        Tuple of (moved_count, error_count, errors)
    """
    backup_dirs = find_backup_directories(root_dir)
    
    if not backup_dirs:
        print("No backup directories found.")
        return 0, 0, []
    
    print(f"Found {len(backup_dirs)} backup directories")
    print(f"Destination: {backup_destination}")
    print(f"Mode: {'DRY RUN' if dry_run else 'MOVE'}")
    print("=" * 60)
    
    moved_count = 0
    error_count = 0
    errors = []
    
    # Create destination directory
    if not dry_run:
        backup_destination.mkdir(parents=True, exist_ok=True)
    
    for backup_dir in backup_dirs:
        try:
            # Get relative path from root to preserve structure
            try:
                relative_path = backup_dir.relative_to(root_dir)
            except ValueError:
                # If backup is outside root, use just the name
                relative_path = Path(backup_dir.name)
            
            # Create destination path preserving original location structure
            dest_path = backup_destination / relative_path
            
            # If destination already exists, add a suffix
            if dest_path.exists():
                counter = 1
                base_name = dest_path.name
                parent = dest_path.parent
                while dest_path.exists():
                    dest_path = parent / f"{base_name}_dup{counter}"
                    counter += 1
            
            if dry_run:
                print(f"Would move: {backup_dir}")
                print(f"         -> {dest_path}")
            else:
                # Create parent directories if needed
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Move the directory
                shutil.move(str(backup_dir), str(dest_path))
                print(f"Moved: {backup_dir.name}")
                print(f"     -> {dest_path}")
            
            moved_count += 1
            
        except Exception as e:
            error_msg = f"Error moving {backup_dir}: {e}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
            error_count += 1
    
    return moved_count, error_count, errors


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Organize backup directories into a centralized location"
    )
    parser.add_argument(
        "--root",
        type=str,
        default="games",
        help="Root directory to search for backups (default: games)"
    )
    parser.add_argument(
        "--destination",
        type=str,
        default="games/backups",
        help="Destination directory for backups (default: games/backups)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually moving files"
    )
    
    args = parser.parse_args()
    
    root_dir = Path(args.root).resolve()
    backup_destination = Path(args.destination).resolve()
    
    if not root_dir.exists():
        print(f"Error: Root directory does not exist: {root_dir}")
        sys.exit(1)
    
    print("Backup Organization Tool")
    print("=" * 60)
    print(f"Root directory: {root_dir}")
    print(f"Backup destination: {backup_destination}")
    print()
    
    moved_count, error_count, errors = organize_backups(
        root_dir,
        backup_destination,
        dry_run=args.dry_run
    )
    
    print()
    print("=" * 60)
    print(f"Summary:")
    print(f"  Moved: {moved_count}")
    print(f"  Errors: {error_count}")
    
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")
    
    if args.dry_run:
        print("\nThis was a dry run. Use without --dry-run to actually move files.")


if __name__ == "__main__":
    main()

