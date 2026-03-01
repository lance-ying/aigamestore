#!/usr/bin/env python3
"""
Check which games have game name violations and test control violations.

This script scans all index.html files in games_final_true and flags:
- Games with explicit game name mentions (violates batch_remove_game_names.py)
- Games with test control buttons (violates batch_remove_test_files.py)
"""

import argparse
import csv
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class ViolationParser(HTMLParser):
    """HTML parser to detect game name and test control violations."""
    
    def __init__(self, game_name: str):
        super().__init__()
        self.game_name = game_name
        self.normalized_game_name = self._normalize_name(game_name)
        
        # Game name violations
        self.has_game_name = False
        self.game_name_details = []
        
        # Test control violations
        self.has_test_controls = False
        self.test_controls_details = []
        
        # State tracking
        self.in_game_title = False
        self.in_title_tag = False
        self.current_title_text = []
        self.visible_text = []
        self.in_script = False
        self.in_style = False
    
    def _normalize_name(self, name: str) -> str:
        """Normalize game name for matching (remove hyphens, lowercase)."""
        return re.sub(r'[^a-z0-9]', '', name.lower())
    
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == 'script':
            self.in_script = True
        elif tag == 'style':
            self.in_style = True
        elif tag == 'title':
            self.in_title_tag = True
            self.current_title_text = []
        elif tag == 'h1':
            if attrs_dict.get('id') == 'gameTitle':
                self.in_game_title = True
                self.current_title_text = []
        elif tag == 'button':
            # Check for test control buttons
            onclick = attrs_dict.get('onclick', '')
            button_id = attrs_dict.get('id', '')
            button_text = attrs_dict.get('text', '')
            
            # Check onclick for TEST_* patterns
            if 'setControlMode' in onclick and 'TEST_' in onclick:
                self.has_test_controls = True
                # Extract TEST_X from onclick
                test_match = re.search(r"TEST_\d+", onclick)
                if test_match:
                    self.test_controls_details.append(f"Button onclick: {test_match.group()}")
            
            # Check button ID for test patterns
            if re.match(r'test_\d+_ModeBtn', button_id, re.IGNORECASE):
                self.has_test_controls = True
                self.test_controls_details.append(f"Button ID: {button_id}")
    
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        elif tag == 'style':
            self.in_style = False
        elif tag == 'title':
            self.in_title_tag = False
            if self.current_title_text:
                title_text = ' '.join(self.current_title_text).strip()
                if title_text and title_text.lower() != 'game':
                    # Check if title contains game name
                    normalized_title = self._normalize_name(title_text)
                    if self.normalized_game_name in normalized_title or normalized_title in self.normalized_game_name:
                        self.has_game_name = True
                        self.game_name_details.append(f"<title>: '{title_text}'")
                self.current_title_text = []
        elif tag == 'h1':
            if self.in_game_title:
                self.in_game_title = False
                if self.current_title_text:
                    title_text = ' '.join(self.current_title_text).strip()
                    if title_text:
                        self.has_game_name = True
                        self.game_name_details.append(f"h1#gameTitle: '{title_text}'")
                self.current_title_text = []
    
    def handle_data(self, data):
        # Skip script and style content
        if self.in_script or self.in_style:
            return
        
        # Collect text from title tag or gameTitle
        if self.in_title_tag or self.in_game_title:
            stripped = data.strip()
            if stripped:
                self.current_title_text.append(stripped)
        
        # Collect visible text for game name matching
        if not self.in_script and not self.in_style:
            stripped = data.strip()
            if stripped:
                self.visible_text.append(stripped)
    
    def check_visible_text_for_game_name(self):
        """Check visible text for game name mentions."""
        all_text = ' '.join(self.visible_text)
        normalized_text = self._normalize_name(all_text)
        
        # Check if normalized game name appears in visible text
        if self.normalized_game_name and len(self.normalized_game_name) > 3:
            if self.normalized_game_name in normalized_text:
                # Try to find the actual text that matches
                for text in self.visible_text:
                    normalized_text_item = self._normalize_name(text)
                    if self.normalized_game_name in normalized_text_item:
                        # Check if it's not just a common word
                        if len(text) > 3 and text.lower() not in ['game', 'games', 'the', 'and', 'or']:
                            self.has_game_name = True
                            self.game_name_details.append(f"Visible text: '{text[:50]}...'")
                            break


def check_game_violations(game_dir: Path) -> Dict[str, any]:
    """
    Check a single game's index.html file for violations.
    Returns a dict with game_name, has_game_name, has_test_controls, details
    """
    game_name = game_dir.name
    html_path = game_dir / 'index.html'
    
    result = {
        'game_name': game_name,
        'has_game_name': False,
        'has_test_controls': False,
        'game_name_details': '',
        'test_controls_details': ''
    }
    
    if not html_path.exists():
        return result
    
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading {html_path}: {e}")
        return result
    
    # Parse HTML
    parser = ViolationParser(game_name)
    try:
        parser.feed(html_content)
        parser.check_visible_text_for_game_name()
    except Exception as e:
        print(f"Error parsing HTML for {game_name}: {e}")
        return result
    
    # Also check for test buttons in raw HTML (in case parser missed them)
    test_button_patterns = [
        r"onclick=['\"]window\.setControlMode\(['\"]TEST_\d+",
        r"onclick=['\"].*setControlMode\(['\"]TEST_\d+",
        r'<button[^>]*TEST[^>]*>',
        r'id=["\']test_\d+_ModeBtn["\']',
    ]
    
    for pattern in test_button_patterns:
        if re.search(pattern, html_content, re.IGNORECASE):
            parser.has_test_controls = True
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches[:3]:  # Limit to first 3 matches
                if match not in parser.test_controls_details:
                    parser.test_controls_details.append(f"HTML pattern: {match[:50]}")
            break
    
    # Set results
    result['has_game_name'] = parser.has_game_name
    result['has_test_controls'] = parser.has_test_controls
    result['game_name_details'] = ' | '.join(parser.game_name_details) if parser.game_name_details else ''
    result['test_controls_details'] = ' | '.join(parser.test_controls_details) if parser.test_controls_details else ''
    
    return result


def scan_all_games(base_path: Path) -> list:
    """Scan all game directories and collect violation results."""
    results = []
    
    if not base_path.exists():
        print(f"Directory not found: {base_path}")
        return results
    
    print(f"Scanning {base_path.name}...")
    game_dirs = [d for d in base_path.iterdir() if d.is_dir()]
    
    # Filter out backups and hidden directories
    game_dirs = [
        d for d in game_dirs
        if '_backup_' not in d.name
        and not d.name.startswith('.')
        and (d / 'index.html').exists()
    ]
    
    for game_dir in game_dirs:
        result = check_game_violations(game_dir)
        results.append(result)
    
    return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Check which games have game name and test control violations in their index.html files"
    )
    parser.add_argument(
        "--directory",
        default="games/games_final_true",
        help="Directory containing games to scan (default: games/games_final_true)"
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV file path (default: games_html_violations.csv)"
    )
    
    args = parser.parse_args()
    
    # Determine base path
    base_path = Path(args.directory)
    if not base_path.is_absolute():
        base_path = Path(__file__).parent / args.directory
    
    # Determine output path
    if args.output:
        output_csv = Path(args.output)
        if not output_csv.is_absolute():
            output_csv = Path(__file__).parent / args.output
    else:
        output_csv = Path(__file__).parent / 'games_html_violations.csv'
    
    print("Scanning game directories for violations...")
    results = scan_all_games(base_path)
    
    # Write results to CSV
    print(f"\nWriting results to {output_csv}...")
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'game_name', 'has_game_name', 'has_test_controls', 'game_name_details', 'test_controls_details'
        ])
        writer.writeheader()
        for result in sorted(results, key=lambda x: x['game_name']):
            writer.writerow(result)
    
    # Print statistics
    total = len(results)
    with_game_name = sum(1 for r in results if r['has_game_name'])
    with_test_controls = sum(1 for r in results if r['has_test_controls'])
    with_both = sum(1 for r in results if r['has_game_name'] and r['has_test_controls'])
    clean = sum(1 for r in results if not r['has_game_name'] and not r['has_test_controls'])
    
    print(f"\nDone!")
    print(f"Total games scanned: {total}")
    print(f"Games with game name violations: {with_game_name}")
    print(f"Games with test control violations: {with_test_controls}")
    print(f"Games with both violations: {with_both}")
    print(f"Clean games (no violations): {clean}")
    print(f"Output written to: {output_csv}")


if __name__ == '__main__':
    main()
