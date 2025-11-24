#!/usr/bin/env python3
"""
Script to classify indie Steam games for VLM generation suitability using Gemini.
Evaluates games based on how suitable they are for vision-language model generation into mini games.
"""

import pandas as pd
import google.generativeai as genai
import time
import json
import csv
from pathlib import Path
import os
from typing import Dict, Any, List

# Configure Gemini API
def setup_gemini():
    """Setup Gemini API with API key from file"""
    try:
        # Try to read from gemini.txt first
        gemini_file = Path('/Users/lance/Documents/GitHub/gemini.txt')
        if gemini_file.exists():
            with open(gemini_file, 'r') as f:
                api_key = f.read().strip()
            print(f"Loaded Gemini API key from: {gemini_file}")
        else:
            # Fallback to environment variable
            api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
            if not api_key:
                print("Error: Could not find Gemini API key")
                print("Please either:")
                print("1. Create /Users/lance/Documents/GitHub/gemini.txt with your API key")
                print("2. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable")
                return None
            print("Loaded Gemini API key from environment variable")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        return model
        
    except Exception as e:
        print(f"Error setting up Gemini API: {e}")
        return None

def create_batch_classification_prompt(games_batch: List[Dict]) -> str:
    """Create a detailed prompt for batch game classification for VLM generation"""
    games_info = ""
    for i, game in enumerate(games_batch, 1):
        games_info += f"""
GAME {i}:
- Name: {game['name']}
- URL: {game['url']}
- Genre: {game.get('genre', 'N/A')}
- Description: {game.get('description', 'N/A')}
"""
    
    prompt = f"""
You are a game design expert analyzing Steam indie games for their suitability to be generated into mini games using Vision-Language Models (VLMs).

VLM GENERATION CONTEXT:
Vision-Language Models can generate playable HTML5 games from text descriptions and visual references. The generated games typically:
- Use p5.js and/or Matter.js for rendering and physics
- Are 2D games with keyboard controls
- Have simple to moderate complexity
- Include scoring systems and level progression
- Can be implemented in a single HTML file

GAMES TO ANALYZE:
{games_info}

CLASSIFICATION CRITERIA:
Please analyze each game and provide a suitability score (0.0-1.0) for VLM generation based on these specific criteria:

1. **IMPLEMENTATION COMPLEXITY** (Weight: 25%)
   - Can the core mechanics be implemented with standard web technologies (HTML/CSS/JS, p5.js, Matter.js)?
   - SUITABLE (0.8-1.0): Simple mechanics, clear rules, straightforward gameplay loops
   - MODERATE (0.5-0.7): Some complexity but can be simplified, requires moderate abstraction
   - NOT_SUITABLE (0.0-0.4): Highly complex systems, requires advanced AI/ML, server infrastructure, or months of development

2. **VISUAL SIMPLICITY** (Weight: 20%)
   - Can the game's visual style be simplified while keeping core mechanics intact?
   - SUITABLE (0.8-1.0): Simple graphics, 2D sprites, basic shapes work well
   - MODERATE (0.5-0.7): 3D can be converted to 2D, complex graphics can use simple representations
   - NOT_SUITABLE (0.0-0.4): Requires realistic 3D graphics that cannot be simplified, highly detailed art essential to gameplay

3. **GAME LOOP CLARITY** (Weight: 20%)
   - Is there a clear, repeatable gameplay loop that can be described concisely?
   - SUITABLE (0.8-1.0): Clear objectives, well-defined win/lose conditions, obvious scoring
   - MODERATE (0.5-0.7): Some open-endedness but core loop is identifiable
   - NOT_SUITABLE (0.0-0.4): Open-world, sandbox, or highly emergent gameplay without clear structure

4. **CONTROL SCHEME** (Weight: 15%)
   - Can the game be controlled with keyboard inputs (arrows, space, WASD, etc.)?
   - SUITABLE (0.8-1.0): Discrete actions, turn-based, simple navigation, click-to-select
   - MODERATE (0.5-0.7): Some continuous movement but can be adapted
   - NOT_SUITABLE (0.0-0.4): Requires precise touch gestures, complex multi-touch, or specialized input

5. **TRIAL DURATION** (Weight: 10%)
   - Can individual rounds/levels be completed in 2-10 minutes?
   - SUITABLE (0.8-1.0): Short rounds, level-based, clear progression
   - MODERATE (0.5-0.7): Longer sessions but can be broken into levels
   - NOT_SUITABLE (0.0-0.4): Requires hours-long sessions, no clear stopping points

6. **DESCRIPTION CLARITY** (Weight: 10%)
   - Can the game mechanics be clearly described in text for a VLM to understand?
   - SUITABLE (0.8-1.0): Simple, well-defined mechanics that are easy to describe
   - MODERATE (0.5-0.7): Some complexity but describable
   - NOT_SUITABLE (0.0-0.4): Highly abstract, emergent, or difficult to articulate mechanics

EXAMPLES OF GOOD VLM CANDIDATES (Score 0.8-1.0):
- Puzzle games (match-3, tile matching, block puzzles, brain teasers)
- Simple platformers with clear objectives
- Card games and board games
- Physics puzzles (Angry Birds-style, Cut the Rope-style)
- Arcade games (Snake, Pac-Man-style, simple shooters)
- Turn-based strategy games
- Tower defense games
- Simple rhythm games
- Top-down or side-view racing games

EXAMPLES OF POOR VLM CANDIDATES (Score 0.0-0.4):
- Complex real-time multiplayer requiring server architecture
- MMOs with persistent online worlds
- Games requiring realistic 3D graphics that cannot be simplified
- Extremely complex simulations (full city simulators, detailed economics)
- Games with 100+ unique levels requiring custom design
- Games entirely dependent on social features or player trading
- Fighting games with frame-perfect combos
- Games requiring large amounts of unique content

RESPONSE FORMAT:
Provide your analysis in this exact JSON format for each game:

{{
    "games": [
        {{
            "game_name": "Game Name 1",
            "vlm_suitability_score": 0.0-1.0,
            "classification": "HIGHLY_SUITABLE" (0.8-1.0), "MODERATELY_SUITABLE" (0.5-0.7), or "NOT_SUITABLE" (0.0-0.4),
            "confidence": 0.0-1.0,
            "reasoning": "Brief explanation of the score and decision",
            "implementation_complexity_score": 0.0-1.0,
            "visual_simplicity_score": 0.0-1.0,
            "game_loop_clarity_score": 0.0-1.0,
            "control_scheme_score": 0.0-1.0,
            "trial_duration_score": 0.0-1.0,
            "description_clarity_score": 0.0-1.0,
            "key_strengths": ["List of what makes this game suitable for VLM generation"],
            "key_challenges": ["List of main challenges for VLM generation"],
            "simplification_notes": "What would need to be simplified for VLM generation",
            "estimated_implementation_difficulty": "Easy/Medium/Hard"
        }}
    ]
}}

Focus on whether a VLM can generate a playable mini-game version from a text description. Consider that the VLM can simplify graphics and mechanics, but cannot implement highly complex systems or require extensive custom content.
"""
    return prompt

def classify_games_batch(model, games_batch: List[Dict]) -> List[Dict]:
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
                game_result['genre'] = original_game.get('genre', '')
                game_result['description'] = original_game.get('description', '')
            game_result['raw_response'] = response_text
            processed_results.append(game_result)
        
        return processed_results
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error for batch: {e}")
        print(f"Response text: {response_text[:500]}...")
        # Return error results for all games in batch
        error_results = []
        for game in games_batch:
            error_results.append({
                'game_name': game['name'],
                'game_url': game['url'],
                'genre': game.get('genre', ''),
                'description': game.get('description', ''),
                'vlm_suitability_score': 0.0,
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
                'genre': game.get('genre', ''),
                'description': game.get('description', ''),
                'vlm_suitability_score': 0.0,
                'classification': 'ERROR',
                'confidence': 0.0,
                'reasoning': f'Classification error: {str(e)}',
                'raw_response': 'No response'
            })
        return error_results

def process_indie_games(model, input_csv: str, output_csv: str, start_idx: int = 0, batch_size: int = 50, games_per_api_call: int = 5) -> pd.DataFrame:
    """Process indie games in batches with rate limiting"""
    # Read input CSV
    games = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        games = list(reader)
    
    total_games = len(games)
    results = []
    
    print(f"Processing {total_games} indie games starting from index {start_idx}")
    print(f"Batch size: {batch_size}")
    print(f"Games per API call: {games_per_api_call}")
    
    # Create output directory if needed
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    for i in range(start_idx, min(start_idx + batch_size, total_games), games_per_api_call):
        # Create batch of games for this API call
        games_batch = []
        batch_end = min(i + games_per_api_call, total_games)
        
        for j in range(i, batch_end):
            row = games[j]
            games_batch.append({
                'name': row['name'],
                'url': row['url'],
                'genre': row.get('genre', ''),
                'description': row.get('description', '')
            })
        
        print(f"\n[{i+1}-{batch_end}/{total_games}] Classifying batch: {[g['name'] for g in games_batch]}")
        
        # Classify the batch of games
        batch_results = classify_games_batch(model, games_batch)
        results.extend(batch_results)
        
        # Rate limiting - wait between API calls
        time.sleep(3)  # 3 second delay between API calls
        
        # Save intermediate results every 20 games (4 API calls)
        if (i + games_per_api_call) % 20 == 0:
            intermediate_df = pd.DataFrame(results)
            intermediate_path = output_path.parent / f"indie_games_vlm_classification_intermediate_{i+games_per_api_call}.csv"
            intermediate_df.to_csv(intermediate_path, index=False)
            print(f"Saved intermediate results: {intermediate_path}")
    
    return pd.DataFrame(results)

def main():
    """Main function to classify indie games for VLM generation"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Classify indie games for VLM generation suitability')
    parser.add_argument('--input', default='/Users/lance/Documents/GitHub/aigamestore/crawled_games/indie_games_with_genres_and_desc.csv',
                        help='Input CSV file with games')
    parser.add_argument('--output', default='/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/indie_games_vlm_classification.csv',
                        help='Output CSV file')
    parser.add_argument('--start-idx', type=int, default=0, help='Start index (for resuming)')
    parser.add_argument('--batch-size', type=int, default=None, help='Number of games to process (default: all)')
    parser.add_argument('--games-per-call', type=int, default=5, help='Games per API call')
    parser.add_argument('--resume', action='store_true', help='Resume from last checkpoint')
    args = parser.parse_args()
    
    # Setup Gemini
    model = setup_gemini()
    if not model:
        return
    
    # Input and output paths
    input_csv = args.input
    output_csv = args.output
    
    # Check if input file exists
    if not Path(input_csv).exists():
        print(f"Error: Input file not found: {input_csv}")
        return
    
    # Read total number of games
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        total_games = len(list(reader))
    
    print(f"Found {total_games} games in {input_csv}")
    
    # Determine start index and batch size
    if args.resume:
        # Find latest intermediate file
        output_dir = Path(output_csv).parent
        intermediate_files = list(output_dir.glob("indie_games_vlm_classification_intermediate_*.csv"))
        if intermediate_files:
            latest = max(intermediate_files, key=lambda p: int(p.stem.split('_')[-1]))
            start_idx = int(latest.stem.split('_')[-1])
            batch_size = total_games - start_idx
            print(f"Resuming from index {start_idx}")
        else:
            print("No intermediate files found. Starting from beginning.")
            start_idx = 0
            batch_size = total_games
    else:
        start_idx = args.start_idx
        batch_size = args.batch_size if args.batch_size is not None else total_games
    
    print(f"Processing {batch_size} games starting from index {start_idx}")
    
    # Process games
    results_df = process_indie_games(model, input_csv, output_csv, start_idx, batch_size, games_per_api_call=args.games_per_call)
    
    # Save final results
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    results_df.to_csv(output_path, index=False)
    
    print(f"\n=== INDIE GAMES VLM CLASSIFICATION COMPLETE ===")
    print(f"Results saved to: {output_path}")
    
    # Show summary statistics
    if len(results_df) > 0:
        highly_suitable = len(results_df[results_df['classification'] == 'HIGHLY_SUITABLE'])
        moderately_suitable = len(results_df[results_df['classification'] == 'MODERATELY_SUITABLE'])
        not_suitable = len(results_df[results_df['classification'] == 'NOT_SUITABLE'])
        error_count = len(results_df[results_df['classification'] == 'ERROR'])
        
        print(f"\n=== SUMMARY ===")
        print(f"Total games processed: {len(results_df)}")
        print(f"Highly suitable for VLM generation: {highly_suitable} ({highly_suitable/len(results_df)*100:.1f}%)")
        print(f"Moderately suitable: {moderately_suitable} ({moderately_suitable/len(results_df)*100:.1f}%)")
        print(f"Not suitable: {not_suitable} ({not_suitable/len(results_df)*100:.1f}%)")
        print(f"Errors: {error_count} ({error_count/len(results_df)*100:.1f}%)")
        
        # Show average score
        if 'vlm_suitability_score' in results_df.columns:
            avg_score = results_df['vlm_suitability_score'].mean()
            print(f"\nAverage VLM suitability score: {avg_score:.2f}")
        
        # Show top suitable games
        suitable_games = results_df[results_df['classification'].isin(['HIGHLY_SUITABLE', 'MODERATELY_SUITABLE'])]
        if len(suitable_games) > 0:
            # Sort by score
            suitable_games = suitable_games.sort_values('vlm_suitability_score', ascending=False)
            print(f"\n=== TOP SUITABLE GAMES FOR VLM GENERATION ===")
            for idx, row in suitable_games.head(10).iterrows():
                print(f"• {row['game_name']} (Score: {row.get('vlm_suitability_score', 0):.2f}) - {row.get('reasoning', 'N/A')[:100]}")

if __name__ == "__main__":
    main()

