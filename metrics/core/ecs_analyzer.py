import os
import json
import logging
import re
import time
import sys
from typing import Dict, List, Any, Set, Optional, Tuple
from collections import defaultdict

# Import from core modules
from metrics.core.ast_parser import extract_ast_from_js
from metrics.utils.visualization import create_ecs_graph, visualize_ecs_graph, VISUALIZATION_ENABLED

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

class ECSStructure:
    """Holds the discovered ECS elements."""

    def __init__(self):
        self.components: Dict[str, Set[str]] = defaultdict(
            set
        )  # name -> {properties accessed}
        self.entities: Dict[str, Set[str]] = defaultdict(
            set
        )  # name -> {component names}
        self.systems: Dict[str, Dict[str, Set[str]]] = defaultdict(
            lambda: {"reads": set(), "writes": set()}
        )  # name -> {"reads":{comps}, "writes":{comps}}
        self.component_defs: Set[str] = (
            set()
        )  # Functions/classes likely defining components
        self.entity_defs: Set[str] = set()  # Functions/classes likely defining entities
        self.system_defs: Set[str] = set()  # Functions likely defining systems
        self.errors: List[str] = []


def _is_component_creation(node: Dict) -> Optional[str]:
    """Check if node represents component creation (function call or new). Returns component name."""
    if node.get("type") == "CallExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and re.match(
            r"^(create|make|build)\w*Component$", callee.get("name", ""), re.IGNORECASE
        ):
            return callee["name"]
    elif node.get("type") == "NewExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and callee.get("name", "").endswith(
            "Component"
        ):
            return callee["name"]
    return None


def _is_entity_creation(node: Dict) -> Optional[str]:
    """Check if node represents entity creation. Returns entity type name."""
    if node.get("type") == "CallExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and re.match(
            r"^create\w*Entity$", callee.get("name", ""), re.IGNORECASE
        ):
            # Extract the part between 'create' and 'Entity'
            match = re.match(
                r"^create(\w*)Entity$", callee.get("name", ""), re.IGNORECASE
            )
            return (
                match.group(1) + "Entity"
                if match and match.group(1)
                else callee["name"]
            )
    elif node.get("type") == "NewExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and callee.get("name", "").endswith(
            "Entity"
        ):
            return callee["name"]

    # Also check for simple object literals assigned to variables ending in Entity
    # This requires context (parent node), complex to do perfectly here.
    # Example: let playerEntity = { components: {...} };
    if node.get("type") == "VariableDeclarator" and node.get("id") and node.get("init"):
        if node["id"].get("type") == "Identifier" and node["id"].get(
            "name", ""
        ).endswith("Entity"):
            if node["init"].get("type") == "ObjectExpression" and any(
                p.get("key", {}).get("name") == "components"
                for p in node["init"].get("properties", [])
            ):
                return node["id"]["name"]

    return None


def _extract_member_expression_parts(node: Dict) -> List[str]:
    """Recursively extracts parts of a MemberExpression (e.g., entity.components.position.x -> ['entity', 'components', 'position', 'x'])."""
    parts = []
    if node.get("type") == "MemberExpression":
        obj = node.get("object")
        prop = node.get("property")
        if obj:
            parts.extend(_extract_member_expression_parts(obj))
        if prop and prop.get("type") == "Identifier":
            parts.append(prop.get("name", ""))
        elif prop and prop.get("type") == "Literal":  # Handle obj["property"]
            parts.append(str(prop.get("value", "")))

    elif node.get("type") == "Identifier":
        parts.append(node.get("name", ""))
    return parts


def _analyze_system_body(node: Dict, system_name: str, structure: ECSStructure):
    """Recursively analyze nodes within a system function to find component access."""
    if not isinstance(node, dict):
        return

    component_access_pattern = re.compile(
        r"(\w+)\.(components|props|state)\.(\w+Component|\w+)\.?(\w+)?"
    )
    # More flexible pattern: matches things like
    # entity.components.positionComponent.x
    # player.components.health.hp
    # state.props.transformComponent.y

    # Check for MemberExpression (e.g., entity.components.position.x)
    if node.get("type") == "MemberExpression":
        full_access = ".".join(_extract_member_expression_parts(node))
        match = component_access_pattern.search(full_access)
        if match:
            # base_var = match.group(1) # e.g., entity, player, state
            # prop_container = match.group(2) # e.g., components, props, state
            component_name = match.group(3)  # e.g., positionComponent, health
            property_name = match.group(4)  # ee.g., x, hp (optional)

            # Normalize component name (heuristic: add Component if missing)
            if not component_name.endswith("Component"):
                component_name += "Component"

            # Determine if it's a read or write
            # Rough heuristic: if it's the left side of an assignment, it's a write.
            parent = node.get(
                "_parent"
            )  # Assume parent reference is added during traversal
            is_write = False
            if (
                parent
                and parent.get("type") == "AssignmentExpression"
                and parent.get("left") == node
            ):
                is_write = True
            elif parent and parent.get("type") == "UpdateExpression":  # e.g. score++
                is_write = True

            if is_write:
                structure.systems[system_name]["writes"].add(component_name)
            else:
                structure.systems[system_name]["reads"].add(component_name)

            # Record the component and property accessed
            if property_name:
                structure.components[component_name].add(property_name)
            else:
                structure.components[
                    component_name
                ]  # Ensure component exists even if no prop accessed

    # Recursively check children, passing parent context
    for key, value in node.items():
        if key == "_parent":
            continue  # Avoid circular traversal
        if isinstance(value, dict):
            value["_parent"] = node  # Add parent reference
            _analyze_system_body(value, system_name, structure)
            del value["_parent"]  # Clean up parent reference
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    item["_parent"] = node
                    _analyze_system_body(item, system_name, structure)
                    del item["_parent"]


def traverse_ast(node: Dict, structure: ECSStructure):
    """Recursively traverses the AST to find ECS patterns."""
    if not isinstance(node, dict):
        return

    node_type = node.get("type")

    # --- Identify Definitions ---
    if node_type == "FunctionDeclaration":
        func_name = node.get("id", {}).get("name", "")
        if func_name:
            if re.match(
                r"^(create|make|build)\w*Component$", func_name, re.IGNORECASE
            ) or func_name.endswith("Component"):
                structure.component_defs.add(func_name)
                structure.components[func_name]  # Ensure it's listed
            elif re.match(
                r"^(create|make|build)\w*Entity$", func_name, re.IGNORECASE
            ) or func_name.endswith("Entity"):
                structure.entity_defs.add(func_name)
                # Try to extract components created within the factory
                # TODO: Add analysis of function body here
            elif func_name.endswith("System"):
                structure.system_defs.add(func_name)
                # Analyze system body for component usage
                if node.get("body"):
                    _analyze_system_body(node["body"], func_name, structure)

    elif node_type == "VariableDeclarator":
        var_name = node.get("id", {}).get("name", "")
        init_node = node.get("init")
        if var_name and init_node:
            # Check if assigning a component/entity creation function result
            comp_name = _is_component_creation(init_node)
            if comp_name:
                structure.components[comp_name]  # Register component
            entity_type = _is_entity_creation(init_node)
            if entity_type:
                structure.entities[entity_type]  # Register entity type

            # Check if assigning an object literal that looks like an entity
            entity_type_from_literal = _is_entity_creation(
                node
            )  # Checks var name + object literal structure
            if (
                entity_type_from_literal
                and entity_type_from_literal not in structure.entities
            ):
                structure.entities[entity_type_from_literal]
                # Extract components from literal definition
                props = init_node.get("properties", [])
                components_prop = next(
                    (p for p in props if p.get("key", {}).get("name") == "components"),
                    None,
                )
                if (
                    components_prop
                    and components_prop.get("value", {}).get("type")
                    == "ObjectExpression"
                ):
                    component_assignments = components_prop["value"].get(
                        "properties", []
                    )
                    for comp_assign in component_assignments:
                        comp_key_node = comp_assign.get("key")
                        comp_val_node = comp_assign.get("value")
                        comp_name_guess = None
                        if comp_key_node and comp_key_node.get("type") == "Identifier":
                            comp_name_guess = comp_key_node.get("name")
                            if not comp_name_guess.endswith("Component"):
                                comp_name_guess += "Component"  # Heuristic

                        # Check if value is a creation call
                        created_comp_name = _is_component_creation(comp_val_node)
                        if created_comp_name:
                            structure.entities[entity_type_from_literal].add(
                                created_comp_name
                            )
                        elif comp_name_guess:  # Fallback to key name
                            structure.entities[entity_type_from_literal].add(
                                comp_name_guess
                            )
                            structure.components[
                                comp_name_guess
                            ]  # Ensure component is listed

    # Recursively process child nodes
    for key, value in node.items():
        if isinstance(value, dict):
            traverse_ast(value, structure)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    traverse_ast(item, structure)


def analyze_ecs_structure_static(
    game_path: str
) -> Tuple[ECSStructure, Dict[str, Any]]:
    """
    Analyzes JavaScript files in a directory to extract ECS structure (static analysis).

    Args:
        game_path: Path to the root directory or HTML file of the game code.

    Returns:
        A tuple containing (ECSStructure object, results dictionary)
    """
    ecs_structure = ECSStructure()
    
    # Check if the path is an HTML file or a directory
    if os.path.isfile(game_path) and game_path.lower().endswith('.html'):
        logging.info(f"Processing single HTML file: {game_path}")
        
        # For HTML files, we'll only do basic structure initialization
        # since most game logic will be in included JS files or inline scripts
        # The runtime analysis will be more useful for HTML files
        results = {
            "components": {},
            "entities": {},
            "systems": {},
            "_meta": {
                "component_definitions": [],
                "entity_definitions": [],
                "system_definitions": [],
                "errors": [],
                "analysis_modes": ["static-limited"],
            },
        }
        
        return ecs_structure, results
        
    elif not os.path.isdir(game_path):
        logging.error(f"Invalid game path: {game_path}")
        return ECSStructure(), {"error": f"Invalid game path: {game_path}"}

    js_files = []
    for root, _, files in os.walk(game_path):
        for file in files:
            if file.endswith(".js"):
                js_files.append(os.path.join(root, file))

    logging.info(f"Found {len(js_files)} JavaScript files to analyze in {game_path}")

    for js_file in js_files:
        logging.info(f"Processing: {os.path.relpath(js_file, game_path)}")
        ast = extract_ast_from_js(js_file)
        if ast:
            try:
                traverse_ast(ast, ecs_structure)
            except Exception as e:
                logging.error(
                    f"Error traversing AST for {os.path.basename(js_file)}: {e}",
                    exc_info=True,
                )
                ecs_structure.errors.append(
                    f"AST Traversal Error in {os.path.basename(js_file)}: {e}"
                )
        else:
            ecs_structure.errors.append(
                f"Parsing Failed for {os.path.basename(js_file)}"
            )

    # Prepare results dictionary
    results = {
        "components": {
            name: sorted(list(props))
            for name, props in ecs_structure.components.items()
        },
        "entities": {
            name: sorted(list(comps)) for name, comps in ecs_structure.entities.items()
        },
        "systems": {
            name: {
                "reads": sorted(list(deps["reads"])),
                "writes": sorted(list(deps["writes"])),
            }
            for name, deps in ecs_structure.systems.items()
        },
        "_meta": {  # Include definitions for context
            "component_definitions": sorted(list(ecs_structure.component_defs)),
            "entity_definitions": sorted(list(ecs_structure.entity_defs)),
            "system_definitions": sorted(list(ecs_structure.system_defs)),
            "errors": ecs_structure.errors,
            "analysis_modes": ["static"],
        },
    }

    return ecs_structure, results


def analyze_ecs_structure(
    game_path: str, output_dir: Optional[str] = None, record_gameplay: bool = False, recording_duration: int = 30
) -> Dict[str, Any]:
    """
    Analyzes JavaScript files in a directory to extract ECS structure.
    This is a wrapper function that calls the static analysis and prepares visualization if required.

    Args:
        game_path: Path to the root directory of the game code.
        output_dir: Optional directory to save visualization output.
        record_gameplay: Whether to record gameplay with screenshots every 5 seconds.
        recording_duration: Duration in seconds to record gameplay (only used if record_gameplay is True).

    Returns:
        A dictionary containing the discovered ECS structure (components, entities, systems).
    """
    # Default timeout for runtime analysis
    timeout = 30  # Default timeout in seconds
    
    # Normalize the game path to absolute
    abs_game_path = os.path.abspath(game_path)
    logging.info(f"Using absolute game path: {abs_game_path}")
    
    # Create output directory if needed
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
        except OSError as e:
            logging.error(f"Failed to create output directory {output_dir}: {e}")
            output_dir = None  # Disable output saving if dir creation fails

    # Run static analysis
    _, static_results = analyze_ecs_structure_static(abs_game_path)
    
    # If browser analysis is available (through imported function), run it
    runtime_results = {}
    try:
        import asyncio
        
        # Try multiple import paths for browser module
        browser_module = None
        extract_runtime_ecs_data = None
        extract_runtime_ecs_data_with_recording = None
        
        try:
            from metrics.core.browser import extract_runtime_ecs_data, extract_runtime_ecs_data_with_recording
            browser_module = "metrics.core.browser"
        except ImportError:
            try:
                from core.browser import extract_runtime_ecs_data, extract_runtime_ecs_data_with_recording
                browser_module = "core.browser"
            except ImportError:
                # Last resort - try relative import
                current_dir = os.path.dirname(os.path.abspath(__file__))
                sys.path.append(current_dir)
                try:
                    from browser import extract_runtime_ecs_data, extract_runtime_ecs_data_with_recording
                    browser_module = "browser"
                except ImportError:
                    raise ImportError("Could not import browser module from any known location")

        logging.info(f"Using browser module from: {browser_module}")
        
        if record_gameplay:
            # Use the continuous recording version
            logging.info(f"Running browser-based runtime analysis with {recording_duration}s gameplay recording...")
            
            try:
                # Always use get_event_loop and create_task instead of run_until_complete or asyncio.run
                loop = asyncio.get_event_loop()
                
                # Check if this is a direct file or a directory
                is_html_file = os.path.isfile(abs_game_path) and abs_game_path.lower().endswith('.html')
                
                # Use a shorter timeout for direct file access to avoid unnecessary waiting
                recording_adjusted = recording_duration // 2 if is_html_file else recording_duration
                
                runtime_results_future = asyncio.ensure_future(
                    extract_runtime_ecs_data_with_recording(
                        abs_game_path, recording_duration=recording_adjusted
                    )
                )
                # If we're not in an event loop yet, run it
                if not loop.is_running():
                    runtime_results = loop.run_until_complete(runtime_results_future)
                else:
                    # If we're already in a running loop, just wait for the task to complete
                    # This is a workaround - in real async code, you'd typically just await the coroutine
                    # Add timeout to prevent deadlocks
                    timeout = recording_adjusted + 10  # recording_duration plus 10 seconds buffer
                    start_time = time.time()
                    while not runtime_results_future.done():
                        # Check for timeout
                        if time.time() - start_time > timeout:
                            runtime_results_future.cancel()
                            raise TimeoutError(f"Runtime analysis with recording timed out after {timeout} seconds")
                        # Use a short sleep to avoid CPU spinning
                        time.sleep(0.1)
                    runtime_results = runtime_results_future.result()
            except Exception as e:
                logging.error(f"Error during runtime analysis with recording: {e}", exc_info=True)
                static_results["_meta"]["errors"].append(f"Runtime Analysis Error: {e}")
        else:
            # Use the standard version without continuous recording
            logging.info("Running browser-based runtime analysis...")
            
            try:
                # Always use get_event_loop and create_task instead of run_until_complete or asyncio.run
                loop = asyncio.get_event_loop()
                
                # Check if this is a direct file or a directory
                is_html_file = os.path.isfile(abs_game_path) and abs_game_path.lower().endswith('.html')
                
                # Use a shorter timeout for direct file access to avoid unnecessary waiting
                timeout_override = 15 if is_html_file else timeout
                
                runtime_results_future = asyncio.ensure_future(
                    extract_runtime_ecs_data(abs_game_path)
                )
                # If we're not in an event loop yet, run it
                if not loop.is_running():
                    runtime_results = loop.run_until_complete(runtime_results_future)
                else:
                    # If we're already in a running loop, just wait for the task to complete
                    # with a timeout to prevent deadlocks
                    timeout = timeout_override  # 15-30 seconds timeout depending on file type 
                    start_time = time.time()
                    while not runtime_results_future.done():
                        # Check for timeout
                        if time.time() - start_time > timeout:
                            runtime_results_future.cancel()
                            raise TimeoutError(f"Runtime analysis timed out after {timeout} seconds")
                        # Use a short sleep to avoid CPU spinning
                        time.sleep(0.1)
                    runtime_results = runtime_results_future.result()
            except Exception as e:
                logging.error(f"Error during runtime analysis: {e}", exc_info=True)
                static_results["_meta"]["errors"].append(f"Runtime Analysis Error: {e}")
        
        if "error" in runtime_results:
            logging.warning(f"Runtime analysis error: {runtime_results['error']}")
        else:
            # Merge results from runtime analysis
            static_results = merge_static_runtime_results(static_results, runtime_results)
            static_results["_meta"]["analysis_modes"].append("runtime")
            
            # Include screenshot information if available
            if "screenshots" in runtime_results and runtime_results["screenshots"]:
                static_results["_meta"]["screenshots"] = runtime_results["screenshots"]
                static_results["_meta"]["screenshot_count"] = runtime_results.get("screenshot_count", len(runtime_results["screenshots"]))
                static_results["_meta"]["screenshot_interval"] = runtime_results.get("screenshot_interval", 5)
                logging.info(f"Captured {static_results['_meta']['screenshot_count']} gameplay screenshots")
            
            # Process entity snapshots if available
            if "entity_snapshots" in runtime_results:
                logging.info(f"Processing {len(runtime_results['entity_snapshots'])} entity snapshots")
                
                # Add a summary of entity changes over time
                if len(runtime_results["entity_snapshots"]) >= 2:
                    time_analysis = analyze_entity_changes(runtime_results["entity_snapshots"])
                    static_results["_meta"]["entity_dynamics"] = time_analysis
            
            # Add component definitions if available
            if "component_definitions" in runtime_results:
                static_results["_meta"]["component_definitions_runtime"] = runtime_results["component_definitions"]
                
    except ImportError:
        logging.warning("Browser module not available, skipping runtime analysis")
    except Exception as e:
        logging.error(f"Error in runtime analysis: {e}", exc_info=True)
        static_results["_meta"]["errors"].append(f"Runtime Analysis Error: {e}")

    # If visualization is required and output_dir is specified, use the visualization module
    if VISUALIZATION_ENABLED and output_dir:
        try:
            graph = create_ecs_graph(static_results)
            if graph and graph.number_of_nodes() > 0:
                viz_path = os.path.join(output_dir, "ecs_visualization.png")
                if visualize_ecs_graph(graph, viz_path):
                    static_results["visualization_path"] = viz_path
                    logging.info(f"ECS visualization saved to {viz_path}")
                else:
                    logging.warning("Failed to create ECS visualization")
            else:
                logging.warning("No nodes found for ECS graph visualization")
        except Exception as e:
            logging.error(f"Failed to generate visualization: {e}", exc_info=True)
            static_results["_meta"]["errors"].append(f"Visualization Error: {e}")

    return static_results


def merge_static_runtime_results(static_results: Dict, runtime_results: Dict) -> Dict:
    """
    Merges results from static and runtime analysis.
    
    Args:
        static_results: Results from static analysis
        runtime_results: Results from runtime analysis
        
    Returns:
        Merged results dictionary
    """
    merged = static_results.copy()
    
    # Merge components
    for comp_name, props in runtime_results.get("components", {}).items():
        if comp_name in merged["components"]:
            # Combine properties from both analyses
            merged["components"][comp_name] = sorted(list(set(merged["components"][comp_name] + (props if isinstance(props, list) else []))))
        else:
            merged["components"][comp_name] = props if isinstance(props, list) else []
    
    # Merge entities
    for entity_name, comps in runtime_results.get("entities", {}).items():
        if entity_name in merged["entities"]:
            # Combine components from both analyses
            merged["entities"][entity_name] = sorted(list(set(merged["entities"][entity_name] + list(comps.keys()))))
        else:
            merged["entities"][entity_name] = sorted(list(comps.keys()))
    
    # Merge systems
    for sys_name, sys_data in runtime_results.get("systems", {}).items():
        if sys_name in merged["systems"]:
            # Combine system data from both analyses
            if "reads" in merged["systems"][sys_name] and "reads" in sys_data:
                merged["systems"][sys_name]["reads"] = sorted(list(set(merged["systems"][sys_name]["reads"] + sys_data["reads"])))
            if "writes" in merged["systems"][sys_name] and "writes" in sys_data:
                merged["systems"][sys_name]["writes"] = sorted(list(set(merged["systems"][sys_name]["writes"] + sys_data["writes"])))
        else:
            merged["systems"][sys_name] = sys_data
    
    return merged


def analyze_entity_changes(snapshots: List[Dict]) -> Dict[str, Any]:
    """
    Analyzes entity changes over time from snapshots.
    
    Args:
        snapshots: List of entity snapshots
        
    Returns:
        Dictionary with analysis of entity changes
    """
    if not snapshots or len(snapshots) < 2:
        return {"error": "Not enough snapshots for time analysis"}
    
    results = {
        "changing_entities": [],
        "static_entities": [],
        "appearing_entities": [],
        "disappearing_entities": [],
        "property_changes": {},  # Track which properties changed
        "snapshot_count": len(snapshots)
    }
    
    # Create sets of entity IDs for each snapshot and tracking property changes
    entity_sets = []
    entity_changes = {}  # Track changes in entity properties
    
    for snapshot in snapshots:
        if "entities" in snapshot and isinstance(snapshot["entities"], dict):
            entity_ids = set(snapshot["entities"].keys())
            entity_sets.append(entity_ids)
            
            # Track property changes for each entity
            for entity_id, entity_data in snapshot["entities"].items():
                if "_tracked_properties" in entity_data:
                    if entity_id not in entity_changes:
                        entity_changes[entity_id] = {
                            "snapshots": [],
                            "changing_props": set()
                        }
                    
                    entity_changes[entity_id]["snapshots"].append(entity_data["_tracked_properties"])
        elif "entities" in snapshot and isinstance(snapshot["entities"], list):
            # Handle array format - extract IDs from objects
            entity_ids = set()
            for i, entity in enumerate(snapshot["entities"]):
                if isinstance(entity, dict):
                    entity_id = entity.get("id") or entity.get("name") or entity.get("type") or f"entity_{i}"
                    entity_ids.add(entity_id)
            entity_sets.append(entity_ids)
    
    if not entity_sets:
        return {"error": "Could not extract entity sets from snapshots"}
    
    # Find entities that appear/disappear
    all_entities = set().union(*entity_sets)
    always_present = set.intersection(*entity_sets) if entity_sets else set()
    
    # Analyze property changes for entities that appear in multiple snapshots
    for entity_id, change_data in entity_changes.items():
        if len(change_data["snapshots"]) >= 2:
            # Compare properties between snapshots
            for i in range(len(change_data["snapshots"]) - 1):
                snapshot1 = change_data["snapshots"][i]
                snapshot2 = change_data["snapshots"][i + 1]
                
                for prop in snapshot1:
                    if prop in snapshot2:
                        if snapshot1[prop] != snapshot2[prop]:
                            change_data["changing_props"].add(prop)
                            
                            # Add this property change to our results
                            if entity_id not in results["property_changes"]:
                                results["property_changes"][entity_id] = {}
                            
                            if prop not in results["property_changes"][entity_id]:
                                results["property_changes"][entity_id][prop] = []
                            
                            # Store the before and after values
                            results["property_changes"][entity_id][prop].append({
                                "from": snapshot1[prop],
                                "to": snapshot2[prop],
                                "snapshot_indices": [i, i+1]
                            })
    
    # Categorize entities based on appearance and property changes
    for entity_id in all_entities:
        # Check if entity appears in all snapshots
        if entity_id in always_present:
            # Check if it changes based on tracked properties
            if entity_id in entity_changes and entity_changes[entity_id]["changing_props"]:
                # Entity changes properties over time
                results["changing_entities"].append(entity_id)
            else:
                results["static_entities"].append(entity_id)
        else:
            # Entity appears or disappears
            first_appearance = next((i for i, s in enumerate(entity_sets) if entity_id in s), -1)
            last_appearance = next((i for i, s in enumerate(reversed(entity_sets)) if entity_id in s), -1)
            
            if first_appearance == 0 and last_appearance < len(entity_sets) - 1:
                results["disappearing_entities"].append(entity_id)
            elif first_appearance > 0:
                results["appearing_entities"].append(entity_id)
    
    # Add a summary of what types of properties changed
    property_type_counts = {}
    for entity_id, props in results["property_changes"].items():
        for prop_name in props:
            # Categorize properties
            category = "other"
            if any(pos_term in prop_name.lower() for pos_term in ['position', 'pos', 'x', 'y', 'z', 'transform']):
                category = "position"
            elif any(vel_term in prop_name.lower() for vel_term in ['velocity', 'vel', 'speed', 'direction', 'angle', 'rotation']):
                category = "movement"
            elif any(state_term in prop_name.lower() for state_term in ['health', 'hp', 'lives', 'score', 'points']):
                category = "game_state"
            elif any(state_term in prop_name.lower() for state_term in ['state', 'visible', 'active', 'enabled']):
                category = "visibility_state"
                
            property_type_counts[category] = property_type_counts.get(category, 0) + 1
    
    results["property_change_summary"] = property_type_counts
    
    return results 


def test_game_playability(game_path: str, duration: int = 15, timeout: int = 20) -> Dict[str, Any]:
    """
    A simplified approach to test if a game is playable by comparing ECS states
    before and after user interaction.
    
    Args:
        game_path: Path to the game file or directory
        duration: Duration in seconds to run the interaction (default: 15)
        timeout: Timeout in seconds for each state extraction (default: 20)
        
    Returns:
        Dictionary with playability assessment results
    """
    try:
        import asyncio
        # Try multiple import paths for browser module
        browser_module = None
        try:
            from metrics.core.browser import extract_runtime_ecs_data
            browser_module = "metrics.core.browser"
        except ImportError:
            try:
                from core.browser import extract_runtime_ecs_data
                browser_module = "core.browser"
            except ImportError:
                # Last resort - try relative import
                current_dir = os.path.dirname(os.path.abspath(__file__))
                sys.path.append(current_dir)
                try:
                    from browser import extract_runtime_ecs_data
                    browser_module = "browser"
                except ImportError:
                    raise ImportError("Could not import browser module from any known location")

        logging.info(f"Using browser module from: {browser_module}")

        # Log more details about the game path
        abs_path = os.path.abspath(game_path)
        logging.info(f"Starting simplified playability test for path: {game_path}")
        logging.info(f"Absolute path: {abs_path}, Exists: {os.path.exists(abs_path)}")
        
        # Check if file/directory exists
        if not os.path.exists(abs_path):
            return {
                "playable": False, 
                "reason": f"Game path does not exist: {abs_path}",
                "details": {
                    "path_provided": game_path,
                    "abs_path": abs_path,
                    "cwd": os.getcwd()
                }
            }
        
        # Use absolute path for all operations
        game_path = abs_path
            
        # Get initial state
        logging.info("Extracting initial ECS state...")
        try:
            loop = asyncio.get_event_loop()
            initial_state_future = asyncio.ensure_future(extract_runtime_ecs_data(game_path, capture_baseline=True))
            
            if not loop.is_running():
                initial_state = loop.run_until_complete(initial_state_future)
            else:
                # Wait with timeout
                start_time = time.time()
                while not initial_state_future.done():
                    if time.time() - start_time > timeout:
                        initial_state_future.cancel()
                        raise TimeoutError("Initial state extraction timed out")
                    time.sleep(0.1)
                initial_state = initial_state_future.result()
        except TimeoutError:
            return {"playable": False, "reason": f"Initial state extraction timed out after {timeout} seconds"}
        except Exception as e:
            logging.error(f"Error extracting initial state: {str(e)}", exc_info=True)
            return {"playable": False, "reason": f"Failed to extract initial state: {str(e)}"}
            
        if "error" in initial_state:
            return {"playable": False, "reason": f"Failed to get initial state: {initial_state['error']}"}
            
        # Wait a brief period for the game to load fully
        time.sleep(2)
        
        # Get state after interaction time
        logging.info(f"Waiting {duration}s for user interaction...")
        time.sleep(duration)
        
        logging.info("Extracting final ECS state...")
        try:
            final_state_future = asyncio.ensure_future(extract_runtime_ecs_data(game_path, capture_action=True))
            
            if not loop.is_running():
                final_state = loop.run_until_complete(final_state_future)
            else:
                # Wait with timeout
                start_time = time.time()
                while not final_state_future.done():
                    if time.time() - start_time > timeout:
                        final_state_future.cancel()
                        raise TimeoutError("Final state extraction timed out")
                    time.sleep(0.1)
                final_state = final_state_future.result()
        except TimeoutError:
            return {"playable": False, "reason": f"Final state extraction timed out after {timeout} seconds"}
        except Exception as e:
            logging.error(f"Error extracting final state: {str(e)}", exc_info=True)
            return {"playable": False, "reason": f"Failed to extract final state: {str(e)}"}
            
        if "error" in final_state:
            return {"playable": False, "reason": f"Failed to get final state: {final_state['error']}"}
        
        # Compare states to determine playability
        changes = compare_ecs_states(initial_state, final_state)
        
        playability_result = {
            "playable": changes["has_changes"],
            "changes": changes,
            "interaction_duration": duration
        }
        
        if changes["has_changes"]:
            logging.info("Game appears to be playable - detected ECS state changes")
        else:
            logging.info("Game may not be playable - no ECS state changes detected")
            
        return playability_result
        
    except ImportError as ie:
        logging.error(f"Import error during playability test: {str(ie)}", exc_info=True)
        return {
            "playable": False, 
            "reason": "Browser module not available. Install playwright with 'pip install playwright && python -m playwright install'",
            "details": {
                "error_type": "ImportError",
                "error_message": str(ie)
            }
        }
    except Exception as e:
        logging.error(f"Error in playability test: {e}", exc_info=True)
        return {
            "playable": False, 
            "reason": str(e),
            "details": {
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        }


def compare_ecs_states(state1: Dict, state2: Dict) -> Dict[str, Any]:
    """
    Compare two ECS states to determine if significant changes occurred.
    
    Args:
        state1: Initial ECS state
        state2: Final ECS state after interaction
        
    Returns:
        Dictionary describing changes between states
    """
    result = {
        "has_changes": False,
        "new_entities": [],
        "removed_entities": [],
        "changed_entities": {},
        "component_changes": {}
    }
    
    # Compare entities
    entities1 = set(state1.get("entities", {}).keys())
    entities2 = set(state2.get("entities", {}).keys())
    
    result["new_entities"] = list(entities2 - entities1)
    result["removed_entities"] = list(entities1 - entities2)
    
    # Check for changes in entities present in both states
    common_entities = entities1.intersection(entities2)
    for entity_id in common_entities:
        # Get components for this entity in both states
        components1 = set(state1["entities"][entity_id].keys())
        components2 = set(state2["entities"][entity_id].keys())
        
        # Track new/removed components
        new_components = list(components2 - components1)
        removed_components = list(components1 - components2)
        
        # Track changed component properties
        changed_components = {}
        common_components = components1.intersection(components2)
        
        for comp_name in common_components:
            comp1 = state1["entities"][entity_id][comp_name]
            comp2 = state2["entities"][entity_id][comp_name]
            
            # If components have tracked properties (like position, health, etc.)
            if isinstance(comp1, dict) and isinstance(comp2, dict):
                changed_props = {}
                for prop in set(comp1.keys()).intersection(comp2.keys()):
                    if comp1[prop] != comp2[prop]:
                        changed_props[prop] = {
                            "before": comp1[prop],
                            "after": comp2[prop]
                        }
                
                if changed_props:
                    changed_components[comp_name] = changed_props
        
        # Record changes for this entity if any were found
        if new_components or removed_components or changed_components:
            result["changed_entities"][entity_id] = {
                "new_components": new_components,
                "removed_components": removed_components,
                "changed_components": changed_components
            }
    
    # Also record changes at the component type level
    components1 = set(state1.get("components", {}).keys())
    components2 = set(state2.get("components", {}).keys())
    
    result["component_changes"] = {
        "new_components": list(components2 - components1),
        "removed_components": list(components1 - components2)
    }
    
    # Determine if any significant changes occurred
    result["has_changes"] = bool(
        result["new_entities"] or 
        result["removed_entities"] or 
        result["changed_entities"] or
        result["component_changes"]["new_components"] or 
        result["component_changes"]["removed_components"]
    )
    
    return result 