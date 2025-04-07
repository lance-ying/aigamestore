import os
import argparse
import json
import asyncio
import sys
from typing import Dict, List, Any, Tuple

# Add the parent directory to path to make imports work when run directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import from our new module structure
from metrics.checks.implementation import check_js_implementation
from metrics.core.ecs_analyzer import analyze_ecs_structure
from metrics.core.browser import extract_runtime_ecs_data


async def run_metrics_async(game_path: str, disable_browser: bool = False) -> Dict[str, Any]:
    """
    Run all available metrics on the game implementation (async version).
    
    Args:
        game_path: Path to the directory containing the game files
        disable_browser: Whether to disable headless browser analysis
        
    Returns:
        Dictionary with results from all metrics
    """
    if not os.path.isdir(game_path):
        return {"error": f"Invalid game path: {game_path} is not a directory"}
    
    # Create output directory for all metrics
    output_dir = os.path.join(game_path, "metrics_results")
    os.makedirs(output_dir, exist_ok=True)
    
    results = {}
    
    # Run implementation check
    implementation_success, implementation_results = check_js_implementation(game_path)
    results["implementation_check"] = {
        "success": implementation_success,
        "details": implementation_results
    }
    
    # Run ECS structure analysis
    ecs_output_dir = os.path.join(output_dir, "ecs_analysis")
    os.makedirs(ecs_output_dir, exist_ok=True)
    
    # First run static analysis
    static_results = analyze_ecs_structure(game_path, ecs_output_dir)
    
    # Get results from browser analysis if not disabled
    ecs_results = static_results
    runtime_analysis_success = False
    
    if not disable_browser:
        try:
            # Run browser-based analysis
            runtime_results = await extract_runtime_ecs_data(game_path)
            
            # Check if browser analysis was successful
            if "error" not in runtime_results:
                # Combine static and runtime results (could be moved to a separate function)
                ecs_results = merge_static_runtime_results(static_results, runtime_results)
                runtime_analysis_success = True
            else:
                # Add error to the static results
                static_results["_meta"]["errors"].append(runtime_results["error"])
        except Exception as e:
            static_results["_meta"]["errors"].append(f"Runtime analysis error: {str(e)}")
    
    # Consider analysis successful if we found any ECS components
    ecs_success = (
        len(ecs_results.get("entities", [])) > 0 or
        len(ecs_results.get("components", [])) > 0 or
        len(ecs_results.get("systems", [])) > 0
    )
    
    # Add analysis mode information
    if "_meta" not in ecs_results:
        ecs_results["_meta"] = {}
    
    if "analysis_modes" not in ecs_results["_meta"]:
        ecs_results["_meta"]["analysis_modes"] = ["static"]
        if runtime_analysis_success:
            ecs_results["_meta"]["analysis_modes"].append("runtime")
    
    results["ecs_analysis"] = {
        "success": ecs_success,
        "details": ecs_results
    }
    
    # Additional metrics will be added here as they are implemented
    
    return results


def merge_static_runtime_results(static_results: Dict[str, Any], runtime_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge static and runtime analysis results.
    
    Args:
        static_results: Results from static analysis
        runtime_results: Results from runtime analysis
        
    Returns:
        Merged results dictionary
    """
    # Create a new dictionary for merged results
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


def run_metrics(game_path: str, disable_browser: bool = False) -> Dict[str, Any]:
    """
    Synchronous wrapper for run_metrics_async.
    
    Args:
        game_path: Path to the directory containing the game files
        disable_browser: Whether to disable headless browser analysis
        
    Returns:
        Dictionary with results from all metrics
    """
    return asyncio.run(run_metrics_async(game_path, disable_browser))


def main():
    parser = argparse.ArgumentParser(description="Run all metrics on a game implementation")
    parser.add_argument("game_path", help="Path to the game implementation directory")
    parser.add_argument("--output", help="Path to save the JSON output file", default=None)
    parser.add_argument("--disable-browser", help="Disable headless browser analysis", action="store_true")
    args = parser.parse_args()
    
    results = run_metrics(args.game_path, args.disable_browser)
    
    # Print results summary
    print("\n=== Metrics Results ===")
    for metric_name, metric_results in results.items():
        if "success" in metric_results:
            status = "PASSED" if metric_results["success"] else "FAILED"
            print(f"{metric_name}: {status}")
    
    # Print ECS analysis summary if available
    if "ecs_analysis" in results and "details" in results["ecs_analysis"]:
        ecs = results["ecs_analysis"]["details"]
        print("\nECS Analysis:")
        print(f"- Found {len(ecs.get('entities', []))} entities")
        print(f"- Found {len(ecs.get('components', []))} components")
        print(f"- Found {len(ecs.get('systems', []))} systems")
        
        # Print analysis modes
        if "_meta" in ecs and "analysis_modes" in ecs["_meta"]:
            modes = ", ".join(ecs["_meta"]["analysis_modes"])
            print(f"- Analysis modes: {modes}")
        
        if "visualization_path" in ecs:
            print(f"\nECS visualization: {ecs['visualization_path']}")
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nDetailed results saved to {args.output}")
    else:
        print("\nDetailed results:")
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
