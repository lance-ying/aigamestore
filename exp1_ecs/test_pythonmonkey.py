import pythonmonkey as pm
import os
import glob
from pathlib import Path
import time


class GameTester:
    def __init__(self, games_dir):
        self.games_dir = Path(games_dir)

    def setup_p5_environment(self):
        """Set up a comprehensive p5.js mock environment with globals."""
        p5_mock = """
            // p5.js mock setup with global variables/functions
            globalThis.width = 800;
            globalThis.height = 600;
            globalThis.deltaTime = 16;
            globalThis.frameCount = 0;
            globalThis.key = '';
            globalThis.keyCode = 0;
            
            // Core p5 drawing functions
            globalThis.createCanvas = function() {};
            globalThis.background = function() {};
            globalThis.fill = function() {};
            globalThis.noStroke = function() {};
            globalThis.ellipse = function() {};
            globalThis.textSize = function() {};
            globalThis.textAlign = function() {};
            globalThis.text = function() {};
            globalThis.rect = function() {};
            globalThis.stroke = function() {};
            globalThis.strokeWeight = function() {};
            
            // Math utilities
            globalThis.random = function(min, max) {
                if (max === undefined) {
                    max = min;
                    min = 0;
                }
                return min + Math.random() * (max - min);
            };
            globalThis.floor = function(n) { return Math.floor(n); };
            globalThis.dist = function(x1, y1, x2, y2) {
                return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
            };
            globalThis.constrain = function(n, low, high) {
                return Math.max(Math.min(n, high), low);
            };
            globalThis.sqrt = function(n) { return Math.sqrt(n); };
            
            // Vector operations
            globalThis.createVector = function(x, y) {
                return {
                    x: x || 0,
                    y: y || 0,
                    add: function(v) { this.x += v.x; this.y += v.y; },
                    set: function(x, y) { this.x = x; this.y = y; },
                    mult: function(n) { this.x *= n; this.y *= n; },
                    mag: function() { return Math.sqrt(this.x * this.x + this.y * this.y); }
                };
            };
            
            // Text alignment constants
            globalThis.CENTER = "center";
            globalThis.LEFT = "left";
            globalThis.RIGHT = "right";
            globalThis.TOP = "top";
            globalThis.BOTTOM = "bottom";
            
            // Color modes
            globalThis.RGB = "rgb";
            globalThis.HSB = "hsb";
            globalThis.colorMode = function() {};
            
            // Additional p5 utilities that might be used
            globalThis.push = function() {};
            globalThis.pop = function() {};
            globalThis.translate = function() {};
            globalThis.rotate = function() {};
            globalThis.scale = function() {};
        """
        pm.eval(p5_mock)

    def load_and_eval_game(self, game_path):
        """Load the game code from file and evaluate it."""
        try:
            with open(game_path, "r") as f:
                game_code = f.read()
            pm.eval(game_code)
            return None  # success, no error message
        except Exception as e:
            return str(e)

    def detect_init_function(self):
        """
        Dynamically search for a candidate game initialization function based on naming heuristics.
        Returns the name of the function if found, else None.
        """
        # This script looks for methods with "start", "reset", or "init" in the name.
        fn_name = pm.eval(
            """
            () => {
                const candidates = Object.keys(globalThis)
                    .filter(k => typeof globalThis[k] === "function" && /(start|reset|init)/i.test(k));
                for (const k of candidates) {
                    try {
                        // Try calling a candidate and see if a player entity appears.
                        globalThis[k]();
                        if (typeof entities !== 'undefined' && entities.some(e => e.type === 'player')) {
                            return k;
                        }
                    } catch (e) {
                        // If an error is thrown, skip this candidate.
                    }
                }
                return null;
            }
        """
        )()
        return fn_name

    def check_required_functions(self):
        """Check that the basic functions (setup, draw, keyPressed, and keyReleased) exist."""
        required = ["setup", "draw", "keyPressed", "keyReleased"]
        missing = pm.eval(
            f"""
            () => {{
                let missing = [];
                const req = {required};
                for (let fn of req) {{
                    if (typeof globalThis[fn] !== 'function')
                        missing.push(fn);
                }}
                return missing;
            }}
        """
        )()
        return missing

    def test_initial_state(self):
        """
        Initialize the game by calling initialization functions. Determine
        whether a player entity exists and assess the basic game state.
        """
        # First try calling 'setup'
        pm.eval("setup()")
        # Then call a candidate initialization function if available.
        init_fn = self.detect_init_function()
        if init_fn:
            pm.eval(f"{init_fn}()")
        # Gather the initial state
        state = pm.eval(
            """
            () => {
                return {
                    playerExists: (typeof entities !== 'undefined') ? entities.some(e => e.type === 'player') : false,
                    entityCount: (typeof entities !== 'undefined') ? entities.length : 0,
                    gameState: globalThis.gameState || 'unknown'
                };
            }
        """
        )()
        return state

    def test_input_response(self):
        """
        Simulate key presses to test if the game's input system is responsive.
        Tests both WASD and arrow keys, and runs multiple frames per key press.
        """
        # First ensure we're in game state (not start screen)
        pm.eval(
            """
            // Simulate pressing Enter to start the game if needed
            if (gameState === 'start') {
                globalThis.keyCode = 13;  // Enter key
                if (typeof keyPressed === 'function') keyPressed();
                if (typeof draw === 'function') draw();
                if (typeof keyReleased === 'function') keyReleased();
            }
        """
        )

        # Get initial player position
        initialPlayerPos = pm.eval(
            """
            () => {
                const player = entities.find(e => e.type === 'player');
                if (player) {
                    const position = player.pos || player.position;
                    return position ? { x: position.x, y: position.y } : null;
                }
                return null;
            }
        """
        )()
        if initialPlayerPos is None:
            return False

        # Test both WASD and arrow keys
        test_key_sets = [
            # WASD keys
            [
                {"key": "w", "keyCode": 87},
                {"key": "a", "keyCode": 65},
                {"key": "s", "keyCode": 83},
                {"key": "d", "keyCode": 68},
            ],
            # Arrow keys
            [
                {"key": "ArrowUp", "keyCode": 38},
                {"key": "ArrowLeft", "keyCode": 37},
                {"key": "ArrowDown", "keyCode": 40},
                {"key": "ArrowRight", "keyCode": 39},
            ],
        ]

        playerMoved = False
        for key_set in test_key_sets:
            for tk in key_set:
                # Simulate holding the key for multiple frames
                pm.eval(
                    f"""
                    () => {{
                        // Initialize keysPressed if it doesn't exist
                        if (typeof keysPressed === 'undefined') {{
                            globalThis.keysPressed = {{}};
                        }}
                        
                        // Set up key state
                        globalThis.key = '{tk['key']}';
                        globalThis.keyCode = {tk['keyCode']};
                        
                        // Update keysPressed object
                        keysPressed[{tk['keyCode']}] = true;
                        keysPressed['{tk['key']}'] = true;
                        
                        // Call keyPressed
                        if (typeof keyPressed === 'function') keyPressed();
                        
                        // Run multiple frames while key is held
                        for (let i = 0; i < 30; i++) {{  // Increased frame count
                            if (typeof draw === 'function') draw();
                            if (typeof updateInputSystem === 'function') updateInputSystem();
                            globalThis.frameCount++;
                        }}
                        
                        // Release key
                        keysPressed[{tk['keyCode']}] = false;
                        keysPressed['{tk['key']}'] = false;
                        if (typeof keyReleased === 'function') keyReleased();
                    }}
                """
                )()

                # Check if player position changed
                newPos = pm.eval(
                    """
                    () => {
                        const player = entities.find(e => e.type === 'player');
                        if (player) {
                            const position = player.pos || player.position;
                            return position ? { x: position.x, y: position.y } : null;
                        }
                        return null;
                    }
                """
                )()

                if newPos and (
                    newPos["x"] != initialPlayerPos["x"]
                    or newPos["y"] != initialPlayerPos["y"]
                ):
                    playerMoved = True
                    break
            if playerMoved:
                break

        return playerMoved

    def test_gameplay_mechanics(self):
        """
        Run additional tests to verify game functionality such as enemy spawning
        and scoring mechanics. Simulates enough frames for time-based events.
        """
        # First ensure we're in game state (not start screen)
        pm.eval(
            """
            // First make sure we're in game state
            if (gameState === 'start') {
                // Simulate pressing Enter (keyCode 13) to start the game
                globalThis.keyCode = 13;
                if (typeof keyPressed === 'function') keyPressed();
                if (typeof draw === 'function') draw();
                if (typeof keyReleased === 'function') keyReleased();
            }
        """
        )

        # Run the game for several seconds worth of frames
        pm.eval(
            """
            () => {
                // Simulate 5 seconds of gameplay at 60fps
                for (let i = 0; i < 300; i++) {
                    if (typeof draw === 'function') draw();
                    // Make sure we run the enemy spawn system
                    if (typeof spawnEnemySystem === 'function') spawnEnemySystem();
                    if (typeof updateMovementSystem === 'function') updateMovementSystem();
                    globalThis.frameCount++;
                }
            }
        """
        )()

        # Check various gameplay elements with more detailed enemy detection
        gameplay = pm.eval(
            """
            () => {
                const results = {
                    enemiesSpawned: false,
                    scoreTracking: false,
                    gameStateChanges: false,
                    debug: { 
                        gameState: gameState,
                        entityCount: entities.length,
                        hasEnemies: entities.some(e => e.type === 'enemy')
                    }
                };
                
                // Check for enemies (various possible properties)
                if (typeof entities !== 'undefined') {
                    results.enemiesSpawned = entities.some(e => 
                        e.type === 'enemy' || 
                        (e.components && e.components.ai) ||
                        e.isEnemy
                    );
                }
                
                // Check for score tracking
                results.scoreTracking = (
                    typeof score !== 'undefined' ||
                    typeof globalThis.score !== 'undefined'
                );
                
                // Check for game state
                results.gameStateChanges = (
                    typeof gameState !== 'undefined' &&
                    gameState === 'game'  // specifically check for 'game' state
                );
                
                return results;
            }
        """
        )()

        # Print debug info
        print("\nDebug Info:")
        print(f"  Game State: {gameplay['debug']['gameState']}")
        print(f"  Entity Count: {gameplay['debug']['entityCount']}")
        print(f"  Has Enemies: {gameplay['debug']['hasEnemies']}")

        return gameplay

    def test_specific_game(self, game_path):
        """
        Modular test for a specific game. It sets up the environment, loads the game,
        and tests its initialization, required functions, input response, and gameplay behavior.
        """
        results = {
            "compile_success": False,
            "runtime_checks": {
                "p5_setup": False,
                "game_state": False,
                "entity_system": False,
                "input_system": False,
                "gameplay_logic": False,
            },
            "performance": {"load_time": 0, "memory_usage": 0},
            "errors": [],
        }

        start_time = time.time()

        try:
            # 1. Set up the p5.js environment.
            self.setup_p5_environment()
            results["runtime_checks"]["p5_setup"] = True

            # 2. Load and evaluate the game code.
            load_err = self.load_and_eval_game(game_path)
            if load_err:
                results["errors"].append("Game load error: " + load_err)
                return results
            results["compile_success"] = True

            # 3. Check for required functions.
            missing = self.check_required_functions()
            if missing:
                results["errors"].append(
                    "Missing required functions: " + ", ".join(missing)
                )

            # 4. Test initial game state.
            init_state = self.test_initial_state()
            if init_state["playerExists"]:
                results["runtime_checks"]["game_state"] = True
                results["runtime_checks"]["entity_system"] = True
            else:
                results["errors"].append(
                    "Initial state test failed: No player entity found."
                )

            # 5. Test input handling responsiveness.
            input_ok = self.test_input_response()
            results["runtime_checks"]["input_system"] = input_ok
            if not input_ok:
                results["errors"].append(
                    "Input test failed: Player did not respond to key events."
                )

            # 6. Test gameplay mechanics (e.g. enemy spawning).
            gameplay = self.test_gameplay_mechanics()
            if gameplay.get("enemiesSpawned", False):
                results["runtime_checks"]["gameplay_logic"] = True
            else:
                results["errors"].append("Gameplay test failed: No enemies spawned.")

        except Exception as e:
            results["errors"].append(str(e))

        results["performance"]["load_time"] = time.time() - start_time
        return results

    def test_all_games(self):
        all_results = {}
        # Recursively test games in both 1p and 2p directories.
        for player_dir in ["1p", "2p"]:
            game_dir = self.games_dir / player_dir
            if not game_dir.exists():
                continue
            js_files = glob.glob(str(game_dir / "**/*.js"), recursive=True)
            for game_file in js_files:
                game_name = Path(game_file).relative_to(self.games_dir)
                all_results[str(game_name)] = self.test_specific_game(game_file)
        return all_results


def main():
    # Example: Test a specific game.
    games_dir = Path(__file__).parent / "games"
    tester = GameTester(games_dir)
    specific_game = games_dir / "1p/ecs/shooting/lone_marksman/game.js"
    results = tester.test_specific_game(specific_game)

    print(f"\nGame Testing Results for {specific_game}:")
    print("=" * 50)
    print(f"Compilation: {'✓' if results['compile_success'] else '✗'}")

    print("\nRuntime Checks:")
    for check, status in results["runtime_checks"].items():
        print(f"  {check}: {'✓' if status else '✗'}")

    if "errors" in results and results["errors"]:
        print("\nErrors:")
        for error in results["errors"]:
            print(f"  - {error}")

    print("\nPerformance:")
    print(f"  Load Time: {results['performance']['load_time']:.3f}s")


if __name__ == "__main__":
    main()
