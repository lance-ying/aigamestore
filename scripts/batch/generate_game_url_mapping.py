#!/usr/bin/env python3
"""
Generate a CSV mapping game directory names to their App Store/Steam URLs.

This script scans 4 game directories and extracts URLs using multiple strategies:
1. Direct URL extraction from metadata.json concept field
2. Matching concepts with CSV files in archive/games/
3. Searching intermediate_outputs.json
4. Searching root-level tempfiles
"""

import json
import csv
import re
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher


def extract_url_from_text(text: str) -> Optional[str]:
    """Extract URLs from text using regex patterns."""
    if not text:
        return None
    
    # Patterns for App Store and Steam URLs
    patterns = [
        r'https://apps\.apple\.com/[^\s\)]+',
        r'https://store\.steampowered\.com/[^\s\)]+',
        r'https://steamcommunity\.com/app/[^\s\)]+',
        r'App Store URL:\s*(https://[^\s\)]+)',
        r'Steam URL:\s*(https://[^\s\)]+)',
        r'Store URL:\s*(https://[^\s\)]+)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Return the first match (remove any trailing punctuation)
            url = matches[0].rstrip('.,;!?)')
            if url.startswith('http'):
                return url
    
    return None


def get_url_from_metadata(metadata_path: Path) -> Tuple[Optional[str], Optional[str]]:
    """
    Check metadata.json for URLs and extract concept text.
    Returns: (url, concept_text)
    """
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        game_info = metadata.get('game_info', {})
        concept = game_info.get('concept', '')
        
        # Try to extract URL from concept field
        url = extract_url_from_text(concept)
        if url:
            return url, concept
        
        return None, concept
    except Exception as e:
        print(f"Error reading metadata.json: {e}")
        return None, None


def load_csv_files(csv_dir: Path) -> List[Dict]:
    """Load all CSV files from archive/games/ into memory."""
    csv_data = []
    
    csv_files = [
        csv_dir / 'unique_suitable_games_with_concepts.csv',
        csv_dir / 'archive' / 'unique_suitable_games_with_concepts.csv',
        csv_dir / 'archive' / 'top_50_paid_games_detailed_20250705_103208.csv',
        csv_dir / 'archive' / 'top_50_free_games_detailed_20250705_103208.csv',
    ]
    
    for csv_file in csv_files:
        if csv_file.exists():
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        csv_data.append(row)
                print(f"Loaded {len(csv_data)} rows from {csv_file.name}")
            except Exception as e:
                print(f"Error loading {csv_file}: {e}")
    
    return csv_data


def similarity_score(text1: str, text2: str) -> float:
    """Calculate similarity between two texts."""
    if not text1 or not text2:
        return 0.0
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def match_concept_with_csv(concept_text: str, csv_data: List[Dict], game_name: str = None) -> Optional[str]:
    """
    Match concept text with CSV game_concept column using fuzzy matching.
    Returns URL if match found.
    """
    if not concept_text:
        return None
    
    # Extract the game name from concept if it starts with **Game Name**:
    concept_game_name = None
    if concept_text.startswith('**'):
        match = re.match(r'\*\*([^*]+)\*\*', concept_text)
        if match:
            concept_game_name = match.group(1).strip()
    
    best_match = None
    best_score = 0.0
    best_url = None
    
    for row in csv_data:
        csv_concept = row.get('game_concept', '')
        csv_game_name = row.get('game_name', '')
        csv_url = row.get('game_url') or row.get('app_store_url', '')
        
        if not csv_url:
            continue
        
        # Try matching by game name first
        if game_name or concept_game_name:
            name_to_match = game_name or concept_game_name
            name_score = similarity_score(name_to_match, csv_game_name)
            if name_score > 0.8:  # High threshold for name matching
                if name_score > best_score:
                    best_score = name_score
                    best_url = csv_url
                    best_match = csv_game_name
        
        # Try matching by concept text
        if csv_concept:
            # Extract game name from CSV concept
            csv_concept_name = None
            if csv_concept.startswith('**'):
                match = re.match(r'\*\*([^*]+)\*\*', csv_concept)
                if match:
                    csv_concept_name = match.group(1).strip()
            
            # Compare concept names
            if concept_game_name and csv_concept_name:
                concept_score = similarity_score(concept_game_name, csv_concept_name)
                if concept_score > best_score:
                    best_score = concept_score
                    best_url = csv_url
                    best_match = csv_concept_name
            
            # Compare full concept text (first 500 chars for efficiency)
            concept_text_short = concept_text[:500].lower()
            csv_concept_short = csv_concept[:500].lower()
            text_score = similarity_score(concept_text_short, csv_concept_short)
            if text_score > 0.7 and text_score > best_score:  # Lower threshold for text matching
                best_score = text_score
                best_url = csv_url
                best_match = csv_game_name
    
    if best_url and best_score > 0.7:
        return best_url
    
    return None


def get_url_from_intermediate_outputs(intermediate_path: Path) -> Optional[str]:
    """Check intermediate_outputs.json for URLs."""
    try:
        with open(intermediate_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check full_response field
        full_response = data.get('full_response', '')
        if full_response:
            url = extract_url_from_text(full_response)
            if url:
                return url
        
        # Check call_history
        call_history = data.get('call_history', [])
        for call in call_history:
            if isinstance(call, dict):
                prompt = call.get('prompt', '')
                response = call.get('response', '')
                url = extract_url_from_text(prompt) or extract_url_from_text(response)
                if url:
                    return url
        
        return None
    except Exception as e:
        print(f"Error reading intermediate_outputs.json: {e}")
        return None


def search_tempfiles(concept_name: str, root_dir: Path) -> Optional[str]:
    """Search root-level tempfiles for URLs."""
    if not concept_name:
        return None
    
    # Normalize concept name for filename
    # Remove special characters and convert to lowercase
    normalized = re.sub(r'[^a-z0-9]+', '-', concept_name.lower()).strip('-')
    
    # Try different variations
    tempfile_patterns = [
        f"temp_concept_{normalized}.txt",
        f"temp_concept_{concept_name.lower().replace(' ', '_')}.txt",
    ]
    
    for pattern in tempfile_patterns:
        tempfile_path = root_dir / pattern
        if tempfile_path.exists():
            try:
                with open(tempfile_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    url = extract_url_from_text(content)
                    if url:
                        return url
            except Exception as e:
                print(f"Error reading {tempfile_path}: {e}")
    
    return None


def load_concept_json_files(concepts_dir: Path) -> List[Dict]:
    """Load all JSON files from data/concepts/game_concepts/ directories."""
    concept_data = []
    
    subdirs = ['csv_games', 'csv_suitable_games', 'ios_game_concepts', 'csv_games_direct']
    
    for subdir in subdirs:
        subdir_path = concepts_dir / subdir
        if subdir_path.exists():
            for json_file in subdir_path.glob('*.json'):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        concept_data.append(data)
                except Exception as e:
                    print(f"Error loading {json_file}: {e}")
    
    return concept_data


def find_original_game_name(concept_text: str, game_name: str, concept_data: List[Dict], csv_data: List[Dict]) -> Optional[str]:
    """Find the original game name from various sources."""
    original_name = None
    
    # Strategy 1: Check metadata.json for original_game_name field (handled in get_url_from_metadata)
    
    # Strategy 2: Extract from concept text (format: **Game Name**:)
    if concept_text and concept_text.startswith('**'):
        match = re.match(r'\*\*([^*]+)\*\*', concept_text)
        if match:
            original_name = match.group(1).strip()
            # Clean up common suffixes
            original_name = re.sub(r'\s*(Clone|Lite|Reboot|Web Edition|2D|3D)$', '', original_name, flags=re.IGNORECASE)
    
    # Strategy 3: Search concept JSON files
    if not original_name and concept_data:
        best_match = None
        best_score = 0.0
        
        for concept_entry in concept_data:
            # Check original_game_name field
            csv_original = concept_entry.get('original_game_name', '')
            if csv_original:
                score = similarity_score(game_name.lower(), csv_original.lower())
                if score > 0.7 and score > best_score:
                    best_score = score
                    best_match = csv_original
            
            # Check game_name field
            csv_game_name = concept_entry.get('game_name', '')
            if csv_game_name:
                score = similarity_score(game_name.lower(), csv_game_name.lower())
                if score > 0.8 and score > best_score:
                    best_score = score
                    best_match = csv_game_name
            
            # Check name field (for ios_game_concepts)
            csv_name = concept_entry.get('name', '')
            if csv_name:
                score = similarity_score(game_name.lower(), csv_name.lower())
                if score > 0.8 and score > best_score:
                    best_score = score
                    best_match = csv_name
        
        if best_match:
            original_name = best_match
    
    # Strategy 4: Search CSV files by matching concept
    if not original_name and concept_text and csv_data:
        best_match = None
        best_score = 0.0
        
        for row in csv_data:
            csv_concept = row.get('game_concept', '')
            csv_game_name = row.get('game_name', '')
            
            if csv_concept and csv_game_name:
                # Compare concept texts
                concept_score = similarity_score(concept_text[:500].lower(), csv_concept[:500].lower())
                if concept_score > 0.7 and concept_score > best_score:
                    best_score = concept_score
                    best_match = csv_game_name
        
        if best_match:
            original_name = best_match
    
    return original_name


def scan_game_directory(game_dir: Path, csv_data: List[Dict], concept_data: List[Dict], root_dir: Path) -> Dict[str, str]:
    """
    Scan a single game directory and extract URL or original game name.
    Returns: {game_name: url_or_original_name}
    """
    game_name = game_dir.name
    metadata_path = game_dir / 'metadata.json'
    intermediate_path = game_dir / 'intermediate_outputs.json'
    
    url = None
    concept_text = None
    original_game_name = None
    
    # Strategy 1: Check metadata.json for direct URL and original_game_name
    if metadata_path.exists():
        url, concept_text = get_url_from_metadata(metadata_path)
        # Check for original_game_name in metadata
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                game_info = metadata.get('game_info', {})
                original_game_name = game_info.get('original_game_name')
        except:
            pass
    
    # Strategy 2: Match with CSV files for URL
    if not url and concept_text and csv_data:
        url = match_concept_with_csv(concept_text, csv_data, game_name)
    
    # Strategy 3: Check intermediate_outputs.json for URL
    if not url and intermediate_path.exists():
        url = get_url_from_intermediate_outputs(intermediate_path)
    
    # Strategy 4: Search tempfiles for URL
    if not url and concept_text:
        # Extract game name from concept
        concept_name = None
        if concept_text.startswith('**'):
            match = re.match(r'\*\*([^*]+)\*\*', concept_text)
            if match:
                concept_name = match.group(1).strip()
        
        if concept_name:
            url = search_tempfiles(concept_name, root_dir)
    
    # If no URL found, try to find original game name
    if not url:
        original_game_name = find_original_game_name(concept_text, game_name, concept_data, csv_data)
    
    # Return URL if found, otherwise return original game name
    result = url or original_game_name or ''
    return {game_name: result}


def scan_all_directories(base_path: Path, csv_data: List[Dict], concept_data: List[Dict]) -> List[Tuple[str, str]]:
    """Scan all 4 game directories and collect URLs or original game names."""
    results = []
    
    directories = [
        base_path / 'blue_purple_games_flattened_modded',
        base_path / 'games_pilot',
        base_path / 'purple_yellow_games_flattened',
        base_path / 'red_green_games_flattened',
    ]
    
    root_dir = base_path.parent  # Go up to project root for tempfiles
    
    total_games = 0
    for dir_path in directories:
        if not dir_path.exists():
            print(f"Directory not found: {dir_path}")
            continue
        
        print(f"\nScanning {dir_path.name}...")
        game_dirs = [d for d in dir_path.iterdir() if d.is_dir()]
        total_games += len(game_dirs)
        
        for game_dir in game_dirs:
            game_results = scan_game_directory(game_dir, csv_data, concept_data, root_dir)
            results.extend(game_results.items())
    
    print(f"\nTotal games scanned: {total_games}")
    return results


def main():
    """Main entry point."""
    base_path = Path(__file__).resolve().parents[2] / 'games' / 'games_final'
    csv_dir = Path(__file__).resolve().parents[2] / 'archive' / 'games'
    concepts_dir = Path(__file__).resolve().parents[2] / 'data' / 'concepts' / 'game_concepts'
    output_csv = Path(__file__).resolve().parents[2] / 'game_url_mapping.csv'
    
    print("Loading CSV files...")
    csv_data = load_csv_files(csv_dir)
    print(f"Loaded {len(csv_data)} total CSV records\n")
    
    print("Loading concept JSON files...")
    concept_data = load_concept_json_files(concepts_dir)
    print(f"Loaded {len(concept_data)} concept JSON files\n")
    
    print("Scanning game directories...")
    results = scan_all_directories(base_path, csv_data, concept_data)
    
    # Write results to CSV
    print(f"\nWriting results to {output_csv}...")
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['game_name', 'game_url'])
        for game_name, url_or_name in sorted(results):
            writer.writerow([game_name, url_or_name])
    
    # Print statistics
    urls_found = sum(1 for _, url in results if url and url.startswith('http'))
    names_found = sum(1 for _, url in results if url and not url.startswith('http'))
    empty = sum(1 for _, url in results if not url)
    print(f"\nDone! Found URLs for {urls_found} games, original names for {names_found} games, {empty} games with no match")
    print(f"Output written to: {output_csv}")


if __name__ == '__main__':
    main()

