import os
import json
import subprocess
import tempfile
import re
import logging
import time
import asyncio
from typing import Dict, List, Any, Set, Tuple, Optional
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Try importing visualization libraries, but allow the script to run without them.
try:
    import networkx as nx
    import matplotlib.pyplot as plt
    VISUALIZATION_ENABLED = True
except ImportError:
    logging.warning("NetworkX or Matplotlib not found. Visualization will be disabled.")
    VISUALIZATION_ENABLED = False

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright
    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False

# --- JavaScript AST Parsing ---

def _run_node_script(script_content: str) -> Tuple[Optional[Dict], Optional[str]]:
    """Runs a Node.js script and returns the parsed JSON output or error."""
    stdout_data, stderr_data = None, None
    try:
        with tempfile.NamedTemporaryFile(suffix='.js', mode='w+', delete=False, encoding='utf-8') as temp_script:
            temp_script.write(script_content)
            script_path = temp_script.name

        # Ensure Node.js and esprima are available
        try:
            # Check for Node
            proc_node = subprocess.run(['node', '--version'], capture_output=True, text=True, check=False)
            if proc_node.returncode != 0:
                 raise FileNotFoundError("Node.js not found. Please install Node.js.")
            # Check for esprima (this is a basic check, might need npm install esprima)
            proc_esprima = subprocess.run(['node', '-e', "require('esprima')"], capture_output=True, text=True, check=False)
            if proc_esprima.returncode != 0:
                logging.warning("Esprima not found globally. Attempting to use local install or assuming it's available.")
                # Alternatively, could try installing it: subprocess.run(['npm', 'install', 'esprima'])

        except FileNotFoundError as e:
            logging.error(f"Dependency check failed: {e}")
            return None, str(e)


        process = subprocess.run(
            ['node', script_path],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=False # Don't raise exception on non-zero exit code
        )
        os.unlink(script_path) # Clean up the temporary file

        if process.returncode != 0 or process.stderr:
            # Check if stderr contains the JSON error output we defined
            try:
                 error_json = json.loads(process.stderr)
                 if "error" in error_json:
                     stderr_data = f"Esprima parsing error: {error_json['error']}"
                 else:
                    stderr_data = process.stderr.strip()
            except json.JSONDecodeError:
                 stderr_data = process.stderr.strip()
                 if not stderr_data and process.returncode != 0:
                     stderr_data = f"Node.js process exited with code {process.returncode}"


        if process.stdout:
             try:
                 stdout_data = json.loads(process.stdout)
             except json.JSONDecodeError as e:
                  stderr_data = stderr_data + f"\nFailed to parse stdout JSON: {e}\nStdout was: {process.stdout[:500]}" if stderr_data else f"Failed to parse stdout JSON: {e}\nStdout was: {process.stdout[:500]}"


        return stdout_data, stderr_data

    except Exception as e:
        logging.error(f"Error running Node.js script: {e}")
        if 'script_path' in locals() and os.path.exists(script_path):
             os.unlink(script_path)
        return None, str(e)

def extract_ast_from_js(js_file_path: str) -> Optional[Dict]:
    """
    Extracts the Abstract Syntax Tree (AST) from a JavaScript file using Esprima via Node.js.

    Args:
        js_file_path: The absolute path to the JavaScript file.

    Returns:
        The AST as a dictionary, or None if parsing fails.
    """
    # Determine the project root directory (heuristic: go up until we find node_modules or a known root marker)
    # This assumes the script is run from somewhere within the project structure.
    current_dir = os.path.dirname(os.path.abspath(__file__)) # Directory of parse_ast.py
    project_root = current_dir
    # Go up directory levels until node_modules is found or we hit the filesystem root
    while not os.path.exists(os.path.join(project_root, 'node_modules', 'esprima')) and project_root != os.path.dirname(project_root):
         project_root = os.path.dirname(project_root)

    # Check if we found node_modules/esprima
    esprima_path_in_node_modules = os.path.join(project_root, 'node_modules', 'esprima')
    if not os.path.exists(esprima_path_in_node_modules):
         logging.error(f"Could not find esprima installation relative to {current_dir}. Looked for {esprima_path_in_node_modules}. Please run 'npm install esprima' in the project root.")
         # Fallback to trying global require, but log a clear warning
         logging.warning("Falling back to global 'require(\"esprima\")'.")
         require_path = "esprima" # Try global
    else:
         # Construct the path Node.js needs for require(), relative to the temp script
         # It's often easier to pass the absolute path and use require(absolute_path)
         esprima_require_target = esprima_path_in_node_modules.replace('\\', '\\\\') # Escape for JS string
         require_path = f"'{esprima_require_target}'" # Use the specific path

    # Esprima options: add range and loc for potential future use
    esprima_options = "{ range: true, loc: true, tolerant: true, comment: false }" # Tolerant mode might help

    # Escape backslashes in the file path for JavaScript string compatibility
    js_safe_path = js_file_path.replace('\\', '\\\\')

    # Modified Node Script
    node_script = f"""
    const fs = require('fs');
    const path = require('path'); // Import path module

    // Require esprima using the determined path
    const esprima = require({require_path});

    try {{
        const code = fs.readFileSync('{js_safe_path}', 'utf8');
        // Attempt to parse as a module first, fallback to script
        let ast;
        try {{
           ast = esprima.parseModule(code, {esprima_options});
        }} catch (moduleError) {{
           try {{
              ast = esprima.parseScript(code, {esprima_options});
           }} catch (scriptError) {{
              // Throw the more relevant error (or combine them)
              throw scriptError; // Prioritize script error if module fails
           }}
        }}

        console.log(JSON.stringify(ast, null, 2)); // Output AST to stdout
    }} catch (error) {{
        // Output specific error details to stderr as JSON
        console.error(JSON.stringify({{ error: error.message, stack: error.stack }}));
        process.exit(1); // Exit with error code
    }}
    """

    ast_data, error_message = _run_node_script(node_script)

    if error_message:
        # Log the specific error message we received
        logging.error(f"Failed to parse {os.path.basename(js_file_path)} using Node/Esprima: {error_message}")
        return None
    if not ast_data:
        logging.error(f"No AST data returned for {os.path.basename(js_file_path)}.")
        return None

    return ast_data

# --- AST Analysis for ECS Patterns ---

class ECSStructure:
    """Holds the discovered ECS elements."""
    def __init__(self):
        self.components: Dict[str, Set[str]] = defaultdict(set) # name -> {properties accessed}
        self.entities: Dict[str, Set[str]] = defaultdict(set)   # name -> {component names}
        self.systems: Dict[str, Dict[str, Set[str]]] = defaultdict(lambda: {"reads": set(), "writes": set()}) # name -> {"reads":{comps}, "writes":{comps}}
        self.component_defs: Set[str] = set() # Functions/classes likely defining components
        self.entity_defs: Set[str] = set()    # Functions/classes likely defining entities
        self.system_defs: Set[str] = set()    # Functions likely defining systems
        self.errors: List[str] = []

def _is_component_creation(node: Dict) -> Optional[str]:
    """Check if node represents component creation (function call or new). Returns component name."""
    if node.get("type") == "CallExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and re.match(r"^(create|make|build)\w*Component$", callee.get("name", ""), re.IGNORECASE):
            return callee["name"]
    elif node.get("type") == "NewExpression" and node.get("callee"):
         callee = node["callee"]
         if callee.get("type") == "Identifier" and callee.get("name", "").endswith("Component"):
             return callee["name"]
    return None

def _is_entity_creation(node: Dict) -> Optional[str]:
    """Check if node represents entity creation. Returns entity type name."""
    if node.get("type") == "CallExpression" and node.get("callee"):
        callee = node["callee"]
        if callee.get("type") == "Identifier" and re.match(r"^create\w*Entity$", callee.get("name", ""), re.IGNORECASE):
            # Extract the part between 'create' and 'Entity'
            match = re.match(r"^create(\w*)Entity$", callee.get("name", ""), re.IGNORECASE)
            return match.group(1) + "Entity" if match and match.group(1) else callee["name"]
    elif node.get("type") == "NewExpression" and node.get("callee"):
         callee = node["callee"]
         if callee.get("type") == "Identifier" and callee.get("name", "").endswith("Entity"):
             return callee["name"]

    # Also check for simple object literals assigned to variables ending in Entity
    # This requires context (parent node), complex to do perfectly here.
    # Example: let playerEntity = { components: {...} };
    if node.get("type") == "VariableDeclarator" and node.get("id") and node.get("init"):
        if node["id"].get("type") == "Identifier" and node["id"].get("name", "").endswith("Entity"):
            if node["init"].get("type") == "ObjectExpression" and any(p.get("key", {}).get("name") == "components" for p in node["init"].get("properties", [])):
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
        elif prop and prop.get("type") == "Literal": # Handle obj["property"]
             parts.append(str(prop.get("value", "")))

    elif node.get("type") == "Identifier":
        parts.append(node.get("name", ""))
    return parts

def _analyze_system_body(node: Dict, system_name: str, structure: ECSStructure):
    """Recursively analyze nodes within a system function to find component access."""
    if not isinstance(node, dict):
        return

    component_access_pattern = re.compile(r"(\w+)\.(components|props|state)\.(\w+Component|\w+)\.?(\w+)?")
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
            component_name = match.group(3) # e.g., positionComponent, health
            property_name = match.group(4) # ee.g., x, hp (optional)

            # Normalize component name (heuristic: add Component if missing)
            if not component_name.endswith("Component"):
                 component_name += "Component"

            # Determine if it's a read or write
            # Rough heuristic: if it's the left side of an assignment, it's a write.
            parent = node.get("_parent") # Assume parent reference is added during traversal
            is_write = False
            if parent and parent.get("type") == "AssignmentExpression" and parent.get("left") == node:
                is_write = True
            elif parent and parent.get("type") == "UpdateExpression": # e.g. score++
                 is_write = True


            if is_write:
                structure.systems[system_name]["writes"].add(component_name)
            else:
                structure.systems[system_name]["reads"].add(component_name)

            # Record the component and property accessed
            if property_name:
                structure.components[component_name].add(property_name)
            else:
                 structure.components[component_name] # Ensure component exists even if no prop accessed

    # Recursively check children, passing parent context
    for key, value in node.items():
        if key == "_parent": continue # Avoid circular traversal
        if isinstance(value, dict):
             value["_parent"] = node # Add parent reference
             _analyze_system_body(value, system_name, structure)
             del value["_parent"] # Clean up parent reference
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
            if re.match(r"^(create|make|build)\w*Component$", func_name, re.IGNORECASE) or func_name.endswith("Component"):
                 structure.component_defs.add(func_name)
                 structure.components[func_name] # Ensure it's listed
            elif re.match(r"^(create|make|build)\w*Entity$", func_name, re.IGNORECASE) or func_name.endswith("Entity"):
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
                   structure.components[comp_name] # Register component
              entity_type = _is_entity_creation(init_node)
              if entity_type:
                    structure.entities[entity_type] # Register entity type

              # Check if assigning an object literal that looks like an entity
              entity_type_from_literal = _is_entity_creation(node) # Checks var name + object literal structure
              if entity_type_from_literal and entity_type_from_literal not in structure.entities:
                  structure.entities[entity_type_from_literal]
                  # Extract components from literal definition
                  props = init_node.get("properties", [])
                  components_prop = next((p for p in props if p.get("key", {}).get("name") == "components"), None)
                  if components_prop and components_prop.get("value", {}).get("type") == "ObjectExpression":
                       component_assignments = components_prop["value"].get("properties", [])
                       for comp_assign in component_assignments:
                            comp_key_node = comp_assign.get("key")
                            comp_val_node = comp_assign.get("value")
                            comp_name_guess = None
                            if comp_key_node and comp_key_node.get("type") == "Identifier":
                                comp_name_guess = comp_key_node.get("name")
                                if not comp_name_guess.endswith("Component"):
                                     comp_name_guess += "Component" # Heuristic

                            # Check if value is a creation call
                            created_comp_name = _is_component_creation(comp_val_node)
                            if created_comp_name:
                                structure.entities[entity_type_from_literal].add(created_comp_name)
                            elif comp_name_guess: # Fallback to key name
                                 structure.entities[entity_type_from_literal].add(comp_name_guess)
                                 structure.components[comp_name_guess] # Ensure component is listed


    # --- Identify Usage / Relationships (Simplified - focus was on system body analysis) ---
    # More complex analysis could track assignments like `player.components.pos = createPositionComponent()`
    # or `entities.push(createEnemyEntity())`

    # Recursively process child nodes
    for key, value in node.items():
        if isinstance(value, dict):
            traverse_ast(value, structure)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    traverse_ast(item, structure)


def analyze_ecs_structure(game_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes JavaScript files in a directory to extract ECS structure.

    Args:
        game_path: Path to the root directory of the game code.
        output_dir: Optional directory to save visualization output.

    Returns:
        A dictionary containing the discovered ECS structure (components, entities, systems).
    """
    if not os.path.isdir(game_path):
        logging.error(f"Invalid game path: {game_path}")
        return {"error": f"Invalid game path: {game_path}"}

    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
        except OSError as e:
            logging.error(f"Failed to create output directory {output_dir}: {e}")
            output_dir = None # Disable output saving if dir creation fails

    js_files = []
    for root, _, files in os.walk(game_path):
        for file in files:
            if file.endswith('.js'):
                js_files.append(os.path.join(root, file))

    logging.info(f"Found {len(js_files)} JavaScript files to analyze in {game_path}")

    ecs_structure = ECSStructure()

    for js_file in js_files:
        logging.info(f"Processing: {os.path.relpath(js_file, game_path)}")
        ast = extract_ast_from_js(js_file)
        if ast:
            try:
                traverse_ast(ast, ecs_structure)
            except Exception as e:
                 logging.error(f"Error traversing AST for {os.path.basename(js_file)}: {e}", exc_info=True)
                 ecs_structure.errors.append(f"AST Traversal Error in {os.path.basename(js_file)}: {e}")
        else:
            ecs_structure.errors.append(f"Parsing Failed for {os.path.basename(js_file)}")


    # --- Prepare Final Results ---
    results = {
        "components": {name: sorted(list(props)) for name, props in ecs_structure.components.items()},
        "entities": {name: sorted(list(comps)) for name, comps in ecs_structure.entities.items()},
        "systems": {
            name: {
                "reads": sorted(list(deps["reads"])),
                "writes": sorted(list(deps["writes"]))
            } for name, deps in ecs_structure.systems.items()
        },
        "_meta": { # Include definitions for context
             "component_definitions": sorted(list(ecs_structure.component_defs)),
             "entity_definitions": sorted(list(ecs_structure.entity_defs)),
             "system_definitions": sorted(list(ecs_structure.system_defs)),
             "errors": ecs_structure.errors
        }
    }

    # --- Visualization (Optional) ---
    if VISUALIZATION_ENABLED and output_dir:
        try:
            graph = create_ecs_graph(results)
            if graph.number_of_nodes() > 0:
                viz_path = os.path.join(output_dir, "ecs_visualization.png")
                visualize_ecs_graph(graph, viz_path)
                results["visualization_path"] = viz_path
            else:
                 logging.warning("No nodes found for ECS graph visualization.")
        except Exception as e:
            logging.error(f"Failed to generate visualization: {e}", exc_info=True)
            results["_meta"]["errors"].append(f"Visualization Error: {e}")


    return results


# --- Graph Visualization ---

def create_ecs_graph(ecs_results: Dict) -> nx.DiGraph:
    """Creates a networkx graph from the analyzed ECS structure."""
    graph = nx.DiGraph()

    # Add nodes for components
    for comp_name, props in ecs_results.get("components", {}).items():
        # label = f"{comp_name}\n({', '.join(props)})" if props else comp_name
        graph.add_node(comp_name, type="component", label=comp_name) # Keep label simple for now

    # Add nodes for entity types
    for entity_name, components in ecs_results.get("entities", {}).items():
        # label = f"{entity_name}\n[{', '.join(components)}]" if components else entity_name
        graph.add_node(entity_name, type="entity", label=entity_name)
        # Add "has" relationship edges
        for comp_name in components:
            if graph.has_node(comp_name): # Only add edge if component node exists
                graph.add_edge(entity_name, comp_name, type="has")
            else:
                 logging.warning(f"Graph: Component node '{comp_name}' not found for entity '{entity_name}'.")


    # Add nodes for systems and dependency edges
    for sys_name, deps in ecs_results.get("systems", {}).items():
        graph.add_node(sys_name, type="system", label=sys_name)
        # Add "reads" relationship edges
        for comp_name in deps.get("reads", []):
            if graph.has_node(comp_name):
                graph.add_edge(comp_name, sys_name, type="read_by")
            else:
                 logging.warning(f"Graph: Component node '{comp_name}' not found for system '{sys_name}' (read).")
        # Add "writes" relationship edges
        for comp_name in deps.get("writes", []):
            if graph.has_node(comp_name):
                graph.add_edge(sys_name, comp_name, type="writes_to")
            else:
                 logging.warning(f"Graph: Component node '{comp_name}' not found for system '{sys_name}' (write).")

    return graph

def visualize_ecs_graph(graph: nx.DiGraph, output_path: str):
    """Visualizes the ECS graph using Matplotlib and saves it."""
    if not VISUALIZATION_ENABLED:
        logging.warning("Visualization libraries not available. Skipping graph generation.")
        return

    if graph.number_of_nodes() == 0:
        logging.warning("Graph is empty, cannot visualize.")
        return

    plt.figure(figsize=(18, 12)) # Adjust figure size for potentially large graphs
    plt.title("ECS Architecture")

    # Use a layout algorithm that handles larger graphs better, e.g., spring_layout or kamada_kawai
    try:
        # Increase iterations for potentially better layout, k controls distance
        pos = nx.spring_layout(graph, k=0.5, iterations=50, seed=42)
    except Exception as layout_err:
         logging.error(f"Graph layout failed: {layout_err}. Falling back to random layout.")
         pos = nx.random_layout(graph, seed=42) # Fallback layout


    node_colors = []
    node_sizes = []
    node_shapes = [] # Store shapes as well

    type_map = {"component": ("lightblue", 500, "s"), # Square
                "entity": ("lightgreen", 700, "o"),   # Circle
                "system": ("lightcoral", 700, "d")}   # Diamond

    for node in graph.nodes():
        node_type = graph.nodes[node].get("type", "unknown")
        color, size, shape = type_map.get(node_type, ("gray", 400, "h")) # Hexagon for unknown
        node_colors.append(color)
        node_sizes.append(size)
        node_shapes.append(shape) # Append shape marker

    # Draw nodes with different shapes - requires iterating through unique shapes
    unique_shapes = set(node_shapes)
    for shape in unique_shapes:
        nodelist = [node for i, node in enumerate(graph.nodes()) if node_shapes[i] == shape]
        colors = [node_colors[i] for i, node in enumerate(graph.nodes()) if node_shapes[i] == shape]
        sizes = [node_sizes[i] for i, node in enumerate(graph.nodes()) if node_shapes[i] == shape]

        nx.draw_networkx_nodes(graph, pos, nodelist=nodelist, node_color=colors, node_size=sizes, node_shape=shape, alpha=0.8)


    # Draw edges with different styles or labels based on type
    edge_colors = {"has": "gray", "read_by": "blue", "writes_to": "red"}
    edge_styles = {"has": "dotted", "read_by": "solid", "writes_to": "dashed"}

    for u, v, data in graph.edges(data=True):
        edge_type = data.get("type", "unknown")
        color = edge_colors.get(edge_type, "black")
        style = edge_styles.get(edge_type, "solid")
        nx.draw_networkx_edges(graph, pos, edgelist=[(u, v)], edge_color=color, style=style, alpha=0.6, arrows=True)


    # Draw labels (adjust font size)
    labels = {node: graph.nodes[node].get("label", node) for node in graph.nodes()}
    nx.draw_networkx_labels(graph, pos, labels=labels, font_size=8)

    # Create legend (manually)
    legend_elements = [
        plt.Line2D([0], [0], marker='s', color='w', label='Component', markerfacecolor='lightblue', markersize=10),
        plt.Line2D([0], [0], marker='o', color='w', label='Entity Type', markerfacecolor='lightgreen', markersize=10),
        plt.Line2D([0], [0], marker='d', color='w', label='System', markerfacecolor='lightcoral', markersize=10),
        plt.Line2D([0], [0], color='gray', lw=2, linestyle='dotted', label='Has Component'),
        plt.Line2D([0], [0], color='blue', lw=2, label='Read By System'),
        plt.Line2D([0], [0], color='red', lw=2, linestyle='dashed', label='Writes To Component')
    ]
    plt.legend(handles=legend_elements, loc='upper right', fontsize='small')


    plt.axis('off')
    plt.tight_layout()
    try:
        plt.savefig(output_path, dpi=150) # Increase DPI for better quality
        logging.info(f"ECS visualization saved to {output_path}")
    except Exception as e:
         logging.error(f"Failed to save visualization to {output_path}: {e}")
    finally:
        plt.close() # Close the plot to free memory

# --- Dynamic ECS Analysis through Headless Browser ---

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
        return {"error": "Playwright not installed. Run 'pip install playwright && python -m playwright install --with-deps chromium'"}
    
    # Start a simple HTTP server to serve the game files
    server_process = None
    try:
        # Use Python's built-in HTTP server
        server_process = subprocess.Popen(
            ["python", "-m", "http.server", str(port)],
            cwd=game_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        logging.info(f"Started HTTP server on port {port}")
        
        # Allow server to start
        time.sleep(1)
        
        # Use asyncio to run the browser interaction
        result = await _run_headless_browser(f"http://localhost:{port}", timeout)
        return result
    except Exception as e:
        logging.error(f"Error in headless browser extraction: {e}", exc_info=True)
        return {"error": str(e)}
    finally:
        if server_process:
            server_process.terminate()
            logging.info("HTTP server terminated")


async def _run_headless_browser(url: str, timeout: int) -> Dict[str, Any]:
    """
    Uses Playwright to run the game and extract runtime ECS information.
    
    Args:
        url: URL to the game
        timeout: Maximum time to wait for game initialization
        
    Returns:
        Dictionary with dynamically discovered ECS elements
    """
    runtime_ecs_data = {
        "entities": {},
        "components": {},
        "systems": {},
        "errors": []
    }
    
    async with async_playwright() as p:
        # Use Firefox instead of Chromium
        browser = await p.firefox.launch(headless=True, slow_mo=1000)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Add JavaScript hooks to capture ECS data
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
                
                // Look for common system containers
                const systemContainers = [
                    window.systems,
                    window.game?.systems,
                    window.world?.systems,
                    window.systemManager?.systems
                ];
                
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
        """)
        
        try:
            # Navigate to the page
            await page.goto(url, wait_until='networkidle')
            logging.info(f"Page loaded: {url}")
            
            # Wait for the game to initialize
            await page.wait_for_timeout(2000)
            
            # Identify and interact with canvas
            try:
                logging.info("Looking for game canvas")
                
                # Get all canvases with their attributes
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
                    for i, canvas in enumerate(canvas_info):
                        logging.info(f"Canvas #{i}: id='{canvas['id']}', classes='{canvas['classes']}', dimensions={canvas['width']}x{canvas['height']}")
                    
                    # Use the first canvas for interaction
                    main_canvas = canvas_info[0]
                    canvas_selector = main_canvas['selector']
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
                        
                        # Common game start/interaction keys
                        interaction_keys = ['Enter', ' ', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd']
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
                        
                        # More complex interaction patterns
                        key_sequences = [
                            # Hold right arrow
                            {'key': 'ArrowRight', 'duration': 800},
                            # Hold left arrow
                            {'key': 'ArrowLeft', 'duration': 800},
                            # Space for jumping/action
                            {'key': ' ', 'duration': 300}
                        ]
                        
                        for seq in key_sequences:
                            try:
                                await page.keyboard.down(seq['key'])
                                await page.wait_for_timeout(seq['duration'])
                                await page.keyboard.up(seq['key'])
                                await page.wait_for_timeout(300)
                                
                                # Extract entities after key sequence
                                await page.evaluate("window.extractEntitiesFromGlobal()")
                            except Exception as seq_err:
                                logging.debug(f"Error with key sequence {seq['key']}: {seq_err}")
                else:
                    logging.info("No canvas elements found")
            except Exception as canvas_err:
                logging.warning(f"Error handling canvas: {canvas_err}")
            
            # Direct extraction from global entities
            extracted_entities = await page.evaluate("""() => {
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
                            }
                        });
                    } else if (typeof entities === 'object') {
                        Object.entries(entities).forEach(([id, entity]) => {
                            if (entity && typeof entity === 'object') {
                                window.capturedECS.entities[id] = entity.components || {};
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
            
            if extracted_entities.get('found'):
                logging.info(f"Extracted {extracted_entities['count']} entities from global variable")
                logging.info(f"Entity sample: {', '.join(extracted_entities['entitySample'])}")
                logging.info(f"Components found: {', '.join(extracted_entities['componentsSample'])}")
                
                # Update our result data
                runtime_ecs_data['entities'] = extracted_entities.get('entityDetails', {})
                
                # Extract components from entities
                for entity_components in runtime_ecs_data['entities'].values():
                    for comp_name, props in entity_components.items():
                        if comp_name not in runtime_ecs_data['components']:
                            runtime_ecs_data['components'][comp_name] = props
            else:
                logging.info("No entities found in global variable")
            
            # Capture systems
            systems_data = await page.evaluate("window.captureSystems()")
            if systems_data:
                runtime_ecs_data['systems'] = systems_data
                logging.info(f"Captured {len(systems_data)} systems")
            
            # Take a screenshot for reference
            try:
                if not os.path.exists('metrics_results/screenshots'):
                    os.makedirs('metrics_results/screenshots', exist_ok=True)
                await page.screenshot(path='metrics_results/screenshots/game_final_state.png')
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


# --- Combined Static and Dynamic ECS Analysis ---

async def analyze_ecs_structure_with_runtime(game_path: str, output_dir: Optional[str] = None, run_browser: bool = True) -> Dict[str, Any]:
    """
    Analyzes JavaScript files and optionally performs runtime analysis to discover the ECS structure.
    
    Args:
        game_path: Path to the root directory of the game code.
        output_dir: Optional directory to save visualization output.
        run_browser: Whether to perform runtime analysis with a headless browser
        
    Returns:
        A dictionary containing the discovered ECS structure (components, entities, systems).
    """
    # Run static analysis first
    static_results = analyze_ecs_structure(game_path, output_dir)
    
    if not run_browser or not HEADLESS_BROWSER_ENABLED:
        if not HEADLESS_BROWSER_ENABLED and run_browser:
            static_results["_meta"]["errors"].append(
                "Headless browser analysis skipped: Playwright not installed. " +
                "Run 'pip install playwright && python -m playwright install --with-deps chromium'"
            )
        return static_results
    
    # Run dynamic analysis
    try:
        runtime_results = await extract_runtime_ecs_data(game_path)
        
        # Log runtime analysis results
        logging.info(f"Runtime analysis found {len(runtime_results.get('entities', {}))} entities, {len(runtime_results.get('components', {}))} components, and {len(runtime_results.get('systems', {}))} systems")
        if runtime_results.get('entities'):
            logging.info(f"Entities found: {', '.join(runtime_results['entities'].keys())}")
        
        # Merge the results
        merged_results = {
            "components": {},
            "entities": {},
            "systems": {},
            "_meta": {
                "component_definitions": static_results.get("_meta", {}).get("component_definitions", []),
                "entity_definitions": static_results.get("_meta", {}).get("entity_definitions", []),
                "system_definitions": static_results.get("_meta", {}).get("system_definitions", []),
                "errors": static_results.get("_meta", {}).get("errors", []) + runtime_results.get("errors", []),
                "analysis_modes": ["static"]
            }
        }
        
        # Add runtime analysis tag if it was successful
        if "error" not in runtime_results:
            merged_results["_meta"]["analysis_modes"].append("runtime")
        else:
            merged_results["_meta"]["errors"].append(runtime_results["error"])
        
        # Merge components (combine properties)
        for comp_name, props in static_results.get("components", {}).items():
            merged_results["components"][comp_name] = list(props)
            
        for comp_name, props in runtime_results.get("components", {}).items():
            if comp_name in merged_results["components"]:
                # Combine static and runtime properties
                merged_props = set(merged_results["components"][comp_name])
                merged_props.update(props)
                merged_results["components"][comp_name] = sorted(list(merged_props))
            else:
                merged_results["components"][comp_name] = sorted(props)
        
        # Merge entities (prefer runtime entities but keep static ones)
        for entity_name, comps in static_results.get("entities", {}).items():
            merged_results["entities"][entity_name] = sorted(list(comps))
            
        for entity_name, comps_data in runtime_results.get("entities", {}).items():
            components_set = set()
            # Extract component names from runtime data
            for comp_name in comps_data.keys():
                components_set.add(comp_name)
                
            if entity_name in merged_results["entities"]:
                existing_comps = set(merged_results["entities"][entity_name])
                existing_comps.update(components_set)
                merged_results["entities"][entity_name] = sorted(list(existing_comps))
            else:
                merged_results["entities"][entity_name] = sorted(list(components_set))
        
        # Merge systems (combine read/write dependencies)
        for sys_name, deps in static_results.get("systems", {}).items():
            merged_results["systems"][sys_name] = {
                "reads": sorted(list(deps.get("reads", []))),
                "writes": sorted(list(deps.get("writes", []))),
                "properties": []
            }
            
        for sys_name, sys_data in runtime_results.get("systems", {}).items():
            if sys_name in merged_results["systems"]:
                # Keep existing read/write info from static analysis
                if "properties" in sys_data:
                    merged_results["systems"][sys_name]["properties"] = sys_data["properties"]
            else:
                # For systems only found at runtime, we don't know read/write access
                merged_results["systems"][sys_name] = {
                    "reads": [],
                    "writes": [],
                    "properties": sys_data.get("properties", []),
                    "runtime_only": True
                }
        
        # Update visualization if enabled
        if VISUALIZATION_ENABLED and output_dir:
            try:
                graph = create_ecs_graph(merged_results)
                if graph.number_of_nodes() > 0:
                    viz_path = os.path.join(output_dir, "ecs_visualization_combined.png")
                    visualize_ecs_graph(graph, viz_path)
                    merged_results["visualization_path"] = viz_path
            except Exception as e:
                logging.error(f"Failed to generate visualization: {e}", exc_info=True)
                merged_results["_meta"]["errors"].append(f"Visualization Error: {e}")
        
        return merged_results
        
    except Exception as e:
        logging.error(f"Error in combined ECS analysis: {e}", exc_info=True)
        static_results["_meta"]["errors"].append(f"Runtime analysis error: {str(e)}")
        return static_results
