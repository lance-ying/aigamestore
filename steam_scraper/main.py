"""Main script to run the Steam scraper and generate JSON output."""

from .data_processor import process_games_data
from .json_exporter import save_games_to_json, print_json_summary, create_readme_file
from .config import BASE_OUTPUT_DIR, SCREENSHOTS_DIR, ICONS_DIR, VIDEOS_DIR, STEAM_CATEGORIES
import os

def main(categories_to_scrape=None, limit_per_category=50):
    """Main function to run the Steam scraper and generate JSON files."""
    print("=" * 60)
    print("STEAM GAMES SCRAPER - JSON EDITION")
    print("=" * 60)
    
    if categories_to_scrape is None:
        # Default to some popular categories
        categories_to_scrape = ['top_sellers', 'new_trending', 'indie', 'action', 'rpg']
    
    all_games = []
    
    for category in categories_to_scrape:
        if category not in STEAM_CATEGORIES:
            print(f"Skipping unknown category: {category}")
            continue
            
        print(f"\n" + "=" * 60)
        print(f"PROCESSING STEAM {category.upper().replace('_', ' ')}")
        print("=" * 60)
        
        games = process_games_data(category, limit_per_category)
        if games:
            # Save category-specific JSON files
            save_games_to_json(games, category)
            print_json_summary(games, category)
            all_games.extend(games)
        else:
            print(f"No games found for category: {category}")
    
    # Create README file
    create_readme_file()
    
    # Final summary
    if all_games:
        total_games = len(all_games)
        total_screenshots = sum(len(g['media']['screenshots']) for g in all_games)
        total_header_images = len([g for g in all_games if g['media']['header_image_path']])
        
        print("\n" + "=" * 60)
        print("SCRAPING COMPLETE!")
        print("=" * 60)
        print(f"🎮 Total games processed: {total_games}")
        print(f"📸 Total screenshots downloaded: {total_screenshots}")
        print(f"🖼️  Total header images downloaded: {total_header_images}")
        print(f"📁 Output directory: {os.path.abspath(BASE_OUTPUT_DIR)}")
        print()
        print("📄 JSON Files Created:")
        for category in categories_to_scrape:
            if category in STEAM_CATEGORIES:
                print(f"   - {category} (full): json/steam_{category}_latest.json")
                print(f"   - {category} (simple): json/steam_{category}_simple_latest.json")
        print()
        print("🖼️  Media Assets:")
        print(f"   - Header images: {ICONS_DIR}/")
        print(f"   - Screenshots: {SCREENSHOTS_DIR}/")
        print(f"   - Videos: {VIDEOS_DIR}/")
        print()
        print("📋 Documentation: README.md")
        print()
        print("✅ Ready for analysis! Check the JSON files for your Steam game data.")
    else:
        print("\n❌ No games were successfully processed.")

def scrape_all_categories(limit_per_category=20):
    """Scrape all available Steam categories."""
    categories = list(STEAM_CATEGORIES.keys())
    main(categories, limit_per_category)

def scrape_specific_categories(categories, limit_per_category=50):
    """Scrape specific Steam categories."""
    main(categories, limit_per_category)

if __name__ == "__main__":
    # Example usage - scrape top categories
    main(['top_sellers', 'indie', 'action'], 25)