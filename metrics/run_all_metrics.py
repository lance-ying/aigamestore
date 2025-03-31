import os
import argparse
import json
from typing import Dict, List, Any, Tuple

from implementation_check import check_js_implementation


def run_metrics(game_path: str) -> Dict[str, Any]:
    """
    Run all available metrics on the game implementation.
    
    Args:
        game_path: Path to the directory containing the game files
        
    Returns:
        Dictionary with results from all metrics
    """
    if not os.path.isdir(game_path):
        return {"error": f"Invalid game path: {game_path} is not a directory"}
    
    results = {}
    
    # Run implementation check
    implementation_success, implementation_results = check_js_implementation(game_path)
    results["implementation_check"] = {
        "success": implementation_success,
        "details": implementation_results
    }
    
    # Additional metrics will be added here as they are implemented
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Run all metrics on a game implementation")
    parser.add_argument("game_path", help="Path to the game implementation directory")
    parser.add_argument("--output", help="Path to save the JSON output file", default=None)
    args = parser.parse_args()
    
    results = run_metrics(args.game_path)
    
    # Print results summary
    print("\n=== Metrics Results ===")
    for metric_name, metric_results in results.items():
        if "success" in metric_results:
            status = "PASSED" if metric_results["success"] else "FAILED"
            print(f"{metric_name}: {status}")
    
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
