import os
import json
import subprocess
import tempfile
import logging
from typing import Dict, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

def _run_node_script(script_content: str) -> Tuple[Optional[Dict], Optional[str]]:
    """Runs a Node.js script and returns the parsed JSON output or error."""
    stdout_data, stderr_data = None, None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".js", mode="w+", delete=False, encoding="utf-8"
        ) as temp_script:
            temp_script.write(script_content)
            script_path = temp_script.name

        # Ensure Node.js and esprima are available
        try:
            # Check for Node
            proc_node = subprocess.run(
                ["node", "--version"], capture_output=True, text=True, check=False
            )
            if proc_node.returncode != 0:
                raise FileNotFoundError("Node.js not found. Please install Node.js.")
            # Check for esprima (this is a basic check, might need npm install esprima)
            proc_esprima = subprocess.run(
                ["node", "-e", "require('esprima')"],
                capture_output=True,
                text=True,
                check=False,
            )
            if proc_esprima.returncode != 0:
                logging.warning(
                    "Esprima not found globally. Attempting to use local install or assuming it's available."
                )
                # Alternatively, could try installing it: subprocess.run(['npm', 'install', 'esprima'])

        except FileNotFoundError as e:
            logging.error(f"Dependency check failed: {e}")
            return None, str(e)

        process = subprocess.run(
            ["node", script_path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,  # Don't raise exception on non-zero exit code
        )
        os.unlink(script_path)  # Clean up the temporary file

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
                    stderr_data = (
                        f"Node.js process exited with code {process.returncode}"
                    )

        if process.stdout:
            try:
                stdout_data = json.loads(process.stdout)
            except json.JSONDecodeError as e:
                stderr_data = (
                    stderr_data
                    + f"\nFailed to parse stdout JSON: {e}\nStdout was: {process.stdout[:500]}"
                    if stderr_data
                    else f"Failed to parse stdout JSON: {e}\nStdout was: {process.stdout[:500]}"
                )

        return stdout_data, stderr_data

    except Exception as e:
        logging.error(f"Error running Node.js script: {e}")
        if "script_path" in locals() and os.path.exists(script_path):
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
    current_dir = os.path.dirname(
        os.path.abspath(__file__)
    )  # Directory of current module
    project_root = current_dir
    # Go up directory levels until node_modules is found or we hit the filesystem root
    while not os.path.exists(
        os.path.join(project_root, "node_modules", "esprima")
    ) and project_root != os.path.dirname(project_root):
        project_root = os.path.dirname(project_root)

    # Check if we found node_modules/esprima
    esprima_path_in_node_modules = os.path.join(project_root, "node_modules", "esprima")
    if not os.path.exists(esprima_path_in_node_modules):
        logging.error(
            f"Could not find esprima installation relative to {current_dir}. Looked for {esprima_path_in_node_modules}. Please run 'npm install esprima' in the project root."
        )
        # Fallback to trying global require, but log a clear warning
        logging.warning("Falling back to global 'require(\"esprima\")'.")
        require_path = "esprima"  # Try global
    else:
        # Construct the path Node.js needs for require(), relative to the temp script
        # It's often easier to pass the absolute path and use require(absolute_path)
        esprima_require_target = esprima_path_in_node_modules.replace(
            "\\", "\\\\"
        )  # Escape for JS string
        require_path = f"'{esprima_require_target}'"  # Use the specific path

    # Esprima options: add range and loc for potential future use
    esprima_options = "{ range: true, loc: true, tolerant: true, comment: false }"  # Tolerant mode might help

    # Escape backslashes in the file path for JavaScript string compatibility
    js_safe_path = js_file_path.replace("\\", "\\\\")

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
        logging.error(
            f"Failed to parse {os.path.basename(js_file_path)} using Node/Esprima: {error_message}"
        )
        return None
    if not ast_data:
        logging.error(f"No AST data returned for {os.path.basename(js_file_path)}.")
        return None

    return ast_data 