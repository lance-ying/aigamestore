#!/usr/bin/env python3
"""
Script to update file paths in Python scripts after reorganizing the crawled_games folder.
"""

import os
import re
from pathlib import Path

def update_file_paths(file_path: str):
    """Update paths in a Python file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define path mappings
    path_mappings = [
        # Old path -> New path
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/all_games_data.csv', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/all_games_data.csv'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.csv', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.csv'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.xlsx', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/filtered_high_quality_games.xlsx'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/merged_classification_games.csv', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/processed_data/merged_classification_games.csv'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/2d_conversion_classification.csv', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/classification_results/2d_conversion_classification.csv'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/intermediate_results/classification_results_intermediate_', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/intermediate_results/classification_results_intermediate_'),
        
        ('/Users/lance/Documents/GitHub/aigamestore/crawled_games/raw_data/', 
         '/Users/lance/Documents/GitHub/aigamestore/crawled_games/raw_data/'),
    ]
    
    # Apply path mappings
    updated_content = content
    for old_path, new_path in path_mappings:
        updated_content = updated_content.replace(old_path, new_path)
    
    # Write back if changes were made
    if updated_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated paths in: {file_path}")
        return True
    else:
        print(f"No path updates needed in: {file_path}")
        return False

def main():
    """Update paths in all Python files"""
    project_root = Path('/Users/lance/Documents/GitHub/aigamestore')
    
    # Find all Python files
    python_files = list(project_root.glob('*.py'))
    
    updated_files = []
    for py_file in python_files:
        if update_file_paths(str(py_file)):
            updated_files.append(py_file.name)
    
    print(f"\n=== PATH UPDATE SUMMARY ===")
    print(f"Files updated: {len(updated_files)}")
    for file_name in updated_files:
        print(f"  - {file_name}")
    
    if not updated_files:
        print("No files needed path updates.")

if __name__ == "__main__":
    main()
