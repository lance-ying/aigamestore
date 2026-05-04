#!/usr/bin/env python3
"""
Copy all required files for fix_game_gui.py to a new directory for a separate repo.

This script:
1. Analyzes fix_game_gui.py and its dependencies
2. Copies all required files maintaining directory structure
3. Creates a requirements.txt file
4. Creates a README with setup instructions
"""

import ast
import shutil
import subprocess
from pathlib import Path
from typing import Set, Dict, List
import importlib.util


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE_SCRIPT = PROJECT_ROOT / "scripts" / "utils" / "fix_game_gui.py"
DEST_DIR = PROJECT_ROOT / "fix_game_gui_standalone"


def get_imports_from_file(file_path: Path) -> Set[str]:
    """Extract all import statements from a Python file."""
    imports = set()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}")
    
    return imports


def is_standard_library(module_name: str) -> bool:
    """Check if a module is part of Python standard library."""
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is None:
            return False
        # Standard library modules typically don't have an origin or have a specific pattern
        if spec.origin is None:
            return True
        # Check if it's in the standard library path
        import sys
        stdlib_paths = [p for p in sys.path if 'site-packages' not in p and 'dist-packages' not in p]
        for stdlib_path in stdlib_paths:
            if stdlib_path in spec.origin:
                return True
        return False
    except Exception:
        return False


def is_external_package(module_name: str) -> bool:
    """Check if a module is an external package (not in project)."""
    # Common external packages used in this project
    external_packages = {
        'gradio', 'anthropic', 'openai', 'yaml', 'google', 'google.generativeai',
        'plyer', 'win10toast'
    }
    
    if module_name in external_packages:
        return True
    
    # Check if it's a standard library module
    if is_standard_library(module_name):
        return False
    
    # Check if it exists in the project
    project_module_path = PROJECT_ROOT / module_name.replace('.', '/')
    if project_module_path.exists():
        return False
    
    # Check for __init__.py pattern
    parts = module_name.split('.')
    for i in range(len(parts), 0, -1):
        test_path = PROJECT_ROOT / '/'.join(parts[:i])
        if test_path.exists() or (test_path.parent / f"{test_path.name}.py").exists():
            return False
    
    return True


def find_project_module(module_name: str) -> Path:
    """Find the file path for a project module."""
    # Try direct path
    module_path = PROJECT_ROOT / module_name.replace('.', '/')
    if module_path.exists():
        if module_path.is_file() and module_path.suffix == '.py':
            return module_path
        elif module_path.is_dir():
            init_file = module_path / "__init__.py"
            if init_file.exists():
                return init_file
    
    # Try with .py extension
    py_file = PROJECT_ROOT / f"{module_name.replace('.', '/')}.py"
    if py_file.exists():
        return py_file
    
    # Try parent directory with __init__.py
    parts = module_name.split('.')
    for i in range(len(parts) - 1, 0, -1):
        parent_dir = PROJECT_ROOT / '/'.join(parts[:i])
        child_name = parts[i]
        init_file = parent_dir / "__init__.py"
        if init_file.exists():
            # Check if the child module exists
            child_path = parent_dir / f"{child_name}.py"
            if child_path.exists():
                return child_path
    
    return None


def get_all_dependencies(file_path: Path, visited: Set[str] = None) -> Set[Path]:
    """Recursively find all project dependencies."""
    if visited is None:
        visited = set()
    
    if not file_path.exists():
        return set()
    
    # Avoid circular dependencies
    file_key = str(file_path.relative_to(PROJECT_ROOT))
    if file_key in visited:
        return set()
    visited.add(file_key)
    
    dependencies = {file_path}
    imports = get_imports_from_file(file_path)
    
    for module_name in imports:
        # Skip external packages and standard library
        if is_external_package(module_name) or is_standard_library(module_name):
            continue
        
        # Find the module in the project
        module_path = find_project_module(module_name)
        if module_path:
            # Recursively get dependencies
            deps = get_all_dependencies(module_path, visited)
            dependencies.update(deps)
    
    return dependencies


def copy_file_structure(source: Path, dest: Path, files: Set[Path]):
    """Copy files maintaining directory structure."""
    dest.mkdir(parents=True, exist_ok=True)
    
    for file_path in files:
        if not file_path.exists():
            continue
        
        # Calculate relative path from project root
        try:
            rel_path = file_path.relative_to(PROJECT_ROOT)
        except ValueError:
            continue
        
        dest_path = dest / rel_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"  Copying: {rel_path}")
        shutil.copy2(file_path, dest_path)


def create_requirements_txt(dest_dir: Path):
    """Create requirements.txt with external dependencies."""
    requirements = [
        "gradio>=4.0.0",
        "anthropic>=0.18.0",
        "openai>=1.0.0",
        "pyyaml>=6.0",
        "google-generativeai>=0.3.0",
    ]
    
    requirements_path = dest_dir / "requirements.txt"
    with open(requirements_path, 'w') as f:
        f.write('\n'.join(requirements) + '\n')
    
    print(f"  Created: requirements.txt")


def create_readme(dest_dir: Path):
    """Create README with setup instructions."""
    readme_content = """# Game Fix GUI

A Gradio-based web interface for fixing games with natural language feedback.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file with your API keys:
```
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

3. Run the GUI:
```bash
python scripts/utils/fix_game_gui.py
```

Or with custom port:
```bash
python scripts/utils/fix_game_gui.py --port 7860
```

## Features

- Browse and preview games
- Apply fixes using natural language feedback
- Manage backups and restore previous versions
- Flag games with colors for organization
- Regenerate games from concepts

## Project Structure

- `scripts/utils/fix_game_gui.py` - Main GUI application
- `iterators/` - Game fixing logic
- `utils/` - Utility functions
- `llm_interface/` - LLM API interface
"""
    
    readme_path = dest_dir / "README.md"
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"  Created: README.md")


def main():
    """Main function to copy all dependencies."""
    print("=" * 80)
    print("Copying fix_game_gui.py and all dependencies")
    print("=" * 80)
    print()
    
    if not SOURCE_SCRIPT.exists():
        print(f"Error: Source script not found: {SOURCE_SCRIPT}")
        return
    
    print("Analyzing dependencies...")
    all_files = get_all_dependencies(SOURCE_SCRIPT)
    
    print(f"\nFound {len(all_files)} files to copy:")
    for f in sorted(all_files, key=lambda x: str(x.relative_to(PROJECT_ROOT))):
        rel = f.relative_to(PROJECT_ROOT)
        print(f"  - {rel}")
    
    print(f"\nCopying files to: {DEST_DIR}")
    copy_file_structure(PROJECT_ROOT, DEST_DIR, all_files)
    
    print("\nCreating additional files...")
    create_requirements_txt(DEST_DIR)
    create_readme(DEST_DIR)
    
    print("\n" + "=" * 80)
    print("Done!")
    print(f"All files copied to: {DEST_DIR}")
    print("=" * 80)


if __name__ == "__main__":
    main()
