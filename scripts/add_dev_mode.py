#!/usr/bin/env python3
"""
Script to add dev_mode.js to all games in a directory.

This adds a universal dev mode script that allows:
- Press 'L' to open level selector
- URL parameter ?level=X to jump to a level
- Keyboard shortcuts for level navigation

Usage:
    python scripts/add_dev_mode.py --directory public_platform/games
    python scripts/add_dev_mode.py --directory public_platform/games --pattern "battle-zone"
"""

import argparse
import os
from pathlib import Path
import fnmatch

def find_index_html_files(directory: str, pattern: str = "*") -> list:
    """Find all index.html files in game directories."""
    games_path = Path(directory)
    
    if not games_path.exists():
        print(f"Error: Directory not found: {directory}")
        return []
    
    html_files = []
    
    for item in games_path.iterdir():
        if not item.is_dir():
            continue
        
        # Skip backup directories
        if '_backup_' in item.name:
            continue
        
        # Skip hidden directories
        if item.name.startswith('.'):
            continue
        
        # Apply pattern filter
        if not fnmatch.fnmatch(item.name, pattern):
            continue
        
        # Check if index.html exists
        index_html = item / "index.html"
        if index_html.exists():
            html_files.append(index_html)
    
    return sorted(html_files)

def find_game_js_file(game_dir: Path) -> Path:
    """Find the main game.js file in a game directory."""
    # Common names for main game files
    possible_names = ['game.js', 'main.js', 'index.js']
    for name in possible_names:
        game_js = game_dir / name
        if game_js.exists():
            return game_js
    return None

def check_loadlevel_takes_p_parameter(game_dir: Path) -> bool:
    """Check if loadLevel function takes a p5 instance parameter by searching game files."""
    # Search for patterns like: loadLevel(levelNumber, p) or loadLevel(levelNum, p)
    import re
    patterns = [
        r'function\s+loadLevel\s*\([^)]*,\s*p\s*\)',
        r'export\s+function\s+loadLevel\s*\([^)]*,\s*p\s*\)',
        r'loadLevel\s*\([^)]*levelNumber[^)]*,\s*p\s*\)',
        r'loadLevel\s*\([^)]*levelNum[^)]*,\s*p\s*\)',
        r'loadLevel\s*\([^)]*number[^)]*,\s*p\s*\)',
    ]
    
    # Search all .js files in the game directory
    for js_file in game_dir.glob('*.js'):
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                file_content = f.read()
                for pattern in patterns:
                    if re.search(pattern, file_content):
                        return True
        except Exception:
            continue
    
    return False

def find_loadlevel_import_path(game_dir: Path, game_js_content: str) -> tuple:
    """Find the import path for loadLevel if it's imported."""
    import re
    # Look for: import { loadLevel } from './levelManager.js'
    # or: import loadLevel from './levelManager.js'
    patterns = [
        r"import\s+\{\s*loadLevel[^}]*\}\s+from\s+['\"]([^'\"]+)['\"]",
        r"import\s+loadLevel\s+from\s+['\"]([^'\"]+)['\"]",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, game_js_content)
        if match:
            import_path = match.group(1)
            # Check if the imported file exists
            # Resolve relative to game.js location
            game_js_path = find_game_js_file(game_dir)
            if game_js_path:
                import_file = (game_js_path.parent / import_path).resolve()
                if import_file.exists():
                    return (True, import_path)
    
    return (False, None)

def add_load_level_function(game_dir: Path, force_replace: bool = False) -> bool:
    """Add window.loadLevel function to game.js if it doesn't exist."""
    game_js = find_game_js_file(game_dir)
    if not game_js:
        return False
    
    try:
        with open(game_js, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if window.loadLevel already exists
        # If --force-replace is set, we'll replace it
        has_existing = 'window.loadLevel' in content
        if has_existing and not force_replace:
            return False
        
        # If replacing, remove the old window.loadLevel function
        if has_existing and force_replace:
            import re
            # Try to find and remove the existing window.loadLevel function
            # Match from "window.loadLevel" to the closing "};" (handles multi-line)
            # This pattern matches: window.loadLevel = function(...) { ... };
            pattern = r'window\.loadLevel\s*=\s*function\s*\([^)]*\)\s*\{[^}]*\}(?:\s*;)?'
            # Try a more aggressive pattern that handles nested braces
            # Count braces to find the end
            lines = content.split('\n')
            new_lines = []
            skip_until_brace_count = 0
            in_function = False
            brace_count = 0
            
            for i, line in enumerate(lines):
                if 'window.loadLevel' in line and '=' in line and 'function' in line:
                    in_function = True
                    brace_count = line.count('{') - line.count('}')
                    if brace_count <= 0 and '};' in line:
                        # Single line function
                        continue
                    else:
                        # Multi-line function, start counting
                        continue
                
                if in_function:
                    brace_count += line.count('{') - line.count('}')
                    if brace_count <= 0 and ('};' in line or (line.strip().endswith(';') and brace_count == 0)):
                        in_function = False
                        continue
                    else:
                        continue
                
                new_lines.append(line)
            
            content = '\n'.join(new_lines)
        
        # Check if window.gameInstance is set (common pattern)
        has_game_instance = 'window.gameInstance' in content or 'gameInstance' in content
        
        # Try to detect level loading patterns
        has_load_level = 'loadLevel' in content or 'function loadLevel' in content or 'export function loadLevel' in content
        has_initialize_level = 'initializeLevel' in content or 'function initializeLevel' in content
        has_create_level = 'createLevel' in content or 'function createLevel' in content
        
        # Detect which level property the game uses
        uses_level_property = 'state.level' in content or 'gameState.level' in content or '.level =' in content
        uses_current_level = 'state.currentLevel' in content or 'gameState.currentLevel' in content or '.currentLevel =' in content
        
        # Default to currentLevel if both or neither are found
        level_property = 'level' if (uses_level_property and not uses_current_level) else 'currentLevel'
        
        # Check if loadLevel takes p parameter (search all game files)
        loadlevel_takes_p = check_loadlevel_takes_p_parameter(game_dir)
        
        # Check if loadLevel is imported and get its import path
        is_imported, import_path = find_loadlevel_import_path(game_dir, content)
        
        # Find where to insert (after window.gameInstance assignment or at end)
        insertion_code = []
        
        if has_game_instance:
            # Find where window.gameInstance is assigned
            import re
            pattern = r'(window\.gameInstance\s*=\s*[^;]+;)'
            match = re.search(pattern, content)
            if match:
                insert_pos = match.end()  # Initial insert position
                # Generate appropriate loadLevel function based on detected patterns
                if has_load_level:
                    # Try to detect if loadLevel takes p parameter
                    if 'loadLevel(p,' in content or 'loadLevel(p, ' in content:
                        load_code = f'''
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    if (window.gameInstance) {{
      // Try to import and call loadLevel if available
      if (typeof loadLevel === 'function') {{
        loadLevel(window.gameInstance, levelNum);
      }} else if (typeof initializeLevel === 'function') {{
        initializeLevel(window.gameInstance, levelNum);
      }}
      if (state.gamePhase !== undefined) {{
        state.gamePhase = "PLAYING";
      }}
    }}
  }}
}};'''
                    else:
                        # Check if loadLevel is imported from a module
                        if is_imported:
                            if loadlevel_takes_p:
                                # Imported function that takes p5 instance parameter
                                # Check if import already exists and add alias if needed
                                if 'loadLevelFromManager' not in content:
                                    # Try to add alias to existing import
                                    content = re.sub(
                                        r"(import\s+\{\s*)loadLevel([^}]*\}\s+from\s+['\"][^'\"]+['\"])",
                                        r"\1loadLevel as loadLevelFromManager\2",
                                        content
                                    )
                                    # If that didn't work, try adding a new import
                                    if 'loadLevelFromManager' not in content and import_path:
                                        # Find last import statement
                                        import_matches = list(re.finditer(r'(import\s+[^;]+;)', content))
                                        if import_matches:
                                            last_import = import_matches[-1]
                                            import_pos = last_import.end()
                                            import_statement = f"\nimport {{ loadLevel as loadLevelFromManager }} from '{import_path}';"
                                            content = content[:import_pos] + import_statement + content[import_pos:]
                                        else:
                                            # No imports found, add at top
                                            import_statement = f"import {{ loadLevel as loadLevelFromManager }} from '{import_path}';\n"
                                            content = import_statement + content
                                
                                load_code = f'''
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : gameState;
  if (state && window.gameInstance) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Call the imported loadLevel function with p5 instance
    if (typeof loadLevelFromManager === 'function') {{
      loadLevelFromManager(levelNum, window.gameInstance);
    }} else if (typeof loadLevel === 'function') {{
      loadLevel(levelNum, window.gameInstance);
    }}
    // Start the game
    if (state.gamePhase !== undefined && typeof GAME_PHASES !== 'undefined') {{
      state.gamePhase = GAME_PHASES.PLAYING;
    }} else if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
                                # Recalculate insert_pos after modifying content
                                match = re.search(pattern, content)
                                insert_pos = match.end() if match else len(content)
                            else:
                                # Imported function that doesn't take p parameter
                                load_code = f'''
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : gameState;
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Call the imported loadLevel function (it's in module scope)
    if (typeof loadLevel === 'function') {{
      loadLevel(levelNum);
    }}
    // Start the game
    if (state.gamePhase !== undefined && typeof GAME_PHASES !== 'undefined') {{
      state.gamePhase = GAME_PHASES.PLAYING;
    }} else if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
                        else:
                            load_code = f'''
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    if (typeof loadLevel === 'function') {{
      loadLevel(levelNum);
    }} else if (typeof initializeLevel === 'function') {{
      initializeLevel(levelNum);
    }}
    if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
                else:
                    # Generic fallback
                    load_code = f'''
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {{
      resetGame();
    }}
    if (typeof startGame === 'function') {{
      startGame();
    }} else if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
                
                # Recalculate insert_pos if we modified content (e.g., added imports)
                match = re.search(pattern, content)
                insert_pos = match.end() if match else len(content)
                content = content[:insert_pos] + load_code + content[insert_pos:]
            else:
                # Append at end of file
                load_code = f'''

// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    if (typeof loadLevel === 'function') {{
      if (window.gameInstance) {{
        loadLevel(window.gameInstance, levelNum);
      }} else {{
        loadLevel(levelNum);
      }}
    }} else if (typeof initializeLevel === 'function') {{
      if (window.gameInstance) {{
        initializeLevel(window.gameInstance, levelNum);
      }} else {{
        initializeLevel(levelNum);
      }}
    }}
    if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
                content = content.rstrip() + load_code
        else:
            # No gameInstance found, append at end
            load_code = f'''

// Expose level loading for dev mode
window.loadLevel = function(levelNum) {{
  const state = window.getGameState ? window.getGameState() : window.gameState;
  if (state) {{
    // Set level using the property this game uses
    state.{level_property} = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    if (typeof loadLevel === 'function') {{
      loadLevel(levelNum);
    }} else if (typeof initializeLevel === 'function') {{
      initializeLevel(levelNum);
    }}
    if (state.gamePhase !== undefined) {{
      state.gamePhase = "PLAYING";
    }}
  }}
}};'''
            content = content.rstrip() + load_code
        
        # Write back
        with open(game_js, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"      Warning: Could not add loadLevel to {game_js.name}: {e}")
        return False

def add_dev_mode_script(html_path: Path, dev_mode_path: Path) -> bool:
    """Add dev_mode.js script to index.html if not already present."""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Calculate relative path from html to dev_mode.js
        html_dir = html_path.parent
        
        # Check if dev_mode.js should be in the games directory (one level up from game dir)
        games_dir = html_dir.parent
        games_dev_mode = games_dir / "dev_mode.js"
        
        # Check if dev_mode.js is already included
        # Also fix the path if it's using the wrong one
        if 'dev_mode.js' in content:
            # Check if it's using ../../dev_mode.js and should use ../dev_mode.js
            if '../../dev_mode.js' in content and games_dev_mode.exists():
                # Replace the old path with the correct one
                content = content.replace('../../dev_mode.js', '../dev_mode.js')
                with open(html_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True  # We updated it, so return True
            return False  # Already has correct path
        
        # Always use ../dev_mode.js (games directory) if it exists, otherwise use ../../dev_mode.js (public directory)
        if games_dev_mode.exists():
            rel_path = "../dev_mode.js"
        else:
            # Try public directory (two levels up)
            public_dir = games_dir.parent
            public_dev_mode = public_dir / "dev_mode.js"
            if public_dev_mode.exists():
                rel_path = "../../dev_mode.js"
            else:
                # Fallback: calculate relative path to the original dev_mode.js
                try:
                    rel_path = os.path.relpath(dev_mode_path, html_dir)
                except ValueError:
                    # If relative path fails (different drives on Windows), use absolute
                    rel_path = str(dev_mode_path)
        
        # Find where to insert the script (before game.js or at end of body)
        script_tag = f'<script src="{rel_path}"></script>'
        
        # Try to insert before game.js
        if 'game.js' in content:
            # Find the game.js script tag
            import re
            pattern = r'(<script[^>]*src=["\'][^"\']*game\.js["\'][^>]*>)'
            match = re.search(pattern, content)
            if match:
                # Insert before game.js
                insert_pos = match.start()
                content = content[:insert_pos] + f'{script_tag}\n    ' + content[insert_pos:]
            else:
                # Fallback: insert before closing body tag
                content = content.replace('</body>', f'  {script_tag}\n</body>')
        else:
            # No game.js found, insert before closing body tag
            content = content.replace('</body>', f'  {script_tag}\n</body>')
        
        # Write back
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"Error processing {html_path}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description="Add dev_mode.js to all games in a directory"
    )
    parser.add_argument(
        "--directory",
        default="public_platform/games",
        help="Directory containing games (default: public_platform/games)"
    )
    parser.add_argument(
        "--pattern",
        default="*",
        help="Glob pattern to filter games (e.g., 'battle-*')"
    )
    parser.add_argument(
        "--dev-mode-path",
        default="public/games/dev_mode.js",
        help="Path to dev_mode.js file (default: public/games/dev_mode.js)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--force-replace",
        action="store_true",
        help="Replace existing window.loadLevel functions (useful for fixing games)"
    )
    
    args = parser.parse_args()
    
    # Find dev_mode.js
    dev_mode_path = Path(args.dev_mode_path)
    if not dev_mode_path.exists():
        print(f"Error: dev_mode.js not found at {dev_mode_path}")
        print(f"Please ensure dev_mode.js exists at the specified path.")
        return
    
    # Find all index.html files
    print(f"Scanning directory: {args.directory}")
    if args.pattern != "*":
        print(f"Using pattern filter: {args.pattern}")
    
    html_files = find_index_html_files(args.directory, args.pattern)
    print(f"Found {len(html_files)} games\n")
    
    if not html_files:
        print("No games found.")
        return
    
    if args.dry_run:
        print("[DRY RUN] Would add dev_mode.js to:")
        for html_file in html_files:
            print(f"  - {html_file}")
        return
    
    # Process each game
    added_html = 0
    added_loadlevel = 0
    skipped_html = 0
    skipped_loadlevel = 0
    failed = 0
    
    for html_file in html_files:
        game_name = html_file.parent.name
        game_dir = html_file.parent
        print(f"Processing: {game_name}...")
        
        # Add dev_mode.js script to HTML
        html_result = add_dev_mode_script(html_file, dev_mode_path)
        if html_result:
            print("  ✓ Added dev_mode.js to HTML")
            added_html += 1
        else:
            with open(html_file, 'r') as f:
                if 'dev_mode.js' in f.read():
                    print("  ⊘ HTML already has dev_mode.js")
                    skipped_html += 1
                else:
                    print("  ✗ Failed to add to HTML")
                    failed += 1
        
        # Add window.loadLevel function to game.js
        if add_load_level_function(game_dir, args.force_replace):
            if args.force_replace and 'window.loadLevel' in open(find_game_js_file(game_dir) or Path('dummy'), 'r').read() if find_game_js_file(game_dir) else '':
                print("  ✓ Replaced window.loadLevel() function")
            else:
                print("  ✓ Added window.loadLevel() function")
            added_loadlevel += 1
        else:
            game_js = find_game_js_file(game_dir)
            if game_js:
                with open(game_js, 'r') as f:
                    content = f.read()
                    if 'window.loadLevel' in content:
                        print("  ⊘ Already has window.loadLevel" + (" (use --force-replace to update)" if not args.force_replace else ""))
                        skipped_loadlevel += 1
                    else:
                        print("  ⊘ Could not add window.loadLevel (may need manual setup)")
            else:
                print("  ⊘ No game.js found")
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  HTML (dev_mode.js script):")
    print(f"    Added: {added_html}")
    print(f"    Skipped: {skipped_html}")
    print(f"  Game.js (window.loadLevel function):")
    print(f"    Added: {added_loadlevel}")
    print(f"    Skipped: {skipped_loadlevel}")
    print(f"  Failed: {failed}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

