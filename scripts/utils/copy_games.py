#!/usr/bin/env python3
"""
Script to copy all game directories from games_paths.txt to a destination directory.
"""

import os
import shutil
import re
from pathlib import Path

def parse_paths_from_file(file_path):
    """Parse paths from the games_paths.txt file, handling quotes and special characters."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    paths = []
    # Use regex to find paths that start with /Users
    # This handles quoted and unquoted paths, and paths with special characters
    pattern = r"['\"]?([/]Users[^'\"]+?)['\"]?(?=\s|$|['\"])"
    matches = re.findall(pattern, content)
    
    for match in matches:
        # Clean up the path - remove trailing quotes or spaces
        path = match.strip().rstrip("'\"")
        if path and os.path.exists(path):
            paths.append(path)
        elif path:
            print(f"Warning: Path does not exist: {path}")
    
    return paths

def copy_games(source_paths, dest_dir):
    """Copy all game directories to the destination directory."""
    dest_path = Path(dest_dir)
    dest_path.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    failed = 0
    skipped = 0
    
    for source_path in source_paths:
        try:
            source = Path(source_path)
            if not source.exists():
                print(f"Skipping (does not exist): {source_path}")
                failed += 1
                continue
            
            # Get the directory name (last component of the path)
            dir_name = source.name
            
            # Destination path
            dest = dest_path / dir_name
            
            # If destination already exists, skip or handle as needed
            if dest.exists():
                print(f"Skipping (already exists): {dest}")
                skipped += 1
                continue
            
            print(f"Copying: {source_path} -> {dest}")
            shutil.copytree(source_path, dest)
            copied += 1
            
        except Exception as e:
            print(f"Error copying {source_path}: {e}")
            failed += 1
    
    print(f"\nSummary: {copied} copied, {skipped} skipped, {failed} failed")

if __name__ == "__main__":
    games_file = "/Users/heyodogo/Documents/labs/ryan_lab/work/gordian/games_paths.txt"
    dest_directory = "/Users/heyodogo/Documents/labs/ryan_lab/work/more_games"
    
    print("Parsing paths from games_paths.txt...")
    paths = parse_paths_from_file(games_file)
    print(f"Found {len(paths)} paths to copy\n")
    
    print(f"Copying to: {dest_directory}\n")
    copy_games(paths, dest_directory)



