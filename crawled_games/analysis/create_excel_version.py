#!/usr/bin/env python3
"""
Script to create an Excel version of the filtered CSV with proper character encoding.
"""

import pandas as pd
from pathlib import Path

def create_excel_version():
    """
    Create Excel version of the filtered CSV with proper encoding.
    """
    # Load the filtered CSV
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.csv')
    df = pd.read_csv(csv_path)
    
    print(f"Loaded {len(df)} games from filtered CSV")
    
    # Create Excel file with proper encoding
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.xlsx')
    
    # Create Excel writer with proper encoding
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Write the main data
        df.to_excel(writer, sheet_name='High Quality Games', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['High Quality Games']
        
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
        
        # Create a summary sheet
        summary_data = {
            'Metric': [
                'Total Games',
                'Games in Multiple Countries',
                'Games in Multiple Genres',
                'Average Countries per Game',
                'Average Genres per Game',
                'Top Genre (Action)',
                'Top Country (US)',
                'Highest Rated Game',
                'Most Reviewed Game'
            ],
            'Value': [
                len(df),
                len(df[df['country_count'] > 1]),
                len(df[df['genre_count'] > 1]),
                f"{df['country_count'].mean():.1f}",
                f"{df['genre_count'].mean():.1f}",
                len(df[df['genres'].str.contains('action', case=False, na=False)]),
                len(df[df['countries'].str.contains('us', case=False, na=False)]),
                df.loc[df['avg_rating'].idxmax(), 'game_name'],
                df.loc[df['max_reviews'].idxmax(), 'game_name']
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Create genre distribution sheet
        all_genres = []
        for genres_str in df['genres']:
            all_genres.extend([g.strip() for g in genres_str.split(',')])
        
        genre_counts = pd.Series(all_genres).value_counts().reset_index()
        genre_counts.columns = ['Genre', 'Game Count']
        genre_counts.to_excel(writer, sheet_name='Genre Distribution', index=False)
        
        # Create country distribution sheet
        all_countries = []
        for countries_str in df['countries']:
            all_countries.extend([c.strip() for c in countries_str.split(',')])
        
        country_counts = pd.Series(all_countries).value_counts().reset_index()
        country_counts.columns = ['Country', 'Game Count']
        country_counts.to_excel(writer, sheet_name='Country Distribution', index=False)
        
        # Create top games sheet
        top_games = df.head(20)[['game_name', 'countries', 'genres', 'max_reviews', 'avg_rating', 'best_position']]
        top_games.to_excel(writer, sheet_name='Top 20 Games', index=False)
    
    print(f"Excel file saved to: {excel_path}")
    print(f"Excel file contains {len(df)} games with proper character encoding")
    
    # Verify the file was created
    if excel_path.exists():
        file_size = excel_path.stat().st_size / (1024 * 1024)  # Size in MB
        print(f"File size: {file_size:.2f} MB")
        
        # Test reading a few rows to verify encoding
        test_df = pd.read_excel(excel_path, sheet_name='High Quality Games', nrows=5)
        print(f"\nSample data (first 3 games):")
        for idx, row in test_df.head(3).iterrows():
            print(f"  {row['game_name']} - {row['max_reviews']:,} reviews, {row['avg_rating']:.1f}★")
    
    return excel_path

if __name__ == "__main__":
    excel_path = create_excel_version()

