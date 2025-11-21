#!/usr/bin/env python3
"""
Generate game concepts from CSV file using game_concept_generator.

This script:
1. Reads URLs from the CSV file
2. Uses game_concept_generator to fetch game details and generate concepts
3. Saves results to JSON file
"""

import csv
import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from game_concept_generator import generate_concepts_from_urls


def extract_urls_from_csv(csv_path: str) -> list:
    """Extract App Store URLs from CSV file.
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        List of App Store URLs
    """
    urls = []
    csv_file = Path(csv_path)
    
    if not csv_file.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    print(f"Reading CSV file: {csv_path}")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader, 1):
            if not row or len(row) < 14:
                continue
            
            # URL is in column 13 (index 13)
            url = row[13].strip() if len(row) > 13 else ""
            
            if url and url.startswith('https://apps.apple.com'):
                urls.append(url)
            elif url:
                print(f"Warning: Row {i} has invalid URL: {url[:50]}...")
    
    print(f"Extracted {len(urls)} URLs from CSV")
    return urls


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate game concepts from CSV file using game_concept_generator'
    )
    parser.add_argument(
        'csv_file',
        nargs='?',
        default='crawled_games/input_games/new_games_input.csv',
        help='Path to CSV file (default: crawled_games/input_games/new_games_input.csv)'
    )
    parser.add_argument(
        '-o', '--output',
        default='crawled_games/input_games/new_games_concepts.json',
        help='Output JSON file path (default: crawled_games/input_games/new_games_concepts.json)'
    )
    parser.add_argument(
        '-b', '--batch-size',
        type=int,
        default=5,
        help='Number of games to process per AI batch (default: 5)'
    )
    parser.add_argument(
        '--start-from',
        type=int,
        default=0,
        help='Start from this index (for resuming)'
    )
    parser.add_argument(
        '--max-games',
        type=int,
        default=None,
        help='Maximum number of games to process (default: all)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("GAME CONCEPT GENERATOR - CSV PROCESSOR")
    print("=" * 70)
    print()
    
    try:
        # Extract URLs from CSV
        urls = extract_urls_from_csv(args.csv_file)
        
        if not urls:
            print("No URLs found in CSV file!")
            sys.exit(1)
        
        # Apply start_from and max_games filters
        if args.start_from > 0:
            urls = urls[args.start_from:]
            print(f"Starting from index {args.start_from}")
        
        if args.max_games:
            urls = urls[:args.max_games]
            print(f"Limiting to {args.max_games} games")
        
        print(f"\nProcessing {len(urls)} games with batch size {args.batch_size}")
        print()
        
        # Generate concepts using game_concept_generator
        results = generate_concepts_from_urls(
            urls,
            verbose=True,
            batch_size=args.batch_size
        )
        
        # Save results
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Summary
        concepts_generated = sum(1 for r in results if r.get('concept', '').strip())
        
        print()
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total games processed: {len(results)}")
        print(f"Concepts generated: {concepts_generated}")
        print(f"Failed: {len(results) - concepts_generated}")
        print(f"Output saved to: {output_path}")
        print("=" * 70)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

