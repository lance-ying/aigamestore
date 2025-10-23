# Game 2D Conversion Classification

This script uses Google's Gemini Flash 2.5 model to classify mobile games for their potential to be converted into 2D desktop games with keyboard controls.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements_classification.txt
   ```

2. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Save it to `../gemini.txt` (relative to this directory)
   - Or set it as an environment variable:
     ```bash
     export GEMINI_API_KEY='your_api_key_here'
     ```

3. **Test the setup:**
   ```bash
   python test_gemini_setup.py
   ```

## Usage

Run the classification script:
```bash
python classify_2d_potential.py
```

The script will present you with options:
1. **Process all games** (1,353 games - will take several hours)
2. **Process first 20 games** (for testing)
3. **Process specific range** (custom start index and batch size)
4. **Resume from previous run** (continues from last intermediate save)

## Classification Criteria

Games are evaluated on:

1. **Trial Duration**: Can rounds be completed in 5-10 minutes?
2. **Game Structure**: Has clear scoring/win conditions (not open-ended)?
3. **Mechanical Complexity**: Simple enough for 2D conversion?
4. **Control Compatibility**: Can be controlled with keyboard presses?
5. **Movement Requirements**: Avoids continuous movement needs?

## Output

The script generates:
- `2d_conversion_classification.csv` - Final results
- `classification_results_intermediate_*.csv` - Intermediate saves every 10 games
- Console output with progress and summary statistics

## Output Format

Each game gets classified with:
- `classification`: "SUITABLE" or "NOT_SUITABLE"
- `confidence`: 0.0-1.0 confidence score
- `reasoning`: Brief explanation
- `trial_duration`: Estimated time for one trial/round
- `control_type`: How controls would work with keyboard
- `complexity_level`: Simple/Medium/Complex
- `key_challenges`: List of main conversion challenges
- `conversion_notes`: Additional conversion notes

## Rate Limiting

The script processes **5 games per API call** with **3-second delays** between calls to avoid quota limits. This reduces API calls by 80% compared to individual game processing. Processing all 1,353 games will take approximately 14+ minutes.

## Error Handling

- Saves intermediate results every 20 games (4 API calls)
- Handles API errors gracefully
- Can resume from interrupted runs
- Logs all errors for debugging
- Batch processing reduces API quota usage by 80%
