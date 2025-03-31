import os
import json
import time
import tempfile
import shutil
from typing import Dict, List, Any, Tuple, Optional, TYPE_CHECKING
import asyncio
from PIL import Image, ImageChops
import numpy as np
from pathlib import Path

# Try to import playwright, handle gracefully if not installed
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
    if TYPE_CHECKING:
        from playwright.async_api import Page, Browser
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

# Import our AST parsing module
from parse_ast import analyze_ecs_structure


class PlayabilityTester:
    """Tests game playability by simulating key presses and monitoring state changes."""
    
    def __init__(self, game_path: str, output_dir: str = None):
        """
        Initialize the playability tester.
        
        Args:
            game_path: Path to the game directory
            output_dir: Directory to save output files
        """
        self.game_path = game_path
        self.output_dir = output_dir or os.path.join(game_path, "playability_results")
        self.screenshot_dir = os.path.join(self.output_dir, "screenshots")
        self.state_dir = os.path.join(self.output_dir, "states")
        
        # Create output directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.screenshot_dir, exist_ok=True)
        os.makedirs(self.state_dir, exist_ok=True)
        
        # Game state tracking
        self.states = []
        self.screenshots = []
        self.input_responses = []
        
        # Default test parameters
        self.test_keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']
        self.key_hold_duration = 200  # ms
        self.state_capture_delay = 300  # ms
        
        # Check for index.html
        self.html_path = self._find_html_file()
    
    def _find_html_file(self) -> str:
        """Find the main HTML file for the game."""
        # First, look for index.html
        index_path = os.path.join(self.game_path, "index.html")
        if os.path.exists(index_path):
            return index_path
        
        # If not found, look for any HTML file
        for root, _, files in os.walk(self.game_path):
            for file in files:
                if file.endswith('.html'):
                    return os.path.join(root, file)
        
        # No HTML file found
        return None
    
    async def setup_browser(self) -> Tuple[Any, Any, Any]:
        """Set up the browser and navigate to the game page."""
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError(
                "Playwright is required for playability testing. "
                "Install it with: pip install playwright && playwright install"
            )
        
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 800, "height": 600})
        page = await context.new_page()
        
        # Inject state extraction script
        await self._inject_state_extraction(page)
        
        # Navigate to the game
        file_url = f"file://{os.path.abspath(self.html_path)}"
        await page.goto(file_url)
        
        # Wait for game to load
        await asyncio.sleep(2)
        
        return playwright, browser, page
    
    async def _inject_state_extraction(self, page: Any) -> None:
        """Inject script to extract ECS state from the game."""
        # This script attempts to find the ECS state in common patterns
        await page.add_init_script("""
        window.extractGameState = function() {
            let state = {
                entities: {},
                systems: [],
                timestamp: Date.now()
            };
            
            // Try to find the game/world/ecs object
            let game = window.game || window.world || window.ecs;
            if (!game) {
                // Try to find it by inspecting global objects
                for (let key of Object.keys(window)) {
                    let obj = window[key];
                    if (obj && typeof obj === 'object') {
                        // Check for common ECS patterns
                        if (obj.entities && obj.systems) {
                            game = obj;
                            break;
                        }
                    }
                }
            }
            
            if (!game) {
                return { error: "Could not find game state" };
            }
            
            // Extract entities and components
            if (game.entities) {
                if (Array.isArray(game.entities)) {
                    // Handle array-based entities
                    game.entities.forEach((entity, index) => {
                        state.entities[entity.id || index] = {
                            components: {}
                        };
                        
                        // Extract components
                        if (entity.components) {
                            for (let [compName, component] of Object.entries(entity.components)) {
                                state.entities[entity.id || index].components[compName] = 
                                    JSON.parse(JSON.stringify(component));
                            }
                        }
                    });
                } else if (typeof game.entities === 'object') {
                    // Handle object/map-based entities
                    for (let [entityId, entity] of Object.entries(game.entities)) {
                        state.entities[entityId] = {
                            components: {}
                        };
                        
                        // Extract components
                        if (entity.components) {
                            for (let [compName, component] of Object.entries(entity.components)) {
                                state.entities[entityId].components[compName] = 
                                    JSON.parse(JSON.stringify(component));
                            }
                        }
                    }
                }
            }
            
            // Extract systems
            if (game.systems) {
                if (Array.isArray(game.systems)) {
                    state.systems = game.systems.map(sys => sys.constructor.name || "Unknown");
                } else if (typeof game.systems === 'object') {
                    state.systems = Object.keys(game.systems);
                }
            }
            
            return state;
        };
        """)
    
    async def capture_state(self, page: Any, label: str) -> Dict:
        """Capture the current game state and screenshot."""
        # Take a screenshot
        screenshot_path = os.path.join(self.screenshot_dir, f"{label}.png")
        await page.screenshot(path=screenshot_path)
        self.screenshots.append(screenshot_path)
        
        # Extract game state
        state = await page.evaluate("window.extractGameState()")
        
        # Save state to file
        state_path = os.path.join(self.state_dir, f"{label}.json")
        with open(state_path, 'w') as f:
            json.dump(state, f, indent=2)
            
        # Store state
        state['_label'] = label
        state['_screenshot'] = screenshot_path
        self.states.append(state)
        
        return state
    
    async def press_key(self, page: Any, key: str) -> None:
        """Press and hold a key, then release it."""
        await page.keyboard.down(key)
        await asyncio.sleep(self.key_hold_duration / 1000)
        await page.keyboard.up(key)
        await asyncio.sleep(self.state_capture_delay / 1000)
    
    def compare_screenshots(self, img1_path: str, img2_path: str) -> Tuple[float, Image.Image]:
        """
        Compare two screenshots and return the difference percentage.
        
        Returns:
            Tuple containing (difference_percentage, difference_image)
        """
        img1 = Image.open(img1_path)
        img2 = Image.open(img2_path)
        
        # Ensure images are the same size
        if img1.size != img2.size:
            img2 = img2.resize(img1.size)
        
        # Calculate difference
        diff = ImageChops.difference(img1, img2)
        
        # Convert to numpy array for analysis
        diff_array = np.array(diff)
        total_pixels = diff_array.shape[0] * diff_array.shape[1]
        changed_pixels = np.sum(diff_array > 10)  # Threshold for significant changes
        
        diff_percentage = (changed_pixels / total_pixels) * 100
        
        # Save difference image
        diff_path = os.path.join(
            self.screenshot_dir, 
            f"diff_{os.path.basename(img1_path)}_{os.path.basename(img2_path)}.png"
        )
        diff.save(diff_path)
        
        return diff_percentage, diff
    
    def compare_states(self, state1: Dict, state2: Dict) -> Dict:
        """
        Compare two game states and identify changes.
        
        Returns:
            Dictionary with changes in entities and components
        """
        changes = {
            "entity_count_change": len(state2.get("entities", {})) - len(state1.get("entities", {})),
            "changed_entities": [],
            "changed_components": [],
            "detailed_changes": {}
        }
        
        # Compare entities
        for entity_id, entity2 in state2.get("entities", {}).items():
            if entity_id not in state1.get("entities", {}):
                changes["changed_entities"].append({"id": entity_id, "type": "added"})
                continue
                
            entity1 = state1["entities"][entity_id]
            
            # Compare components
            for comp_name, comp2 in entity2.get("components", {}).items():
                if comp_name not in entity1.get("components", {}):
                    changes["changed_components"].append({
                        "entity": entity_id,
                        "component": comp_name,
                        "type": "added"
                    })
                    continue
                    
                comp1 = entity1["components"][comp_name]
                
                # Compare component properties
                if json.dumps(comp1) != json.dumps(comp2):
                    changes["changed_components"].append({
                        "entity": entity_id,
                        "component": comp_name,
                        "type": "modified"
                    })
                    
                    # Track detailed property changes
                    if entity_id not in changes["detailed_changes"]:
                        changes["detailed_changes"][entity_id] = {}
                        
                    changes["detailed_changes"][entity_id][comp_name] = self._get_property_changes(comp1, comp2)
        
        # Check for removed entities
        for entity_id in state1.get("entities", {}):
            if entity_id not in state2.get("entities", {}):
                changes["changed_entities"].append({"id": entity_id, "type": "removed"})
        
        return changes
    
    def _get_property_changes(self, obj1: Dict, obj2: Dict) -> Dict:
        """Get detailed property changes between two component states."""
        changes = {}
        
        # Check all properties in obj2
        for key, value2 in obj2.items():
            if key not in obj1:
                changes[key] = {"action": "added", "value": value2}
            elif json.dumps(obj1[key]) != json.dumps(value2):
                changes[key] = {
                    "action": "modified",
                    "old_value": obj1[key],
                    "new_value": value2
                }
        
        # Check for removed properties
        for key in obj1:
            if key not in obj2:
                changes[key] = {"action": "removed", "old_value": obj1[key]}
                
        return changes
    
    async def run_playability_test(self) -> Dict:
        """
        Run the full playability test suite.
        
        Returns:
            Dictionary with test results
        """
        if not self.html_path:
            return {
                "success": False,
                "error": "No HTML file found in the game directory"
            }
        
        try:
            # Set up browser
            playwright, browser, page = await self.setup_browser()
            
            # Capture initial state
            initial_state = await self.capture_state(page, "initial")
            
            # Test each key
            for key in self.test_keys:
                # Press key
                await self.press_key(page, key)
                
                # Capture state after key press
                await self.capture_state(page, f"after_{key}")
            
            # Clean up
            await browser.close()
            await playwright.stop()
            
            # Analyze results
            return self.analyze_results()
            
        except Exception as e:
            import traceback
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def analyze_results(self) -> Dict:
        """
        Analyze test results to determine playability.
        
        Returns:
            Dictionary with analysis results
        """
        if len(self.states) < 2:
            return {
                "success": False,
                "error": "Not enough state captures to analyze"
            }
        
        mechanics_results = self._analyze_mechanics()
        rendering_results = self._analyze_rendering()
        
        # Determine overall playability
        success = (mechanics_results["mechanics_working"] or 
                   rendering_results["rendering_working"])
        
        return {
            "success": success,
            "mechanics_check": mechanics_results,
            "rendering_check": rendering_results,
            "test_details": {
                "keys_tested": self.test_keys,
                "state_captures": len(self.states),
                "screenshot_captures": len(self.screenshots)
            }
        }
    
    def _analyze_mechanics(self) -> Dict:
        """Analyze if game mechanics are working."""
        initial_state = self.states[0]
        
        # Track key responses
        key_responses = []
        
        # Compare initial state with each post-key state
        for i in range(1, len(self.states)):
            state = self.states[i]
            changes = self.compare_states(initial_state, state)
            
            # Determine if this key had an effect
            has_effect = (
                changes["entity_count_change"] != 0 or
                len(changes["changed_entities"]) > 0 or
                len(changes["changed_components"]) > 0
            )
            
            key_responses.append({
                "key": state["_label"].replace("after_", ""),
                "has_effect": has_effect,
                "changes": changes
            })
        
        # Determine if mechanics are working
        keys_with_effect = sum(1 for resp in key_responses if resp["has_effect"])
        mechanics_working = keys_with_effect > 0
        
        return {
            "mechanics_working": mechanics_working,
            "keys_with_effect": keys_with_effect,
            "total_keys_tested": len(key_responses),
            "mechanics_score": keys_with_effect / len(key_responses) if key_responses else 0,
            "key_responses": key_responses
        }
    
    def _analyze_rendering(self) -> Dict:
        """Analyze if game rendering is working."""
        initial_screenshot = self.screenshots[0]
        
        # Track visual responses
        visual_responses = []
        
        # Compare initial screenshot with each post-key screenshot
        for i in range(1, len(self.screenshots)):
            screenshot = self.screenshots[i]
            diff_percent, _ = self.compare_screenshots(initial_screenshot, screenshot)
            
            # Determine if this key had a visual effect
            has_effect = diff_percent > 1.0  # More than 1% different
            
            visual_responses.append({
                "key": os.path.basename(screenshot).replace("after_", "").replace(".png", ""),
                "has_effect": has_effect,
                "diff_percentage": diff_percent
            })
        
        # Determine if rendering is working
        keys_with_effect = sum(1 for resp in visual_responses if resp["has_effect"])
        rendering_working = keys_with_effect > 0
        
        return {
            "rendering_working": rendering_working,
            "keys_with_visual_effect": keys_with_effect,
            "total_keys_tested": len(visual_responses),
            "rendering_score": keys_with_effect / len(visual_responses) if visual_responses else 0,
            "visual_responses": visual_responses
        }


async def _run_playability_check(game_path: str, output_dir: str = None) -> Dict:
    """Internal async function to run the playability check."""
    tester = PlayabilityTester(game_path, output_dir)
    return await tester.run_playability_test()


def check_playability(game_path: str, output_dir: str = None) -> Tuple[bool, Dict]:
    """
    Check if the game is playable.
    
    Args:
        game_path: Path to the game directory
        output_dir: Directory to save output files
        
    Returns:
        Tuple with (success, detailed_results)
    """
    if not PLAYWRIGHT_AVAILABLE:
        return False, {
            "error": "Playwright is required for playability testing. "
                    "Install it with: pip install playwright && playwright install"
        }
    
    if not os.path.isdir(game_path):
        return False, {"error": f"Invalid game path: {game_path} is not a directory"}
    
    # Create output directory
    output_dir = output_dir or os.path.join(game_path, "metrics_results", "playability")
    os.makedirs(output_dir, exist_ok=True)
    
    # Run AST analysis to understand the game structure
    ecs_output_dir = os.path.join(output_dir, "ecs_analysis")
    os.makedirs(ecs_output_dir, exist_ok=True)
    
    ecs_results = analyze_ecs_structure(game_path, ecs_output_dir)
    
    # Run playability test
    playability_results = asyncio.run(_run_playability_check(game_path, output_dir))
    
    # Combine results
    combined_results = {
        "ecs_analysis": ecs_results,
        "playability_test": playability_results
    }
    
    # Determine overall success
    success = playability_results.get("success", False)
    
    # Save combined results
    results_path = os.path.join(output_dir, "playability_results.json")
    with open(results_path, 'w') as f:
        json.dump(combined_results, f, indent=2)
    
    return success, combined_results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Check game playability")
    parser.add_argument("game_path", help="Path to the game directory")
    parser.add_argument("--output", help="Directory to save output files", default=None)
    args = parser.parse_args()
    
    success, results = check_playability(args.game_path, args.output)
    
    # Print summary
    if success:
        print("\n✅ Game is playable!")
    else:
        print("\n❌ Game playability check failed")
        if "error" in results:
            print(f"Error: {results['error']}")
    
    # Print details
    if "playability_test" in results and "mechanics_check" in results["playability_test"]:
        mechanics = results["playability_test"]["mechanics_check"]
        rendering = results["playability_test"]["rendering_check"]
        
        print("\nMechanics check:", "✅ PASSED" if mechanics["mechanics_working"] else "❌ FAILED")
        print(f"- {mechanics['keys_with_effect']}/{mechanics['total_keys_tested']} keys had an effect on game state")
        
        print("\nRendering check:", "✅ PASSED" if rendering["rendering_working"] else "❌ FAILED")
        print(f"- {rendering['keys_with_visual_effect']}/{rendering['total_keys_tested']} keys had a visual effect")
    
    if "ecs_analysis" in results:
        ecs = results["ecs_analysis"]
        print("\nECS Analysis:")
        print(f"- Found {len(ecs.get('entities', []))} entities")
        print(f"- Found {len(ecs.get('components', []))} components")
        print(f"- Found {len(ecs.get('systems', []))} systems")
        
        if "visualization_path" in ecs:
            print(f"\nECS visualization: {ecs['visualization_path']}")
