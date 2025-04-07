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
        
    async def __aenter__(self):
        if not self.enabled:
            logging.warning("Headless browser is not enabled. Install playwright with: "
                           "pip install playwright && python -m playwright install --with-deps chromium")
            return self
            
        try:
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
            
        if not self.server_process:
            return {"error": "Server not running. Use within 'async with' context."}
            
        url = f"http://localhost:{self.port}"
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
                
                # Identify and interact with game canvas
                runtime_ecs_data = await self._interact_with_game(page, runtime_ecs_data)
                
                # Take a screenshot for reference
                try:
                    screenshots_dir = os.path.join(self.game_path, "metrics_results", "screenshots")
                    os.makedirs(screenshots_dir, exist_ok=True)
                    await page.screenshot(path=os.path.join(screenshots_dir, "game_final_state.png"))
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
                systems: {}
            };
            
            // Hook to directly extract entities from the global entities variable
            window.extractEntitiesFromGlobal = function() {
                const result = {};
                
                if (!window.entities) return result;
                
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
                            }
                            
                            if (Object.keys(components).length > 0) {
                                result[entityId] = components;
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
                            }
                            
                            if (Object.keys(components).length > 0) {
                                result[entityId] = components;
                            }
                        }
                    });
                }
                
                // Store the extracted entities in capturedECS
                window.capturedECS.entities = Object.assign({}, window.capturedECS.entities, result);
                return result;
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
        
    async def _interact_with_game(self, page: Page, runtime_ecs_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interacts with the game to extract ECS information.
        
        Args:
            page: Playwright page object
            runtime_ecs_data: Dictionary to store extracted data
            
        Returns:
            Updated runtime_ecs_data
        """
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
                    
                    # Extract entities from the global variable
                    logging.info("Extracting entities from global variable")
                    await page.evaluate("window.extractEntitiesFromGlobal()")
                    
                    # Simulate key presses for common game interactions
                    await self._simulate_key_presses(page)
                    
                    # Capture systems
                    systems_data = await page.evaluate("window.captureSystems()")
                    if systems_data:
                        runtime_ecs_data["systems"] = systems_data
                        logging.info(f"Captured {len(systems_data)} systems")
            else:
                logging.info("No canvas elements found")
        except Exception as canvas_err:
            logging.warning(f"Error handling canvas: {canvas_err}")
            
        # Direct extraction from global entities
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
                        
        return runtime_ecs_data
        
    async def _simulate_key_presses(self, page: Page):
        """Simulate key presses to interact with the game."""
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
                    entityDetails: window.capturedECS.entities
                };
            } else if (window.entities) {
                // Fall back to window.entities if direct access fails
                window.extractEntitiesFromGlobal();
                
                return {
                    found: true,
                    count: Object.keys(window.capturedECS.entities).length,
                    entitySample: Object.keys(window.capturedECS.entities).slice(0, 5),
                    componentsSample: Object.keys(window.capturedECS.components),
                    entityDetails: window.capturedECS.entities
                };
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


async def extract_runtime_ecs_data(game_path: str, port: int = 8000, timeout: int = 60) -> Dict[str, Any]:
    """
    Starts a lightweight server and extracts ECS information from the running game.
    
    Args:
        game_path: Path to the directory containing the game files
        port: Port to use for the server
        timeout: Timeout in seconds for the browser interaction
        
    Returns:
        Dictionary with dynamically discovered ECS elements
    """
    if not HEADLESS_BROWSER_ENABLED:
        return {
            "error": "Playwright not installed. Run 'pip install playwright && python -m playwright install --with-deps chromium'"
        }
        
    async with BrowserController(game_path, port) as browser:
        return await browser.analyze_game(timeout) 