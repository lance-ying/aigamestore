#!/usr/bin/env python3
"""
Script to create final filtered CSV and Excel files for paid games with high-confidence suitable games.
"""

import pandas as pd
from pathlib import Path

def create_paid_final_filtered():
    """
    Create final filtered CSV and Excel files for paid games.
    """
    # Load the paid games classification data
    classification_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/paid_games_classification.csv')
    games_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/paid_games_data.csv')
    
    try:
        classification_df = pd.read_csv(classification_path)
        games_df = pd.read_csv(games_path)
        
        print(f"Loaded {len(classification_df)} classified paid games")
        print(f"Loaded {len(games_df)} paid games data")
        
        # Join the data
        merged_df = pd.merge(classification_df, games_df, on='game_name', how='inner')
        print(f"Merged data: {len(merged_df)} games")
        
    except FileNotFoundError as e:
        print(f"Error loading files: {e}")
        print("Please run the paid games classification first")
        return None
    
    # Apply filters: ratings >= 4.5, SUITABLE, confidence >= 0.8
    print("Applying filters:")
    print("- Ratings >= 4.5")
    print("- Classification = SUITABLE")
    print("- Confidence >= 0.8")
    
    df_filtered = merged_df[
        (merged_df['avg_rating'] >= 4.5) & 
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
    
    excluded_count = len(merged_df[(merged_df['avg_rating'] >= 4.5) & (merged_df['classification'] == 'SUITABLE') & (merged_df['confidence'] >= 0.8)]) - len(df_filtered)
    print(f"Excluded {excluded_count} games")
    print(f"Final filtered to {len(df_filtered)} games")
    
    # Remove duplicates by category (sudoku, solitaire, math puzzle)
    print("Removing duplicate categories...")
    
    categories = {
        'sudoku': ['sudoku'],
        'solitaire': ['solitaire'],
        'math_puzzle': ['math puzzle', 'cross math', 'crossmath']
    }
    
    df_cleaned = df_filtered.copy()
    removed_games = []
    
    for category, keywords in categories.items():
        mask = df_cleaned['reasoning'].str.contains('|'.join(keywords), case=False, na=False)
        category_games = df_cleaned[mask]
        
        if len(category_games) > 1:
            print(f"Found {len(category_games)} {category} games, keeping best one")
            # Keep the best one (highest confidence, then highest rating, then most reviews)
            best_game = category_games.sort_values(['confidence', 'avg_rating', 'max_reviews'], ascending=[False, False, False]).iloc[0]
            games_to_remove = category_games[category_games.index != best_game.name]
            
            for idx, row in games_to_remove.iterrows():
                removed_games.append({
                    'game_name': row['game_name'],
                    'category': category,
                    'rating': row['avg_rating'],
                    'confidence': row['confidence'],
                    'reviews': row['max_reviews']
                })
            
            # Remove the duplicate games
            df_cleaned = df_cleaned[~df_cleaned.index.isin(games_to_remove.index)]
    
    print(f"Removed {len(removed_games)} duplicate games")
    print(f"Final unique paid games: {len(df_cleaned)}")
    
    # Sort by confidence (descending) then by rating (descending)
    df_cleaned = df_cleaned.sort_values(['confidence', 'avg_rating'], ascending=[False, False])
    
    # Save CSV
    csv_output_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/final_paid_suitable_games.csv')
    df_cleaned.to_csv(csv_output_path, index=False)
    print(f"CSV saved to: {csv_output_path}")
    
    # Create Excel file with multiple sheets
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/final_paid_suitable_games.xlsx')
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Main data sheet
        df_cleaned.to_excel(writer, sheet_name='Final Paid Games', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Final Paid Games']
        
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
                'Total Final Paid Games',
                'Games Excluded (Poker/Chess/Mahjong)',
                'Duplicate Games Removed',
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
                len(df_cleaned),
                excluded_count,
                len(removed_games),
                f"{df_cleaned['avg_rating'].mean():.2f}",
                f"{df_cleaned['confidence'].mean():.2f}",
                len(df_cleaned[df_cleaned['has_us_version'] == True]),
                len(df_cleaned[df_cleaned['has_gb_version'] == True]),
                df_cleaned['genres'].str.split(',').explode().str.strip().mode().iloc[0] if len(df_cleaned) > 0 else 'N/A',
                df_cleaned['countries'].str.split(',').explode().str.strip().mode().iloc[0] if len(df_cleaned) > 0 else 'N/A',
                f"{df_cleaned['max_reviews'].mean():,.0f}",
                len(df_cleaned[df_cleaned['avg_rating'] == 5.0]),
                len(df_cleaned[df_cleaned['confidence'] >= 0.9])
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Create genre distribution sheet
        all_genres = []
        for genres_str in df_cleaned['genres']:
            all_genres.extend([g.strip() for g in genres_str.split(',')])
        
        genre_counts = pd.Series(all_genres).value_counts().reset_index()
        genre_counts.columns = ['Genre', 'Game Count']
        genre_counts.to_excel(writer, sheet_name='Genre Distribution', index=False)
        
        # Create country distribution sheet
        all_countries = []
        for countries_str in df_cleaned['countries']:
            all_countries.extend([c.strip() for c in countries_str.split(',')])
        
        country_counts = pd.Series(all_countries).value_counts().reset_index()
        country_counts.columns = ['Country', 'Game Count']
        country_counts.to_excel(writer, sheet_name='Country Distribution', index=False)
        
        # Create top games by confidence sheet
        top_confidence = df_cleaned.head(50)[['game_name', 'confidence', 'avg_rating', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type', 'reasoning', 'formatted_price']]
        top_confidence.to_excel(writer, sheet_name='Top 50 by Confidence', index=False)
        
        # Create top games by rating sheet
        top_rating = df_cleaned.nlargest(50, 'avg_rating')[['game_name', 'avg_rating', 'confidence', 'max_reviews', 'countries', 'genres', 'trial_duration', 'control_type', 'reasoning', 'formatted_price']]
        top_rating.to_excel(writer, sheet_name='Top 50 by Rating', index=False)
        
        # Create removed games sheet for reference
        if removed_games:
            removed_df = pd.DataFrame(removed_games)
            removed_df.to_excel(writer, sheet_name='Removed Duplicates', index=False)
    
    print(f"Excel file saved to: {excel_path}")
    
    # Display summary statistics
    print(f"\n=== FINAL PAID GAMES SUMMARY ===")
    print(f"Total games: {len(df_cleaned)}")
    print(f"Games excluded: {excluded_count}")
    print(f"Duplicate games removed: {len(removed_games)}")
    print(f"Average rating: {df_cleaned['avg_rating'].mean():.2f}")
    print(f"Average confidence: {df_cleaned['confidence'].mean():.2f}")
    print(f"Games with US versions: {len(df_cleaned[df_cleaned['has_us_version'] == True])}")
    print(f"Games with GB versions: {len(df_cleaned[df_cleaned['has_gb_version'] == True])}")
    print(f"Games with perfect 5.0 rating: {len(df_cleaned[df_cleaned['avg_rating'] == 5.0])}")
    print(f"Games with 0.9+ confidence: {len(df_cleaned[df_cleaned['confidence'] >= 0.9])}")
    
    # Show top 10 games by confidence
    print(f"\n=== TOP 10 PAID GAMES BY CONFIDENCE ===")
    top_games = df_cleaned.head(10)
    for idx, row in top_games.iterrows():
        print(f"{row['game_name']} - {row['confidence']:.2f} confidence, {row['avg_rating']:.1f}★ ({row['formatted_price']})")
    
    return df_cleaned

if __name__ == "__main__":
    df_cleaned = create_paid_final_filtered()
