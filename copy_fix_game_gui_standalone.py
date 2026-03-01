#!/usr/bin/env python3
"""
Copy fix_game_gui.py and all its dependencies to a standalone directory.

This creates a self-contained version that can be used in a separate repository.
"""

import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
DEST_DIR = PROJECT_ROOT / "fix_game_gui_standalone"

# Files and directories to copy
FILES_TO_COPY = [
    # Main script
    "scripts/utils/fix_game_gui.py",
    
    # Core dependencies
    "iterators/__init__.py",
    "iterators/feedback_fix.py",
    "iterators/base.py",  # feedback_fix might import from base
    
    # LLM interface
    "llm_interface/__init__.py",
    "llm_interface/model_api.py",
    
    # Utils
    "utils/__init__.py",
    "utils/saving_utils/__init__.py",
    "utils/saving_utils/fix_log_writer.py",
    
    # Optional: for regenerate functionality
    "generators/__init__.py",
    "generators/base.py",
    "generators/single_prompt_with_testing.py",
    "utils/saving_utils/file_writer.py",
    "utils/prompt_formatting/__init__.py",
    "utils/prompt_formatting/prompt_utils.py",
    "utils/prompt_formatting/html_template_utils.py",
    "evaluators/__init__.py",
    "evaluators/basic_test/__init__.py",
    "evaluators/basic_test/runner.py",
    "evaluators/basic_test/core/__init__.py",
    "evaluators/basic_test/core/basic_test.py",
    "evaluators/basic_test/core/browser.py",
]


def ensure_init_files(dest_path: Path):
    """Ensure __init__.py files exist in all copied directories."""
    for py_file in dest_path.rglob("*.py"):
        parent = py_file.parent
        init_file = parent / "__init__.py"
        if not init_file.exists():
            init_file.write_text("# Auto-generated\n")


def copy_file(source: Path, dest: Path):
    """Copy a file, creating parent directories as needed."""
    if not source.exists():
        print(f"  ⚠️  Warning: {source} does not exist, skipping")
        return False
    
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
    return True


def create_requirements_txt(dest_dir: Path):
    """Create requirements.txt."""
    requirements = """gradio>=4.0.0
anthropic>=0.18.0
openai>=1.0.0
pyyaml>=6.0
google-generativeai>=0.3.0
"""
    (dest_dir / "requirements.txt").write_text(requirements)


def create_readme(dest_dir: Path):
    """Create README.md."""
    readme = """# Game Fix GUI - Standalone

A Gradio-based web interface for fixing games with natural language feedback.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the project root with your API keys:
```
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

3. Configure game directories:
Edit `scripts/utils/fix_game_gui.py` and update the `GAME_DIRECTORIES` dictionary
to point to your game directories.

4. Run the GUI:
```bash
python scripts/utils/fix_game_gui.py
```

Or with custom port:
```bash
python scripts/utils/fix_game_gui.py --port 7860
```

## Features

- Browse and preview games in an iframe
- Apply fixes using natural language feedback
- Manage backups and restore previous versions
- Flag games with colors (red, yellow, green, blue, purple) for organization
- Regenerate games from concepts stored in metadata.json

## Project Structure

- `scripts/utils/fix_game_gui.py` - Main GUI application
- `iterators/` - Game fixing logic (FeedbackFixIterator)
- `utils/` - Utility functions for saving logs and formatting
- `llm_interface/` - LLM API interface (ModelAPI)
- `generators/` - Game generation (optional, for regenerate feature)

## Notes

- The GUI expects games to be in directories relative to where the script is run
- Games should have an `index.html` file
- The GUI creates backups automatically before applying fixes
- Fix logs are saved in `fix_logs/` subdirectories within each game
"""
    (dest_dir / "README.md").write_text(readme)


def create_gitignore(dest_dir: Path):
    """Create .gitignore."""
    gitignore = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
.env.local

# Game data (if you want to exclude)
games/
archive/

# Logs
*.log
fix_logs/

# OS
.DS_Store
Thumbs.db
"""
    (dest_dir / ".gitignore").write_text(gitignore)


def main():
    """Main function."""
    print("=" * 80)
    print("Copying fix_game_gui.py and dependencies")
    print("=" * 80)
    print()
    
    # Remove existing destination
    if DEST_DIR.exists():
        print(f"Removing existing directory: {DEST_DIR}")
        shutil.rmtree(DEST_DIR)
    
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Copying files...")
    copied = 0
    skipped = 0
    
    for file_rel_path in FILES_TO_COPY:
        source = PROJECT_ROOT / file_rel_path
        dest = DEST_DIR / file_rel_path
        
        if copy_file(source, dest):
            print(f"  ✓ {file_rel_path}")
            copied += 1
        else:
            skipped += 1
    
    print(f"\nCopied {copied} files, skipped {skipped} files")
    
    # Ensure __init__.py files exist
    print("\nEnsuring __init__.py files exist...")
    ensure_init_files(DEST_DIR)
    
    # Create additional files
    print("\nCreating additional files...")
    create_requirements_txt(DEST_DIR)
    create_readme(DEST_DIR)
    create_gitignore(DEST_DIR)
    
    print("\n" + "=" * 80)
    print("Done!")
    print(f"Standalone version created in: {DEST_DIR}")
    print("=" * 80)
    print("\nNext steps:")
    print(f"1. cd {DEST_DIR}")
    print("2. Review and update GAME_DIRECTORIES in scripts/utils/fix_game_gui.py")
    print("3. Create .env file with your API keys")
    print("4. pip install -r requirements.txt")
    print("5. python scripts/utils/fix_game_gui.py")


if __name__ == "__main__":
    main()
