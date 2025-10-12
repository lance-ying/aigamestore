"""
Legacy wrapper module for implementation checking.
This imports from the new module structure for backward compatibility.
"""

from metrics.checks.implementation import check_js_implementation, check_p5js_imports, run_eslint

# Re-export the functions for backward compatibility
__all__ = ['check_js_implementation', 'check_p5js_imports', 'run_eslint']
