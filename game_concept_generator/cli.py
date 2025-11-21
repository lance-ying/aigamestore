#!/usr/bin/env python3
"""Command-line interface for the Game Concept Generator."""

import sys
import json
import argparse
from pathlib import Path
from .main import generate_concept_from_url, generate_concepts_from_urls


def main():
    parser = argparse.ArgumentParser(
        description='Generate mechanic-focused game concepts from App Store URLs'
    )
    parser.add_argument(
        'input',
        help='App Store URL or path to file containing URLs (one per line)'
    )
    parser.add_argument(
        '-o', '--output',
        help='Output JSON file path (default: print to stdout)'
    )
    parser.add_argument(
        '-b', '--batch-size',
        type=int,
        default=5,
        help='Number of games to process per AI batch (default: 5)'
    )
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Suppress progress messages'
    )
    
    args = parser.parse_args()
    
    # Check if input is a URL or file
    if args.input.startswith('http'):
        # Single URL
        result = generate_concept_from_url(args.input, verbose=not args.quiet)
        results = [result] if result else []
    else:
        # File with URLs
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: File not found: {args.input}", file=sys.stderr)
            sys.exit(1)
        
        with open(input_path, 'r', encoding='utf-8') as f:
            urls = [line.strip() for line in f if line.strip()]
        
        results = generate_concepts_from_urls(
            urls, 
            verbose=not args.quiet, 
            batch_size=args.batch_size
        )
    
    # Output results
    if args.output:
        output_path = Path(args.output)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        if not args.quiet:
            print(f"\n✅ Saved {len(results)} games to: {output_path}")
    else:
        print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()

