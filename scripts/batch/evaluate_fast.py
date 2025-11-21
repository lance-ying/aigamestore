#!/usr/bin/env python3
"""
Fast game loader - checks if games load without errors.

This is a lightweight evaluator that simply:
1. Loads each game in a headless browser
2. Records JavaScript errors
3. Checks if game initializes properly
4. Reports results

Much faster than VLM evaluation - good for quick screening.

Usage:
    uv run python scripts/batch/evaluate_fast.py --games-dir public/new_batch_110325
    uv run python scripts/batch/evaluate_fast.py --games-dir public/new_batch_110325 --output results.json
    uv run python scripts/batch/evaluate_fast.py --games-dir public/new_batch_110325 --max-games 10
"""

import argparse
import asyncio
import json
import os
import sys
import http.server
import socketserver
import threading
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Add parent directory to path to allow imports from root
sys.path.insert(0, str(Path(__file__).parent.parent.parent.resolve()))

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Error: playwright not installed. Install with: pip install playwright")
    sys.exit(1)


def find_game_files_path(game_dir: Path) -> Optional[Path]:
    """Navigate through nested structure to find actual game files."""
    if (game_dir / "index.html").exists():
        return game_dir
    
    try:
        sample_dirs = [d for d in game_dir.iterdir() if d.is_dir() and d.name.startswith('sample')]
    except (PermissionError, OSError):
        return None
    
    if not sample_dirs:
        return None
    
    sample_path = sample_dirs[0]
    if (sample_path / "index.html").exists():
        return sample_path
    
    try:
        game_dirs = [d for d in sample_path.iterdir() if d.is_dir() and d.name.startswith('game')]
    except (PermissionError, OSError):
        return None
    
    if not game_dirs:
        return None
    
    game_path = game_dirs[0]
    if (game_path / "index.html").exists():
        return game_path
    
    return None


def find_all_games(games_dir: str = "games", verbose: bool = False) -> List[Path]:
    """Find all game directories that contain an index.html file."""
    games_path = Path(games_dir)
    if not games_path.exists():
        print(f"Error: Games directory '{games_dir}' does not exist")
        return []
    
    game_dirs = []
    skipped = 0
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        if item.name.startswith('.') or item.name.startswith('single_prompt') or '_backup_' in item.name:
            continue
        
        if item.name.endswith('.json'):
            continue
        
        game_files_path = find_game_files_path(item)
        
        if game_files_path is None:
            skipped += 1
            continue
        
        game_dirs.append(game_files_path)
    
    if verbose:
        print(f"  Found {len(game_dirs)} games (skipped {skipped})")
    
    return sorted(game_dirs)


def get_game_title(game_path: Path) -> str:
    """Try to extract game title from metadata or use directory name."""
    metadata_path = game_path / "metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            if metadata.get('game_info', {}).get('title'):
                return metadata['game_info']['title']
            
            concept = metadata.get('game_info', {}).get('concept')
            if concept:
                if isinstance(concept, str):
                    concept = json.loads(concept)
                if concept.get('game_name'):
                    return concept['game_name']
        except Exception:
            pass
    
    return game_path.parent.name if game_path.name.startswith('sample') else game_path.name


class SimpleHTTPServer:
    """Simple HTTP server for serving games."""
    
    def __init__(self, port: int = 8765):
        self.port = port
        self.server = None
        self.thread = None
    
    def start(self, serve_dir: str):
        """Start the HTTP server."""
        os.chdir(serve_dir)
        
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                pass
        
        self.server = socketserver.TCPServer(("127.0.0.1", self.port), QuietHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Stop the HTTP server."""
        if self.server:
            self.server.shutdown()


async def check_game_loads(
    game_path: Path,
    server_url: str,
    timeout: int = 10
) -> Dict[str, Any]:
    """Check if a game loads without JavaScript errors."""
    game_title = get_game_title(game_path)
    
    # Calculate relative path from public directory
    public_path = Path(game_path).resolve()
    for parent in public_path.parents:
        if parent.name == "public":
            relative_path = public_path.relative_to(parent)
            break
    else:
        relative_path = public_path.name
    
    url = f"{server_url}/{relative_path}/index.html"
    
    errors = []
    result = {
        "game_title": game_title,
        "game_path": str(game_path),
        "url": url,
        "status": "unknown",
        "errors": []
    }
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context()
            page = await context.new_page()
            
            # Capture console errors
            def handle_console(msg):
                if msg.type in ["error", "exception"]:
                    errors.append(f"{msg.type}: {msg.text}")
            
            page.on("console", handle_console)
            
            # Try to load the page
            try:
                await page.goto(url, timeout=timeout * 1000, wait_until="domcontentloaded")
                
                # Wait a bit for any initialization errors
                await asyncio.sleep(2)
                
                # Check if page still loaded
                title = await page.title()
                
                if errors:
                    result["status"] = "error"
                    result["errors"] = errors
                else:
                    result["status"] = "success"
                
            except Exception as e:
                result["status"] = "error"
                result["errors"] = [str(e)]
            
            await browser.close()
    
    except Exception as e:
        result["status"] = "error"
        result["errors"] = [f"Browser error: {str(e)}"]
    
    return result


async def batch_check_games(
    games_dir: str = "games",
    max_games: Optional[int] = None,
    verbose: bool = True,
    server_port: int = 8765
) -> Dict[str, Any]:
    """Check all games in a directory."""
    print("="*80)
    print("Fast Game Loader - Checking if games load without errors")
    print("="*80)
    
    games = find_all_games(games_dir, verbose=True)
    
    if not games:
        print(f"No games found in {games_dir}")
        return {"games": [], "summary": {"total": 0, "success": 0, "errors": 0}}
    
    print(f"\nFound {len(games)} games")
    
    if max_games:
        games = games[:max_games]
        print(f"Limiting to first {max_games} games")
    
    # Start HTTP server
    print(f"\nStarting HTTP server on port {server_port}...")
    server = SimpleHTTPServer(port=server_port)
    
    try:
        # Find public directory
        public_dir = None
        for game_path in games:
            for parent in game_path.parents:
                if parent.name == "public":
                    public_dir = str(parent)
                    break
            if public_dir:
                break
        
        if not public_dir:
            print("Error: Could not find public directory")
            return {"games": [], "summary": {"total": 0, "success": 0, "errors": 0}}
        
        server.start(public_dir)
        time.sleep(1)  # Give server time to start
        
        server_url = f"http://127.0.0.1:{server_port}"
        results = []
        
        print(f"\nChecking {len(games)} games...")
        print("="*80)
        
        for i, game_path in enumerate(games, 1):
            game_title = get_game_title(game_path)
            print(f"\n[{i}/{len(games)}] {game_title}")
            
            result = await check_game_loads(game_path, server_url)
            results.append(result)
            
            if result["status"] == "success":
                print(f"  ✓ Loaded successfully")
            else:
                print(f"  ✗ Failed: {result.get('errors', ['Unknown error'])[0]}")
            
            # Small delay between checks
            await asyncio.sleep(0.5)
        
        # Generate summary
        success_count = sum(1 for r in results if r["status"] == "success")
        error_count = sum(1 for r in results if r["status"] == "error")
        
        summary = {
            "total": len(results),
            "success": success_count,
            "errors": error_count,
            "timestamp": datetime.now().isoformat()
        }
        
        return {
            "games": results,
            "summary": summary
        }
    
    finally:
        server.stop()


def print_summary(results: Dict[str, Any]) -> None:
    """Print a summary of results."""
    summary = results.get('summary', {})
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"\nTotal games: {summary.get('total', 0)}")
    print(f"Loaded successfully: {summary.get('success', 0)}")
    print(f"Failed to load: {summary.get('errors', 0)}")
    
    if summary.get('total', 0) > 0:
        success_rate = 100 * summary.get('success', 0) / summary.get('total', 1)
        print(f"Success rate: {success_rate:.1f}%")
    
    # Show failures
    failures = [g for g in results.get('games', []) if g['status'] == 'error']
    if failures:
        print("\n" + "="*80)
        print("FAILED GAMES")
        print("="*80)
        for game in failures:
            print(f"\n{game['game_title']}")
            for error in game.get('errors', []):
                print(f"  • {error}")
    
    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(
        description="Fast game loader - check if games load without errors"
    )
    parser.add_argument(
        "--games-dir",
        default="games",
        help="Directory containing game folders (default: games)"
    )
    parser.add_argument(
        "--max-games",
        type=int,
        help="Maximum number of games to check (optional)"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file for results (optional)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8765,
        help="HTTP server port (default: 8765)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress verbose output"
    )
    
    args = parser.parse_args()
    
    # Run checks
    results = asyncio.run(batch_check_games(
        games_dir=args.games_dir,
        max_games=args.max_games,
        verbose=not args.quiet,
        server_port=args.port
    ))
    
    # Print summary
    print_summary(results)
    
    # Save to file if requested
    if args.output:
        output_path = Path(args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nDetailed results saved to: {output_path}")


if __name__ == "__main__":
    main()







