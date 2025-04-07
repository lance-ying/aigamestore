import os
import time
import logging
import asyncio
import subprocess
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright, Page

    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False


class BrowserController:
    """
    Class to manage headless browser interactions for game analysis.
    """
    def __init__(self, game_path: str, port: int = 8000):
        self.game_path = game_path
        self.port = port
        self.server_process = None
        self.enabled = HEADLESS_BROWSER_ENABLED
        self.is_html_file = os.path.isfile(game_path) and game_path.lower().endswith('.html')
        
    async def __aenter__(self):
        if not self.enabled:
            logging.warning("Headless browser is not enabled. Install playwright with: "
                           "pip install playwright && python -m playwright install --with-deps chromium")
            return self
            
        try:
            # If it's a single HTML file, we don't need to start a server
            if self.is_html_file:
                logging.info(f"Game path is a single HTML file: {self.game_path}")
                return self
                
            # Start a simple HTTP server to serve the game files
            self.server_process = subprocess.Popen(
                ["python", "-m", "http.server", str(self.port)],
                cwd=self.game_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            logging.info(f"Started HTTP server on port {self.port}")
            
            # Allow server to start
            await asyncio.sleep(1)
            return self
        except Exception as e:
            logging.error(f"Error starting server: {e}")
            if self.server_process:
                self.server_process.terminate()
                self.server_process = None
            raise
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.server_process:
            self.server_process.terminate()
            logging.info("HTTP server terminated")
    
    async def analyze_game(self, timeout: int = 60) -> Dict[str, Any]:
        """
        Analyzes the game by opening it in a headless browser and extracting ECS information.
        
        Args:
            timeout: Maximum time to wait for game initialization
            
        Returns:
            Dictionary with dynamically discovered ECS elements
        """
        if not self.enabled:
            return {"error": "Headless browser not enabled. Install playwright."}
            
        if not self.is_html_file and not self.server_process:
            return {"error": "Server not running. Use within 'async with' context."}
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        return await self._run_headless_browser(url, timeout)
        
    async def _run_headless_browser(self, url: str, timeout: int) -> Dict[str, Any]:
        """
        Uses Playwright to run the game and extract runtime ECS information.
        
        Args:
            url: URL to the game
            timeout: Maximum time to wait for game initialization
            
        Returns:
            Dictionary with dynamically discovered ECS elements
        """
        runtime_ecs_data = {"entities": {}, "components": {}, "systems": {}, "errors": []}
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(self.game_path, "metrics_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True, slow_mo=1000)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Add JavaScript hooks to capture ECS data
            await self._add_js_hooks(page)
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle")
                logging.info(f"Page loaded: {url}")
                
                # Wait for the game to initialize
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                await self._save_screenshot(page, screenshots_dir, "game_initial_state.png")
                
                # Identify and interact with game canvas
                runtime_ecs_data = await self._interact_with_game(page, runtime_ecs_data, screenshots_dir)
                
                # Take a final screenshot for reference
                try:
                    await self._save_screenshot(page, screenshots_dir, "game_final_state.png")
                    logging.info("Final game state screenshot saved")
                except Exception as ss_err:
                    logging.warning(f"Failed to save screenshot: {ss_err}")
                
                # Get final data
                final_data = await page.evaluate("window.capturedECS")
                if final_data:
                    runtime_ecs_data.update(final_data)
            except Exception as e:
                logging.error(f"Error in browser interaction: {e}")
                runtime_ecs_data["errors"].append(f"Browser interaction error: {e}")
            finally:
                await browser.close()
                
        return runtime_ecs_data
        
    async def _add_js_hooks(self, page: Page):
        """Add JavaScript hooks to capture ECS data from the running game."""
        await page.add_init_script("""
            window.capturedECS = {
                entities: {},
                components: {},  
                systems: {},
                entity_snapshots: []
            };
            
            // Enhanced function to extract entities from global variable
            window.extractEntitiesFromGlobal = function() {
                const result = {};
                
                if (!window.entities) return result;
                
                // Extract key properties that often change in games for tracking
                const trackPropertyChanges = function(entity) {
                    const tracked = {};
                    
                    // Common properties to track
                    const trackProps = [
                        // Position
                        'position', 'pos', 'x', 'y', 'z', 'transform',
                        // Movement 
                        'velocity', 'vel', 'speed', 'direction', 'angle', 'rotation',
                        // Game state
                        'health', 'hp', 'lives', 'score', 'points',
                        // State
                        'state', 'visible', 'active', 'enabled'
                    ];
                    
                    // Direct properties
                    for (const prop of trackProps) {
                        if (entity[prop] !== undefined) {
                            if (typeof entity[prop] === 'object') {
                                tracked[prop] = JSON.parse(JSON.stringify(entity[prop]));
                            } else {
                                tracked[prop] = entity[prop];
                            }
                        }
                    }
                    
                    // Component properties - check for nested properties in components
                    if (entity.components) {
                        for (const compName in entity.components) {
                            const comp = entity.components[compName];
                            for (const prop of trackProps) {
                                if (comp[prop] !== undefined) {
                                    tracked[`${compName}.${prop}`] = 
                                        typeof comp[prop] === 'object' 
                                            ? JSON.parse(JSON.stringify(comp[prop])) 
                                            : comp[prop];
                                }
                            }
                        }
                    }
                    
                    return tracked;
                };
                
                // Process array of entities
                if (Array.isArray(window.entities)) {
                    window.entities.forEach((entity, index) => {
                        if (entity && typeof entity === 'object') {
                            const entityId = entity.id || entity.name || entity.type || `entity_${index}`;
                            const components = {};
                            
                            // Extract components directly from entity.components
                            if (entity.components && typeof entity.components === 'object') {
                                Object.entries(entity.components).forEach(([compName, compValue]) => {
                                    if (compValue && typeof compValue === 'object') {
                                        const normalizedName = compName.endsWith('Component') ? 
                                            compName : compName + 'Component';
                                        components[normalizedName] = Object.keys(compValue);
                                        
                                        // Store component data for later retrieval
                                        window.capturedECS.components[normalizedName] = 
                                            window.capturedECS.components[normalizedName] || 
                                            Object.keys(compValue);
                                    }
                                });
                            } else {
                                // Try to extract components directly from entity properties
                                // Some games store components directly on the entity
                                Object.entries(entity).forEach(([key, value]) => {
                                    // Skip common non-component properties
                                    if (['id', 'name', 'type', 'active', 'enabled', 'visible'].includes(key)) {
                                        return;
                                    }
                                    
                                    if (value && typeof value === 'object') {
                                        const normalizedName = key.endsWith('Component') ? 
                                            key : key + 'Component';
                                        components[normalizedName] = Object.keys(value);
                                        
                                        window.capturedECS.components[normalizedName] = 
                                            window.capturedECS.components[normalizedName] || 
                                            Object.keys(value);
                                    }
                                });
                            }
                            
                            if (Object.keys(components).length > 0) {
                                result[entityId] = components;
                                
                                // Track property changes for this entity
                                result[entityId]._tracked_properties = trackPropertyChanges(entity);
                            }
                        }
                    });
                } else if (typeof window.entities === 'object') {
                    // Process object/map of entities
                    Object.entries(window.entities).forEach(([entityId, entity]) => {
                        if (entity && typeof entity === 'object') {
                            const components = {};
                            
                            // Extract components directly from entity.components
                            if (entity.components && typeof entity.components === 'object') {
                                Object.entries(entity.components).forEach(([compName, compValue]) => {
                                    if (compValue && typeof compValue === 'object') {
                                        const normalizedName = compName.endsWith('Component') ? 
                                            compName : compName + 'Component';
                                        components[normalizedName] = Object.keys(compValue);
                                        
                                        window.capturedECS.components[normalizedName] = 
                                            window.capturedECS.components[normalizedName] || 
                                            Object.keys(compValue);
                                    }
                                });
                            } else {
                                // Try alternate component access approaches
                                Object.entries(entity).forEach(([key, value]) => {
                                    // Skip common non-component properties
                                    if (['id', 'name', 'type', 'active', 'enabled', 'visible'].includes(key)) {
                                        return;
                                    }
                                    
                                    if (value && typeof value === 'object') {
                                        const normalizedName = key.endsWith('Component') ? 
                                            key : key + 'Component';
                                        components[normalizedName] = Object.keys(value);
                                        
                                        window.capturedECS.components[normalizedName] = 
                                            window.capturedECS.components[normalizedName] || 
                                            Object.keys(value);
                                    }
                                });
                            }
                            
                            if (Object.keys(components).length > 0) {
                                result[entityId] = components;
                                
                                // Track property changes for this entity
                                result[entityId]._tracked_properties = trackPropertyChanges(entity);
                            }
                        }
                    });
                }
                
                // Store the extracted entities in capturedECS
                window.capturedECS.entities = Object.assign({}, window.capturedECS.entities, result);
                
                // Store entity snapshot to track changes over time
                // Store a deep copy to make sure we capture the state at this moment
                try {
                    // Instead of copying window.entities, we use our processed result which includes tracked properties
                    window.capturedECS.entity_snapshots.push({
                        timestamp: Date.now(),
                        entities: JSON.parse(JSON.stringify(result))
                    });
                    
                    // Keep only the last 5 snapshots to avoid memory issues
                    if (window.capturedECS.entity_snapshots.length > 5) {
                        window.capturedECS.entity_snapshots.shift();
                    }
                } catch (e) {
                    console.error("Failed to create entity snapshot:", e);
                }
                
                return result;
            };
            
            // Find component definitions in the global scope
            window.findComponentDefinitions = function() {
                const componentDefs = {};
                
                // Look for functions that define components
                for (const key in window) {
                    // Look for functions that create components
                    if (typeof window[key] === 'function') {
                        const fnString = window[key].toString();
                        // Check if function name or string contents suggest it creates components
                        if (key.match(/^(create|make|build)\w*Component$/i) || 
                            key.endsWith('Component') ||
                            fnString.includes('components') || 
                            fnString.includes('Component')) {
                            
                            componentDefs[key] = {
                                type: 'function',
                                source: fnString.substring(0, 100) + '...' // Store beginning of function
                            };
                        }
                    }
                }
                
                window.capturedECS.componentDefinitions = componentDefs;
                return componentDefs;
            };
            
            // Simplified systems capture 
            window.captureSystems = function() {
                const systems = {};
                
                // Look for common system containers and patterns
                const systemContainers = [
                    window.systems,
                    window.game?.systems,
                    window.world?.systems,
                    window.systemManager?.systems,
                    // Add more common patterns
                    window.game?.systemManager?.systems,
                    window.ecs?.systems,
                    window.engine?.systems
                ];
                
                // Also look for individual system objects in global scope
                for (const key in window) {
                    if (key.endsWith('System') && typeof window[key] === 'object') {
                        const system = window[key];
                        systems[key] = {
                            update: typeof system.update === 'function',
                            properties: Object.keys(system).filter(k => 
                                typeof system[k] !== 'function' && !['id', 'name', 'type'].includes(k)
                            )
                        };
                    }
                }
                
                // Process system containers
                for (const container of systemContainers) {
                    if (Array.isArray(container)) {
                        container.forEach((system, index) => {
                            if (system && typeof system === 'object') {
                                const systemId = system.id || system.name || system.type || `system_${index}`;
                                systems[systemId] = {
                                    update: typeof system.update === 'function',
                                    properties: Object.keys(system).filter(k => 
                                        typeof system[k] !== 'function' && !['id', 'name', 'type'].includes(k)
                                    )
                                };
                            }
                        });
                    } else if (container && typeof container === 'object') {
                        Object.entries(container).forEach(([systemId, system]) => {
                            if (system && typeof system === 'object') {
                                systems[systemId] = {
                                    update: typeof system.update === 'function',
                                    properties: Object.keys(system).filter(k => 
                                        typeof system[k] !== 'function' && !['id', 'name', 'type'].includes(k)
                                    )
                                };
                            }
                        });
                    }
                }
                
                window.capturedECS.systems = Object.assign({}, window.capturedECS.systems, systems);
                return systems;
            };

            window.setSlowMo = function(enabled) {
                // Store original update functions if they exist
                if (typeof window.game !== 'undefined') {
                    if (!window._originalUpdate && window.game.update) {
                        window._originalUpdate = window.game.update;
                    }
                    if (enabled && window._originalUpdate) {
                        // Completely stop updates instead of slowing down
                        window.game.update = function(dt) { return; };
                    } else if (!enabled && window._originalUpdate) {
                        window.game.update = window._originalUpdate;
                    }
                }
                
                // Handle time scale if it exists
                if (typeof window.game !== 'undefined') {
                    if (window.game.timeScale !== undefined) {
                        window.game.timeScale = enabled ? 0 : 1.0;  // Use 0 instead of 0.1
                    }
                    if (window.game.time?.timeScale !== undefined) {
                        window.game.time.timeScale = enabled ? 0 : 1.0;  // Use 0 instead of 0.1
                    }
                }
                
                // Handle requestAnimationFrame
                if (enabled) {
                    if (!window._originalRAF) {
                        window._originalRAF = window.requestAnimationFrame;
                        // Don't execute the callback at all instead of slowing it down
                        window.requestAnimationFrame = () => undefined;
                    }
                } else if (window._originalRAF) {
                    window.requestAnimationFrame = window._originalRAF;
                    window._originalRAF = null;
                }
                
                window._slowMoEnabled = enabled;
            };
        """)
        
    async def _save_screenshot(self, page: Page, directory: str, filename: str) -> str:
        """Save a screenshot and return the path."""
        try:
            full_path = os.path.join(directory, filename)
            await page.screenshot(path=full_path)
            logging.info(f"Screenshot saved to {full_path}")
            return full_path
        except Exception as e:
            logging.error(f"Error saving screenshot: {e}")
            return ""
            
    async def capture_continuous_screenshots(self, page: Page, directory: str, duration: int) -> List[str]:
        """
        Capture screenshots continuously for a specified duration while interacting with the game.
        
        Args:
            page: Playwright page object
            directory: Directory to save screenshots
            duration: Duration in seconds to capture screenshots
            
        Returns:
            List of screenshot file paths
        """
        screenshot_paths = []
        screenshot_interval = 5  # Capture every 5 seconds
        start_time = time.time()
        last_screenshot_time = start_time
        
        # Define interaction patterns to keep the game active
        interaction_patterns = [
            # Right key press for 500ms
            {"keys": ["ArrowRight"], "duration": 500},
            # Left key press for 500ms
            {"keys": ["ArrowLeft"], "duration": 500},
            # Up and space together
            {"keys": ["ArrowUp", " "], "duration": 300},
            # Single keypress sequence
            {"keys": ["a", "d", "w", "s"], "duration": 200}
        ]
        
        pattern_index = 0
        interaction_interval = 3  # Apply interaction every 3 seconds
        last_interaction_time = start_time
        
        logging.info(f"Starting continuous capture for {duration} seconds")
        
        while time.time() - start_time < duration:
            current_time = time.time()
            
            # Take screenshot at regular intervals
            if current_time - last_screenshot_time >= screenshot_interval:
                timestamp = int(current_time)
                screenshot_path = await self._save_screenshot(
                    page, directory, f"gameplay_{timestamp}.png"
                )
                if screenshot_path:
                    screenshot_paths.append(screenshot_path)
                    last_screenshot_time = current_time
                    
                # Extract entities after each screenshot
                try:
                    await page.evaluate("window.extractEntitiesFromGlobal()")
                except Exception as e:
                    logging.debug(f"Error extracting entities: {e}")
            
            # Apply interaction pattern at intervals
            if current_time - last_interaction_time >= interaction_interval:
                pattern = interaction_patterns[pattern_index % len(interaction_patterns)]
                pattern_index += 1
                
                try:
                    # Apply the current interaction pattern
                    for key in pattern["keys"]:
                        # Press and hold keys
                        await page.keyboard.down(key)
                    
                    # Hold for specified duration
                    await page.wait_for_timeout(pattern["duration"])
                    
                    # Release all keys
                    for key in pattern["keys"]:
                        await page.keyboard.up(key)
                        
                    logging.debug(f"Applied interaction pattern: {pattern['keys']}")
                    last_interaction_time = current_time
                except Exception as e:
                    logging.debug(f"Error applying interaction pattern: {e}")
            
            # Sleep a short time to avoid busy waiting
            await asyncio.sleep(0.1)
            
        logging.info(f"Continuous capture complete. Captured {len(screenshot_paths)} screenshots")
        return screenshot_paths
        
    async def _interact_with_game(self, page: Page, runtime_ecs_data: Dict[str, Any], screenshots_dir: str) -> Dict[str, Any]:
        """
        Interacts with the game to extract ECS information.
        
        Args:
            page: Playwright page object
            runtime_ecs_data: Dictionary to store extracted data
            screenshots_dir: Directory to save screenshots
            
        Returns:
            Updated runtime_ecs_data
        """
        # Setup for periodic screenshots
        runtime_ecs_data["screenshots"] = []
        last_screenshot_time = time.time()
        screenshot_interval = 5  # Take a screenshot every 5 seconds
        
        # Find canvas elements
        try:
            logging.info("Looking for game canvas")
            canvas_info = await page.evaluate("""() => {
                const canvases = Array.from(document.querySelectorAll('canvas'));
                return canvases.map((canvas, index) => {
                    return {
                        index: index,
                        id: canvas.id || '',
                        classes: canvas.className || '',
                        width: canvas.width,
                        height: canvas.height,
                        selector: canvas.id ? `#${canvas.id}` : 
                                 canvas.className ? `.${canvas.className.split(' ')[0]}` : 
                                 `canvas:nth-of-type(${index + 1})`
                    };
                });
            }""")
            
            if canvas_info and len(canvas_info) > 0:
                logging.info(f"Found {len(canvas_info)} canvas elements")
                
                # Use the first canvas for interaction
                main_canvas = canvas_info[0]
                canvas_selector = main_canvas["selector"]
                logging.info(f"Using canvas selector: {canvas_selector}")
                
                # Focus and interact with the canvas
                canvas_element = page.locator(canvas_selector)
                if await canvas_element.count() > 0:
                    # Click to focus
                    await canvas_element.click()
                    await page.wait_for_timeout(500)
                    
                    # Take periodic screenshot
                    current_time = time.time()
                    if current_time - last_screenshot_time >= screenshot_interval:
                        screenshot_path = await self._save_screenshot(
                            page, 
                            screenshots_dir, 
                            f"gameplay_{int(current_time)}.png"
                        )
                        if screenshot_path:
                            runtime_ecs_data["screenshots"].append(screenshot_path)
                        last_screenshot_time = current_time
                    
                    # Extract entities from the global variable
                    logging.info("Extracting entities from global variable")
                    await page.evaluate("window.extractEntitiesFromGlobal()")
                    
                    # Find component definitions
                    logging.info("Finding component definitions")
                    component_defs = await page.evaluate("window.findComponentDefinitions()")
                    if component_defs:
                        runtime_ecs_data["component_definitions"] = component_defs
                        logging.info(f"Found {len(component_defs)} component definitions")
                    
                    # Simulate key presses for common game interactions
                    await self._simulate_key_presses(page, screenshots_dir, runtime_ecs_data)
                    
                    # Capture systems
                    systems_data = await page.evaluate("window.captureSystems()")
                    if systems_data:
                        runtime_ecs_data["systems"] = systems_data
                        logging.info(f"Captured {len(systems_data)} systems")
                        
                    # Take multiple snapshots to capture entity changes over time
                    for i in range(3):
                        logging.info(f"Taking entity snapshot {i+1}/3")
                        await page.evaluate("window.extractEntitiesFromGlobal()")
                        await page.wait_for_timeout(1000)  # Wait between snapshots
                        
                        # Take periodic screenshot during snapshots
                        current_time = time.time()
                        if current_time - last_screenshot_time >= screenshot_interval:
                            screenshot_path = await self._save_screenshot(
                                page, 
                                screenshots_dir, 
                                f"gameplay_{int(current_time)}.png"
                            )
                            if screenshot_path:
                                runtime_ecs_data["screenshots"].append(screenshot_path)
                            last_screenshot_time = current_time
                else:
                    logging.info("No canvas elements found")
        except Exception as canvas_err:
            logging.warning(f"Error handling canvas: {canvas_err}")
        
        # Get final entity data with snapshots for time-varying analysis
        try:
            extracted_entities = await self._get_entities_from_global(page)
            if extracted_entities.get("found"):
                logging.info(f"Extracted {extracted_entities['count']} entities from global variable")
                
                # Update our result data
                runtime_ecs_data["entities"] = extracted_entities.get("entityDetails", {})
                
                # Extract components from entities
                for entity_components in runtime_ecs_data["entities"].values():
                    for comp_name, props in entity_components.items():
                        if comp_name not in runtime_ecs_data["components"]:
                            runtime_ecs_data["components"][comp_name] = props
                
                # Include entity snapshots if available
                if extracted_entities.get("snapshots"):
                    runtime_ecs_data["entity_snapshots"] = extracted_entities.get("snapshots")
                    logging.info(f"Captured {len(runtime_ecs_data['entity_snapshots'])} entity snapshots")
        except Exception as e:
            logging.error(f"Error extracting entity data: {e}")
            runtime_ecs_data["errors"].append(f"Entity extraction error: {e}")
            
        return runtime_ecs_data
        
    async def _simulate_key_presses(self, page: Page, screenshots_dir: str = None, runtime_ecs_data: Dict[str, Any] = None):
        """Simulate key presses to interact with the game."""
        # Track screenshot timing
        last_screenshot_time = time.time()
        screenshot_interval = 5  # Take a screenshot every 5 seconds
        
        # Common game start/interaction keys
        interaction_keys = [
            "Enter", " ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", 
            "w", "a", "s", "d"
        ]
        
        for key in interaction_keys:
            try:
                # Send key directly to the canvas
                await page.keyboard.press(key)
                logging.info(f"Sent key: {key}")
                await page.wait_for_timeout(500)
                
                # Take periodic screenshot during key presses
                if screenshots_dir and runtime_ecs_data:
                    current_time = time.time()
                    if current_time - last_screenshot_time >= screenshot_interval:
                        screenshot_path = await self._save_screenshot(
                            page, 
                            screenshots_dir, 
                            f"gameplay_key_{key}_{int(current_time)}.png"
                        )
                        if screenshot_path:
                            runtime_ecs_data["screenshots"].append(screenshot_path)
                        last_screenshot_time = current_time
                
                # Extract entities after each key interaction
                await page.evaluate("window.extractEntitiesFromGlobal()")
            except Exception as key_err:
                logging.debug(f"Error sending key {key}: {key_err}")
                
        # Try more complex key sequences
        key_sequences = [
            {"key": "ArrowRight", "duration": 800},
            {"key": "ArrowLeft", "duration": 800},
            {"key": " ", "duration": 300},
        ]
        
        for seq in key_sequences:
            try:
                logging.info(f"Testing key sequence: {seq['key']}")
                
                # Press the key and hold it
                await page.keyboard.down(seq["key"])
                await page.wait_for_timeout(seq["duration"])
                await page.keyboard.up(seq["key"])
                await page.wait_for_timeout(200)
                
                # Take periodic screenshot during key sequences
                if screenshots_dir and runtime_ecs_data:
                    current_time = time.time()
                    if current_time - last_screenshot_time >= screenshot_interval:
                        screenshot_path = await self._save_screenshot(
                            page, 
                            screenshots_dir, 
                            f"gameplay_seq_{seq['key']}_{int(current_time)}.png"
                        )
                        if screenshot_path:
                            runtime_ecs_data["screenshots"].append(screenshot_path)
                        last_screenshot_time = current_time
                
                # Extract entities after the key sequence
                await page.evaluate("window.extractEntitiesFromGlobal()")
            except Exception as seq_err:
                logging.error(f"Error with key sequence {seq['key']}: {seq_err}")
        
    async def _get_entities_from_global(self, page: Page) -> Dict[str, Any]:
        """Extract entities from global JavaScript variables."""
        # Execute the extraction
        return await page.evaluate("""() => {
            // Check for global entities variable
            // Try to access entities directly first
            if (typeof entities !== 'undefined') {
                console.log("Found entities directly in global scope");
                
                // Store entities in our capture structure
                if (Array.isArray(entities)) {
                    entities.forEach((entity, index) => {
                        if (entity && typeof entity === 'object') {
                            const entityId = entity.id || entity.name || entity.type || `entity_${index}`;
                            window.capturedECS.entities[entityId] = entity.components || {};
                            
                            // Extract component names from the entity
                            if (entity.components) {
                                Object.keys(entity.components).forEach(compName => {
                                    window.capturedECS.components[compName] = true;
                                });
                            }
                        }
                    });
                } else if (typeof entities === 'object') {
                    Object.entries(entities).forEach(([id, entity]) => {
                        if (entity && typeof entity === 'object') {
                            window.capturedECS.entities[id] = entity.components || {};
                            
                            // Extract component names from the entity
                            if (entity.components) {
                                Object.keys(entity.components).forEach(compName => {
                                    window.capturedECS.components[compName] = true;
                                });
                            }
                        }
                    });
                }
                
                // Return info about extracted entities
                return {
                    found: true,
                    count: Object.keys(window.capturedECS.entities).length,
                    entitySample: Object.keys(window.capturedECS.entities).slice(0, 5),
                    componentsSample: Object.keys(window.capturedECS.components),
                    entityDetails: window.capturedECS.entities,
                    snapshots: window.capturedECS.entity_snapshots
                };
            } else if (window.entities) {
                // Fall back to window.entities if direct access fails
                window.extractEntitiesFromGlobal();
                
                return {
                    found: true,
                    count: Object.keys(window.capturedECS.entities).length,
                    entitySample: Object.keys(window.capturedECS.entities).slice(0, 5),
                    componentsSample: Object.keys(window.capturedECS.components),
                    entityDetails: window.capturedECS.entities,
                    snapshots: window.capturedECS.entity_snapshots
                };
            } else {
                // Try looking for entities in common game objects
                const gameObjects = [
                    window.game?.entities,
                    window.world?.entities,
                    window.entityManager?.entities,
                    window.scene?.entities,
                    window.ecs?.entities
                ];
                
                for (const entityContainer of gameObjects) {
                    if (entityContainer) {
                        console.log("Found entities in game object");
                        window.entities = entityContainer; // Set for our extraction function
                        window.extractEntitiesFromGlobal();
                        break;
                    }
                }
                
                // Check if we found any entities
                if (Object.keys(window.capturedECS.entities).length > 0) {
                    return {
                        found: true,
                        count: Object.keys(window.capturedECS.entities).length,
                        entitySample: Object.keys(window.capturedECS.entities).slice(0, 5),
                        componentsSample: Object.keys(window.capturedECS.components),
                        entityDetails: window.capturedECS.entities,
                        snapshots: window.capturedECS.entity_snapshots
                    };
                }
            }
            return { found: false };
        }""")
    
    async def check_entities_frozen(self, page: Page) -> bool:
        """
        Checks if entities are frozen by comparing their state across multiple snapshots.
        
        Args:
            page: Playwright page object
            
        Returns:
            True if entities appear to be frozen, False otherwise
        """
        try:
            # Take multiple snapshots using the existing extraction method
            snapshots = []
            for i in range(3):  # Take 3 snapshots
                extracted = await self._get_entities_from_global(page)
                if extracted and extracted.get("found"):
                    logging.info(f"Snapshot {i + 1}: Found {extracted['count']} entities")
                    snapshots.append(extracted.get("entityDetails", {}))
                else:
                    logging.warning(f"Snapshot {i + 1}: No entities found")
                await page.wait_for_timeout(1000)
                
            # Compare snapshots
            if not snapshots[0]:  # No entities found
                logging.warning("No entities found in snapshots")
                return False
                
            # Compare consecutive snapshots
            for i in range(len(snapshots) - 1):
                snapshot1 = snapshots[i]
                snapshot2 = snapshots[i + 1]
                
                # Compare each entity's state
                for entity_id in snapshot1:
                    if entity_id not in snapshot2:
                        logging.warning(f"Entity {entity_id} disappeared between snapshots {i+1} and {i+2}")
                        return False
                        
                    # Compare positions with small threshold
                    pos1 = snapshot1[entity_id].get("position", {})
                    pos2 = snapshot2[entity_id].get("position", {})
                    dx = abs(pos1.get("x", 0) - pos2.get("x", 0))
                    dy = abs(pos1.get("y", 0) - pos2.get("y", 0))
                    
                    if dx > 0.1 or dy > 0.1:  # Allow small movement threshold
                        logging.warning(
                            f"""
Entity {entity_id} moved between snapshots {i+1} and {i+2}:
Previous position: (x={pos1.get('x', 0)}, y={pos1.get('y', 0)})
Current position: (x={pos2.get('x', 0)}, y={pos2.get('y', 0)})
Movement delta: (dx={dx}, dy={dy})
"""
                        )
                        return False
                        
            logging.info("All entities remained frozen across snapshots")
            return True
            
        except Exception as e:
            logging.error(f"Error checking if entities are frozen: {e}")
            return False

    async def analyze_game_with_continuous_recording(self, timeout: int = 60, recording_duration: int = 30) -> Dict[str, Any]:
        """
        Analyzes the game with continuous recording of gameplay via screenshots.
        
        Args:
            timeout: Maximum time to wait for game initialization
            recording_duration: Duration in seconds to record gameplay
            
        Returns:
            Dictionary with dynamically discovered ECS elements and gameplay screenshots
        """
        if not self.enabled:
            return {"error": "Headless browser not enabled. Install playwright."}
            
        if not self.is_html_file and not self.server_process:
            return {"error": "Server not running. Use within 'async with' context."}
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
        
        runtime_ecs_data = {"entities": {}, "components": {}, "systems": {}, "errors": [], "screenshots": []}
        screenshots_dir = os.path.join(self.game_path, "metrics_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        logging.info(f"Starting game analysis with {recording_duration}s continuous recording")
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True, slow_mo=1000)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Add JavaScript hooks to capture ECS data
            await self._add_js_hooks(page)
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle")
                logging.info(f"Page loaded: {url}")
                
                # Wait for the game to initialize
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_screenshot = await self._save_screenshot(page, screenshots_dir, "game_initial_state.png")
                if initial_screenshot:
                    runtime_ecs_data["screenshots"].append(initial_screenshot)
                
                # Identify and interact with the canvas briefly
                canvas_info = await page.evaluate("""() => {
                    const canvases = Array.from(document.querySelectorAll('canvas'));
                    return canvases.map((canvas, index) => {
                        return {
                            index: index,
                            id: canvas.id || '',
                            classes: canvas.className || '',
                            width: canvas.width,
                            height: canvas.height,
                            selector: canvas.id ? `#${canvas.id}` : 
                                     canvas.className ? `.${canvas.className.split(' ')[0]}` : 
                                     `canvas:nth-of-type(${index + 1})`
                        };
                    });
                }""")
                
                if canvas_info and len(canvas_info) > 0:
                    logging.info(f"Found {len(canvas_info)} canvas elements")
                    
                    # Focus on the canvas
                    main_canvas = canvas_info[0]
                    canvas_selector = main_canvas["selector"]
                    canvas_element = page.locator(canvas_selector)
                    if await canvas_element.count() > 0:
                        await canvas_element.click()
                        
                        # Start the game with a few key presses
                        for key in ["Enter", " ", "ArrowRight"]:
                            try:
                                await page.keyboard.press(key)
                                await page.wait_for_timeout(300)
                            except Exception:
                                pass
                        
                        # Now start continuous recording
                        logging.info(f"Starting continuous recording for {recording_duration} seconds")
                        continuous_screenshots = await self.capture_continuous_screenshots(
                            page, screenshots_dir, recording_duration
                        )
                        runtime_ecs_data["screenshots"].extend(continuous_screenshots)
                        logging.info(f"Captured {len(continuous_screenshots)} continuous screenshots")
                        
                        # After recording, extract ECS data
                        component_defs = await page.evaluate("window.findComponentDefinitions()")
                        if component_defs:
                            runtime_ecs_data["component_definitions"] = component_defs
                            
                        systems_data = await page.evaluate("window.captureSystems()")
                        if systems_data:
                            runtime_ecs_data["systems"] = systems_data
                else:
                    logging.warning("No canvas elements found for game interaction")
                    
                # Take a final screenshot
                final_screenshot = await self._save_screenshot(page, screenshots_dir, "game_final_state.png")
                if final_screenshot:
                    runtime_ecs_data["screenshots"].append(final_screenshot)
                    
                # Get entity data
                extracted_entities = await self._get_entities_from_global(page)
                if extracted_entities.get("found"):
                    runtime_ecs_data["entities"] = extracted_entities.get("entityDetails", {})
                    
                    # Extract components from entities
                    for entity_components in runtime_ecs_data["entities"].values():
                        for comp_name, props in entity_components.items():
                            if comp_name not in runtime_ecs_data["components"]:
                                runtime_ecs_data["components"][comp_name] = props
                    
                    if extracted_entities.get("snapshots"):
                        runtime_ecs_data["entity_snapshots"] = extracted_entities.get("snapshots")
                        
                # Get final capturedECS data
                final_data = await page.evaluate("window.capturedECS")
                if final_data:
                    # Update with any additional data from capturedECS
                    for key in ["components", "systems"]:
                        if key in final_data and key in runtime_ecs_data:
                            runtime_ecs_data[key].update(final_data[key])
                    
            except Exception as e:
                logging.error(f"Error in continuous game analysis: {e}")
                runtime_ecs_data["errors"].append(f"Continuous analysis error: {e}")
            finally:
                await browser.close()
            
        # Add screenshot metadata
        if runtime_ecs_data["screenshots"]:
            runtime_ecs_data["screenshot_count"] = len(runtime_ecs_data["screenshots"])
            runtime_ecs_data["screenshot_interval"] = 5  # seconds
            
        return runtime_ecs_data


async def extract_runtime_ecs_data(
    game_path: str, 
    port: int = 8000, 
    timeout: int = 60,
    capture_baseline: bool = False,
    capture_action: bool = False
) -> Dict[str, Any]:
    """
    Starts a lightweight server and extracts ECS information from the running game.
    
    Args:
        game_path: Path to the directory containing the game files
        port: Port to use for the server
        timeout: Timeout in seconds for the browser interaction
        capture_baseline: If True, marks this as a baseline capture for playability testing
        capture_action: If True, marks this as a post-action capture for playability testing
        
    Returns:
        Dictionary with dynamically discovered ECS elements
    """
    if not HEADLESS_BROWSER_ENABLED:
        return {
            "error": "Playwright not installed. Run 'pip install playwright && python -m playwright install --with-deps chromium'"
        }
        
    async with BrowserController(game_path, port) as browser:
        result = await browser.analyze_game(timeout)
        
        # Add metadata for playability testing
        if capture_baseline:
            result["_meta"] = result.get("_meta", {})
            result["_meta"]["capture_type"] = "baseline"
            result["_meta"]["capture_time"] = time.time()
            
        if capture_action:
            result["_meta"] = result.get("_meta", {})
            result["_meta"]["capture_type"] = "post_action"
            result["_meta"]["capture_time"] = time.time()
            
        return result

async def extract_runtime_ecs_data_with_recording(
    game_path: str, 
    recording_duration: int = 30, 
    port: int = 8000, 
    timeout: int = 60
) -> Dict[str, Any]:
    """
    Starts a lightweight server and extracts ECS information from the running game,
    with continuous recording of gameplay via screenshots.
    
    Args:
        game_path: Path to the directory containing the game files
        recording_duration: Duration in seconds to record gameplay
        port: Port to use for the server
        timeout: Timeout in seconds for the browser interaction
        
    Returns:
        Dictionary with dynamically discovered ECS elements and gameplay screenshots
    """
    if not HEADLESS_BROWSER_ENABLED:
        return {
            "error": "Playwright not installed. Run 'pip install playwright && python -m playwright install --with-deps chromium'"
        }
        
    async with BrowserController(game_path, port) as browser:
        return await browser.analyze_game_with_continuous_recording(timeout, recording_duration) 