#!/usr/bin/env python3
"""
Check which games have controls/instructions and descriptions in their index.html files.

This script scans all index.html files in games_final subdirectories and flags:
- Games with control instructions embedded in HTML
- Games with/without game descriptions
"""

import argparse
import csv
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Optional, Tuple


class ControlDescriptionParser(HTMLParser):
    """HTML parser to extract control text and description text."""
    
    def __init__(self):
        super().__init__()
        self.control_text = ""
        self.description_text = ""
        self.in_game_controls = False
        self.in_game_description = False
        self.current_text = []
        self.visible_text = []
        self.in_script = False
        self.in_style = False
        self.potential_control_texts = []  # Store potential control texts from <p> tags
        self.current_p_text = []
        self.in_p = False
    
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == 'script':
            self.in_script = True
        elif tag == 'style':
            self.in_style = True
        elif tag in ('p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            if attrs_dict.get('id') == 'gameControls':
                self.in_game_controls = True
                self.current_text = []
            elif attrs_dict.get('id') == 'gameDescription':
                self.in_game_description = True
                self.current_text = []
            elif tag == 'p' and not self.in_script and not self.in_style:
                # Track <p> tags that might contain controls
                self.in_p = True
                self.current_p_text = []
    
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        elif tag == 'style':
            self.in_style = False
        elif tag in ('p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            if self.in_game_controls:
                self.control_text = ' '.join(self.current_text).strip()
                self.in_game_controls = False
                self.current_text = []
            elif self.in_game_description:
                self.description_text = ' '.join(self.current_text).strip()
                self.in_game_description = False
                self.current_text = []
            elif tag == 'p' and self.in_p:
                # Check if this <p> tag contains control keywords
                p_text = ' '.join(self.current_p_text).strip()
                if p_text and _has_control_keywords_static(p_text):
                    self.potential_control_texts.append(p_text)
                self.in_p = False
                self.current_p_text = []
    
    def handle_data(self, data):
        # Skip script and style content
        if self.in_script or self.in_style:
            return
        
        # Collect text from gameControls or gameDescription elements
        if self.in_game_controls or self.in_game_description:
            # Only add non-whitespace data or meaningful whitespace
            stripped = data.strip()
            if stripped:
                self.current_text.append(stripped)
        elif self.in_p:
            # Collect text from <p> tags
            stripped = data.strip()
            if stripped:
                self.current_p_text.append(stripped)
        
        # Also collect visible text for pattern matching (only non-whitespace)
        if not self.in_script and not self.in_style:
            stripped = data.strip()
            if stripped:
                self.visible_text.append(stripped)


# Note: extract_text_from_html function removed - parsing now done directly in check_game_html


def _has_control_keywords_static(text: str) -> bool:
    """Check if text contains control-related keywords (static helper)."""
    if not text:
        return False
    
    text_lower = text.lower()
    control_patterns = [
        r'\barrow\b', r'\bspace\b', r'\benter\b', r'\besc\b', r'\bescape\b',
        r'\bwasd\b', r'\bkey\b', r'\bcontrol\b', r'\bpress\b', r'\bclick\b',
        r'arrow\s+(left|right|up|down)', r'space\s+to', r'press\s+\w+', r'use\s+\w+\s+to',
    ]
    for pattern in control_patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False


def has_control_keywords(text: str) -> bool:
    """Check if text contains control-related keywords."""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Common control keywords
    control_patterns = [
        r'\barrow\b',
        r'\bspace\b',
        r'\benter\b',
        r'\besc\b',
        r'\bescape\b',
        r'\bwasd\b',
        r'\bkey\b',
        r'\bcontrol\b',
        r'\bpress\b',
        r'\bclick\b',
        r'\bmove\b',
        r'\bjump\b',
        r'\battack\b',
        r'\baim\b',
        r'\bfire\b',
        r'\bselect\b',
        r'\bstart\b',
        r'\bpause\b',
        r'\brestart\b',
        r'arrow\s+(left|right|up|down)',
        r'space\s+to',
        r'press\s+\w+',
        r'use\s+\w+\s+to',
    ]
    
    for pattern in control_patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    
    return False


def check_game_html(game_dir: Path) -> Dict[str, any]:
    """
    Check a single game's index.html file for controls and descriptions.
    Returns a dict with game_name, has_controls, control_text, has_description, description_text
    """
    game_name = game_dir.name
    html_path = game_dir / 'index.html'
    
    result = {
        'game_name': game_name,
        'has_controls': False,
        'control_text': '',
        'has_description': False,
        'description_text': ''
    }
    
    if not html_path.exists():
        return result
    
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading {html_path}: {e}")
        return result
    
    # Extract control and description text
    parser = ControlDescriptionParser()
    try:
        parser.feed(html_content)
    except Exception as e:
        print(f"Warning: HTML parsing error for {game_name}: {e}")
        return result
    
    control_text = parser.control_text
    description_text = parser.description_text
    all_visible_text = ' '.join(parser.visible_text)
    
    # Check for controls
    has_controls = False
    if control_text:
        has_controls = True
        result['control_text'] = control_text
    elif parser.potential_control_texts:
        # Use control text from <p> tags that contain control keywords
        has_controls = True
        result['control_text'] = ' | '.join(parser.potential_control_texts)
    elif has_control_keywords(all_visible_text):
        # Check if description contains controls
        if description_text and has_control_keywords(description_text):
            has_controls = True
            result['control_text'] = description_text
        # Or check other visible text
        elif has_control_keywords(all_visible_text):
            has_controls = True
            # Try to extract relevant control text from visible text
            # Look for patterns like "Arrow Left/Right: ..." or "Space to ..."
            # First, try to find a paragraph or div that contains controls
            control_matches = re.findall(
                r'(?:[^|]*(?:arrow|space|enter|esc|wasd|key|control|press)[^|]*)',
                all_visible_text,
                re.IGNORECASE
            )
            if control_matches:
                # Clean up matches and join
                cleaned = [m.strip() for m in control_matches if len(m.strip()) > 5]
                if cleaned:
                    result['control_text'] = ' | '.join(cleaned[:3])  # Limit to first 3 matches
    
    result['has_controls'] = has_controls
    
    # Check for description
    if description_text:
        result['has_description'] = True
        result['description_text'] = description_text
    
    return result


def scan_all_games(base_path: Path, flat_structure: bool = False) -> list:
    """
    Scan all game directories and collect results.
    
    Args:
        base_path: Base directory containing games
        flat_structure: If True, scan games directly in base_path.
                       If False, scan subdirectories within base_path.
    """
    results = []
    
    if flat_structure:
        # Flat structure: games are directly in base_path
        if not base_path.exists():
            print(f"Directory not found: {base_path}")
            return results
        
        print(f"Scanning {base_path.name}...")
        game_dirs = [
            d for d in base_path.iterdir() 
            if d.is_dir() and not d.name.startswith('.') and '_backup_' not in d.name
        ]
        
        for game_dir in game_dirs:
            # Only process directories that have index.html
            if (game_dir / 'index.html').exists():
                result = check_game_html(game_dir)
                results.append(result)
    else:
        # Nested structure: scan subdirectories
        directories = [
            base_path / 'blue_purple_games_flattened_modded',
            base_path / 'games_pilot',
            base_path / 'purple_yellow_games_flattened',
            base_path / 'red_green_games_flattened',
        ]
        
        for dir_path in directories:
            if not dir_path.exists():
                print(f"Directory not found: {dir_path}")
                continue
            
            print(f"Scanning {dir_path.name}...")
            game_dirs = [d for d in dir_path.iterdir() if d.is_dir()]
            
            for game_dir in game_dirs:
                result = check_game_html(game_dir)
                results.append(result)
    
    return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Check which games have controls/instructions and descriptions in their index.html files"
    )
    parser.add_argument(
        "--directory",
        default=None,
        help="Directory containing games to scan (default: games/games_final with nested structure)"
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV file path (default: games_with_html_controls.csv)"
    )
    
    args = parser.parse_args()
    
    # Determine base path
    if args.directory:
        base_path = Path(args.directory)
        if not base_path.is_absolute():
            base_path = Path(__file__).resolve().parents[2] / args.directory
        flat_structure = True  # Assume flat if directory is explicitly provided
    else:
        base_path = Path(__file__).resolve().parents[2] / 'games' / 'games_final'
        flat_structure = False  # Use nested structure by default
    
    # Determine output path
    if args.output:
        output_csv = Path(args.output)
        if not output_csv.is_absolute():
            output_csv = Path(__file__).resolve().parents[2] / args.output
    else:
        output_csv = Path(__file__).resolve().parents[2] / 'games_with_html_controls.csv'
    
    print("Scanning game directories for controls and descriptions in HTML...")
    results = scan_all_games(base_path, flat_structure=flat_structure)
    
    # Write results to CSV
    print(f"\nWriting results to {output_csv}...")
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'game_name', 'has_controls', 'control_text', 'has_description', 'description_text'
        ])
        writer.writeheader()
        for result in sorted(results, key=lambda x: x['game_name']):
            writer.writerow(result)
    
    # Print statistics
    total = len(results)
    with_controls = sum(1 for r in results if r['has_controls'])
    without_controls = total - with_controls
    with_description = sum(1 for r in results if r['has_description'])
    without_description = total - with_description
    
    print(f"\nDone!")
    print(f"Total games scanned: {total}")
    print(f"Games with controls: {with_controls}")
    print(f"Games without controls: {without_controls}")
    print(f"Games with description: {with_description}")
    print(f"Games without description: {without_description}")
    print(f"Output written to: {output_csv}")


if __name__ == '__main__':
    main()

