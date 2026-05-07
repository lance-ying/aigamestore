#!/usr/bin/env python3

"""
Extract game ratings and play duration from Firebase downloads to CSV

Usage: python scripts/extract_ratings_to_csv.py [downloads_dir] [output_csv]

Example: python scripts/extract_ratings_to_csv.py downloads_archive ratings.csv
"""

import json
import os
import sys
import csv
from pathlib import Path
from datetime import datetime

def extract_game_info_from_path(game_path):
    """
    Extract method, game_id from path like:
    games/games_pilot/vibe_coding_iter_0/game_0007/sample_0

    Returns: (method, game_id)
    """
    parts = game_path.split('/')

    # Find games_pilot index
    try:
        games_pilot_idx = parts.index('games_pilot')
        method = parts[games_pilot_idx + 1] if len(parts) > games_pilot_idx + 1 else 'unknown'
        game_id = parts[games_pilot_idx + 2] if len(parts) > games_pilot_idx + 2 else 'unknown'
        return method, game_id
    except (ValueError, IndexError):
        return 'unknown', 'unknown'

def parse_session_data(session_path):
    """
    Parse a session directory and extract relevant data

    Returns dict with:
    - prolific_id (userId)
    - method
    - game_id
    - session_id
    - duration (seconds)
    - fun_rating
    - playability_rating
    - start_time
    - end_time
    """
    session_dir = Path(session_path)

    metadata_file = session_dir / 'metadata.json'
    ratings_file = session_dir / 'ratings.json'

    if not metadata_file.exists():
        return None

    # Read metadata
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    # Read ratings (if exists)
    fun_rating = None
    playability_rating = None
    if ratings_file.exists():
        with open(ratings_file, 'r') as f:
            ratings = json.load(f)
            fun_rating = ratings.get('fun')
            playability_rating = ratings.get('playability')

    # Extract method and game_id from gameId path
    game_id_path = metadata.get('gameId', '')
    method, game_id = extract_game_info_from_path(game_id_path)

    return {
        'prolific_id': metadata.get('userId', 'unknown'),
        'method': method,
        'game_id': game_id,
        'session_id': metadata.get('sessionId', 'unknown'),
        'duration_seconds': metadata.get('duration', 0),
        'fun_rating': fun_rating if fun_rating is not None else '',
        'playability_rating': playability_rating if playability_rating is not None else '',
        'start_time': metadata.get('startTime', ''),
        'end_time': metadata.get('endTime', ''),
        'completed': metadata.get('completed', False),
    }

def find_all_sessions(downloads_dir):
    """
    Find all session directories in the downloads folder
    """
    storage_dir = Path(downloads_dir) / 'storage' / 'games'

    if not storage_dir.exists():
        print(f"Error: Storage directory not found at {storage_dir}")
        return []

    sessions = []

    # Walk through all directories looking for session folders
    for root, dirs, files in os.walk(storage_dir):
        # A session directory contains metadata.json
        if 'metadata.json' in files:
            sessions.append(root)

    return sessions

def main():
    # Parse arguments
    downloads_dir = sys.argv[1] if len(sys.argv) > 1 else 'downloads'
    output_csv = sys.argv[2] if len(sys.argv) > 2 else 'game_ratings.csv'

    downloads_path = Path(downloads_dir)

    if not downloads_path.exists():
        print(f"Error: Downloads directory not found at {downloads_path}")
        print(f"Usage: python {sys.argv[0]} [downloads_dir] [output_csv]")
        sys.exit(1)

    print(f"Scanning {downloads_path} for session data...\n")

    # Find all sessions
    session_paths = find_all_sessions(downloads_dir)
    print(f"Found {len(session_paths)} sessions\n")

    # Extract data from each session
    all_data = []
    for session_path in session_paths:
        data = parse_session_data(session_path)
        if data:
            all_data.append(data)

    print(f"Extracted data from {len(all_data)} sessions\n")

    # Sort by prolific_id, then method, then game_id
    all_data.sort(key=lambda x: (x['prolific_id'], x['method'], x['game_id']))

    # Write to CSV
    if all_data:
        fieldnames = [
            'prolific_id',
            'method',
            'game_id',
            'session_id',
            'duration_seconds',
            'fun_rating',
            'playability_rating',
            'start_time',
            'end_time',
            'completed'
        ]

        with open(output_csv, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_data)

        print(f"CSV written to: {output_csv}\n")

        # Print summary statistics
        print("Summary:")
        print(f"   Total sessions: {len(all_data)}")

        # Count unique users
        unique_users = len(set(d['prolific_id'] for d in all_data))
        print(f"   Unique users: {unique_users}")

        # Count sessions with ratings
        with_ratings = sum(1 for d in all_data if d['fun_rating'] != '')
        print(f"   Sessions with ratings: {with_ratings}")

        # Count by method
        methods = {}
        for d in all_data:
            method = d['method']
            methods[method] = methods.get(method, 0) + 1

        print(f"\n   Sessions by method:")
        for method, count in sorted(methods.items()):
            print(f"     {method}: {count}")

        print()
    else:
        print("No session data found")
        sys.exit(1)

if __name__ == '__main__':
    main()
