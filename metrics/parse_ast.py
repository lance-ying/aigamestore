"""
Legacy wrapper module for ECS analysis.
This imports from the new module structure for backward compatibility.
"""

import asyncio
from typing import Dict, Any, Optional

from metrics.core.ast_parser import extract_ast_from_js
from metrics.core.ecs_analyzer import (
    ECSStructure, analyze_ecs_structure, analyze_ecs_structure_static,
    traverse_ast
)
from metrics.core.browser import extract_runtime_ecs_data
from metrics.utils.visualization import create_ecs_graph, visualize_ecs_graph

# Define backward-compatible function
async def analyze_ecs_structure_with_runtime(
    game_path: str, output_dir: Optional[str] = None, run_browser: bool = True
) -> Dict[str, Any]:
    """
    Analyzes JavaScript files and optionally performs runtime analysis to discover the ECS structure.
    This is a wrapper for backward compatibility.

    Args:
        game_path: Path to the root directory of the game code.
        output_dir: Optional directory to save visualization output.
        run_browser: Whether to perform runtime analysis with a headless browser

    Returns:
        A dictionary containing the discovered ECS structure (components, entities, systems).
    """
    # Run static analysis first
    static_results = analyze_ecs_structure(game_path, output_dir)
    
    if not run_browser:
        return static_results
        
    # Run dynamic analysis
    try:
        runtime_results = await extract_runtime_ecs_data(game_path)
        
        # If we have an error in runtime analysis, return static results
        if "error" in runtime_results:
            static_results["_meta"]["errors"].append(runtime_results["error"])
            return static_results
            
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
                "analysis_modes": ["static", "runtime"],
            },
        }
        
        # Merge components (combine properties)
        for comp_name, props in static_results.get("components", {}).items():
            merged_results["components"][comp_name] = list(props)

        for comp_name, props in runtime_results.get("components", {}).items():
            if comp_name in merged_results["components"]:
                # Combine static and runtime properties
                merged_props = set(merged_results["components"][comp_name])
                # Handle case where props is a boolean
                if isinstance(props, (list, set)):
                    merged_props.update(props)
                merged_results["components"][comp_name] = sorted(list(merged_props))
            else:
                # Handle case where props is a boolean
                merged_results["components"][comp_name] = (
                    sorted(list(props)) if isinstance(props, (list, set)) else []
                )

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
                "properties": [],
            }

        for sys_name, sys_data in runtime_results.get("systems", {}).items():
            if sys_name in merged_results["systems"]:
                # Keep existing read/write info from static analysis
                if "properties" in sys_data:
                    merged_results["systems"][sys_name]["properties"] = sys_data[
                        "properties"
                    ]
            else:
                # For systems only found at runtime, we don't know read/write access
                merged_results["systems"][sys_name] = {
                    "reads": [],
                    "writes": [],
                    "properties": sys_data.get("properties", []),
                    "runtime_only": True,
                }
                
        # Use visualization from static analysis if it exists
        if "visualization_path" in static_results:
            merged_results["visualization_path"] = static_results["visualization_path"]
            
        return merged_results
        
    except Exception as e:
        static_results["_meta"]["errors"].append(f"Runtime analysis error: {str(e)}")
        return static_results

# Re-export functions and classes for backward compatibility
__all__ = [
    'extract_ast_from_js', 'ECSStructure', 'analyze_ecs_structure',
    'analyze_ecs_structure_static', 'analyze_ecs_structure_with_runtime',
    'traverse_ast', 'extract_runtime_ecs_data', 
    'create_ecs_graph', 'visualize_ecs_graph'
]
