#!/usr/bin/env python3
"""
Test script to verify canvas-only screenshots for public_platform games.

This script captures screenshots WITHOUT calling the VLM API, so it doesn't
require API keys. It just tests the screenshot capture functionality.
"""

import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def test_canvas_screenshot():
    """Test canvas-only screenshot for public_platform games."""
    
    # Get the absolute path to a public_platform game
    project_root = Path(__file__).parent.parent
    game_path = project_root / "public_platform" / "games" / "snake-io" / "index.html"
    game_url = f"file://{game_path}"
    
    print("="*70)
    print("Testing Canvas-Only Screenshot Feature")
    print("="*70)
    print(f"\nGame: snake-io")
    print(f"URL: {game_url}")
    
    # Check if URL contains "public_platform"
    is_public_platform = "public_platform" in game_url
    print(f"\n✓ Public platform detected: {is_public_platform}")
    
    # Create screenshot directory
    screenshot_dir = Path("./test_screenshots")
    screenshot_dir.mkdir(exist_ok=True)
    
    with sync_playwright() as p:
        print("\n📱 Launching browser...")
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print(f"🌐 Loading game...")
        page.goto(game_url, wait_until="domcontentloaded")
        time.sleep(1)
        
        # Find canvas
        print("🎯 Locating canvas...")
        canvas = page.locator("canvas").first
        canvas.wait_for(state="visible", timeout=5000)
        print("✓ Canvas found!")
        
        # Focus and start game
        canvas.click()
        canvas.press("Enter")
        time.sleep(1)
        
        print("\n📸 Capturing screenshots...")
        
        # Take full page screenshot
        full_page_path = screenshot_dir / "fullpage_screenshot.png"
        page.screenshot(path=str(full_page_path))
        print(f"  ✓ Full page screenshot: {full_page_path}")
        
        # Take canvas-only screenshot
        canvas_only_path = screenshot_dir / "canvas_only_screenshot.png"
        canvas.screenshot(path=str(canvas_only_path))
        print(f"  ✓ Canvas-only screenshot: {canvas_only_path}")
        
        # Get dimensions
        full_page_size = full_page_path.stat().st_size
        canvas_only_size = canvas_only_path.stat().st_size
        
        print("\n📊 Results:")
        print(f"  Full page size: {full_page_size:,} bytes")
        print(f"  Canvas-only size: {canvas_only_size:,} bytes")
        print(f"  Size reduction: {((full_page_size - canvas_only_size) / full_page_size * 100):.1f}%")
        
        # Canvas dimensions
        canvas_box = canvas.bounding_box()
        if canvas_box:
            print(f"  Canvas dimensions: {canvas_box['width']:.0f}x{canvas_box['height']:.0f}px")
        
        print("\n" + "="*70)
        print("✅ TEST COMPLETE!")
        print("="*70)
        print(f"\nScreenshots saved to: {screenshot_dir.absolute()}")
        print("\nCompare the two screenshots:")
        print(f"  1. {full_page_path.name} - Contains full page with controls/description")
        print(f"  2. {canvas_only_path.name} - Contains ONLY the game canvas")
        print("\nFor public_platform games, the VLM will automatically use canvas-only!")
        
        # Keep browser open for a moment so user can see it
        time.sleep(2)
        browser.close()

if __name__ == "__main__":
    try:
        test_canvas_screenshot()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


