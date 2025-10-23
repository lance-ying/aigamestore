#!/usr/bin/env python3
"""
Script to create filtered CSV and Excel files with high-confidence suitable games.
Filters for: ratings >= 4.5, classification = SUITABLE, confidence >= 0.8
"""

import pandas as pd
from pathlib import Path

def create_filtered_high_confidence():
    """
    Create filtered CSV and Excel files with high-confidence suitable games.
    """
    # Load the merged classification data
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/merged_classification_games.csv')
    df = pd.read_csv(csv_path)
    
    print(f"Loaded {len(df)} games from merged classification data")
    
    # Apply filters
    print("Applying filters:")
    print("- Ratings >= 4.5")
    print("- Classification = SUITABLE")
    print("- Confidence >= 0.8")
    
    # Filter the data
    df_filtered = df[
        (df['avg_rating'] >= 4.5) & 
        (df['classification'] == 'SUITABLE') & 
        (df['confidence'] >= 0.8)
    ]
    
    print(f"Filtered to {len(df_filtered)} high-confidence suitable games")
    
    # Sort by confidence (descending) then by rating (descending)
    df_filtered = df_filtered.sort_values(['confidence', 'avg_rating'], ascending=[False, False])
    
    # Save CSV
    csv_output_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/high_confidence_suitable_games.csv')
    df_filtered.to_csv(csv_output_path, index=False)
    print(f"CSV saved to: {csv_output_path}")
    
    # Create Excel file with multiple sheets
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/high_confidence_suitable_games.xlsx')
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main data sheet
        df_filtered.to_excel(writer, sheet_name='High Confidence Games', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['High Confidence Games']
        
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
                'Total High-Confidence Games',
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
        top_confidence = df_filtered.head(50)[['game_name', 'confidence', 'avg_rating', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type']]
        top_confidence.to_excel(writer, sheet_name='Top 50 by Confidence', index=False)
        
        # Create top games by rating sheet
        top_rating = df_filtered.nlargest(50, 'avg_rating')[['game_name', 'avg_rating', 'confidence', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type']]
        top_rating.to_excel(writer, sheet_name='Top 50 by Rating', index=False)
    
    print(f"Excel file saved to: {excel_path}")
    
    # Display summary statistics
    print(f"\n=== HIGH-CONFIDENCE SUITABLE GAMES SUMMARY ===")
    print(f"Total games: {len(df_filtered)}")
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
    
    return df_filtered

if __name__ == "__main__":
    df_filtered = create_filtered_high_confidence()
