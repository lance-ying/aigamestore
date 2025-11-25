"""Script to add Steam 'about the game' section to CSV file."""

import csv
import re
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from steam_scraper.steam_api_alt import get_app_details
from steam_scraper.config import BATCH_DELAY, BATCH_SIZE


def extract_app_id_from_url(url):
    """Extract Steam app ID from URL."""
    if not url or not isinstance(url, str):
        return None
    
    # Pattern: https://store.steampowered.com/app/367520
    match = re.search(r'/app/(\d+)', url)
    if match:
        return int(match.group(1))
    return None


def fetch_aboutme_for_url(url, retries=3):
    """Fetch the 'about the game' section (detailed_description) from Steam with retry logic.
    
    Args:
        url: Steam game URL
        retries: Number of retry attempts (default: 3)
    
    Returns:
        str: Description text or empty string if failed
    """
    app_id = extract_app_id_from_url(url)
    if not app_id:
        return ""
    
    for attempt in range(retries):
        try:
            app_details = get_app_details(app_id)
        except Exception as e:
            print(f"    Error fetching details for app_id {app_id}: {e}")
            if attempt < retries - 1:
                wait_time = (2 ** attempt) * 5
                print(f"    Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
            return ""
            
            # If we got None (rate limited), wait longer before retry
        if app_details is None:
                if attempt < retries - 1:
                    wait_time = (2 ** attempt) * 5  # Exponential backoff: 5s, 10s, 20s
                    print(f"    ⚠ Rate limited, waiting {wait_time}s before retry {attempt + 2}/{retries}...")
                    time.sleep(wait_time)
                    continue
                return ""
            
            # Check if we got valid details with description
        if app_details and app_details.get('description'):
            return app_details['description']
            
            # If we got empty details (not rate limited, just no data), return empty
            if app_details and not app_details.get('description'):
                return ""
                

def add_aboutme_column(input_csv_path, output_csv_path=None, start_row=0, max_rows=None):
    """
    Add 'aboutme' column to CSV file.
    
    Args:
        input_csv_path: Path to input CSV file
        output_csv_path: Path to output CSV file (default: overwrites input)
        start_row: Row to start from (for resuming)
        max_rows: Maximum number of rows to process (None = all)
    """
    input_path = Path(input_csv_path)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_csv_path}")
        return
    
    if output_csv_path is None:
        output_csv_path = input_csv_path
    
    output_path = Path(output_csv_path)
    
    # Read all rows first
    print(f"Reading CSV file: {input_path}")
    rows = []
    fieldnames = None
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    total_rows = len(rows)
    print(f"Found {total_rows} rows")
    
    # Add 'aboutme' to fieldnames if not present
    if 'aboutme' not in fieldnames:
        fieldnames = list(fieldnames) + ['aboutme']
    
    # Determine processing range
    end_row = total_rows if max_rows is None else min(start_row + max_rows, total_rows)
    rows_to_process = rows[start_row:end_row]
    
    print(f"\nProcessing rows {start_row + 1} to {end_row} ({len(rows_to_process)} rows)")
    print(f"Rate limiting: {BATCH_DELAY}s delay every {BATCH_SIZE} requests\n")
    
    # Process rows
    processed = 0
    errors = 0
    
    for i, row in enumerate(rows_to_process):
        current_row_num = start_row + i + 1
        
        # Skip if already has aboutme
        if row.get('aboutme') and row['aboutme'].strip():
            print(f"[{current_row_num}/{total_rows}] Skipping {row.get('game_name', 'Unknown')} - already has aboutme")
            processed += 1
            continue
        
        game_url = row.get('game_url', '')
        game_name = row.get('game_name', 'Unknown')
        
        print(f"[{current_row_num}/{total_rows}] Fetching aboutme for: {game_name}")
        
        aboutme = fetch_aboutme_for_url(game_url)
        row['aboutme'] = aboutme
        
        if aboutme:
            print(f"    ✓ Got {len(aboutme)} characters")
            processed += 1
        else:
            print(f"    ✗ No aboutme found")
            errors += 1
        
        # Rate limiting - also add small delay between each request
        if i + 1 < len(rows_to_process):
            time.sleep(0.5)  # Small delay between each request
        
        # Longer pause every BATCH_SIZE requests
        if (i + 1) % BATCH_SIZE == 0 and i + 1 < len(rows_to_process):
            print(f"    Pausing for {BATCH_DELAY} seconds...")
            time.sleep(BATCH_DELAY)
    
    # Write updated CSV
    print(f"\nWriting updated CSV to: {output_path}")
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✓ Complete!")
    print(f"  Processed: {processed}")
    print(f"  Errors: {errors}")
    print(f"  Output: {output_path}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Add Steam 'about the game' section to CSV")
    parser.add_argument("input_csv", help="Input CSV file path")
    parser.add_argument("-o", "--output", help="Output CSV file path (default: overwrites input)")
    parser.add_argument("--start-row", type=int, default=0, help="Row to start from (0-indexed)")
    parser.add_argument("--max-rows", type=int, help="Maximum number of rows to process")
    
    args = parser.parse_args()
    
    add_aboutme_column(
        args.input_csv,
        args.output,
        start_row=args.start_row,
        max_rows=args.max_rows
    )

