"""
Screenshot utilities for browser-based game testing.
"""

import os
import logging
from typing import Optional
from PIL import Image, ImageChops
from playwright.async_api import Page

# Configure logging for local module
logger = logging.getLogger(__name__)

async def save_screenshot(page: Page, directory: str, filename: str, frame_counter: int) -> str:
    """
    Save a screenshot and return the path.
    
    Args:
        page: Playwright page
        directory: Directory to save the screenshot
        filename: Filename for the screenshot
        frame_counter: Frame counter for the screenshot
        
    Returns:
        Path to the saved screenshot
    """
    try:
        # Capture full page screenshot to a temporary file
        temp_path = os.path.join(directory, "temp_screenshot.png")
        await page.screenshot(path=temp_path, full_page=True)
        
        # Resize the image to save space (by a factor of 4)
        full_path = os.path.join(directory, filename)
        with Image.open(temp_path) as img:
            # Calculate new size (1/4 of original)
            new_width = img.width // 4
            new_height = img.height // 4
            # Resize the image
            resized_img = img.resize((new_width, new_height), Image.LANCZOS)
            # Save resized image
            resized_img.save(full_path)
            
        # Remove temporary file
        os.remove(temp_path)
        
        logging.info(f"Screenshot saved to {full_path} (resized by factor of 4)")
        return full_path
    except Exception as e:
        logging.error(f"Error saving screenshot: {e}")
        return ""

def compare_screenshots(before_path: str, after_path: str) -> float:
    """
    Compare two screenshots and calculate a difference score.
    
    Args:
        before_path: Path to before screenshot
        after_path: Path to after screenshot
        
    Returns:
        diff_score: float between 0 and 1, where 0 is no difference and 1 is completely different
    """
    try:
        # Open images
        before_img = Image.open(before_path)
        after_img = Image.open(after_path)
        
        # Ensure same size for comparison
        if before_img.size != after_img.size:
            # Resize the smaller image to match the larger one
            if before_img.size[0] * before_img.size[1] < after_img.size[0] * after_img.size[1]:
                before_img = before_img.resize(after_img.size, Image.Resampling.LANCZOS)
            else:
                after_img = after_img.resize(before_img.size, Image.Resampling.LANCZOS)
        
        # Calculate difference
        diff_img = ImageChops.difference(before_img, after_img)
        
        # Calculate difference score (0 to 1)
        diff_gray = diff_img.convert('L')  # Convert to grayscale
        total_pixels = diff_gray.size[0] * diff_gray.size[1]
        diff_pixels = sum(1 for pixel in diff_gray.getdata() if pixel > 0)
        diff_score = diff_pixels / total_pixels
        
        return diff_score
        
    except Exception as e:
        logging.error(f"Error comparing screenshots: {e}")
        return 0 