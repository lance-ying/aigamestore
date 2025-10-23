#!/usr/bin/env python3
"""
Script to update the filtered CSV and Excel files to prioritize US versions for subtitles and URLs.
"""

import pandas as pd
from pathlib import Path

def update_with_us_versions():
    """
    Update the filtered data to prioritize US versions for subtitles and URLs.
    """
    # Load the original all games data
    original_csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/all_games_data.csv')
    df_original = pd.read_csv(original_csv_path)
    
    print(f"Loaded {len(df_original)} games from original CSV")
    
    # Apply filters: >=10k reviews and >=4.0 rating
    df_filtered = df_original[(df_original['reviews'] >= 10000) & (df_original['rating'] >= 4.0)]
    print(f"After filtering (>=10k reviews & >=4.0 rating): {len(df_filtered)} games")
    
    # Group by game name and prioritize US versions
    print("Processing games to prioritize US versions...")
    
    def get_us_priority_data(group):
        """Get data prioritizing US versions, then GB versions for subtitle and URLs"""
        # Check if there's a US version
        us_version = group[group['country'] == 'us']
        gb_version = group[group['country'] == 'gb']
        
        if len(us_version) > 0:
            # Use US version for subtitle and URLs
            priority_row = us_version.iloc[0]
            priority_country = 'us'
        elif len(gb_version) > 0:
            # Use GB version for subtitle and URLs
            priority_row = gb_version.iloc[0]
            priority_country = 'gb'
        else:
            # Use first available version
            priority_row = group.iloc[0]
            priority_country = 'other'
        
        subtitle = priority_row['subtitle']
        app_store_url = priority_row['app_store_url']
        searchapi_url = priority_row['searchapi_url']
        formatted_price = priority_row['formatted_price']
        currency = priority_row['currency']
        
        # Aggregate other fields
        countries = ', '.join(sorted(group['country'].unique()))
        genres = ', '.join(sorted(group['genre'].unique()))
        max_reviews = group['reviews'].max()
        avg_rating = round(group['rating'].mean(), 2)
        best_position = group['position'].min()
        
        # Get latest release date
        try:
            dates = pd.to_datetime(group['release_date'], errors='coerce')
            latest_date = dates.max().strftime('%Y-%m-%d') if not pd.isna(dates.max()) else group['release_date'].iloc[0]
        except:
            latest_date = group['release_date'].iloc[0]
        
        return pd.Series({
            'countries': countries,
            'genres': genres,
            'max_reviews': max_reviews,
            'avg_rating': avg_rating,
            'best_position': best_position,
            'subtitle': subtitle,
            'app_id': group['app_id'].iloc[0],
            'bundle_id': group['bundle_id'].iloc[0],
            'release_date': latest_date,
            'is_free': group['is_free'].iloc[0],
            'formatted_price': formatted_price,
            'currency': currency,
            'app_store_url': app_store_url,
            'searchapi_url': searchapi_url,
            'country_count': len(group['country'].unique()),
            'genre_count': len(group['genre'].unique()),
            'has_us_version': len(us_version) > 0,
            'has_gb_version': len(gb_version) > 0,
            'priority_country': priority_country
        })
    
    # Group by game name and apply the function
    aggregated = df_filtered.groupby('game_name').apply(get_us_priority_data).reset_index()
    
    # Sort by max reviews (descending) then by avg rating (descending)
    aggregated = aggregated.sort_values(['max_reviews', 'avg_rating'], ascending=[False, False])
    
    print(f"After aggregation: {len(aggregated)} unique games")
    
    # Count how many games have US/GB versions
    us_games_count = aggregated['has_us_version'].sum()
    gb_games_count = aggregated['has_gb_version'].sum()
    us_or_gb_count = len(aggregated[aggregated['priority_country'].isin(['us', 'gb'])])
    
    print(f"Games with US versions: {us_games_count} ({us_games_count/len(aggregated)*100:.1f}%)")
    print(f"Games with GB versions: {gb_games_count} ({gb_games_count/len(aggregated)*100:.1f}%)")
    print(f"Games with US or GB versions: {us_or_gb_count} ({us_or_gb_count/len(aggregated)*100:.1f}%)")
    
    # Save updated CSV
    csv_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.csv')
    aggregated.to_csv(csv_path, index=False)
    print(f"Updated CSV saved to: {csv_path}")
    
    # Create updated Excel file
    excel_path = Path('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.xlsx')
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        # Write the main data
        aggregated.to_excel(writer, sheet_name='High Quality Games', index=False)
        
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
                'Games with US Versions',
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
                len(aggregated),
                us_games_count,
                len(aggregated[aggregated['country_count'] > 1]),
                len(aggregated[aggregated['genre_count'] > 1]),
                f"{aggregated['country_count'].mean():.1f}",
                f"{aggregated['genre_count'].mean():.1f}",
                len(aggregated[aggregated['genres'].str.contains('action', case=False, na=False)]),
                len(aggregated[aggregated['countries'].str.contains('us', case=False, na=False)]),
                aggregated.loc[aggregated['avg_rating'].idxmax(), 'game_name'],
                aggregated.loc[aggregated['max_reviews'].idxmax(), 'game_name']
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Create genre distribution sheet
        all_genres = []
        for genres_str in aggregated['genres']:
            all_genres.extend([g.strip() for g in genres_str.split(',')])
        
        genre_counts = pd.Series(all_genres).value_counts().reset_index()
        genre_counts.columns = ['Genre', 'Game Count']
        genre_counts.to_excel(writer, sheet_name='Genre Distribution', index=False)
        
        # Create country distribution sheet
        all_countries = []
        for countries_str in aggregated['countries']:
            all_countries.extend([c.strip() for c in countries_str.split(',')])
        
        country_counts = pd.Series(all_countries).value_counts().reset_index()
        country_counts.columns = ['Country', 'Game Count']
        country_counts.to_excel(writer, sheet_name='Country Distribution', index=False)
        
        # Create top games sheet
        top_games = aggregated.head(20)[['game_name', 'countries', 'genres', 'max_reviews', 'avg_rating', 'best_position', 'has_us_version', 'has_gb_version', 'priority_country']]
        top_games.to_excel(writer, sheet_name='Top 20 Games', index=False)
    
    print(f"Updated Excel file saved to: {excel_path}")
    
    # Show some examples of games with US versions
    print(f"\n=== EXAMPLES OF GAMES WITH US VERSIONS ===")
    us_games = aggregated[aggregated['priority_country'] == 'us'].head(10)
    for idx, row in us_games.iterrows():
        print(f"{row['game_name']} - {row['max_reviews']:,} reviews, {row['avg_rating']:.1f}★ (US subtitle: '{row['subtitle'][:50]}...')")
    
    # Show some examples of games with GB versions (no US)
    print(f"\n=== EXAMPLES OF GAMES WITH GB VERSIONS (NO US) ===")
    gb_games = aggregated[aggregated['priority_country'] == 'gb'].head(10)
    for idx, row in gb_games.iterrows():
        print(f"{row['game_name']} - {row['max_reviews']:,} reviews, {row['avg_rating']:.1f}★ (GB subtitle: '{row['subtitle'][:50]}...')")
    
    # Show some examples of games without US or GB versions
    print(f"\n=== EXAMPLES OF GAMES WITHOUT US/GB VERSIONS ===")
    other_games = aggregated[aggregated['priority_country'] == 'other'].head(5)
    for idx, row in other_games.iterrows():
        print(f"{row['game_name']} - {row['max_reviews']:,} reviews, {row['avg_rating']:.1f}★ (Countries: {row['countries']})")
    
    return aggregated

if __name__ == "__main__":
    df_updated = update_with_us_versions()
