# Game Check

A tool for testing games by checking if they load correctly, accept user inputs, and can be restarted.

## Features

- **Game Loading Test**: Checks if the game loads without errors and displays a canvas.
- **Game Interaction Test**: Tests if the game responds to user inputs by checking for visual changes.
- **Game Restart Test**: Verifies that the game can be restarted with the 'R' key.

## Requirements

- Python 3.6+
- Playwright (`pip install playwright`)
- Pillow (`pip install pillow`)

After installing Playwright, you need to install the browser engines:

```bash
python -m playwright install --with-deps firefox
```

## Usage

### Running All Tests

```bash
python -m game_check.run_all_tests <game_path>
```

or use the CLI script:

```bash
./game_check_cli.py <game_path>
```

### Command-line Options

```
usage: run_all_tests.py [-h] [--output OUTPUT] [--skip-load] [--skip-interaction] [--skip-restart] game_path

Run all game tests

positional arguments:
  game_path             Path to the game directory or HTML file

optional arguments:
  -h, --help            show this help message and exit
  --output OUTPUT, -o OUTPUT
                        Path to save combined results (JSON)
  --skip-load           Skip load test
  --skip-interaction    Skip interaction test
  --skip-restart        Skip restart test
```

### Running Individual Tests

To run only the load test:

```bash
python -m game_check.tests.load_test <game_path>
```

To run only the interaction test:

```bash
python -m game_check.tests.interaction_test <game_path>
```

To run only the restart test:

```bash
python -m game_check.tests.restart_test <game_path>
```

## Output

Each test generates a results dictionary containing:

- `test_result`: A boolean indicating whether the test passed (True) or failed (False)
- Additional information specific to each test
- Paths to screenshots taken during testing

Test results are saved to a JSON file in the `game_check_results` directory next to the game path.

## Example

```bash
$ python -m game_check.run_all_tests path/to/game

==================================================
GAME LOAD TEST RESULTS
==================================================
✅ TEST PASSED
Screenshots saved: 1
  - game_initial_load.png
==================================================

==================================================
GAME INTERACTION TEST RESULTS
==================================================
✅ TEST PASSED
Visual changes detected: 3
  - ArrowLeft: diff score 0.0623
  - ArrowRight: diff score 0.0712
  - Space: diff score 0.0215
Screenshots saved: 7
  - before_start.png
  - start_game_before.png
  - start_game_after.png
  - press_arrowleft_0_before.png
==================================================

==================================================
GAME RESTART TEST RESULTS
==================================================
✅ TEST PASSED
Initial state restored: True
  - Difference score: 0.0120
Screenshots saved: 4
  - initial_state.png
  - in_game_state.png
  - gameplay_state.png
  - restart_state.png
==================================================

==================================================
OVERALL TEST RESULTS
==================================================
Load Test: ✅ PASSED
Interaction Test: ✅ PASSED
Restart Test: ✅ PASSED
--------------------------------------------------
Overall Result: ✅ PASSED
==================================================
```

## Notes

- The game must be an HTML file or a directory containing an HTML file
- The tests use Playwright to open a headless browser and simulate user inputs
- The interaction test checks for visual changes by comparing screenshots
- The restart test verifies that the game returns to its initial state