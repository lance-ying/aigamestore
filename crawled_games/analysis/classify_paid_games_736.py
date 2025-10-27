#!/usr/bin/env python3
"""
Script to classify 736 paid games (>100 reviews, >=4.0 rating) for 2D conversion potential using Gemini Flash 2.5.
"""

import pandas as pd
import google.generativeai as genai
import time
import json
from pathlib import Path
import os
from typing import Dict, Any

# Configure Gemini API
def setup_gemini():
    """Setup Gemini API with API key from file"""
    try:
        # Try to read from ../../gemini.txt first
        gemini_file = Path('/Users/lance/Documents/GitHub/gemini.txt')
        if gemini_file.exists():
            with open(gemini_file, 'r') as f:
                api_key = f.read().strip()
            print(f"Loaded Gemini API key from: {gemini_file}")
        else:
            # Fallback to environment variable
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                print("Error: Could not find Gemini API key")
                print("Please either:")
                print("1. Create ../../gemini.txt with your API key")
                print("2. Set GEMINI_API_KEY environment variable")
                return None
            print("Loaded Gemini API key from environment variable")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        return model
        
    except Exception as e:
        print(f"Error setting up Gemini API: {e}")
        return None

def create_batch_classification_prompt(games_batch: list) -> str:
    """Create a detailed prompt for batch game classification"""
    games_info = ""
    for i, game in enumerate(games_batch, 1):
        games_info += f"""
GAME {i}:
- Name: {game['name']}
- URL: {game['url']}
- Subtitle: {game['subtitle']}
- Price: {game['price']}
- Rating: {game['rating']}★
- Reviews: {game['reviews']:,}
"""
    
    prompt = f"""
You are a game design expert analyzing PAID mobile games for their potential to be converted into 2D desktop games with keyboard controls.

GAMES TO ANALYZE:
{games_info}

CLASSIFICATION CRITERIA:
Please analyze each PAID game and classify it as "SUITABLE" or "NOT_SUITABLE" for 2D conversion based on these specific criteria:

1. **TRIAL DURATION**: Can individual trials/rounds be completed within 2-10 minutes?
   - SUITABLE: Puzzle games, match-3, simple platformers, card games, turn-based games
   - NOT_SUITABLE: Long RPG sessions, endless runners, complex strategy games

2. **GAME STRUCTURE**: Does the game have clear scoring/win conditions (not open-ended)?
   - SUITABLE: Games with levels, scores, clear objectives, win/lose states
   - NOT_SUITABLE: Open-world games, sandbox games, endless modes without scoring

3. **MECHANICAL COMPLEXITY**: Are the core mechanics simple enough for 2D conversion?
   - SUITABLE: Simple controls, basic physics, straightforward gameplay
   - NOT_SUITABLE: Complex simulations, advanced physics, intricate systems

4. **CONTROL COMPATIBILITY**: Can the game be controlled with keyboard presses?
   - SUITABLE: Tap-to-move, click-to-select, simple gestures, turn-based actions
   - NOT_SUITABLE: Continuous swiping, complex multi-touch, precise touch gestures

5. **MOVEMENT REQUIREMENTS**: Does the game require continuous movement?
   - SUITABLE: Discrete actions, turn-based, click-to-move, simple navigation
   - NOT_SUITABLE: Continuous running, real-time combat, fluid motion games

6. **PAID GAME CONSIDERATIONS**: Consider that paid games often have:
   - Higher quality and polish
   - More complete experiences
   - Better suited for premium desktop conversion
   - May have more complex but well-designed mechanics

RESPONSE FORMAT:
Provide your analysis in this exact JSON format for each game:

{{
    "games": [
        {{
            "game_name": "Game Name 1",
            "classification": "SUITABLE" or "NOT_SUITABLE",
            "confidence": 0.0-1.0,
            "reasoning": "Brief explanation of the decision",
            "trial_duration": "Estimated time for one trial/round",
            "control_type": "Description of how controls would work with keyboard",
            "complexity_level": "Simple/Medium/Complex",
            "key_challenges": ["List of main challenges for 2D conversion"],
            "conversion_notes": "Additional notes about the conversion process"
        }}
    ]
}}

Focus on the core gameplay mechanics and ignore graphics quality or visual complexity. Consider that clicks can be converted to keyboard presses, but continuous gestures cannot. Paid games may have higher conversion potential due to their premium nature.
"""
    return prompt

def classify_games_batch(model, games_batch: list) -> list:
    """Classify a batch of games using Gemini"""
    try:
        prompt = create_batch_classification_prompt(games_batch)
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Parse JSON response
        response_text = response.text.strip()
        
        # Try to extract JSON from response
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            json_text = response_text[json_start:json_end].strip()
        else:
            # Try to find JSON object in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_text = response_text[start_idx:end_idx]
            else:
                json_text = response_text
        
        # Parse JSON
        result = json.loads(json_text)
        
        # Process each game result
        processed_results = []
        for game_result in result.get('games', []):
            # Find the original game data to add metadata
            original_game = next((g for g in games_batch if g['name'] == game_result['game_name']), None)
            if original_game:
                game_result['game_url'] = original_game['url']
                game_result['subtitle'] = original_game['subtitle']
                game_result['price'] = original_game['price']
                game_result['rating'] = original_game['rating']
                game_result['reviews'] = original_game['reviews']
            game_result['raw_response'] = response_text
            processed_results.append(game_result)
        
        return processed_results
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error for batch: {e}")
        # Return error results for all games in batch
        error_results = []
        for game in games_batch:
            error_results.append({
                'game_name': game['name'],
                'game_url': game['url'],
                'subtitle': game['subtitle'],
                'price': game['price'],
                'rating': game['rating'],
                'reviews': game['reviews'],
                'classification': 'ERROR',
                'confidence': 0.0,
                'reasoning': f'JSON parsing error: {str(e)}',
                'raw_response': response_text if 'response_text' in locals() else 'No response'
            })
        return error_results
        
    except Exception as e:
        print(f"Error classifying batch: {e}")
        # Return error results for all games in batch
        error_results = []
        for game in games_batch:
            error_results.append({
                'game_name': game['name'],
                'game_url': game['url'],
                'subtitle': game['subtitle'],
                'price': game['price'],
                'rating': game['rating'],
                'reviews': game['reviews'],
                'classification': 'ERROR',
                'confidence': 0.0,
                'reasoning': f'Classification error: {str(e)}',
                'raw_response': 'No response'
            })
        return error_results

def process_paid_games_batch(model, df: pd.DataFrame, start_idx: int = 0, batch_size: int = 50) -> pd.DataFrame:
    """Process paid games in batches with rate limiting"""
    results = []
    total_games = len(df)
    games_per_api_call = 5  # Process 5 games per API call
    
    print(f"Processing {total_games} paid games starting from index {start_idx}")
    print(f"Batch size: {batch_size}")
    print(f"Games per API call: {games_per_api_call}")
    
    for i in range(start_idx, min(start_idx + batch_size, total_games), games_per_api_call):
        # Create batch of games for this API call
        games_batch = []
        batch_end = min(i + games_per_api_call, total_games)
        
        for j in range(i, batch_end):
            row = df.iloc[j]
            games_batch.append({
                'name': row['game_name'],
                'url': row['app_store_url'],
                'subtitle': row.get('subtitle', ''),
                'price': row.get('formatted_price', ''),
                'rating': row.get('avg_rating', 0.0),
                'reviews': row.get('max_reviews', 0)
            })
        
        print(f"\n[{i+1}-{batch_end}/{total_games}] Classifying batch: {[g['name'] for g in games_batch]}")
        
        # Classify the batch of games
        batch_results = classify_games_batch(model, games_batch)
        results.extend(batch_results)
        
        # Rate limiting - wait between API calls (longer delay to avoid quota limits)
        time.sleep(3)  # 3 second delay between API calls
        
        # Save intermediate results every 20 games (4 API calls)
        if (i + games_per_api_call) % 20 == 0:
            intermediate_df = pd.DataFrame(results)
            intermediate_path = f'/Users/lance/Documents/GitHub/aigamestore/crawled_games/intermediate_results/paid_736_classification_results_intermediate_{i+games_per_api_call}.csv'
            intermediate_df.to_csv(intermediate_path, index=False)
            print(f"Saved intermediate results: {intermediate_path}")
    
    return pd.DataFrame(results)

def main():
    """Main function to classify paid games"""
    # Setup Gemini
    model = setup_gemini()
    if not model:
        return
    
    # Load the unfiltered paid games data and apply filters
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/all_paid_games_unfiltered.csv')
    df_all = pd.read_csv(csv_path)
    
    # Apply filters: >100 reviews and >=4.0 rating
    df = df_all[(df_all['max_reviews'] > 100) & (df_all['avg_rating'] >= 4.0)]
    
    print(f"Loaded {len(df_all)} total paid games")
    print(f"After filtering (>100 reviews, >=4.0 rating): {len(df)} games")
    
    # Ask user for batch processing
    print("\nBatch processing options:")
    print("1. Process all 736 games")
    print("2. Process first 20 games (for testing)")
    print("3. Process specific range")
    
    choice = input("Enter your choice (1-3): ").strip()
    
    if choice == "1":
        start_idx = 0
        batch_size = len(df)
    elif choice == "2":
        start_idx = 0
        batch_size = 20
    elif choice == "3":
        start_idx = int(input("Enter start index: "))
        batch_size = int(input("Enter batch size: "))
    else:
        print("Invalid choice. Processing first 20 games.")
        start_idx = 0
        batch_size = 20
    
    # Process games
    results_df = process_paid_games_batch(model, df, start_idx, batch_size)
    
    # Save final results
    output_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/paid_736_games_classification.csv')
    results_df.to_csv(output_path, index=False)
    
    print(f"\n=== PAID GAMES CLASSIFICATION COMPLETE ===")
    print(f"Results saved to: {output_path}")
    
    # Show summary statistics
    if len(results_df) > 0:
        suitable_count = len(results_df[results_df['classification'] == 'SUITABLE'])
        not_suitable_count = len(results_df[results_df['classification'] == 'NOT_SUITABLE'])
        error_count = len(results_df[results_df['classification'] == 'ERROR'])
        
        print(f"\n=== SUMMARY ===")
        print(f"Total paid games processed: {len(results_df)}")
        print(f"Suitable for 2D conversion: {suitable_count} ({suitable_count/len(results_df)*100:.1f}%)")
        print(f"Not suitable: {not_suitable_count} ({not_suitable_count/len(results_df)*100:.1f}%)")
        print(f"Errors: {error_count} ({error_count/len(results_df)*100:.1f}%)")
        
        # Show some suitable games
        suitable_games = results_df[results_df['classification'] == 'SUITABLE']
        if len(suitable_games) > 0:
            print(f"\n=== TOP SUITABLE PAID GAMES ===")
            for idx, row in suitable_games.head(10).iterrows():
                print(f"• {row['game_name']} - {row['reasoning']}")
        
        # Show average confidence
        if 'confidence' in results_df.columns:
            avg_confidence = results_df['confidence'].mean()
            print(f"\nAverage confidence: {avg_confidence:.2f}")

if __name__ == "__main__":
    main()
