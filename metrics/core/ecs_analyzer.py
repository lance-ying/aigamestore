import os
import json
import logging
import re
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
        game_path: Path to the root directory of the game code.

    Returns:
        A tuple containing (ECSStructure object, results dictionary)
    """
    if not os.path.isdir(game_path):
        logging.error(f"Invalid game path: {game_path}")
        return ECSStructure(), {"error": f"Invalid game path: {game_path}"}

    js_files = []
    for root, _, files in os.walk(game_path):
        for file in files:
            if file.endswith(".js"):
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
    game_path: str, output_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes JavaScript files in a directory to extract ECS structure.
    This is a wrapper function that calls the static analysis and prepares visualization if required.

    Args:
        game_path: Path to the root directory of the game code.
        output_dir: Optional directory to save visualization output.

    Returns:
        A dictionary containing the discovered ECS structure (components, entities, systems).
    """
    # Create output directory if needed
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
        except OSError as e:
            logging.error(f"Failed to create output directory {output_dir}: {e}")
            output_dir = None  # Disable output saving if dir creation fails

    # Run static analysis
    _, results = analyze_ecs_structure_static(game_path)

    # If visualization is required and output_dir is specified, use the visualization module
    if VISUALIZATION_ENABLED and output_dir:
        try:
            graph = create_ecs_graph(results)
            if graph and graph.number_of_nodes() > 0:
                viz_path = os.path.join(output_dir, "ecs_visualization.png")
                if visualize_ecs_graph(graph, viz_path):
                    results["visualization_path"] = viz_path
                    logging.info(f"ECS visualization saved to {viz_path}")
                else:
                    logging.warning("Failed to create ECS visualization")
            else:
                logging.warning("No nodes found for ECS graph visualization")
        except Exception as e:
            logging.error(f"Failed to generate visualization: {e}", exc_info=True)
            results["_meta"]["errors"].append(f"Visualization Error: {e}")

    return results 