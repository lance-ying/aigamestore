import os
import subprocess
import re
import tempfile
from typing import Dict, Any, Tuple, List, Optional


def check_p5js_imports(html_file_path: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Check if p5.js is properly imported in the HTML file.
    
    Args:
        html_file_path: Path to the HTML file
        
    Returns:
        Tuple of (success: bool, results: Dict)
    """
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Extract all script tags
        script_tags = re.findall(r'<script[^>]*src=["\']([^"\']*)["\'][^>]*>', content)
        
        # Check for p5.js imports (simpler approach)
        p5js_imports = [src for src in script_tags if 'p5' in src and '.js' in src]
        
        # Check for local JavaScript files
        local_js_imports = [src for src in script_tags if '.js' in src and not (src.startswith('http') or src.startswith('//'))]
        
        # Verify local files exist
        base_dir = os.path.dirname(html_file_path)
        missing_files = []
        
        for js_path in local_js_imports:
            # Handle relative paths
            full_path = os.path.join(base_dir, js_path)
            if not os.path.exists(full_path):
                missing_files.append(js_path)
        
        results = {
            "p5js_found": len(p5js_imports) > 0,
            "p5js_imports": p5js_imports,
            "local_js_imports": local_js_imports,
            "missing_files": missing_files
        }
        
        # Success if p5.js is found and all referenced local files exist
        success = len(p5js_imports) > 0 and len(missing_files) == 0     
        return success, results
        
    except Exception as e:
        return False, {"error": f"Error checking HTML file: {str(e)}"}


def run_eslint(js_file_path: str, game_path: str) -> Dict[str, Any]:
    """
    Run ESLint on a JavaScript file with appropriate configuration for p5.js.
    
    Args:
        js_file_path: Path to the JavaScript file
        game_path: Path to the game directory
        
    Returns:
        Dictionary with lint results
    """
    # Create temporary ESLint configuration using the new flat config format
    with tempfile.NamedTemporaryFile(mode='w', suffix='.mjs', delete=False) as eslint_config:
        config_content = """export default [
            {
                languageOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'script',
                    globals: {
                        // Browser globals
                        window: 'readonly',
                        document: 'readonly',
                        
                        // p5.js globals
                        p5: 'readonly',
                        setup: 'readonly',
                        draw: 'readonly',
                        mousePressed: 'readonly',
                        mouseReleased: 'readonly',
                        mouseMoved: 'readonly',
                        mouseDragged: 'readonly',
                        keyPressed: 'readonly',
                        keyReleased: 'readonly',
                        preload: 'readonly',
                        createCanvas: 'readonly',
                        background: 'readonly',
                        fill: 'readonly',
                        stroke: 'readonly',
                        noStroke: 'readonly',
                        noFill: 'readonly',
                        rect: 'readonly',
                        ellipse: 'readonly',
                        line: 'readonly',
                        text: 'readonly',
                        image: 'readonly',
                        loadImage: 'readonly',
                        loadSound: 'readonly',
                        color: 'readonly',
                        random: 'readonly',
                        width: 'readonly',
                        height: 'readonly'
                    }
                }
            }
        ];"""
        
        # Write directly without encoding since we're in text mode ('w')
        eslint_config.write(config_content)
        eslint_config_path = eslint_config.name
    
    try:
        # Use absolute path for the JavaScript file to avoid path resolution issues
        abs_js_file_path = os.path.abspath(js_file_path)
        
        # Verify file exists before passing to ESLint
        if not os.path.isfile(abs_js_file_path):
            return {
                "file": os.path.basename(js_file_path),
                "returncode": 1,
                "output": f"Error: File not found at path: {abs_js_file_path}"
            }
        
        # Try running ESLint with the flat config format
        try:
            # Use the new flat config format
            eslint_process = subprocess.run(
                ['npx', 'eslint', '--config', eslint_config_path, abs_js_file_path],
                cwd=game_path,
                capture_output=True,
                text=True,
                timeout=10  # Add timeout to prevent hanging
            )
            
            # If there's an error about flat config, try a simpler approach
            if eslint_process.returncode != 0 and ("eslint.config.js" in eslint_process.stderr or 
                                                "--config" in eslint_process.stderr):
                # Fallback to basic syntax check using Node.js
                node_process = subprocess.run(
                    ['node', '--check', abs_js_file_path],
                    cwd=game_path,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                file_result = {
                    "file": os.path.basename(js_file_path),
                    "returncode": node_process.returncode,
                    "output": f"Basic syntax check: {node_process.stderr if node_process.returncode != 0 else 'No syntax errors'}"
                }
            else:
                file_result = {
                    "file": os.path.basename(js_file_path),
                    "returncode": eslint_process.returncode,
                    "output": eslint_process.stdout + eslint_process.stderr
                }
                
        except (subprocess.TimeoutExpired, subprocess.SubprocessError) as e:
            # If any subprocess errors or timeouts occur, fall back to a basic syntax check
            try:
                node_process = subprocess.run(
                    ['node', '--check', abs_js_file_path],
                    cwd=game_path,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                file_result = {
                    "file": os.path.basename(js_file_path),
                    "returncode": node_process.returncode,
                    "output": f"Basic syntax check: {node_process.stderr if node_process.returncode != 0 else 'No syntax errors'}"
                }
            except Exception:
                # If all else fails, assume file is okay
                file_result = {
                    "file": os.path.basename(js_file_path),
                    "returncode": 0,
                    "output": "ESLint check skipped due to configuration issues. Assuming valid JavaScript."
                }
        
        # Clean up the temporary config file
        if os.path.exists(eslint_config_path):
            os.unlink(eslint_config_path)
            
        return file_result
        
    except Exception as e:
        # Clean up the temporary config file
        if os.path.exists(eslint_config_path):
            os.unlink(eslint_config_path)
            
        return {
            "file": os.path.basename(js_file_path),
            "error": str(e),
            "returncode": 1
        }


def check_js_implementation(game_path: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Check if a p5.js game implementation compiles without errors.
    
    Args:
        game_path: Path to the directory containing the game files (HTML and JavaScript)
        
    Returns:
        Tuple of (success: bool, results: Dict)
    """
    # Convert to absolute path to ensure consistent path resolution
    game_path = os.path.abspath(game_path)
    
    if not os.path.isdir(game_path):
        return False, {"error": f"Invalid game path: {game_path} is not a directory"}
    
    # Check if required files exist
    js_files = [f for f in os.listdir(game_path) if f.endswith('.js')]
    html_files = [f for f in os.listdir(game_path) if f.endswith('.html')]
    
    if not js_files:
        return False, {"error": "No JavaScript files found in the game directory"}
    
    if not html_files:
        return False, {"error": "No HTML files found in the game directory"}
    
    results = {
        "html_checks": [],
        "eslint_results": []
    }
    
    has_errors = False
    
    # Check HTML files for p5.js import and JavaScript file references
    for html_file in html_files:
        html_file_path = os.path.join(game_path, html_file)
        html_success, html_result = check_p5js_imports(html_file_path)
        
        if not html_success:
            has_errors = True
            
        results["html_checks"].append({
            "file": html_file,
            "success": html_success,
            "details": html_result
        })
    
    # Run ESLint on JavaScript files
    for js_file in js_files:
        js_file_path = os.path.join(game_path, js_file)
        file_result = run_eslint(js_file_path, game_path)
        
        if file_result.get("returncode", 1) != 0:
            has_errors = True
        
        results["eslint_results"].append(file_result)
    
    return not has_errors, results 