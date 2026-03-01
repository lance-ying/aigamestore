#!/usr/bin/env python3
"""Generate a game directly from an App Store URL.

This script automates the complete pipeline:
1. Generate temp concept file from App Store URL
2. Add full App Store description to the concept file
3. Generate the game using the concept file
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from game_concept_generator.url_parser import extract_url_info, extract_game_name_from_url
from game_concept_generator.app_store_client import get_app_details


def generate_temp_concept(url: str, project_root: Path, skip_if_exists: bool = False) -> Optional[Path]:
    """Step 1: Generate temp concept file from App Store URL.
    
    Args:
        url: App Store URL
        project_root: Project root directory
        skip_if_exists: If True, skip if file already exists
        
    Returns:
        Path to created temp concept file, or None on failure
    """
    print("\n" + "="*80)
    print("STEP 1: Generating Temp Concept File")
    print("="*80)
    print(f"Processing: {url}")
    
    # Extract app ID and country
    app_id, country_code = extract_url_info(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return None
    
    print(f"  📱 App ID: {app_id}, Country: {country_code.upper()}")
    
    # Fetch app details
    print(f"  ⏳ Fetching app details...")
    app_details = get_app_details(app_id, country_code)
    
    if not app_details or not app_details.get('description'):
        print(f"  ❌ No description found")
        return None
    
    name = app_details.get('name', extract_game_name_from_url(url))
    description = app_details.get('description', '')
    
    print(f"  ✅ Fetched: {name}")
    
    # Create a basic concept from the first paragraph of description
    concept_lines = description.split('\n')
    first_paragraph = concept_lines[0] if concept_lines else description[:500]
    
    # If first paragraph is too long, truncate to first sentence
    if len(first_paragraph) > 500:
        sentences = first_paragraph.split('.')
        if len(sentences) > 1:
            concept = '. '.join(sentences[:2]) + '.'
        else:
            concept = first_paragraph[:500] + '...'
    else:
        concept = first_paragraph
    
    # Create filename from game name
    safe_name = name.lower().replace(' ', '_').replace('-', '_')
    # Remove special characters
    safe_name = ''.join(c for c in safe_name if c.isalnum() or c == '_')
    filename = f"temp_concept_{safe_name}.txt"
    file_path = project_root / filename
    
    # Check if file exists and skip if requested
    if skip_if_exists and file_path.exists():
        print(f"  ⏭️  File already exists: {filename}, skipping")
        return file_path
    
    # Write temp concept file
    content = f"{concept}\n\nApp Store URL: {url}\n"
    
    file_path.write_text(content, encoding='utf-8')
    print(f"  💾 Created: {filename}")
    
    return file_path


def add_full_description(concept_file: Path, project_root: Path, skip_if_exists: bool = False) -> bool:
    """Step 2: Add full App Store description to temp concept file.
    
    Args:
        concept_file: Path to temp concept file
        project_root: Project root directory (unused but kept for consistency)
        skip_if_exists: If True, skip if description already added
        
    Returns:
        True on success, False on failure
    """
    print("\n" + "="*80)
    print("STEP 2: Adding Full App Store Description")
    print("="*80)
    print(f"Processing: {concept_file.name}")
    
    # Read current content
    if not concept_file.exists():
        print(f"  ❌ File not found: {concept_file}")
        return False
    
    content = concept_file.read_text(encoding='utf-8')
    
    # Check if description already added
    if "Full Description:" in content:
        if skip_if_exists:
            print(f"  ⏭️  Description already added, skipping")
            return True
        else:
            print(f"  ⚠️  Description already added, but continuing anyway")
    
    # Extract App Store URL
    url = None
    for line in content.split('\n'):
        if line.startswith('App Store URL:'):
            url = line.replace('App Store URL:', '').strip()
            break
    
    if not url or url == "(Not found in CSV - game from metadata.json)":
        print(f"  ⚠️  No App Store URL found in file")
        return False
    
    print(f"  📱 URL: {url}")
    
    # Extract app ID and country
    app_id, country_code = extract_url_info(url)
    
    if not app_id:
        print(f"  ❌ Could not extract app ID from URL")
        return False
    
    print(f"  🔍 App ID: {app_id}, Country: {country_code.upper()}")
    
    # Fetch app details
    print(f"  ⏳ Fetching description from App Store...")
    app_details = get_app_details(app_id, country_code)
    
    if not app_details or not app_details.get('description'):
        print(f"  ❌ No description found")
        return False
    
    description = app_details.get('description', '')
    name = app_details.get('name', 'Unknown')
    
    print(f"  ✅ Fetched description for: {name}")
    print(f"  📝 Description length: {len(description)} characters")
    
    # Append description to file
    new_content = content.rstrip() + "\n\n" + "="*80 + "\n"
    new_content += "Full Description:\n"
    new_content += "="*80 + "\n\n"
    new_content += description + "\n"
    
    concept_file.write_text(new_content, encoding='utf-8')
    print(f"  💾 Updated file: {concept_file.name}")
    
    return True


def generate_game_from_concept(
    concept_file: Path,
    config: str,
    game_index: Optional[int],
    model: Optional[str],
    no_testing: bool,
    project_root: Path
) -> Optional[Path]:
    """Step 3: Generate game using the temp concept file.
    
    Args:
        concept_file: Path to temp concept file
        config: Path to generator config file
        game_index: Optional game index override
        model: Optional model override
        no_testing: Whether to skip testing
        project_root: Project root directory
        
    Returns:
        Path to generated game directory, or None on failure
    """
    print("\n" + "="*80)
    print("STEP 3: Generating Game")
    print("="*80)
    print(f"Concept file: {concept_file.name}")
    print(f"Config: {config}")
    if game_index:
        print(f"Game index: {game_index}")
    if model:
        print(f"Model: {model}")
    
    # Build command to call generate_game.py
    cmd = [
        sys.executable,
        str(project_root / "scripts" / "cli" / "generate_game.py"),
        "--config", config,
        "--concept", str(concept_file),
    ]
    
    if game_index is not None:
        cmd.extend(["--game_index", str(game_index)])
    
    if model:
        cmd.extend(["--model", model])
    
    if no_testing:
        cmd.append("--no-testing")
    
    print(f"\n  ⏳ Running game generation...")
    print(f"  Command: {' '.join(cmd)}")
    
    try:
        # Run the generate_game.py script
        result = subprocess.run(
            cmd,
            cwd=str(project_root),
            capture_output=False,  # Let output stream through
            text=True,
            check=False  # Don't raise on non-zero exit
        )
        
        if result.returncode != 0:
            print(f"\n  ❌ Game generation failed with exit code {result.returncode}")
            return None
        
        print(f"\n  ✅ Game generation completed successfully")
        # Note: generate_game.py prints the game directory path, so it will be visible in output
        
        return None  # We don't parse the output, just let it print
        
    except Exception as e:
        print(f"\n  ❌ Error running game generation: {e}")
        return None


def validate_url(url: str) -> bool:
    """Validate App Store URL format."""
    if not url.startswith("https://apps.apple.com/"):
        return False
    if "/app/" not in url:
        return False
    if "/id" not in url:
        return False
    return True


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Generate a game directly from an App Store URL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  %(prog)s --url "https://apps.apple.com/us/app/color-road/id1342468799"
  
  # With custom game index and model
  %(prog)s --url "https://apps.apple.com/us/app/color-road/id1342468799" \\
    --game_index 5721 \\
    --model google:gemini-3-pro-preview
  
  # Skip steps that are already done
  %(prog)s --url "https://apps.apple.com/us/app/color-road/id1342468799" \\
    --skip_concept --skip_description
        """
    )
    
    parser.add_argument(
        "--url",
        required=True,
        help="App Store URL (e.g., https://apps.apple.com/us/app/color-road/id1342468799)"
    )
    parser.add_argument(
        "--game_index",
        type=int,
        default=None,
        help="Game index for output folder (optional)"
    )
    parser.add_argument(
        "--config",
        default="configs/generators/p5_gen.yaml",
        help="Generator config file path (default: configs/generators/p5_gen.yaml)"
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model override (e.g., google:gemini-3-pro-preview)"
    )
    parser.add_argument(
        "--skip_concept",
        action="store_true",
        help="Skip temp concept generation if file already exists"
    )
    parser.add_argument(
        "--skip_description",
        action="store_true",
        help="Skip adding full description if already present"
    )
    parser.add_argument(
        "--skip_generation",
        action="store_true",
        help="Only create concept files, don't generate game"
    )
    parser.add_argument(
        "--no-testing",
        action="store_true",
        help="Skip automated testing code generation"
    )
    
    args = parser.parse_args()
    
    # Validate URL
    if not validate_url(args.url):
        print("❌ Error: Invalid App Store URL format")
        print("Expected format: https://apps.apple.com/{country}/app/{name}/id{id}")
        return 1
    
    # Validate config file exists
    config_path = project_root / args.config
    if not config_path.exists():
        print(f"❌ Error: Config file not found: {config_path}")
        return 1
    
    print("="*80)
    print("App Store to Game Generation Pipeline")
    print("="*80)
    print(f"URL: {args.url}")
    print(f"Config: {args.config}")
    if args.game_index:
        print(f"Game Index: {args.game_index}")
    if args.model:
        print(f"Model: {args.model}")
    print("="*80)
    
    # Step 1: Generate temp concept file
    concept_file = generate_temp_concept(
        args.url,
        project_root,
        skip_if_exists=args.skip_concept
    )
    
    if not concept_file:
        print("\n❌ Failed to generate temp concept file")
        return 1
    
    # Rate limiting between API calls
    time.sleep(1.5)
    
    # Step 2: Add full description
    if not add_full_description(
        concept_file,
        project_root,
        skip_if_exists=args.skip_description
    ):
        print("\n⚠️  Warning: Failed to add full description, but continuing...")
    
    # Rate limiting between API calls
    time.sleep(1.5)
    
    # Step 3: Generate game
    if not args.skip_generation:
        game_dir = generate_game_from_concept(
            concept_file,
            args.config,
            args.game_index,
            args.model,
            args.no_testing,
            project_root
        )
        
        if game_dir is None and not args.skip_generation:
            # Check if it was a real failure or just no return value
            # (generate_game.py prints the path, so we can't easily capture it)
            print("\n⚠️  Game generation may have completed - check output above")
    else:
        print("\n" + "="*80)
        print("Skipping game generation (--skip_generation flag set)")
        print("="*80)
        print(f"Concept file ready: {concept_file}")
        print("Run game generation manually with:")
        print(f"  uv run python scripts/cli/generate_game.py \\")
        print(f"    --config {args.config} \\")
        print(f"    --concept {concept_file.name}")
        if args.game_index:
            print(f"    --game_index {args.game_index}")
        if args.model:
            print(f"    --model {args.model}")
    
    print("\n" + "="*80)
    print("✅ Pipeline completed!")
    print("="*80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

