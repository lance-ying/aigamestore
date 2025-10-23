# Crawled Games Data Structure

This directory contains organized game data from Apple App Store crawling and AI classification.

## Directory Structure

### 📁 `raw_data/`
Contains the original crawled JSON files organized by genre:
- **`action/`** - Action games data by country (15 files)
- **`adventure/`** - Adventure games data by country (15 files)  
- **`board/`** - Board games data by country (15 files)
- **`casual/`** - Casual games data by country (15 files)
- **`puzzle/`** - Puzzle games data by country (15 files)
- **`crawler.ipynb`** - Original crawling notebook

### 📁 `analysis/`
Contains analysis scripts and notebooks:
- **`analysis.ipynb`** - Main data analysis notebook
- **`classify_2d_potential.py`** - AI classification script for 2D conversion
- **`test_gemini_setup.py`** - Gemini API setup verification
- **`update_us_versions.py`** - Script to prioritize US/GB versions
- **`create_excel_version.py`** - Excel export script
- **`update_paths.py`** - Path update utility
- **`README_classification.md`** - Classification documentation
- **`requirements_classification.txt`** - Python dependencies

### 📁 `processed_data/`
Contains processed and filtered datasets:
- **`all_games_data.csv`** - All 7,000 games with metadata
- **`filtered_high_quality_games.csv`** - 1,353 high-quality games (≥10k reviews, ≥4.0 rating)
- **`filtered_high_quality_games.xlsx`** - Excel version with proper encoding
- **`merged_classification_games.csv`** - Games with AI classification results

### 📁 `classification_results/`
Contains final AI classification results:
- **`2d_conversion_classification.csv`** - Complete classification results

### 📁 `intermediate_results/`
Contains intermediate classification results (saved every 20 games):
- **`classification_results_intermediate_*.csv`** - Progress saves during classification

## File Naming Convention

### Raw Data Files
Format: `top_chart_{genre}_games_{country}.json`
- `genre`: action, adventure, board, casual, puzzle
- `country`: au, br, cn, de, fr, gb, in, jp, kr, mx, sa, tr, us, vn, za

### Processed Data
- **All Games**: Complete dataset with 15 columns including URLs
- **Filtered Games**: High-quality subset with US/GB priority for subtitles/URLs
- **Merged Data**: Combined game metadata with AI classification results

## Key Statistics

- **Total Games**: 7,000 (original) → 1,353 (filtered)
- **Countries**: 14 countries covered
- **Genres**: 5 genres (action, adventure, board, casual, puzzle)
- **AI Classification**: 1,337 games classified for 2D conversion potential
- **Suitable Games**: ~68% classified as suitable for 2D conversion

## Usage

1. **Raw Data**: Use for detailed game information by genre/country
2. **Processed Data**: Use for analysis and filtering
3. **Classification Results**: Use for 2D game conversion planning
4. **Intermediate Results**: Use for resuming interrupted classification runs
5. **Analysis Scripts**: Run from the `analysis/` directory for data processing

## Running Analysis

To run the analysis scripts, navigate to the analysis directory:
```bash
cd crawled_games/analysis
python classify_2d_potential.py
python test_gemini_setup.py
```
