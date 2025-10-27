#!/usr/bin/env python3
"""
Script to append newly included free games classification results to existing CSVs.
"""

import pandas as pd
from pathlib import Path

def append_classification_results():
    """
    Append newly included free games classification results to existing CSVs.
    """
    # Load the newly included free games classification results
    classification_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/newly_included_free_games_classification.csv')
    
    try:
        classification_df = pd.read_csv(classification_path)
        print(f"Loaded {len(classification_df)} newly included free games classification results")
    except FileNotFoundError:
        print("Classification results not found. Please run the classification script first.")
        return None
    
    # Load the original all games data to get the full game information
    all_games_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/all_games_data.csv')
    all_games_df = pd.read_csv(all_games_path)
    
    # Get newly included free games from all games data
    free_games = all_games_df[all_games_df['formatted_price'].isin(['$0.00', '¥0.00', '€0.00', '£0.00', '0.00', 'Free', 'FREE', ''])]
    free_current = free_games[(free_games['reviews'] >= 1000) & (free_games['rating'] >= 4.0)]
    free_previous = free_games[(free_games['reviews'] >= 10000) & (free_games['rating'] >= 4.0)]
    newly_included_free = free_current[~free_current['game_name'].isin(free_previous['game_name'])]
    newly_included_free_unique = newly_included_free.drop_duplicates(subset=['game_name'], keep='first')
    
    print(f"Found {len(newly_included_free_unique)} newly included free games in original data")
    
    # Merge classification results with game data
    merged_df = pd.merge(classification_df, newly_included_free_unique, on='game_name', how='inner')
    print(f"Merged data: {len(merged_df)} games")
    
    # Clean up duplicate columns - use the ones from the original data (rating_y, reviews_y, etc.)
    merged_df['rating'] = merged_df['rating_y']
    merged_df['reviews'] = merged_df['reviews_y']
    merged_df['subtitle'] = merged_df['subtitle_y']
    merged_df['genre'] = merged_df['genre_y']
    
    # Apply filters: ratings >= 4.5, SUITABLE, confidence >= 0.8
    print("Applying filters:")
    print("- Ratings >= 4.5")
    print("- Classification = SUITABLE")
    print("- Confidence >= 0.8")
    
    df_filtered = merged_df[
        (merged_df['rating'] >= 4.5) & 
        (merged_df['classification'] == 'SUITABLE') & 
        (merged_df['confidence'] >= 0.8)
    ]
    
    print(f"After initial filtering: {len(df_filtered)} games")
    
    # Apply additional filters to remove poker, chess, mahjong
    print("Applying additional filters:")
    print("- Removing games with 'poker' in reasoning")
    print("- Removing games with 'chess' in reasoning")
    print("- Removing games with 'mahjong' in reasoning")
    
    excluded_terms = ['poker', 'chess', 'mahjong']
    mask = ~df_filtered['reasoning'].str.contains('|'.join(excluded_terms), case=False, na=False)
    df_filtered = df_filtered[mask]
    
    excluded_count = len(merged_df[(merged_df['rating'] >= 4.5) & (merged_df['classification'] == 'SUITABLE') & (merged_df['confidence'] >= 0.8)]) - len(df_filtered)
    print(f"Excluded {excluded_count} games")
    print(f"Final filtered to {len(df_filtered)} games")
    
    # Load existing filtered high quality games CSV
    existing_csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.csv')
    
    try:
        existing_df = pd.read_csv(existing_csv_path)
        print(f"Loaded {len(existing_df)} existing filtered high quality games")
        
        # Append the new games to the existing CSV
        # First, ensure column compatibility
        for col in df_filtered.columns:
            if col not in existing_df.columns:
                existing_df[col] = None
        
        for col in existing_df.columns:
            if col not in df_filtered.columns:
                df_filtered[col] = None
        
        # Reorder columns to match existing CSV
        df_filtered = df_filtered[existing_df.columns]
        
        # Append new games
        combined_df = pd.concat([existing_df, df_filtered], ignore_index=True)
        
        # Remove duplicates based on game_name
        combined_df_unique = combined_df.drop_duplicates(subset=['game_name'], keep='first')
        
        print(f"Combined dataset: {len(combined_df)} games")
        print(f"After removing duplicates: {len(combined_df_unique)} games")
        
        # Save updated CSV
        combined_df_unique.to_csv(existing_csv_path, index=False)
        print(f"Updated CSV saved to: {existing_csv_path}")
        
    except FileNotFoundError:
        print("Existing filtered high quality games CSV not found. Creating new one.")
        df_filtered.to_csv(existing_csv_path, index=False)
        print(f"New CSV saved to: {existing_csv_path}")
    
    # Also save the newly included games separately
    newly_included_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/newly_included_free_games.csv')
    df_filtered.to_csv(newly_included_path, index=False)
    print(f"Newly included games saved to: {newly_included_path}")
    
    # Create Excel file with the newly included games
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/newly_included_free_games.xlsx')
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main data sheet
        df_filtered.to_excel(writer, sheet_name='Newly Included Free Games', index=False)
        
        # Summary sheet
        summary_data = {
            'Metric': [
                'Total Newly Included Free Games',
                'Games Excluded (Poker/Chess/Mahjong)',
                'Average Rating',
                'Average Confidence',
                'Average Reviews',
                'Games with Perfect 5.0 Rating',
                'Games with 0.9+ Confidence'
            ],
            'Value': [
                len(df_filtered),
                excluded_count,
                f"{df_filtered['rating'].mean():.2f}",
                f"{df_filtered['confidence'].mean():.2f}",
                f"{df_filtered['reviews'].mean():,.0f}",
                len(df_filtered[df_filtered['rating'] == 5.0]),
                len(df_filtered[df_filtered['confidence'] >= 0.9])
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Genre distribution
        genre_counts = df_filtered['genre'].value_counts().reset_index()
        genre_counts.columns = ['Genre', 'Game Count']
        genre_counts.to_excel(writer, sheet_name='Genre Distribution', index=False)
        
        # Top games by confidence
        top_confidence = df_filtered.nlargest(50, 'confidence')[['game_name', 'confidence', 'rating', 'reviews', 'genre', 'trial_duration', 'control_type', 'reasoning']]
        top_confidence.to_excel(writer, sheet_name='Top 50 by Confidence', index=False)
    
    print(f"Excel file saved to: {excel_path}")
    
    # Display summary statistics
    print(f"\n=== NEWLY INCLUDED FREE GAMES SUMMARY ===")
    print(f"Total games: {len(df_filtered)}")
    print(f"Games excluded: {excluded_count}")
    print(f"Average rating: {df_filtered['rating'].mean():.2f}")
    print(f"Average confidence: {df_filtered['confidence'].mean():.2f}")
    print(f"Average reviews: {df_filtered['reviews'].mean():,.0f}")
    print(f"Games with perfect 5.0 rating: {len(df_filtered[df_filtered['rating'] == 5.0])}")
    print(f"Games with 0.9+ confidence: {len(df_filtered[df_filtered['confidence'] >= 0.9])}")
    
    # Show top 10 games by confidence
    print(f"\n=== TOP 10 NEWLY INCLUDED FREE GAMES BY CONFIDENCE ===")
    top_games = df_filtered.nlargest(10, 'confidence')
    for idx, row in top_games.iterrows():
        print(f"{row['game_name']} - {row['confidence']:.2f} confidence, {row['rating']:.1f}★ ({row['reviews']:,} reviews)")
    
    return df_filtered

if __name__ == "__main__":
    df_filtered = append_classification_results()
