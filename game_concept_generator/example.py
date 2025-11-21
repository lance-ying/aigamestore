#!/usr/bin/env python3
"""Example usage of the Game Concept Generator module."""

from game_concept_generator import generate_concept_from_url, generate_concepts_from_urls

def example_single_url():
    """Example: Process a single URL."""
    print("=" * 70)
    print("EXAMPLE 1: Single URL Processing")
    print("=" * 70)
    
    url = "https://apps.apple.com/us/app/subway-surfers/id512939461"
    result = generate_concept_from_url(url)
    
    if result:
        print(f"\n📱 Game: {result['name']}")
        print(f"👤 Developer: {result['developer']}")
        print(f"⭐ Rating: {result['rating']}")
        print(f"\n📝 Concept:\n{result['concept']}")


def example_multiple_urls():
    """Example: Process multiple URLs."""
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Multiple URLs (Batch Processing)")
    print("=" * 70)
    
    urls = [
        "https://apps.apple.com/us/app/traffic-run/id1434400630",
        "https://apps.apple.com/us/app/bridge-race/id1543845882",
        "https://apps.apple.com/cn/app/some-game/id6479760623"
    ]
    
    results = generate_concepts_from_urls(urls, batch_size=3)
    
    print(f"\n✅ Generated {len(results)} concepts\n")
    
    for game in results:
        if game.get('concept'):
            print(f"🎮 {game['name']}")
            print(f"   {game['concept'][:150]}...\n")


def example_from_file():
    """Example: Process URLs from a file."""
    print("\n" + "=" * 70)
    print("EXAMPLE 3: Processing from File")
    print("=" * 70)
    
    # This assumes you have a file called 'urls.txt' with one URL per line
    try:
        with open('urls.txt', 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        
        results = generate_concepts_from_urls(urls, batch_size=5)
        
        # Save to JSON
        import json
        with open('game_concepts_output.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Saved {len(results)} concepts to game_concepts_output.json")
        
    except FileNotFoundError:
        print("⚠️  urls.txt not found - skipping this example")


if __name__ == '__main__':
    # Run examples
    example_single_url()
    example_multiple_urls()
    # example_from_file()  # Uncomment if you have a urls.txt file






