#!/usr/bin/env python3
"""
Render GIFs from screenshots in each folder.

This script scans the screenshots directory and creates a GIF from all PNG files
in each timestamped folder. The GIF is saved in the same folder.

Usage:
    python scripts/render_screenshot_gifs.py
    python scripts/render_screenshot_gifs.py --screenshots-dir screenshots
    python scripts/render_screenshot_gifs.py --duration 500 --loop 0
"""

import argparse
import os
import re
from pathlib import Path
from typing import List, Optional

try:
    from PIL import Image
except ImportError:
    print("Error: PIL/Pillow is required. Install it with: pip install Pillow")
    exit(1)


def natural_sort_key(filename: str) -> tuple:
    """
    Generate a sort key for natural sorting of filenames with numbers.
    
    Args:
        filename: The filename to generate a sort key for
        
    Returns:
        A tuple for sorting that handles numeric parts correctly
    """
    def convert(text):
        return int(text) if text.isdigit() else text.lower()
    
    return tuple(convert(c) for c in re.split(r'(\d+)', filename))


def get_screenshot_files(folder: Path) -> List[Path]:
    """
    Get all PNG screenshot files in a folder, sorted by turn number.
    
    Args:
        folder: Path to the folder containing screenshots
        
    Returns:
        List of Path objects for PNG files, sorted by turn number
    """
    png_files = list(folder.glob("*.png"))
    # Sort by natural order (handles turn_0001, turn_0010, etc. correctly)
    png_files.sort(key=lambda p: natural_sort_key(p.name))
    return png_files


def create_gif_from_images(
    image_paths: List[Path],
    output_path: Path,
    duration: int = 500,
    loop: int = 0
) -> bool:
    """
    Create a GIF from a list of image paths.
    
    Args:
        image_paths: List of paths to image files
        output_path: Path where the GIF should be saved
        duration: Duration of each frame in milliseconds (default: 500)
        loop: Number of loops (0 = infinite, default: 0)
        
    Returns:
        True if successful, False otherwise
    """
    if not image_paths:
        print(f"  No images found in {output_path.parent}")
        return False
    
    try:
        # Open all images
        images = []
        for img_path in image_paths:
            img = Image.open(img_path)
            # Convert to RGB if necessary (GIFs don't support RGBA)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            images.append(img)
        
        # Save as GIF
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=loop,
            optimize=True
        )
        
        print(f"  Created GIF: {output_path} ({len(images)} frames)")
        return True
        
    except Exception as e:
        print(f"  Error creating GIF {output_path}: {e}")
        return False


def process_single_folder(
    folder: Path,
    duration: int = 500,
    loop: int = 0,
    overwrite: bool = False
) -> bool:
    """
    Process a single folder and create a GIF.
    
    Args:
        folder: Path to the folder containing screenshots
        duration: Duration of each frame in milliseconds
        loop: Number of loops (0 = infinite)
        overwrite: Whether to overwrite existing GIFs
        
    Returns:
        True if successful, False otherwise
    """
    if not folder.exists():
        print(f"Error: Folder not found: {folder}")
        return False
    
    if not folder.is_dir():
        print(f"Error: Not a directory: {folder}")
        return False
    
    # Check if this folder contains PNG files
    png_files = get_screenshot_files(folder)
    if not png_files:
        print(f"No PNG files found in {folder}")
        return False
    
    # Determine output GIF path
    gif_path = folder / "animation.gif"
    
    # Skip if GIF already exists and overwrite is False
    if gif_path.exists() and not overwrite:
        print(f"Skipping {folder} (GIF already exists)")
        return False
    
    print(f"Processing: {folder}")
    print(f"  Found {len(png_files)} screenshots")
    print(f"  Frame duration: {duration}ms, Loop: {'infinite' if loop == 0 else loop}")
    
    # Create GIF
    success = create_gif_from_images(png_files, gif_path, duration, loop)
    return success


def process_screenshot_folders(
    screenshots_dir: Path,
    duration: int = 500,
    loop: int = 0,
    overwrite: bool = False
) -> None:
    """
    Process all screenshot folders and create GIFs.
    
    Args:
        screenshots_dir: Root directory containing screenshot folders
        duration: Duration of each frame in milliseconds
        loop: Number of loops (0 = infinite)
        overwrite: Whether to overwrite existing GIFs
    """
    if not screenshots_dir.exists():
        print(f"Error: Screenshots directory not found: {screenshots_dir}")
        return
    
    print(f"Scanning screenshots directory: {screenshots_dir}")
    print(f"Frame duration: {duration}ms, Loop: {'infinite' if loop == 0 else loop}")
    print()
    
    # Find all folders that contain PNG files
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(screenshots_dir):
        folder = Path(root)
        
        # Check if this folder contains PNG files
        png_files = get_screenshot_files(folder)
        if not png_files:
            continue
        
        # Determine output GIF path
        gif_path = folder / "animation.gif"
        
        # Skip if GIF already exists and overwrite is False
        if gif_path.exists() and not overwrite:
            print(f"Skipping {folder.relative_to(screenshots_dir)} (GIF already exists)")
            skipped_count += 1
            continue
        
        print(f"Processing: {folder.relative_to(screenshots_dir)}")
        print(f"  Found {len(png_files)} screenshots")
        
        # Create GIF
        if create_gif_from_images(png_files, gif_path, duration, loop):
            processed_count += 1
        else:
            error_count += 1
        
        print()
    
    # Summary
    print("=" * 60)
    print(f"Summary:")
    print(f"  Processed: {processed_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print("=" * 60)


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Render GIFs from screenshots in each folder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process all screenshots with default settings
  python scripts/render_screenshot_gifs.py
  
  # Specify custom screenshot directory
  python scripts/render_screenshot_gifs.py --screenshots-dir screenshots
  
  # Custom frame duration and loop count
  python scripts/render_screenshot_gifs.py --duration 300 --loop 1
  
  # Overwrite existing GIFs
  python scripts/render_screenshot_gifs.py --overwrite
  
  # Process a specific folder
  python scripts/render_screenshot_gifs.py --folder screenshots/google_gemini-2.5-flash/20251123_181049
        """
    )
    
    parser.add_argument(
        "--screenshots-dir",
        type=str,
        default="screenshots",
        help="Directory containing screenshot folders (default: screenshots)"
    )
    
    parser.add_argument(
        "--duration",
        type=int,
        default=500,
        help="Duration of each frame in milliseconds (default: 500)"
    )
    
    parser.add_argument(
        "--loop",
        type=int,
        default=0,
        help="Number of loops (0 = infinite, default: 0)"
    )
    
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing GIF files"
    )
    
    parser.add_argument(
        "--folder",
        type=str,
        default=None,
        help="Process a specific folder instead of scanning all folders"
    )
    
    args = parser.parse_args()
    
    # If a specific folder is provided, process only that folder
    if args.folder:
        folder_path = Path(args.folder)
        if not folder_path.is_absolute():
            # Make relative to project root
            project_root = Path(__file__).parent.parent
            folder_path = project_root / folder_path
        
        success = process_single_folder(
            folder_path,
            duration=args.duration,
            loop=args.loop,
            overwrite=args.overwrite
        )
        if success:
            print("\n✓ GIF created successfully!")
        else:
            print("\n✗ Failed to create GIF")
    else:
        # Convert to Path object
        screenshots_dir = Path(args.screenshots_dir)
        if not screenshots_dir.is_absolute():
            # Make relative to project root
            project_root = Path(__file__).parent.parent
            screenshots_dir = project_root / screenshots_dir
        
        # Process all folders
        process_screenshot_folders(
            screenshots_dir,
            duration=args.duration,
            loop=args.loop,
            overwrite=args.overwrite
        )


if __name__ == "__main__":
    main()

