import os
import argparse
import json
import asyncio
import sys
from typing import Dict, List, Any, Tuple

# Add the parent directory to path to make imports work when run directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    # For when run as a module
    from metrics.implementation_check import check_js_implementation
    from metrics.parse_ast import analyze_ecs_structure, analyze_ecs_structure_with_runtime
except ImportError:
    # For when run directly
    from implementation_check import check_js_implementation
    from parse_ast import analyze_ecs_structure, analyze_ecs_structure_with_runtime


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
    
    # Run ECS structure analysis (with runtime analysis if enabled)
    ecs_output_dir = os.path.join(output_dir, "ecs_analysis")
    os.makedirs(ecs_output_dir, exist_ok=True)
    
    # Use combined static and runtime analysis
    ecs_results = await analyze_ecs_structure_with_runtime(
        game_path, 
        ecs_output_dir,
        run_browser=not disable_browser
    )
    
    # Consider analysis successful if we found any ECS components
    ecs_success = (
        len(ecs_results.get("entities", [])) > 0 or
        len(ecs_results.get("components", [])) > 0 or
        len(ecs_results.get("systems", [])) > 0
    )
    
    results["ecs_analysis"] = {
        "success": ecs_success,
        "details": ecs_results
    }
    
    # Additional metrics will be added here as they are implemented
    
    return results


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
