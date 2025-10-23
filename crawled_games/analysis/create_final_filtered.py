#!/usr/bin/env python3
"""
Script to create final filtered CSV and Excel files, removing games with poker, chess, or mahjong in reasoning.
"""

import pandas as pd
from pathlib import Path

def create_final_filtered():
    """
    Create final filtered CSV and Excel files, excluding poker, chess, and mahjong games.
    """
    # Load the high-confidence suitable games data
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/high_confidence_suitable_games.csv')
    df = pd.read_csv(csv_path)
    
    print(f"Loaded {len(df)} high-confidence suitable games")
    
    # Apply additional filters to remove poker, chess, mahjong
    print("Applying additional filters:")
    print("- Removing games with 'poker' in reasoning")
    print("- Removing games with 'chess' in reasoning")
    print("- Removing games with 'mahjong' in reasoning")
    
    # Filter out games with these terms in reasoning (case-insensitive)
    excluded_terms = ['poker', 'chess', 'mahjong']
    
    # Create a mask for games to keep (exclude those with the terms)
    mask = ~df['reasoning'].str.contains('|'.join(excluded_terms), case=False, na=False)
    
    df_filtered = df[mask]
    
    excluded_count = len(df) - len(df_filtered)
    print(f"Excluded {excluded_count} games")
    print(f"Final filtered to {len(df_filtered)} games")
    
    # Sort by confidence (descending) then by rating (descending)
    df_filtered = df_filtered.sort_values(['confidence', 'avg_rating'], ascending=[False, False])
    
    # Save CSV
    csv_output_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/final_suitable_games.csv')
    df_filtered.to_csv(csv_output_path, index=False)
    print(f"CSV saved to: {csv_output_path}")
    
    # Create Excel file with multiple sheets
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/final_suitable_games.xlsx')
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main data sheet
        df_filtered.to_excel(writer, sheet_name='Final Suitable Games', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Final Suitable Games']
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            # Set column width with some padding
            adjusted_width = min(max_length + 2, 50)  # Cap at 50 characters
            worksheet.column_dimensions[column_letter].width = adjusted_width
        
        # Create summary sheet
        summary_data = {
            'Metric': [
                'Total Final Games',
                'Games Excluded (Poker/Chess/Mahjong)',
                'Average Rating',
                'Average Confidence',
                'Games with US Versions',
                'Games with GB Versions',
                'Most Common Genre',
                'Most Common Country',
                'Average Reviews',
                'Games with Perfect 5.0 Rating',
                'Games with 0.9+ Confidence'
            ],
            'Value': [
                len(df_filtered),
                excluded_count,
                f"{df_filtered['avg_rating'].mean():.2f}",
                f"{df_filtered['confidence'].mean():.2f}",
                len(df_filtered[df_filtered['has_us_version'] == True]),
                len(df_filtered[df_filtered['has_gb_version'] == True]),
                df_filtered['genres'].str.split(',').explode().str.strip().mode().iloc[0] if len(df_filtered) > 0 else 'N/A',
                df_filtered['countries'].str.split(',').explode().str.strip().mode().iloc[0] if len(df_filtered) > 0 else 'N/A',
                f"{df_filtered['max_reviews'].mean():,.0f}",
                len(df_filtered[df_filtered['avg_rating'] == 5.0]),
                len(df_filtered[df_filtered['confidence'] >= 0.9])
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Create genre distribution sheet
        all_genres = []
        for genres_str in df_filtered['genres']:
            all_genres.extend([g.strip() for g in genres_str.split(',')])
        
        genre_counts = pd.Series(all_genres).value_counts().reset_index()
        genre_counts.columns = ['Genre', 'Game Count']
        genre_counts.to_excel(writer, sheet_name='Genre Distribution', index=False)
        
        # Create country distribution sheet
        all_countries = []
        for countries_str in df_filtered['countries']:
            all_countries.extend([c.strip() for c in countries_str.split(',')])
        
        country_counts = pd.Series(all_countries).value_counts().reset_index()
        country_counts.columns = ['Country', 'Game Count']
        country_counts.to_excel(writer, sheet_name='Country Distribution', index=False)
        
        # Create top games by confidence sheet
        top_confidence = df_filtered.head(50)[['game_name', 'confidence', 'avg_rating', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type', 'reasoning']]
        top_confidence.to_excel(writer, sheet_name='Top 50 by Confidence', index=False)
        
        # Create top games by rating sheet
        top_rating = df_filtered.nlargest(50, 'avg_rating')[['game_name', 'avg_rating', 'confidence', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type', 'reasoning']]
        top_rating.to_excel(writer, sheet_name='Top 50 by Rating', index=False)
        
        # Create excluded games sheet for reference
        excluded_games = df[~mask][['game_name', 'confidence', 'avg_rating', 'max_reviews', 'reasoning']]
        excluded_games.to_excel(writer, sheet_name='Excluded Games', index=False)
    
    print(f"Excel file saved to: {excel_path}")
    
    # Display summary statistics
    print(f"\n=== FINAL FILTERED GAMES SUMMARY ===")
    print(f"Total games: {len(df_filtered)}")
    print(f"Games excluded: {excluded_count}")
    print(f"Average rating: {df_filtered['avg_rating'].mean():.2f}")
    print(f"Average confidence: {df_filtered['confidence'].mean():.2f}")
    print(f"Games with US versions: {len(df_filtered[df_filtered['has_us_version'] == True])}")
    print(f"Games with GB versions: {len(df_filtered[df_filtered['has_gb_version'] == True])}")
    print(f"Games with perfect 5.0 rating: {len(df_filtered[df_filtered['avg_rating'] == 5.0])}")
    print(f"Games with 0.9+ confidence: {len(df_filtered[df_filtered['confidence'] >= 0.9])}")
    
    # Show top 10 games by confidence
    print(f"\n=== TOP 10 GAMES BY CONFIDENCE ===")
    top_games = df_filtered.head(10)
    for idx, row in top_games.iterrows():
        print(f"{row['game_name']} - {row['confidence']:.2f} confidence, {row['avg_rating']:.1f}★ ({row['max_reviews']:,} reviews)")
    
    # Show some excluded games for reference
    print(f"\n=== SAMPLE EXCLUDED GAMES ===")
    excluded_sample = df[~mask].head(5)
    for idx, row in excluded_sample.iterrows():
        print(f"{row['game_name']} - {row['avg_rating']:.1f}★ (Excluded: {row['reasoning'][:100]}...)")
    
    return df_filtered

if __name__ == "__main__":
    df_filtered = create_final_filtered()
