import os
import time
import logging
import asyncio
import subprocess
import random
import re
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image, ImageChops

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright, Page, ConsoleMessage

    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False


class GameBrowserController:
    """
    Class to manage headless browser interactions for game testing.
    """
    def __init__(self, game_path: str, port: int = 8000):
        self.game_path = game_path
        self.port = port
        self.server_process = None
        self.enabled = HEADLESS_BROWSER_ENABLED
        self.is_html_file = os.path.isfile(game_path) and game_path.lower().endswith('.html')
        self.frame_counter = 0  # Add frame counter for screenshots
        self.allowed_keys = {
            "Arrow": [37, 38, 39, 40],  # Left, Up, Right, Down
            "Space": [32],
            "Shift": [16],
            "KeyZ": [90],
            "Enter": [13],
            "KeyR": [82]
        }
        self.key_mapping = {
            "ArrowLeft": 37,
            "ArrowUp": 38,
            "ArrowRight": 39,
            "ArrowDown": 40,
            " ": 32,
            "Shift": 16,
            "z": 90,
            "Enter": 13,
            "r": 82
        }
        # List of gameplay keys (all allowed keys except 'r' and 'Enter')
        self.gameplay_keys = [
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            " ", "Shift", "z"
        ]
        
    def _create_structured_error(self, message, error_type="error", source_file=None, line_number=None, column_number=None, stack=None, context=None):
        """
        Create a structured error dictionary with standardized fields.
        
        Args:
            message: The error message text
            error_type: Type of error (error, syntaxerror, referenceerror, etc.)
            source_file: Source file where the error occurred
            line_number: Line number in the source file
            column_number: Column number in the source file
            stack: Stack trace if available
            context: Additional context about where/when the error happened
            
        Returns:
            Dictionary with structured error information
        """
        # Extract filename without path if full path is provided
        filename = None
        if source_file:
            if '/' in source_file:
                filename = source_file.split('/')[-1]
            elif '\\' in source_file:
                filename = source_file.split('\\')[-1]
            else:
                filename = source_file
                
        return {
            "message": message,
            "type": error_type.lower(),
            "source": {
                "file": source_file,
                "filename": filename,
                "line": line_number,
                "column": column_number
            },
            "stack": stack,
            "context": context,
            "timestamp": time.time()
        }
        
    def _deduplicate_errors(self, errors):
        """
        Remove duplicate errors based on source file and line number.
        
        Args:
            errors: List of structured error dictionaries
            
        Returns:
            List of deduplicated error dictionaries
        """
        unique_errors = {}
        
        for error in errors:
            # Create a unique key based on filename and line number
            source = error.get("source", {})
            filename = source.get("filename")
            line = source.get("line")
            
            # If we don't have filename and line, use the error message as the key
            if not filename or not line:
                key = error.get("message", "")
            else:
                key = f"{filename}:{line}"
                
            # Only add if this key doesn't exist yet
            if key not in unique_errors:
                unique_errors[key] = error
                
        # Return list of unique errors
        return list(unique_errors.values())
    
    async def __aenter__(self):
        if not self.enabled:
            logging.warning("Headless browser is not enabled. Install playwright with: "
                           "pip install playwright && python -m playwright install --with-deps chromium")
            return self
            
        try:
            # If it's a single HTML file, we don't need to start a server
            if self.is_html_file:
                logging.info(f"Game path is a single HTML file: {self.game_path}")
                return self
                
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
    
    async def check_game_loads(self) -> Dict[str, Any]:
        """
        Checks if the game loads correctly without errors.
        
        Returns:
            Dictionary with test results
        """
        if not self.enabled:
            return {
                "test_result": False,
                "error": "Headless browser not enabled. Install playwright."
            }
            
        if not self.is_html_file and not self.server_process:
            return {
                "test_result": False,
                "error": "Server not running. Use within 'async with' context."
            }
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        load_results = await self._run_load_check(url)
        
        # Format the results to be more consistent with interaction test
        final_results = {
            "test_result": load_results["test_result"],
            "load_test": {
                "test_result": load_results["test_result"],
                "canvas_found": load_results["canvas_found"],
                "canvas_count": load_results.get("canvas_count", 0),
                "page_title": load_results.get("page_title", "")
            },
            "console_logs": load_results["console_logs"],
            "console_errors": load_results["console_errors"],  # For backwards compatibility
            "structured_errors": load_results.get("structured_errors", []),  # Include structured errors
            "screenshots": load_results["screenshots"],
            "error": load_results.get("error", None)
        }
        
        # Add console error message if present
        if "console_error_message" in load_results:
            final_results["console_error_message"] = load_results["console_error_message"]
            
        return final_results
            
    async def _run_load_check(self, url: str) -> Dict[str, Any]:
        """
        Loads the game and checks for console errors.
        
        Args:
            url: URL to the game
            
        Returns:
            Dictionary with test results
        """
        result = {
            "test_result": False,
            "console_logs": {
                "error": [],
                "warning": [],
                "info": [],
                "log": [],
                "debug": [],
                "other": []
            },
            "console_errors": [],  # Keep for backwards compatibility
            "structured_errors": [],  # New field for structured errors
            "js_exceptions": [],   # For JS syntax errors and exceptions
            "network_errors": [],  # For tracking network request failures
            "resource_errors": [], # For tracking resource loading failures
            "parse_errors": [],    # For syntax/parse errors in scripts
            "canvas_found": False,
            "screenshots": []
        }
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(os.path.dirname(self.game_path), "game_check_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            
            # Special script to detect syntax errors early
            detect_script = """
            // Log any existing errors
            window.onload = function() {
                if (window.syntaxErrors) {
                    console.error('Syntax errors detected:', window.syntaxErrors);
                }
            };
            
            // Track all script elements to check for syntax errors
            const originalCreateElement = document.createElement;
            document.createElement = function() {
                const element = originalCreateElement.apply(document, arguments);
                
                if (arguments[0].toLowerCase() === 'script') {
                    // Capture syntax errors from script loading
                    element.onerror = function(event) {
                        const src = element.src || 'inline script';
                        console.error(`Script error: ${src}`, event);
                        
                        // Try to extract detailed error info
                        if (!window.syntaxErrors) {
                            window.syntaxErrors = [];
                        }
                        window.syntaxErrors.push({
                            src: src,
                            error: event
                        });
                    };
                }
                return element;
            };
            
            // Enhanced error tracking - collect all errors
            window.jsErrors = [];
            window.moduleErrors = [];
            window.undefinedVars = [];
            
            // Global error handler
            window.onerror = function(message, source, lineno, colno, error) {
                console.error('Caught JS error:', message, source, lineno);
                
                const errorInfo = {
                    message: message,
                    source: source,
                    lineno: lineno,
                    colno: colno,
                    stack: error ? error.stack : null,
                    timestamp: new Date().toISOString()
                };
                
                // Push to general errors collection
                window.jsErrors.push(errorInfo);
                
                // Check if it's an undefined variable error
                if (message && (
                    message.includes('is not defined') || 
                    message.includes('undefined') ||
                    message.includes('null') ||
                    message.includes('cannot read property')
                )) {
                    // Try to extract variable name
                    let varName = 'unknown';
                    const varMatch = message.match(/([a-zA-Z0-9_$]+) is (not defined|undefined)/);
                    if (varMatch) {
                        varName = varMatch[1];
                    }
                    
                    // Add to undefined vars collection
                    window.undefinedVars.push({
                        ...errorInfo,
                        variableName: varName
                    });
                    
                    console.error(`Variable '${varName}' is undefined/not defined. Check initialization and spelling.`);
                }
                
                // Check if it's a module/import error
                if (message && (
                    message.includes('import') || 
                    message.includes('export') ||
                    message.includes('module') ||
                    source && (source.includes('import') || source.includes('export'))
                )) {
                    // Add to module errors collection
                    window.moduleErrors.push(errorInfo);
                    console.error(`Module/import error detected: ${message}`);
                }
                
                // Return true to indicate we've handled the error
                return true;
            };
            
            // Enhanced unhandled promise rejection handler
            window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled Promise Rejection:', event.reason);
                
                const errorInfo = {
                    message: event.reason.message || 'Unhandled Promise Rejection',
                    reason: event.reason.toString(),
                    stack: event.reason.stack,
                    timestamp: new Date().toISOString()
                };
                
                // Push to general errors collection
                window.jsErrors.push(errorInfo);
                
                // Extract source information from stack trace if available
                let sourceFile = 'unknown';
                if (event.reason && event.reason.stack) {
                    const stackMatch = event.reason.stack.match(/at (?:.*?)([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?/);
                    if (stackMatch) {
                        sourceFile = stackMatch[1];
                        errorInfo.sourceFile = sourceFile;
                    }
                }
                
                // Check if it's a module error
                if (errorInfo.message && (
                    errorInfo.message.includes('import') || 
                    errorInfo.message.includes('export') ||
                    errorInfo.message.includes('module')
                )) {
                    window.moduleErrors.push(errorInfo);
                }
            });
            
            // Enhanced dynamic import error tracking
            const originalImport = window.import;
            if (typeof originalImport === 'function') {
                window.import = function() {
                    return originalImport.apply(this, arguments)
                        .catch(error => {
                            console.error(`Dynamic import error:`, error);
                            
                            const errorInfo = {
                                message: error.message,
                                modulePath: arguments[0],
                                stack: error.stack,
                                timestamp: new Date().toISOString()
                            };
                            
                            window.moduleErrors.push(errorInfo);
                            window.jsErrors.push(errorInfo);
                            
                            // Re-throw the error to maintain original behavior
                            throw error;
                        });
                };
            }
            
            // Track resource loading errors with enhanced information
            const originalCreateElement = document.createElement;
            document.createElement = function() {
                const element = originalCreateElement.apply(document, arguments);
                
                if (arguments[0].toLowerCase() === 'script') {
                    element.addEventListener('error', (e) => {
                        const src = e.target.src || 'inline script';
                        const errorInfo = {
                            type: 'script',
                            src: src,
                            filename: src.split('/').pop(),
                            timestamp: new Date().toISOString()
                        };
                        window.jsErrors.push(errorInfo);
                        
                        // Check if it's a module
                        if (e.target.type === 'module' || src.includes('module') || src.includes('import')) {
                            window.moduleErrors.push(errorInfo);
                            console.error(`Module script load error: ${src}`);
                        } else {
                            console.error(`Script load error: ${src}`);
                        }
                    });
                }
                
                if (arguments[0].toLowerCase() === 'link' && element.rel === 'stylesheet') {
                    element.addEventListener('error', (e) => {
                        const href = e.target.href;
                        console.error(`Stylesheet load error: ${href}`);
                        window.jsErrors.push({
                            type: 'stylesheet',
                            src: href,
                            filename: href.split('/').pop(),
                            timestamp: new Date().toISOString()
                        });
                    });
                }
                
                if (arguments[0].toLowerCase() === 'img') {
                    element.addEventListener('error', (e) => {
                        const src = e.target.src;
                        console.error(`Image load error: ${src}`);
                        window.jsErrors.push({
                            type: 'image',
                            src: src,
                            filename: src.split('/').pop(),
                            timestamp: new Date().toISOString()
                        });
                    });
                }
                
                return element;
            };
            """
            
            # Add a special route to intercept HTML and inject early error detection
            async def intercept_html(route, request):
                response = await route.fetch()
                content_type = response.headers.get('content-type', '')
                
                if 'text/html' in content_type:
                    # Get original HTML content
                    html = await response.text()
                    
                    # Insert our script as early as possible to detect syntax errors
                    head_pos = html.find('<head>')
                    if head_pos >= 0:
                        html = html[:head_pos+6] + f'<script>{detect_script}</script>' + html[head_pos+6:]
                    else:
                        # If no head tag, try to insert at the start of body or html
                        body_pos = html.find('<body>')
                        if body_pos >= 0:
                            html = html[:body_pos+6] + f'<script>{detect_script}</script>' + html[body_pos+6:]
                        else:
                            html_pos = html.find('<html>')
                            if html_pos >= 0:
                                html = html[:html_pos+6] + f'<script>{detect_script}</script>' + html[html_pos+6:]
                    
                    await route.fulfill(
                        status=response.status,
                        headers={**response.headers, 'content-length': str(len(html))},
                        body=html
                    )
                else:
                    await route.continue_()
            
            # Apply the interception to all HTML pages
            await context.route('**/*.html', intercept_html)
            await context.route(url, intercept_html)
            
            # Capture console logs and errors
            page = await context.new_page()
            
            # Enable verbose logging for all browser operations
            page.on("console", lambda msg: logging.info(f"CONSOLE: {msg.type} - {msg.text}"))
            
            # Listen for all console messages
            async def handle_console(msg: ConsoleMessage):
                msg_type = msg.type.lower()
                msg_text = f"{msg.text}"
                
                # Store in the appropriate category
                if msg_type in result["console_logs"]:
                    result["console_logs"][msg_type].append(msg_text)
                else:
                    result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
                
                # Also store errors in the legacy field for backwards compatibility
                if msg_type == "error":
                    result["console_errors"].append(f"error: {msg_text}")
                
                # Extract source file and line info from console error message
                source_file = None
                line_number = None
                column_number = None
                
                # Try to extract source information from console message
                # Pattern like: "filename.js:123:45" or "path/to/filename.js:123:45"
                file_match = re.search(r'([a-zA-Z0-9._\-/\\]+\.(js|css|html|jsx|tsx))(?::([0-9]+))?(?::([0-9]+))?', msg_text)
                if file_match:
                    source_file = file_match.group(1)
                    line_number = int(file_match.group(3)) if file_match.group(3) else None
                    column_number = int(file_match.group(4)) if file_match.group(4) else None
                    
                # Create structured error for console errors
                if msg_type == "error":
                    structured_error = self._create_structured_error(
                        message=msg_text,
                        error_type="console_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="console_message"
                    )
                    result["structured_errors"].append(structured_error)
                
                # Check for specific error patterns
                lower_text = msg_text.lower()
                
                # Debug log for all error messages to ensure we're seeing them
                if msg_type == "error" or "error" in lower_text:
                    logging.error(f"RAW BROWSER ERROR: {msg_text}")
                
                # Check for network errors
                if "failed to load resource" in lower_text or "net::" in lower_text:
                    result["network_errors"].append(msg_text)
                    # Add structured network error
                    network_error = self._create_structured_error(
                        message=msg_text,
                        error_type="network_error",
                        source_file=source_file,
                        line_number=line_number,
                        context="resource_loading"
                    )
                    result["structured_errors"].append(network_error)
                    
                # Improved syntax error detection with more patterns
                syntax_error_patterns = [
                    "parseerror", 
                    "syntax error", 
                    "syntaxerror", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input", 
                    "missing )", 
                    "missing }", 
                    "missing ]"
                ]
                
                if any(pattern in lower_text for pattern in syntax_error_patterns):
                    result["parse_errors"].append(msg_text)
                    logging.error(f"Syntax error detected: {msg_text}")
                    
                    # Add structured syntax error
                    syntax_error = self._create_structured_error(
                        message=msg_text,
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="syntax"
                    )
                    result["structured_errors"].append(syntax_error)
                    
                # Source map errors
                if "source map" in lower_text and "error" in lower_text:
                    result["parse_errors"].append(msg_text)
                    
                    # Add structured source map error
                    sourcemap_error = self._create_structured_error(
                        message=msg_text,
                        error_type="sourcemap_error",
                        source_file=source_file,
                        line_number=line_number,
                        context="source_mapping"
                    )
                    result["structured_errors"].append(sourcemap_error)
                
                # Log to Python console for debugging
                log_level = logging.INFO if msg_type != "error" else logging.ERROR
                logging.log(log_level, f"Browser console {msg_type}: {msg_text}")
            
            # Listen for page errors (including syntax errors)
            async def handle_page_error(error):
                # Try to extract source file information from the error message
                error_str = str(error)
                source_file = None
                line_number = None
                column_number = None
                error_type = "runtime_error"  # Default error type
                
                # More comprehensive matching for source file patterns in error messages
                # 1. First try to match the common pattern: "at Function (file.js:123:45)"
                file_match = re.search(r'at (?:.*?)(?:\()?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))(?::([0-9]+))?(?::([0-9]+))?(?:\))?', error_str)
                if file_match:
                    source_file = file_match.group(1)
                    line_number = int(file_match.group(3)) if file_match.group(3) else None
                    column_number = int(file_match.group(4)) if file_match.group(4) else None
                else:
                    # 2. Try to match module import patterns: "Error loading module from "file.js""
                    module_match = re.search(r'(?:loading|importing|from|module) ["\']([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']', error_str)
                    if module_match:
                        source_file = module_match.group(1)
                        error_type = "module_error"
                    else:
                        # 3. Try to match filename patterns in the error message
                        filename_match = re.search(r'(?:in|at|from) ["\']?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']?', error_str)
                        if filename_match:
                            source_file = filename_match.group(1)
                
                # Extract just the filename without full path for cleaner display
                filename = None
                if source_file and '/' in source_file:
                    filename = source_file.split('/')[-1]
                else:
                    filename = source_file
                
                # Format the error message with source file if available
                if source_file:
                    error_msg = f"Page error: {error} [Source: {filename}]"
                else:
                    error_msg = f"Page error: {error}"
                    
                result["js_exceptions"].append(error_msg)
                logging.error(f"RAW PAGE ERROR: {error}")
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(error_msg)
                
                # Create structured error
                structured_error = self._create_structured_error(
                    message=str(error),
                    error_type=error_type,
                    source_file=source_file,
                    line_number=line_number,
                    column_number=column_number,
                    stack=getattr(error, 'stack', None),
                    context="page_error"
                )
                result["structured_errors"].append(structured_error)
                
                # Check for common runtime errors like "X is undefined"
                error_text = str(error).lower()
                runtime_error_patterns = [
                    "is not defined",
                    "is undefined",
                    "cannot read property",
                    "cannot read properties of undefined",
                    "null is not an object",
                    "is not a function"
                ]
                
                # Special handling for runtime errors to preserve the full stack trace
                if any(pattern in error_text for pattern in runtime_error_patterns):
                    # Get the original error message with stack trace
                    full_error = str(error)
                    # Add this as a special entry to ensure it's captured in feedback
                    result["console_logs"]["error"].append(full_error)
                    
                    # Extract the variable name if possible
                    for pattern in runtime_error_patterns:
                        if pattern in error_text:
                            # Try to extract the variable name
                            var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', error_text)
                            if var_match:
                                var_name = var_match.group(1)
                                # Add a clearer message highlighting the variable name and source file
                                source_info = f" [Source: {filename}]" if source_file else ""
                                clear_msg = f"Runtime Error: Variable '{var_name}' {pattern}. Check variable initialization and spelling.{source_info}"
                                result["js_exceptions"].append(clear_msg)
                                result["console_errors"].append(clear_msg)
                                result["console_logs"]["error"].append(clear_msg)
                                
                                # Add more specific structured error for variable errors
                                var_error = self._create_structured_error(
                                    message=f"Variable '{var_name}' {pattern}",
                                    error_type="reference_error",
                                    source_file=source_file,
                                    line_number=line_number,
                                    column_number=column_number,
                                    stack=getattr(error, 'stack', None),
                                    context="undefined_variable"
                                )
                                result["structured_errors"].append(var_error)
                                
                                # Log this clearly for debugging
                                logging.error(f"VARIABLE ERROR: {clear_msg}")
                            break
                
                # Check if it's a parse/syntax error
                syntax_error_patterns = [
                    "syntaxerror", 
                    "parseerror", 
                    "syntax error", 
                    "parse error", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input"
                ]
                
                if any(pattern in error_text for pattern in syntax_error_patterns):
                    # Include source file in the syntax error message if available
                    source_info = f" [Source: {filename}]" if source_file else ""
                    parse_error_msg = f"{error_msg}{source_info}"
                    result["parse_errors"].append(parse_error_msg)
                    logging.error(f"Syntax error detected in page: {parse_error_msg}")
                    
                    # Add structured syntax error
                    syntax_error = self._create_structured_error(
                        message=str(error),
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        stack=getattr(error, 'stack', None),
                        context="syntax"
                    )
                    result["structured_errors"].append(syntax_error)
                    
                    # For SyntaxError, add a cleaner message to parse_errors
                    if "syntaxerror" in error_text:
                        # Try to extract just the syntax error message without stack trace
                        error_str = str(error)
                        if ": " in error_str:
                            error_message = error_str.split(": ", 1)[1].split("\n")[0].strip()
                            clean_error = f"Uncaught SyntaxError: {error_message}{source_info}"
                            result["parse_errors"].append(clean_error)
                            logging.error(f"Uncaught SyntaxError: {clean_error}")
                
                # Explicit check for "false is an invalid identifier" error
                if "false is an invalid identifier" in error_str:
                    source_info = f" [Source: {filename}]" if source_file else ""
                    error_msg = f"Uncaught SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    logging.error(f"Special syntax error detected in page: {error_msg}")
                    
                    # Add structured invalid identifier error
                    invalid_id_error = self._create_structured_error(
                        message="false is an invalid identifier",
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="invalid_identifier"
                    )
                    result["structured_errors"].append(invalid_id_error)
            
            # Listen for uncaught exceptions
            async def handle_exception(exception):
                # Try to extract source file information from the error message
                error_str = str(exception)
                source_file = None
                
                # More comprehensive matching for source file patterns in error messages
                # 1. First try to match the common pattern: "at Function (file.js:123:45)"
                file_match = re.search(r'at (?:.*?)(?:\()?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?(?:\))?', error_str)
                if file_match:
                    source_file = file_match.group(1)
                else:
                    # 2. Try to match module import patterns: "Error loading module from "file.js""
                    module_match = re.search(r'(?:loading|importing|from|module) ["\']([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']', error_str)
                    if module_match:
                        source_file = module_match.group(1)
                    else:
                        # 3. Try to match filename patterns in the error message
                        filename_match = re.search(r'(?:in|at|from) ["\']?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']?', error_str)
                        if filename_match:
                            source_file = filename_match.group(1)
                
                # Extract just the filename without full path for cleaner display
                if source_file and '/' in source_file:
                    source_filename = source_file.split('/')[-1]
                else:
                    source_filename = source_file
                
                # Format the error message with source file if available
                if source_file:
                    error_msg = f"Uncaught exception: {exception} [Source: {source_filename}]"
                else:
                    error_msg = f"Uncaught exception: {exception}"
                
                result["js_exceptions"].append(error_msg)
                logging.error(error_msg)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(error_msg)
                
                # Create structured error
                structured_error = self._create_structured_error(
                    message=str(exception),
                    error_type="exception",
                    source_file=source_file,
                    stack=getattr(exception, 'stack', None),
                    context="uncaught_exception"
                )
                result["structured_errors"].append(structured_error)
                
                # Check if it's our target syntax error
                if "false is an invalid identifier" in str(exception):
                    source_info = f" [Source: {source_filename}]" if source_file else ""
                    error_msg = f"Uncaught SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    result["js_exceptions"].append(error_msg)
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    
                    # Add structured invalid identifier error
                    invalid_id_error = self._create_structured_error(
                        message="false is an invalid identifier",
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="invalid_identifier"
                    )
                    result["structured_errors"].append(invalid_id_error)
                
                # Check for runtime errors like undefined variables
                error_text = str(exception).lower()
                runtime_error_patterns = [
                    "is not defined",
                    "is undefined",
                    "cannot read property",
                    "cannot read properties of undefined"
                ]
                
                # Handle runtime errors
                for pattern in runtime_error_patterns:
                    if pattern in error_text:
                        # Try to extract the variable name
                        var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', error_text)
                        if var_match:
                            var_name = var_match.group(1)
                            # Add clearer message with source file
                            source_info = f" [Source: {source_filename}]" if source_file else ""
                            clear_msg = f"Runtime Error: Variable '{var_name}' {pattern}. Check variable initialization and spelling.{source_info}"
                            result["js_exceptions"].append(clear_msg)
                            result["console_errors"].append(clear_msg)
                            result["console_logs"]["error"].append(clear_msg)
                            logging.error(f"VARIABLE ERROR: {clear_msg}")
                        # Always keep the full error with stack trace
                        result["console_logs"]["error"].append(str(exception))
                        break
            
            # Listen for failed network requests
            async def handle_request_failed(request):
                url = request.url
                error_msg = f"Network request failed: {url}"
                result["network_errors"].append(error_msg)
                logging.error(error_msg)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Also add to console logs for consistency
                result["console_logs"]["error"].append(error_msg)
                
                # Add structured network error
                network_error = self._create_structured_error(
                    message=error_msg,
                    error_type="network_error",
                    source_file=url,  # Use URL as the source
                    context="request_failed"
                )
                result["structured_errors"].append(network_error)
            
            # Listen for resource loading errors (CSS, images, etc.)
            async def handle_response(response):
                if response.status >= 400:  # HTTP error codes
                    url = response.url
                    status = response.status
                    error_msg = f"Resource loading error: {url} (Status: {status})"
                    result["resource_errors"].append(error_msg)
                    logging.error(error_msg)
                    
                    # Add to console errors
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    
                    # Add structured resource error
                    resource_error = self._create_structured_error(
                        message=error_msg,
                        error_type="resource_error",
                        source_file=url,  # Use URL as the source
                        context="http_error",
                        stack={"status": status}
                    )
                    result["structured_errors"].append(resource_error)
            
            # Set up all event listeners
            page.on("console", handle_console)
            page.on("pageerror", handle_page_error)
            page.on("crash", lambda: logging.error("Page crashed"))
            page.on("requestfailed", handle_request_failed)
            page.on("response", handle_response)
            
            # Custom error extraction function
            await page.evaluate("""() => {
                // Report all syntax errors immediately
                window.checkForSyntaxErrors = function() {
                    try {
                        // Try to find any syntax errors in inline scripts
                        const scripts = document.querySelectorAll('script:not([src])');
                        scripts.forEach((script, index) => {
                            try {
                                // Try to compile the script content to check for syntax errors
                                new Function(script.textContent);
                            } catch (e) {
                                if (e instanceof SyntaxError) {
                                    console.error(`Syntax error in inline script #${index}: ${e.message}`);
                                    // Check specifically for "false is an invalid identifier"
                                    if (e.message.includes("false is an invalid identifier")) {
                                        console.error("Detected critical syntax error: false is an invalid identifier");
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error("Error checking for syntax errors:", e);
                    }
                };
                
                // Run syntax check after a short delay
                setTimeout(window.checkForSyntaxErrors, 500);
                
                // Add additional error listeners
                window.addEventListener('error', (event) => {
                    // Get source file and line information
                    const sourceInfo = event.filename ? ` [Source: ${event.filename.split('/').pop()}]` : '';
                    console.error(`JS Error: ${event.message}${sourceInfo}`, 'at line', event.lineno);
                    
                    // Special handling for syntax errors
                    if (event.error instanceof SyntaxError) {
                        console.error(`SyntaxError details: ${event.error.message}${sourceInfo}`);
                        
                        // Special check for our target error
                        if (event.error.message.includes("false is an invalid identifier")) {
                            console.error(`Detected 'false is an invalid identifier' error${sourceInfo}`);
                        }
                    }
                    
                    // Specific handling for undefined variables
                    if (event.message && (
                        event.message.includes("is not defined") || 
                        event.message.includes("is undefined") ||
                        event.message.includes("cannot read property") ||
                        event.message.includes("Cannot read properties of undefined")
                    )) {
                        // Try to extract the variable name
                        const varMatch = event.message.match(/([a-zA-Z0-9_$]+) is (not defined|undefined)/);
                        if (varMatch) {
                            const varName = varMatch[1];
                            console.error(`Runtime Error: Variable '${varName}' is undefined/not defined${sourceInfo}. Check variable initialization and spelling.`);
                        }
                    }
                });
                
                // Add handler for unhandled promise rejections with source tracking
                window.addEventListener('unhandledrejection', (event) => {
                    // Try to extract source information from stack trace if available
                    let sourceInfo = '';
                    if (event.reason && event.reason.stack) {
                        const stackMatch = event.reason.stack.match(/at (?:.*?)([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?/);
                        if (stackMatch) {
                            sourceInfo = ` [Source: ${stackMatch[1]}]`;
                        }
                    }
                    console.error(`Unhandled Promise Rejection: ${event.reason}${sourceInfo}`);
                });
                
                // Track resource loading errors
                const originalCreateElement = document.createElement;
                document.createElement = function() {
                    const element = originalCreateElement.apply(document, arguments);
                    
                    if (arguments[0].toLowerCase() === 'script') {
                        element.addEventListener('error', (e) => {
                            console.error(`Script load error: ${e.target.src} [Source: ${e.target.src.split('/').pop()}]`);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'link' && element.rel === 'stylesheet') {
                        element.addEventListener('error', (e) => {
                            console.error(`Stylesheet load error: ${e.target.href} [Source: ${e.target.href.split('/').pop()}]`);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'img') {
                        element.addEventListener('error', (e) => {
                            console.error(`Image load error: ${e.target.src} [Source: ${e.target.src.split('/').pop()}]`);
                        });
                    }
                    
                    return element;
                };
            }""")
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded and run our custom error checker
                await page.wait_for_timeout(2000)
                
                # Direct evaluation to check for specific syntax error
                try:
                    await page.evaluate("""() => {
                        // Run syntax check again
                        if (window.checkForSyntaxErrors) {
                            window.checkForSyntaxErrors();
                        }
                        
                        // Check page source for specific error patterns
                        const pageSource = document.documentElement.outerHTML;
                        if (pageSource.includes("false is an invalid identifier")) {
                            console.error("Found 'false is an invalid identifier' in page source");
                        }
                    }""")
                except Exception as e:
                    logging.error(f"Error running syntax check script: {e}")
                    # If we got a syntax error here, it's likely what we're looking for
                    if "false is an invalid identifier" in str(e):
                        error_msg = "Uncaught SyntaxError: false is an invalid identifier"
                        result["parse_errors"].append(error_msg)
                        result["js_exceptions"].append(error_msg)
                        result["console_errors"].append(error_msg)
                        result["console_logs"]["error"].append(error_msg)
                        logging.error(f"Syntax error confirmed: {error_msg}")
                
                # Collect detailed JavaScript errors from our enhanced tracking
                try:
                    js_errors = await page.evaluate("window.jsErrors || []")
                    if js_errors and len(js_errors) > 0:
                        logging.info(f"Collected {len(js_errors)} JavaScript errors from enhanced tracking")
                        for error in js_errors:
                            # Format the error message
                            error_msg = f"JavaScript Error: {error.get('message', 'Unknown error')}"
                            if 'source' in error and error['source']:
                                error_msg += f" (Source: {error['source']}:{error.get('lineno', '?')})"
                            # if 'stack' in error and error['stack']:
                            #     error_msg += f"\nStack: {error['stack']}"
                                
                            # Add to appropriate error collections
                            result["js_exceptions"].append(error_msg)
                            result["console_errors"].append(error_msg)
                            result["console_logs"]["error"].append(error_msg)
                            logging.error(f"Enhanced JS error: {error_msg}")
                    
                    # Collect module-specific errors
                    module_errors = await page.evaluate("window.moduleErrors || []")
                    if module_errors and len(module_errors) > 0:
                        logging.info(f"Collected {len(module_errors)} module/import errors")
                        
                        # Add a specific category for module errors
                        if "module_errors" not in result:
                            result["module_errors"] = []
                            
                        for error in module_errors:
                            # Format the module error message
                            error_msg = f"Module/Import Error: {error.get('message', 'Unknown module error')}"
                            if 'source' in error and error['source']:
                                # Extract the file name from the source path
                                if 'source' in error and error['source']:
                                    source_path = error['source']
                                    file_name = source_path.split('/')[-1].split(':')[0] if '/' in source_path else source_path.split('\\')[-1].split(':')[0] if '\\' in source_path else source_path
                                    error['fileName'] = file_name
                                error_msg += f" (Source: {file_name}:{error.get('lineno', '?')})"
                            if 'modulePath' in error:
                                error_msg += f" (Module: {error['modulePath']})"
                            # if 'stack' in error and error['stack']:
                            #     error_msg += f"\nStack: {error['stack']}"
                                
                            # Add to module errors and general error collections
                            result["module_errors"].append(error_msg)
                            result["js_exceptions"].append(error_msg)
                            result["console_errors"].append(error_msg)
                            result["console_logs"]["error"].append(error_msg)
                            logging.error(f"Module error: {error_msg}")
                    
                    # Collect undefined variable errors
                    undefined_vars = await page.evaluate("window.undefinedVars || []")
                    if undefined_vars and len(undefined_vars) > 0:
                        logging.info(f"Collected {len(undefined_vars)} undefined variable errors")
                        
                        # Add a specific category for undefined variables
                        if "undefined_vars" not in result:
                            result["undefined_vars"] = []
                            
                        for error in undefined_vars:
                            # Format the undefined variable error message
                            var_name = error.get('variableName', 'unknown')
                            error_msg = f"Undefined Variable: '{var_name}'"
                            if 'source' in error and error['source']:
                                # Extract the file name from the source path
                                if 'source' in error and error['source']:
                                    source_path = error['source']
                                    file_name = source_path.split('/')[-1].split(':')[0] if '/' in source_path else source_path.split('\\')[-1].split(':')[0] if '\\' in source_path else source_path
                                    error['fileName'] = file_name
                                error_msg += f" (Source: {file_name}:{error.get('lineno', '?')})"
                            # if 'stack' in error and error['stack']:
                            #     error_msg += f"\nStack: {error['stack']}"
                                
                            # Add to undefined vars and general error collections
                            result["undefined_vars"].append(error_msg)
                            result["js_exceptions"].append(error_msg)
                            result["console_errors"].append(error_msg)
                            result["console_logs"]["error"].append(error_msg)
                            logging.error(f"Undefined variable: {error_msg}")
                    
                except Exception as e:
                    logging.error(f"Error collecting enhanced error data: {e}")
                
                # Take initial screenshot
                screenshot_path = await self._save_screenshot(page, screenshots_dir, "state_initial_load.png")
                if screenshot_path:
                    result["screenshots"].append(screenshot_path)
                
                # Check for canvas elements
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                result["canvas_found"] = canvas_count > 0
                result["canvas_count"] = canvas_count
                
                # Get page content and manually check for syntax errors
                page_content = await page.content()
                if "false is an invalid identifier" in page_content:
                    error_msg = "Uncaught SyntaxError: false is an invalid identifier"
                    result["parse_errors"].append(error_msg)
                    result["js_exceptions"].append(error_msg)
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    logging.error(f"Found syntax error in page content: {error_msg}")
                
                # Look for "error" in any console message type
                has_error_messages = False
                error_messages = []
                
                # Log all console messages to make debugging easier
                logging.info("All console messages during game load:")
                for msg_type, messages in result["console_logs"].items():
                    for msg in messages:
                        logging.info(f"  - [{msg_type}] {msg}")
                        if "error" in msg.lower():
                            has_error_messages = True
                            error_messages.append(msg)
                
                # Log JavaScript exceptions separately
                if result["js_exceptions"]:
                    logging.error("JavaScript syntax errors and exceptions:")
                    for exception in result["js_exceptions"]:
                        logging.error(f"  - {exception}")
                        has_error_messages = True
                        error_messages.append(exception)
                
                # Log network errors separately
                if result["network_errors"]:
                    logging.error("Network request errors:")
                    for error in result["network_errors"]:
                        logging.error(f"  - {error}")
                        has_error_messages = True
                        error_messages.append(error)
                
                # Log resource errors separately
                if result["resource_errors"]:
                    logging.error("Resource loading errors:")
                    for error in result["resource_errors"]:
                        logging.error(f"  - {error}")
                        has_error_messages = True
                        error_messages.append(error)
                
                # Log parse errors separately
                if result["parse_errors"]:
                    logging.error("JavaScript parse/syntax errors:")
                    for error in result["parse_errors"]:
                        logging.error(f"  - {error}")
                        has_error_messages = True
                        error_messages.append(error)
                
                # Test passes if there are no errors and at least one canvas is found
                result["test_result"] = not has_error_messages and result["canvas_found"]
                
                # If test failed due to console errors or JS exceptions, include them in a dedicated field
                if not result["test_result"] and has_error_messages:
                    result["console_error_message"] = "\n".join(error_messages)
                    result["error"] = f"Game did not load on the webpage: {len(error_messages)} error messages detected in console."
                    
                    # Log the errors
                    logging.error("Console errors during game load:")
                    for err in error_messages:
                        logging.error(f"  - {err}")
                elif not result["test_result"] and not result["canvas_found"]:
                    result["error"] = "Game load test failed: No canvas element found."
                
                # Add additional information
                result["page_title"] = await page.title()
                
                # Deduplicate structured errors before returning
                result["structured_errors"] = self._deduplicate_errors(result["structured_errors"])
                
            except Exception as e:
                logging.error(f"Error in browser interaction: {e}")
                result["error"] = f"Browser interaction error: {e}"
                
                # Check if the exception is related to our target syntax error
                if "false is an invalid identifier" in str(e):
                    error_msg = "Uncaught SyntaxError: false is an invalid identifier"
                    result["parse_errors"].append(error_msg)
                    result["js_exceptions"].append(error_msg)
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    logging.error(f"Syntax error found in exception: {error_msg}")
            finally:
                await browser.close()
                
        return result
    
    async def _save_screenshot(self, page: Page, directory: str, filename: str) -> str:
        """Save a screenshot and return the path."""
        try:
            # Add frame prefix to filename
            prefixed_filename = filename
            self.frame_counter += 1  # Increment frame counter
            
            # Capture full page screenshot to a temporary file
            temp_path = os.path.join(directory, "temp_screenshot.png")
            await page.screenshot(path=temp_path, full_page=True)
            
            # Resize the image to save space (by a factor of 4)
            full_path = os.path.join(directory, prefixed_filename)
            with Image.open(temp_path) as img:
                # Calculate new size (1/4 of original)
                new_width = img.width // 4
                new_height = img.height // 4
                # Resize the image
                resized_img = img.resize((new_width, new_height), Image.LANCZOS)
                # Save resized image
                resized_img.save(full_path)
                
            # Remove temporary file
            os.remove(temp_path)
            
            logging.info(f"Screenshot saved to {full_path} (resized by factor of 4)")
            return full_path
        except Exception as e:
            logging.error(f"Error saving screenshot: {e}")
            return ""
    
    async def test_game_interaction(self) -> Dict[str, Any]:
        """
        Tests game interaction by starting the game and performing random actions.
        
        Returns:
            Dictionary with test results
        """
        if not self.enabled:
            return {
                "test_result": False,
                "error": "Headless browser not enabled. Install playwright."
            }
            
        if not self.is_html_file and not self.server_process:
            return {
                "test_result": False,
                "error": "Server not running. Use within 'async with' context."
            }
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        interaction_results = await self._test_interaction(url)
        
        # Structure the final results to show game start and random action tests separately
        final_results = {
            "test_result": interaction_results["test_result"],
            "interaction_test": {
                "overall_result": interaction_results["test_result"],
                "game_start_test": {
                    "test_result": interaction_results["game_start_test"]["test_result"],
                    "diff_score": interaction_results["game_start_test"]["diff_score"],
                    "screenshot": interaction_results["game_start_test"]["screenshot"]
                },
                "gameplay_test": {
                    "test_result": interaction_results["gameplay_test"]["test_result"],
                    "key_changes_detected": len([score for score in interaction_results["gameplay_test"]["diff_scores"] if score > 0.001]),
                    "total_actions": len(interaction_results["gameplay_test"]["diff_scores"]),
                    "max_diff_score": max(interaction_results["gameplay_test"]["diff_scores"]) if interaction_results["gameplay_test"]["diff_scores"] else 0
                }
            },
            "console_logs": interaction_results["console_logs"],
            "console_errors": interaction_results["console_errors"],  # For backwards compatibility
            "structured_errors": interaction_results.get("structured_errors", []),  # Include structured errors
            "screenshots": interaction_results["screenshots"],
            "error": interaction_results.get("error", None)
        }
        
        # Add console error message if present
        if "console_error_message" in interaction_results:
            final_results["console_error_message"] = interaction_results["console_error_message"]
        
        # Add key presses with errors information if available
        if "key_presses_with_errors" in interaction_results:
            final_results["key_presses_with_errors"] = interaction_results["key_presses_with_errors"]
        
        # Add game phase information to game_start_test results if available
        if "game_phase_after_enter" in interaction_results["game_start_test"]:
            final_results["interaction_test"]["game_start_test"]["game_phase_after_enter"] = interaction_results["game_start_test"]["game_phase_after_enter"]
            final_results["interaction_test"]["game_start_test"]["game_phase_check_passed"] = interaction_results["game_start_test"]["game_phase_check_passed"]
        
        # Add the detailed results if available
        if "random_actions" in interaction_results:
            final_results["interaction_test"]["gameplay_test"]["detailed_actions"] = interaction_results["random_actions"]
        
        return final_results
    
    async def _test_interaction(self, url: str) -> Dict[str, Any]:
        """
        Tests game interaction with ENTER and random key presses.
        
        Args:
            url: URL to the game
            
        Returns:
            Dictionary with test results
        """
        result = {
            "test_result": False,
            "console_logs": {
                "error": [],
                "warning": [],
                "info": [],
                "log": [],
                "debug": [],
                "other": []
            },
            "console_errors": [],  # Keep for backwards compatibility
            "structured_errors": [], # New field for structured errors
            "js_exceptions": [],   # For JS syntax errors and exceptions
            "network_errors": [],  # For tracking network request failures
            "resource_errors": [], # For tracking resource loading failures
            "parse_errors": [],    # For syntax/parse errors in scripts
            "visual_changes": [],
            "key_tests": [],
            "screenshots": [],
            "game_start_test": {
                "test_result": False,
                "diff_score": 0,
                "screenshot": ""
            },
            "gameplay_test": {
                "test_result": False,
                "diff_scores": [],
                "screenshots": []
            }
        }
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(os.path.dirname(self.game_path), "game_check_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            # Listen for all console messages
            async def handle_console(msg: ConsoleMessage):
                msg_type = msg.type.lower()
                msg_text = f"{msg.text}"
                
                # Store in the appropriate category
                if msg_type in result["console_logs"]:
                    result["console_logs"][msg_type].append(msg_text)
                else:
                    result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
                
                # Also store errors in the legacy field for backwards compatibility
                if msg_type == "error":
                    result["console_errors"].append(f"error: {msg_text}")
                
                # Extract source file and line info from console error message
                source_file = None
                line_number = None
                column_number = None
                
                # Try to extract source information from console message
                # Pattern like: "filename.js:123:45" or "path/to/filename.js:123:45"
                file_match = re.search(r'([a-zA-Z0-9._\-/\\]+\.(js|css|html|jsx|tsx))(?::([0-9]+))?(?::([0-9]+))?', msg_text)
                if file_match:
                    source_file = file_match.group(1)
                    line_number = int(file_match.group(3)) if file_match.group(3) else None
                    column_number = int(file_match.group(4)) if file_match.group(4) else None
                    
                # Create structured error for console errors
                if msg_type == "error":
                    structured_error = self._create_structured_error(
                        message=msg_text,
                        error_type="console_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="console_message"
                    )
                    result["structured_errors"].append(structured_error)
                
                # Check for specific error patterns
                lower_text = msg_text.lower()
                
                # Debug log for all error messages to ensure we're seeing them
                if msg_type == "error" or "error" in lower_text:
                    logging.error(f"RAW BROWSER ERROR: {msg_text}")
                
                # Check for network errors
                if "failed to load resource" in lower_text or "net::" in lower_text:
                    result["network_errors"].append(msg_text)
                    # Add structured network error
                    network_error = self._create_structured_error(
                        message=msg_text,
                        error_type="network_error",
                        source_file=source_file,
                        line_number=line_number,
                        context="resource_loading"
                    )
                    result["structured_errors"].append(network_error)
                    
                # Improved syntax error detection with more patterns
                syntax_error_patterns = [
                    "parseerror", 
                    "syntax error", 
                    "syntaxerror", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input", 
                    "missing )", 
                    "missing }", 
                    "missing ]"
                ]
                
                if any(pattern in lower_text for pattern in syntax_error_patterns):
                    result["parse_errors"].append(msg_text)
                    logging.error(f"Syntax error detected: {msg_text}")
                    
                    # Add structured syntax error
                    syntax_error = self._create_structured_error(
                        message=msg_text,
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="syntax"
                    )
                    result["structured_errors"].append(syntax_error)
                    
                # Source map errors
                if "source map" in lower_text and "error" in lower_text:
                    result["parse_errors"].append(msg_text)
                    
                    # Add structured source map error
                    sourcemap_error = self._create_structured_error(
                        message=msg_text,
                        error_type="sourcemap_error",
                        source_file=source_file,
                        line_number=line_number,
                        context="source_mapping"
                    )
                    result["structured_errors"].append(sourcemap_error)
                
                # Log to Python console for debugging
                log_level = logging.INFO if msg_type != "error" else logging.ERROR
                logging.log(log_level, f"Browser console {msg_type}: {msg_text}")
            
            # Listen for page errors (including syntax errors)
            async def handle_page_error(error):
                # Try to extract source file information from the error message
                error_str = str(error)
                source_file = None
                line_number = None
                column_number = None
                error_type = "runtime_error"  # Default error type
                
                # More comprehensive matching for source file patterns in error messages
                # 1. First try to match the common pattern: "at Function (file.js:123:45)"
                file_match = re.search(r'at (?:.*?)(?:\()?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))(?::([0-9]+))?(?::([0-9]+))?(?:\))?', error_str)
                if file_match:
                    source_file = file_match.group(1)
                    line_number = int(file_match.group(3)) if file_match.group(3) else None
                    column_number = int(file_match.group(4)) if file_match.group(4) else None
                else:
                    # 2. Try to match module import patterns: "Error loading module from "file.js""
                    module_match = re.search(r'(?:loading|importing|from|module) ["\']([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']', error_str)
                    if module_match:
                        source_file = module_match.group(1)
                        error_type = "module_error"
                    else:
                        # 3. Try to match filename patterns in the error message
                        filename_match = re.search(r'(?:in|at|from) ["\']?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']?', error_str)
                        if filename_match:
                            source_file = filename_match.group(1)
                
                # Extract just the filename without full path for cleaner display
                filename = None
                if source_file and '/' in source_file:
                    filename = source_file.split('/')[-1]
                else:
                    filename = source_file
                
                # Format the error message with source file if available
                if source_file:
                    error_msg = f"Page error: {error} [Source: {filename}]"
                else:
                    error_msg = f"Page error: {error}"
                    
                result["js_exceptions"].append(error_msg)
                logging.error(f"RAW PAGE ERROR: {error}")
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(error_msg)
                
                # Create structured error
                structured_error = self._create_structured_error(
                    message=str(error),
                    error_type=error_type,
                    source_file=source_file,
                    line_number=line_number,
                    column_number=column_number,
                    stack=getattr(error, 'stack', None),
                    context="page_error"
                )
                result["structured_errors"].append(structured_error)
                
                # Check for common runtime errors like "X is undefined"
                error_text = str(error).lower()
                runtime_error_patterns = [
                    "is not defined",
                    "is undefined",
                    "cannot read property",
                    "cannot read properties of undefined",
                    "null is not an object",
                    "is not a function"
                ]
                
                # Special handling for runtime errors to preserve the full stack trace
                if any(pattern in error_text for pattern in runtime_error_patterns):
                    # Get the original error message with stack trace
                    full_error = str(error)
                    # Add this as a special entry to ensure it's captured in feedback
                    result["console_logs"]["error"].append(full_error)
                    
                    # Extract the variable name if possible
                    for pattern in runtime_error_patterns:
                        if pattern in error_text:
                            # Try to extract the variable name
                            var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', error_text)
                            if var_match:
                                var_name = var_match.group(1)
                                # Add a clearer message highlighting the variable name and source file
                                source_info = f" [Source: {filename}]" if source_file else ""
                                clear_msg = f"Runtime Error: Variable '{var_name}' {pattern}. Check variable initialization and spelling.{source_info}"
                                result["js_exceptions"].append(clear_msg)
                                result["console_errors"].append(clear_msg)
                                result["console_logs"]["error"].append(clear_msg)
                                
                                # Add more specific structured error for variable errors
                                var_error = self._create_structured_error(
                                    message=f"Variable '{var_name}' {pattern}",
                                    error_type="reference_error",
                                    source_file=source_file,
                                    line_number=line_number,
                                    column_number=column_number,
                                    stack=getattr(error, 'stack', None),
                                    context="undefined_variable"
                                )
                                result["structured_errors"].append(var_error)
                                
                                # Log this clearly for debugging
                                logging.error(f"VARIABLE ERROR: {clear_msg}")
                            break
                
                # Check if it's a parse/syntax error
                syntax_error_patterns = [
                    "syntaxerror", 
                    "parseerror", 
                    "syntax error", 
                    "parse error", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input"
                ]
                
                if any(pattern in error_text for pattern in syntax_error_patterns):
                    # Include source file in the syntax error message if available
                    source_info = f" [Source: {filename}]" if source_file else ""
                    parse_error_msg = f"{error_msg}{source_info}"
                    result["parse_errors"].append(parse_error_msg)
                    logging.error(f"Syntax error detected in page: {parse_error_msg}")
                    
                    # Add structured syntax error
                    syntax_error = self._create_structured_error(
                        message=str(error),
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        stack=getattr(error, 'stack', None),
                        context="syntax"
                    )
                    result["structured_errors"].append(syntax_error)
                    
                    # For SyntaxError, add a cleaner message to parse_errors
                    if "syntaxerror" in error_text:
                        # Try to extract just the syntax error message without stack trace
                        error_str = str(error)
                        if ": " in error_str:
                            error_message = error_str.split(": ", 1)[1].split("\n")[0].strip()
                            clean_error = f"Uncaught SyntaxError: {error_message}{source_info}"
                            result["parse_errors"].append(clean_error)
                            logging.error(f"Uncaught SyntaxError: {clean_error}")
                
                # Explicit check for "false is an invalid identifier" error
                if "false is an invalid identifier" in error_str:
                    source_info = f" [Source: {filename}]" if source_file else ""
                    error_msg = f"Uncaught SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    logging.error(f"Special syntax error detected in page: {error_msg}")
                    
                    # Add structured invalid identifier error
                    invalid_id_error = self._create_structured_error(
                        message="false is an invalid identifier",
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="invalid_identifier"
                    )
                    result["structured_errors"].append(invalid_id_error)
            
            # Listen for uncaught exceptions
            async def handle_exception(exception):
                # Try to extract source file information from the error message
                error_str = str(exception)
                source_file = None
                
                # More comprehensive matching for source file patterns in error messages
                # 1. First try to match the common pattern: "at Function (file.js:123:45)"
                file_match = re.search(r'at (?:.*?)(?:\()?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?(?:\))?', error_str)
                if file_match:
                    source_file = file_match.group(1)
                else:
                    # 2. Try to match module import patterns: "Error loading module from "file.js""
                    module_match = re.search(r'(?:loading|importing|from|module) ["\']([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']', error_str)
                    if module_match:
                        source_file = module_match.group(1)
                    else:
                        # 3. Try to match filename patterns in the error message
                        filename_match = re.search(r'(?:in|at|from) ["\']?([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx))["\']?', error_str)
                        if filename_match:
                            source_file = filename_match.group(1)
                
                # Extract just the filename without full path for cleaner display
                if source_file and '/' in source_file:
                    source_filename = source_file.split('/')[-1]
                else:
                    source_filename = source_file
                
                # Format the error message with source file if available
                if source_file:
                    error_msg = f"Uncaught exception: {exception} [Source: {source_filename}]"
                else:
                    error_msg = f"Uncaught exception: {exception}"
                
                result["js_exceptions"].append(error_msg)
                logging.error(error_msg)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(error_msg)
                
                # Create structured error
                structured_error = self._create_structured_error(
                    message=str(exception),
                    error_type="exception",
                    source_file=source_file,
                    stack=getattr(exception, 'stack', None),
                    context="uncaught_exception"
                )
                result["structured_errors"].append(structured_error)
                
                # Check if it's our target syntax error
                if "false is an invalid identifier" in str(exception):
                    source_info = f" [Source: {source_filename}]" if source_file else ""
                    error_msg = f"Uncaught SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    result["js_exceptions"].append(error_msg)
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    
                    # Add structured invalid identifier error
                    invalid_id_error = self._create_structured_error(
                        message="false is an invalid identifier",
                        error_type="syntax_error",
                        source_file=source_file,
                        line_number=line_number,
                        column_number=column_number,
                        context="invalid_identifier"
                    )
                    result["structured_errors"].append(invalid_id_error)
                
                # Check for runtime errors like undefined variables
                error_text = str(exception).lower()
                runtime_error_patterns = [
                    "is not defined",
                    "is undefined",
                    "cannot read property",
                    "cannot read properties of undefined"
                ]
                
                # Handle runtime errors
                for pattern in runtime_error_patterns:
                    if pattern in error_text:
                        # Try to extract the variable name
                        var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', error_text)
                        if var_match:
                            var_name = var_match.group(1)
                            # Add clearer message with source file
                            source_info = f" [Source: {source_filename}]" if source_file else ""
                            clear_msg = f"Runtime Error: Variable '{var_name}' {pattern}. Check variable initialization and spelling.{source_info}"
                            result["js_exceptions"].append(clear_msg)
                            result["console_errors"].append(clear_msg)
                            result["console_logs"]["error"].append(clear_msg)
                            logging.error(f"VARIABLE ERROR: {clear_msg}")
                        # Always keep the full error with stack trace
                        result["console_logs"]["error"].append(str(exception))
                        break
            
            # Listen for failed network requests
            async def handle_request_failed(request):
                url = request.url
                error_msg = f"Network request failed: {url}"
                result["network_errors"].append(error_msg)
                logging.error(error_msg)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Also add to console logs for consistency
                result["console_logs"]["error"].append(error_msg)
                
                # Add structured network error
                network_error = self._create_structured_error(
                    message=error_msg,
                    error_type="network_error",
                    source_file=url,  # Use URL as the source
                    context="request_failed"
                )
                result["structured_errors"].append(network_error)
            
            # Listen for resource loading errors (CSS, images, etc.)
            async def handle_response(response):
                if response.status >= 400:  # HTTP error codes
                    url = response.url
                    status = response.status
                    error_msg = f"Resource loading error: {url} (Status: {status})"
                    result["resource_errors"].append(error_msg)
                    logging.error(error_msg)
                    
                    # Add to console errors
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    
                    # Add structured resource error
                    resource_error = self._create_structured_error(
                        message=error_msg,
                        error_type="resource_error",
                        source_file=url,  # Use URL as the source
                        context="http_error",
                        stack={"status": status}
                    )
                    result["structured_errors"].append(resource_error)
            
            # Set up all event listeners
            page.on("console", handle_console)
            page.on("pageerror", handle_page_error)
            page.on("crash", lambda: logging.error("Page crashed"))
            page.on("requestfailed", handle_request_failed)
            page.on("response", handle_response)
            
            # Custom error extraction function
            await page.evaluate("""() => {
                // Report all syntax errors immediately
                window.checkForSyntaxErrors = function() {
                    try {
                        // Try to find any syntax errors in inline scripts
                        const scripts = document.querySelectorAll('script:not([src])');
                        scripts.forEach((script, index) => {
                            try {
                                // Try to compile the script content to check for syntax errors
                                new Function(script.textContent);
                            } catch (e) {
                                if (e instanceof SyntaxError) {
                                    console.error(`Syntax error in inline script #${index}: ${e.message}`);
                                    // Check specifically for "false is an invalid identifier"
                                    if (e.message.includes("false is an invalid identifier")) {
                                        console.error("Detected critical syntax error: false is an invalid identifier");
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error("Error checking for syntax errors:", e);
                    }
                };
                
                // Run syntax check after a short delay
                setTimeout(window.checkForSyntaxErrors, 500);
                
                // Add additional error listeners
                window.addEventListener('error', (event) => {
                    // Get source file and line information
                    const sourceInfo = event.filename ? ` [Source: ${event.filename.split('/').pop()}]` : '';
                    console.error(`JS Error: ${event.message}${sourceInfo}`, 'at line', event.lineno);
                    
                    // Special handling for syntax errors
                    if (event.error instanceof SyntaxError) {
                        console.error(`SyntaxError details: ${event.error.message}${sourceInfo}`);
                        
                        // Special check for our target error
                        if (event.error.message.includes("false is an invalid identifier")) {
                            console.error(`Detected 'false is an invalid identifier' error${sourceInfo}`);
                        }
                    }
                    
                    // Specific handling for undefined variables
                    if (event.message && (
                        event.message.includes("is not defined") || 
                        event.message.includes("is undefined") ||
                        event.message.includes("cannot read property") ||
                        event.message.includes("Cannot read properties of undefined")
                    )) {
                        // Try to extract the variable name
                        const varMatch = event.message.match(/([a-zA-Z0-9_$]+) is (not defined|undefined)/);
                        if (varMatch) {
                            const varName = varMatch[1];
                            console.error(`Runtime Error: Variable '${varName}' is undefined/not defined${sourceInfo}. Check variable initialization and spelling.`);
                        }
                    }
                });
                
                // Add handler for unhandled promise rejections with source tracking
                window.addEventListener('unhandledrejection', (event) => {
                    // Try to extract source information from stack trace if available
                    let sourceInfo = '';
                    if (event.reason && event.reason.stack) {
                        const stackMatch = event.reason.stack.match(/at (?:.*?)([a-zA-Z0-9._\-/]+\.(js|mjs|ts|jsx|tsx)):[0-9]+(?::[0-9]+)?/);
                        if (stackMatch) {
                            sourceInfo = ` [Source: ${stackMatch[1]}]`;
                        }
                    }
                    console.error(`Unhandled Promise Rejection: ${event.reason}${sourceInfo}`);
                });
                
                // Track resource loading errors
                const originalCreateElement = document.createElement;
                document.createElement = function() {
                    const element = originalCreateElement.apply(document, arguments);
                    
                    if (arguments[0].toLowerCase() === 'script') {
                        element.addEventListener('error', (e) => {
                            console.error(`Script load error: ${e.target.src} [Source: ${e.target.src.split('/').pop()}]`);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'link' && element.rel === 'stylesheet') {
                        element.addEventListener('error', (e) => {
                            console.error(`Stylesheet load error: ${e.target.href} [Source: ${e.target.href.split('/').pop()}]`);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'img') {
                        element.addEventListener('error', (e) => {
                            console.error(`Image load error: ${e.target.src} [Source: ${e.target.src.split('/').pop()}]`);
                        });
                    }
                    
                    return element;
                };
            }""")
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_filename = f"frame_{self.frame_counter:05d}_initial.png"
                initial_screenshot = await self._save_screenshot(page, screenshots_dir, initial_filename)
                if initial_screenshot:
                    result["screenshots"].append(initial_screenshot)
                
                # Store previous screenshot for diff computation
                prev_screenshot = initial_screenshot
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if canvas_count == 0:
                    result["error"] = "No canvas element found"
                    result["test_result"] = False
                    return result
                
                # --- GAME START TEST ---
                logging.info("Running game start test (pressing Enter)")
                
                # Store logs count before Enter press to check for new ones
                errors_before_enter = len(result["console_logs"]["error"])
                exceptions_before_enter = len(result["js_exceptions"])
                network_errors_before = len(result["network_errors"])
                resource_errors_before = len(result["resource_errors"])
                parse_errors_before = len(result["parse_errors"])
                
                # Run enhanced error tracking script
                await page.evaluate("""() => {
                    // Enhanced error tracking - collect all errors
                    window.jsErrors = window.jsErrors || [];
                    window.moduleErrors = window.moduleErrors || [];
                    window.undefinedVars = window.undefinedVars || [];
                    
                    // Global error handler
                    window.onerror = function(message, source, lineno, colno, error) {
                        console.error('Caught JS error:', message, source, lineno);
                        
                        const errorInfo = {
                            message: message,
                            source: source,
                            lineno: lineno,
                            colno: colno,
                            stack: error ? error.stack : null,
                            timestamp: new Date().toISOString(),
                            context: 'interaction_test'
                        };
                        
                        // Push to general errors collection
                        window.jsErrors.push(errorInfo);
                        
                        // Check if it's an undefined variable error
                        if (message && (
                            message.includes('is not defined') || 
                            message.includes('undefined') ||
                            message.includes('null') ||
                            message.includes('cannot read property')
                        )) {
                            // Try to extract variable name
                            let varName = 'unknown';
                            const varMatch = message.match(/([a-zA-Z0-9_$]+) is (not defined|undefined)/);
                            if (varMatch) {
                                varName = varMatch[1];
                            }
                            
                            // Add to undefined vars collection
                            window.undefinedVars.push({
                                ...errorInfo,
                                variableName: varName
                            });
                            
                            console.error(`Variable '${varName}' is undefined/not defined during gameplay. Check initialization and spelling.`);
                        }
                        
                        // Check if it's a module/import error
                        if (message && (
                            message.includes('import') || 
                            message.includes('export') ||
                            message.includes('module') ||
                            source && (source.includes('import') || source.includes('export'))
                        )) {
                            // Add to module errors collection
                            window.moduleErrors.push(errorInfo);
                            console.error(`Module/import error detected during gameplay: ${message}`);
                        }
                        
                        // Return true to indicate we've handled the error
                        return true;
                    };
                    
                    // Enhanced unhandled promise rejection handler
                    window.addEventListener('unhandledrejection', function(event) {
                        console.error('Unhandled Promise Rejection during gameplay:', event.reason);
                        
                        const errorInfo = {
                            message: event.reason.message || 'Unhandled Promise Rejection',
                            reason: event.reason.toString(),
                            stack: event.reason.stack,
                            timestamp: new Date().toISOString(),
                            context: 'interaction_test'
                        };
                        
                        // Push to general errors collection
                        window.jsErrors.push(errorInfo);
                        
                        // Check if it's a module error
                        if (errorInfo.message && (
                            errorInfo.message.includes('import') || 
                            errorInfo.message.includes('export') ||
                            errorInfo.message.includes('module')
                        )) {
                            window.moduleErrors.push(errorInfo);
                        }
                    });
                }""")
                
                # Start the game by pressing Enter
                await page.keyboard.press("Enter")
                logging.info("Pressed Enter to start the game")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_filename = f"frame_{self.frame_counter:05d}_initial.png"
                initial_screenshot = await self._save_screenshot(page, screenshots_dir, initial_filename)
                if initial_screenshot:
                    result["screenshots"].append(initial_screenshot)
                
                # Store previous screenshot for diff computation
                prev_screenshot = initial_screenshot
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if canvas_count == 0:
                    result["error"] = "No canvas element found"
                    result["test_result"] = False
                    return result
                
                # --- GAME START TEST ---
                logging.info("Running game start test (pressing Enter)")
                
                # Store logs count before Enter press to check for new ones
                errors_before_enter = len(result["console_logs"]["error"])
                exceptions_before_enter = len(result["js_exceptions"])
                network_errors_before = len(result["network_errors"])
                resource_errors_before = len(result["resource_errors"])
                parse_errors_before = len(result["parse_errors"])
                
                # Start game with ENTER key
                start_test = await self._test_key_press(page, "Enter", "start_game", screenshots_dir)
                result["key_tests"].append(start_test)
                
                # Capture new errors that occurred during Enter press
                enter_console_errors = result["console_logs"]["error"][errors_before_enter:]
                enter_js_exceptions = result["js_exceptions"][exceptions_before_enter:]
                enter_network_errors = result["network_errors"][network_errors_before:]
                enter_resource_errors = result["resource_errors"][resource_errors_before:]
                enter_parse_errors = result["parse_errors"][parse_errors_before:]
                
                # Log all console messages during game start
                logging.info("All console messages during game start (Enter press):")
                for msg_type, messages in result["console_logs"].items():
                    # Get only messages added after pressing Enter
                    new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
                    for msg in new_messages:
                        logging.info(f"  - [{msg_type}] {msg}")
                
                # Log all error types separately
                if enter_js_exceptions:
                    logging.error("JavaScript errors during game start (Enter press):")
                    for exception in enter_js_exceptions:
                        logging.error(f"  - {exception}")
                
                if enter_network_errors:
                    logging.error("Network errors during game start (Enter press):")
                    for error in enter_network_errors:
                        logging.error(f"  - {error}")
                        
                if enter_resource_errors:
                    logging.error("Resource errors during game start (Enter press):")
                    for error in enter_resource_errors:
                        logging.error(f"  - {error}")
                        
                if enter_parse_errors:
                    logging.error("Parse errors during game start (Enter press):")
                    for error in enter_parse_errors:
                        logging.error(f"  - {error}")
                
                # Check for error messages during game start
                enter_error_messages = []
                for msg in enter_console_errors:
                    if "error" in msg.lower():
                        enter_error_messages.append(msg)
                
                # Also add all specialized error types to error messages
                enter_error_messages.extend(enter_js_exceptions)
                enter_error_messages.extend(enter_network_errors)
                enter_error_messages.extend(enter_resource_errors)
                enter_error_messages.extend(enter_parse_errors)
                
                # Check for error messages in any console logs (not just error type)
                for msg_type, messages in result["console_logs"].items():
                    # Skip the error type as we already processed it above
                    if msg_type == "error":
                        continue
                    # Get only messages added after pressing Enter
                    new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
                    for msg in new_messages:
                        if "error" in msg.lower():
                            enter_error_messages.append(msg)
                
                # If we found any errors during Enter press, fail the test immediately
                if enter_error_messages:
                    result["game_start_test"]["test_result"] = False
                    result["game_start_test"]["no_error_messages"] = False
                    result["error"] = f"Game start test failed: {len(enter_error_messages)} error messages detected in console after pressing ENTER."
                    result["console_error_message"] = "\n".join(enter_error_messages)
                    logging.error("Console errors during game start:")
                    for err in enter_error_messages:
                        logging.error(f"  - {err}")
                    result["test_result"] = False
                    return result
                
                game_phase_after_enter = None
                game_phase_check_passed = False
                
                # Calculate diff with previous screenshot
                if prev_screenshot and start_test.get("screenshot"):
                    diff_score = self._compare_screenshots(prev_screenshot, start_test.get("screenshot"))
                    start_test["diff_score"] = diff_score
                    
                    # Update game start test results
                    result["game_start_test"]["diff_score"] = diff_score
                    result["game_start_test"]["screenshot"] = start_test.get("screenshot")
                    
                    # Check gamePhase after pressing Enter
                    try:
                        # First check if getGameState function exists
                        has_game_state_function = await page.evaluate("""() => {
                            return typeof getGameState === 'function';
                        }""")
                        
                        if not has_game_state_function:
                            logging.error("getGameState function not found in the game")
                            game_phase_check_passed = True
                            game_phase_after_enter = "ERROR: getGameState function not found"
                        else:
                            game_state = await page.evaluate("getGameState()")
                            if game_state and isinstance(game_state, dict):
                                game_phase_after_enter = game_state.get("gamePhase")
                                if game_phase_after_enter == "PLAYING":
                                    game_phase_check_passed = True
                                else:
                                    logging.warning(f"Game phase after Enter is '{game_phase_after_enter}', expected 'PLAYING'")
                            else:
                                logging.warning(f"getGameState() did not return a valid dictionary. Returned: {game_state}")
                                game_phase_after_enter = f"ERROR: Invalid gameState: {game_state}"
                    except Exception as e:
                        logging.error(f"Error evaluating getGameState(): {e}")
                        game_phase_after_enter = f"ERROR: {str(e)}"

                    result["game_start_test"]["game_phase_after_enter"] = game_phase_after_enter
                    result["game_start_test"]["game_phase_check_passed"] = game_phase_check_passed
                    
                    # Game start test passes if:
                    # 1. Visual changes were detected (diff_score > 0.001)
                    # 2. Game phase is correct 
                    # 3. No error messages appeared (already checked above)
                    result["game_start_test"]["no_error_messages"] = True  # We already checked for errors earlier
                    result["game_start_test"]["test_result"] = (
                        (diff_score > 0.001) and 
                        game_phase_check_passed
                    )
                    
                    if diff_score > 0.001:
                        result["visual_changes"].append({
                            "key": "Enter",
                            "diff_score": diff_score
                        })
                    
                    # Update previous screenshot for next comparison
                    prev_screenshot = start_test.get("screenshot")
                
                # Update the conditional that checks if game started successfully
                if not result["game_start_test"]["test_result"]:
                    error_message = "Game did not start on pressing ENTER."
                    if not (diff_score > 0.001):
                        error_message += " No visual change detected after pressing ENTER."
                    if not game_phase_check_passed:
                        error_message += f" gamePhase was '{game_phase_after_enter}', expected 'PLAYING'."
                    result["error"] = error_message.strip()
                    
                    result["test_result"] = False
                    return result
                
                # --- GAMEPLAY TEST ---
                logging.info("Running gameplay test (random key presses)")
                
                # Now perform random actions for gameplay test
                logging.info("Starting random action sequence (32 initial keys + 256 sticky keys)")
                random_action_results = []
                
                # Initial 32 random key presses
                for i in range(32):
                    # Choose a random key from gameplay keys
                    random_key = random.choice(self.gameplay_keys)
                    logging.info(f"Initial random action {i+1}/32: Pressing key {random_key}")
                    
                    # Store previous errors count to check for new ones
                    errors_before = len(result["console_logs"]["error"])
                    exceptions_before = len(result["js_exceptions"])
                    network_errors_before = len(result["network_errors"])
                    resource_errors_before = len(result["resource_errors"])
                    parse_errors_before = len(result["parse_errors"])
                    
                    # Test key press
                    key_test = await self._test_key_press(page, random_key, f"random_{i}_{random_key}", screenshots_dir)
                    
                    # Calculate diff with previous screenshot
                    if prev_screenshot and key_test.get("screenshot"):
                        diff_score = self._compare_screenshots(prev_screenshot, key_test.get("screenshot"))
                        key_test["diff_score"] = diff_score
                        
                        # Add to gameplay test results
                        result["gameplay_test"]["diff_scores"].append(diff_score)
                        result["gameplay_test"]["screenshots"].append(key_test.get("screenshot"))
                        
                        if diff_score > 0.001:
                            result["visual_changes"].append({
                                "key": random_key,
                                "diff_score": diff_score
                            })
                        
                        # Update previous screenshot for next comparison
                        prev_screenshot = key_test.get("screenshot")
                    
                    # Check for new errors of all types
                    new_errors = result["console_logs"]["error"][errors_before:]
                    new_exceptions = result["js_exceptions"][exceptions_before:]
                    new_network_errors = result["network_errors"][network_errors_before:]
                    new_resource_errors = result["resource_errors"][resource_errors_before:]
                    new_parse_errors = result["parse_errors"][parse_errors_before:]
                    
                    # Check game phase after key press
                    try:
                        # First check if getGameState function exists
                        has_game_state_function = await page.evaluate(r"""() => {
                            return typeof getGameState === 'function';
                        }""")
                        
                        if has_game_state_function:
                            game_state = await page.evaluate("getGameState()")
                            if game_state and isinstance(game_state, dict):
                                game_phase = game_state.get("gamePhase")
                                logging.info(f"Current game phase after key {random_key}: {game_phase}")
                                
                                # If game is over, restart it by pressing R followed by Enter
                                if game_phase in ["GAME_OVER_WIN", "GAME_OVER_LOSS"]:
                                    logging.info(f"Game over detected ({game_phase}), restarting game...")
                                    

                                    while game_phase != "START":
                                        # Press R to restart
                                        await self._test_key_press(page, "r", f"restart_r_{i}", screenshots_dir)
                                        await page.wait_for_timeout(200)
                                        
                                        # Check if game is in START phase
                                        game_state = await page.evaluate("getGameState()")
                                        if game_state and isinstance(game_state, dict):
                                            game_phase = game_state.get("gamePhase")
                                            logging.info(f"Current game phase after restart: {game_phase}")
                                            if game_phase == "START":
                                                break
                                        else:
                                            logging.error(f"Game is not in START phase after restart: {game_phase}")

                                    while game_phase != "PLAYING":
                                        # Press Enter to confirm restart
                                        restart_key_test = await self._test_key_press(page, "Enter", f"restart_enter_{i}", screenshots_dir)
                                        await page.wait_for_timeout(100)

                                        # Check if game is in START phase
                                        game_state = await page.evaluate("getGameState()")
                                        if game_state and isinstance(game_state, dict):
                                            game_phase = game_state.get("gamePhase")
                                            logging.info(f"Current game phase after restart: {game_phase}")
                                            if game_phase == "PLAYING":
                                                break
                                        else:
                                            logging.error(f"Game is not in PLAYING phase after restart: {game_phase}")

                                    # Update previous screenshot after restart
                                    if restart_key_test.get("screenshot"):
                                        prev_screenshot = restart_key_test.get("screenshot")
                                    
                                    # Record this restart action
                                    random_action_info = {
                                        "action_index": i,
                                        "key": f"{random_key} (triggered game over: {game_phase})",
                                        "restart_performed": True,
                                        "screenshot": key_test.get("screenshot"),
                                        "diff_score": key_test.get("diff_score", 0),
                                        "new_errors": [],
                                        "has_errors": False
                                    }
                                    random_action_results.append(random_action_info)
                                    
                                    # Continue to next random action
                                    continue
                    except Exception as e:
                        # Just log the error and continue with testing if game state check fails
                        logging.warning(f"Error checking game phase: {e}")
                    
                    has_new_errors = (
                        len(new_errors) > 0 or 
                        len(new_exceptions) > 0 or
                        len(new_network_errors) > 0 or
                        len(new_resource_errors) > 0 or
                        len(new_parse_errors) > 0
                    )
                    
                    # Log new errors for debugging
                    if has_new_errors:
                        logging.info(f"Console messages and errors during key press '{random_key}':")
                        for msg in new_errors:
                            logging.info(f"  - [error] {msg}")
                        for msg in new_exceptions:
                            logging.error(f"  - [exception] {msg}")
                        for msg in new_network_errors:
                            logging.error(f"  - [network] {msg}")
                        for msg in new_resource_errors:
                            logging.error(f"  - [resource] {msg}")
                        for msg in new_parse_errors:
                            logging.error(f"  - [parse] {msg}")
                    
                    # Combine all errors for this action
                    all_new_errors = (
                        new_errors + 
                        new_exceptions + 
                        new_network_errors + 
                        new_resource_errors + 
                        new_parse_errors
                    )
                    
                    # Add to action results
                    random_action_info = {
                        "action_index": i,
                        "key": random_key,
                        "screenshot": key_test.get("screenshot"),
                        "diff_score": key_test.get("diff_score", 0),
                        "new_errors": all_new_errors,
                        "has_errors": has_new_errors
                    }
                    
                    # If this key press generated errors, mark it as failed and log the errors
                    if has_new_errors:
                        error_messages = []
                        for msg in new_errors:
                            if "error" in msg.lower():
                                error_messages.append(msg)
                        # Add all specialized error types
                        error_messages.extend(new_exceptions)
                        error_messages.extend(new_network_errors)
                        error_messages.extend(new_resource_errors)
                        error_messages.extend(new_parse_errors)
                        
                        if error_messages:
                            random_action_info["test_result"] = False
                            random_action_info["console_error_message"] = "\n".join(error_messages)
                            logging.error(f"Errors detected during key press '{random_key}':")
                            for err in error_messages:
                                logging.error(f"  - {err}")
                    
                    random_action_results.append(random_action_info)
                    
                    # Wait between actions
                    await page.wait_for_timeout(50)
                
                # Now perform 128 "sticky keys" actions
                for i in range(128):
                    # Choose a random key and stick with it for 4-16 consecutive presses
                    sticky_key = random.choice(self.gameplay_keys)
                    consecutive_presses = random.randint(4, 16)
                    
                    logging.info(f"Sticky action {i+1}/128: Pressing {sticky_key} for {consecutive_presses} consecutive times")
                    
                    # Apply the same key multiple times
                    for j in range(consecutive_presses):
                        # Store previous errors count to check for new ones
                        errors_before = len(result["console_logs"]["error"])
                        exceptions_before = len(result["js_exceptions"])
                        network_errors_before = len(result["network_errors"])
                        resource_errors_before = len(result["resource_errors"])
                        parse_errors_before = len(result["parse_errors"])
                        
                        # Test key press
                        key_test = await self._test_key_press(page, sticky_key, f"sticky_{i}_{j}_{sticky_key}", screenshots_dir)
                        
                        # Calculate diff with previous screenshot
                        if prev_screenshot and key_test.get("screenshot"):
                            diff_score = self._compare_screenshots(prev_screenshot, key_test.get("screenshot"))
                            key_test["diff_score"] = diff_score
                            
                            # Add to gameplay test results
                            result["gameplay_test"]["diff_scores"].append(diff_score)
                            result["gameplay_test"]["screenshots"].append(key_test.get("screenshot"))
                            
                            if diff_score > 0.001:
                                result["visual_changes"].append({
                                    "key": sticky_key,
                                    "diff_score": diff_score
                                })
                            
                            # Update previous screenshot for next comparison
                            prev_screenshot = key_test.get("screenshot")
                        
                        # Check for new errors of all types
                        new_errors = result["console_logs"]["error"][errors_before:]
                        new_exceptions = result["js_exceptions"][exceptions_before:]
                        new_network_errors = result["network_errors"][network_errors_before:]
                        new_resource_errors = result["resource_errors"][resource_errors_before:]
                        new_parse_errors = result["parse_errors"][parse_errors_before:]
                        
                        has_new_errors = (
                            len(new_errors) > 0 or 
                            len(new_exceptions) > 0 or
                            len(new_network_errors) > 0 or
                            len(new_resource_errors) > 0 or
                            len(new_parse_errors) > 0
                        )
                        
                        # Combine all errors for this action
                        all_new_errors = (
                            new_errors + 
                            new_exceptions + 
                            new_network_errors + 
                            new_resource_errors + 
                            new_parse_errors
                        )
                        
                        # Add to action results
                        sticky_action_info = {
                            "action_index": f"{i}_{j}",
                            "key": sticky_key,
                            "sticky_sequence": f"{j+1}/{consecutive_presses}",
                            "screenshot": key_test.get("screenshot"),
                            "diff_score": key_test.get("diff_score", 0),
                            "new_errors": all_new_errors,
                            "has_errors": has_new_errors
                        }
                        
                        random_action_results.append(sticky_action_info)
                        
                        # Wait between actions
                        await page.wait_for_timeout(50)
                    
                    # Check game phase after every 4 actions (every sticky key sequence)
                    try:
                        # First check if getGameState function exists
                        has_game_state_function = await page.evaluate(r"""() => {
                            return typeof getGameState === 'function';
                        }""")
                        
                        if has_game_state_function:
                            game_state = await page.evaluate("getGameState()")
                            if game_state and isinstance(game_state, dict):
                                game_phase = game_state.get("gamePhase")
                                logging.info(f"Current game phase after sticky sequence {i+1}: {game_phase}")
                                
                                # If game is over, restart it by pressing R followed by Enter
                                if game_phase in ["GAME_OVER_WIN", "GAME_OVER_LOSS"]:
                                    logging.info(f"Game over detected ({game_phase}), restarting game...")
                                    
                                    restart_count = 0
                                    while game_phase != "START" and restart_count < 10:
                                        # Press R to restart
                                        await self._test_key_press(page, "r", f"restart_r_{i}", screenshots_dir)
                                        await page.wait_for_timeout(200)
                                        restart_count += 1
                                        
                                        # Check if game is in START phase
                                        game_state = await page.evaluate("getGameState()")
                                        if game_state and isinstance(game_state, dict):
                                            game_phase = game_state.get("gamePhase")
                                            logging.info(f"Current game phase after restart: {game_phase}")
                                            if game_phase == "START":
                                                break
                                        else:
                                            logging.error(f"Game is not in START phase after restart: {game_phase}")

                                    restart_count = 0
                                    while game_phase != "PLAYING" and restart_count < 10:
                                        # Press Enter to confirm restart
                                        restart_key_test = await self._test_key_press(page, "Enter", f"restart_enter_{i}", screenshots_dir)
                                        await page.wait_for_timeout(100)
                                        restart_count += 1
                                        # Check if game is in START phase
                                        game_state = await page.evaluate("getGameState()")
                                        if game_state and isinstance(game_state, dict):
                                            game_phase = game_state.get("gamePhase")
                                            logging.info(f"Current game phase after restart: {game_phase}")
                                            if game_phase == "PLAYING":
                                                break
                                        else:
                                            logging.error(f"Game is not in PLAYING phase after restart: {game_phase}")
                    except Exception as e:
                        # Just log the error and continue with testing if game state check fails
                        logging.warning(f"Error checking game phase: {e}")
                
                # Add random action results to the overall results
                result["random_actions"] = random_action_results
                
                # Determine if gameplay test passed (any key press caused visual change)
                non_zero_diffs = [score for score in result["gameplay_test"]["diff_scores"] if score > 0.001]
                result["gameplay_test"]["test_result"] = len(non_zero_diffs) > 0
                
                if not result["gameplay_test"]["test_result"]:
                    result["error"] = "Gameplay test failed: No key presses produced visual changes during gameplay"
                    result["test_result"] = False
                    
                    # Include all error types if available
                    all_errors = (
                        result["console_logs"]["error"] + 
                        result["js_exceptions"] + 
                        result["network_errors"] + 
                        result["resource_errors"] + 
                        result["parse_errors"]
                    )
                    
                    if all_errors:
                        result["console_error_message"] = "\n".join(all_errors)
                
                # Check for errors in the entire test
                console_errors = []
                for msg_type, messages in result["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            console_errors.append(msg)
                
                # Add all specialized error types
                console_errors.extend(result["js_exceptions"])
                console_errors.extend(result["network_errors"])
                console_errors.extend(result["resource_errors"])
                console_errors.extend(result["parse_errors"])
                
                no_console_errors = len(console_errors) == 0
                
                # Find key presses that generated errors
                key_presses_with_errors = [action for action in random_action_results if action.get("has_errors", False)]
                
                # If there were any errors during key presses, mark the test as failed
                if key_presses_with_errors:
                    result["error"] = f"Errors detected during {len(key_presses_with_errors)} key press(es)"
                    result["test_result"] = False
                    
                    # Include all error messages
                    if console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                    
                    # Add information about key presses that caused errors
                    result["key_presses_with_errors"] = [
                        {"key": action["key"], "index": action["action_index"]} 
                        for action in key_presses_with_errors
                    ]
                else:
                    # Overall test passes if both game start and gameplay tests pass and there are no errors
                    result["test_result"] = (
                        no_console_errors and 
                        result["game_start_test"]["test_result"] and 
                        result["gameplay_test"]["test_result"]
                    )
                
                    # If test failed due to errors, include them in dedicated field
                    if not result["test_result"] and not no_console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                
                # Add summary information
                result["summary"] = {
                    "game_start_test": result["game_start_test"]["test_result"],
                    "gameplay_test": result["gameplay_test"]["test_result"],
                    "no_console_errors": no_console_errors,
                    "overall_result": result["test_result"]
                }
                
                # Log summary of all error types
                if result["js_exceptions"]:
                    logging.error(f"Total JavaScript exceptions: {len(result['js_exceptions'])}")
                if result["network_errors"]:
                    logging.error(f"Total network errors: {len(result['network_errors'])}")
                if result["resource_errors"]:
                    logging.error(f"Total resource errors: {len(result['resource_errors'])}")
                if result["parse_errors"]:
                    logging.error(f"Total parse/syntax errors: {len(result['parse_errors'])}")
                
                # After all interactions, collect any errors and finalize results
                # Collect enhanced error data after gameplay
                try:
                    js_errors = await page.evaluate("window.jsErrors || []")
                    if js_errors and len(js_errors) > 0:
                        # Filter for errors that happened during the interaction test
                        interaction_errors = [err for err in js_errors if err.get('context') == 'interaction_test']
                        if interaction_errors:
                            logging.info(f"Collected {len(interaction_errors)} JavaScript errors during gameplay")
                            for error in interaction_errors:
                                # Format the error message
                                error_msg = f"Gameplay Error: {error.get('message', 'Unknown error')}"
                                if 'source' in error and error['source']:
                                    # Extract the file name from the source path
                                    if 'source' in error and error['source']:
                                        source_path = error['source']
                                        file_name = source_path.split('/')[-1].split(':')[0] if '/' in source_path else source_path.split('\\')[-1].split(':')[0] if '\\' in source_path else source_path
                                        error['fileName'] = file_name
                                    error_msg += f" (Source: {file_name}:{error.get('lineno', '?')})"
                                # if 'stack' in error and error['stack']:
                                #     error_msg += f"\nStack: {error['stack']}"
                                    
                                # Add to appropriate error collections
                                result["js_exceptions"].append(error_msg)
                                result["console_errors"].append(error_msg)
                                result["console_logs"]["error"].append(error_msg)
                                logging.error(f"Gameplay error: {error_msg}")
                    
                    # Collect module-specific errors during gameplay
                    module_errors = await page.evaluate("window.moduleErrors || []")
                    if module_errors and len(module_errors) > 0:
                        # Filter for errors that happened during the interaction test
                        interaction_module_errors = [err for err in module_errors if err.get('context') == 'interaction_test']
                        if interaction_module_errors:
                            logging.info(f"Collected {len(interaction_module_errors)} module/import errors during gameplay")
                            
                            # Add a specific category for module errors if not exists
                            if "module_errors" not in result:
                                result["module_errors"] = []
                                
                            for error in interaction_module_errors:
                                # Format the module error message
                                error_msg = f"Module/Import Error during gameplay: {error.get('message', 'Unknown module error')}"
                                if 'source' in error and error['source']:
                                    # Extract the file name from the source path
                                    if 'source' in error and error['source']:
                                        source_path = error['source']
                                        file_name = source_path.split('/')[-1].split(':')[0] if '/' in source_path else source_path.split('\\')[-1].split(':')[0] if '\\' in source_path else source_path
                                        error['fileName'] = file_name
                                    error_msg += f" (Source: {file_name}:{error.get('lineno', '?')})"
                                if 'modulePath' in error:
                                    error_msg += f" (Module: {error['modulePath']})"
                                # if 'stack' in error and error['stack']:
                                #     error_msg += f"\nStack: {error['stack']}"
                                    
                                # Add to module errors and general error collections
                                result["module_errors"].append(error_msg)
                                result["js_exceptions"].append(error_msg)
                                result["console_errors"].append(error_msg)
                                result["console_logs"]["error"].append(error_msg)
                                logging.error(f"Module error during gameplay: {error_msg}")
                    
                    # Collect undefined variable errors during gameplay
                    undefined_vars = await page.evaluate("window.undefinedVars || []")
                    if undefined_vars and len(undefined_vars) > 0:
                        # Filter for errors that happened during the interaction test
                        interaction_undefined_vars = [err for err in undefined_vars if err.get('context') == 'interaction_test']
                        if interaction_undefined_vars:
                            logging.info(f"Collected {len(interaction_undefined_vars)} undefined variable errors during gameplay")
                            
                            # Add a specific category for undefined variables if not exists
                            if "undefined_vars" not in result:
                                result["undefined_vars"] = []
                                
                            for error in interaction_undefined_vars:
                                # Format the undefined variable error message
                                var_name = error.get('variableName', 'unknown')
                                error_msg = f"Undefined Variable during gameplay: '{var_name}'"
                                if 'source' in error and error['source']:
                                    # Extract the file name from the source path
                                    if 'source' in error and error['source']:
                                        source_path = error['source']
                                        file_name = source_path.split('/')[-1].split(':')[0] if '/' in source_path else source_path.split('\\')[-1].split(':')[0] if '\\' in source_path else source_path
                                        error['fileName'] = file_name
                                    error_msg += f" (Source: {file_name}:{error.get('lineno', '?')})"
                                # if 'stack' in error and error['stack']:
                                #     error_msg += f"\nStack: {error['stack']}"
                                    
                                # Add to undefined vars and general error collections
                                result["undefined_vars"].append(error_msg)
                                result["js_exceptions"].append(error_msg)
                                result["console_errors"].append(error_msg)
                                result["console_logs"]["error"].append(error_msg)
                                logging.error(f"Undefined variable during gameplay: {error_msg}")
                    
                except Exception as e:
                    logging.error(f"Error collecting enhanced error data after gameplay: {e}")
                
                # Check for errors that may have occurred during the interaction
                has_interaction_errors = len(result["console_logs"]["error"]) > 0 or len(result["js_exceptions"]) > 0
                
                # Removing reference to undefined gameplay_change_detected variable
                # The test result has already been determined earlier in the function
                
                # Before returning the result, deduplicate errors
                result["structured_errors"] = self._deduplicate_errors(result["structured_errors"])
                
                return result
            except Exception as e:
                logging.error(f"Error in game interaction test: {e}")
                result["error"] = f"Game interaction test error: {e}"
            finally:
                await browser.close()
                
        return result
    
    async def _test_key_press(self, page: Page, key: str, test_name: str, screenshots_dir: str) -> Dict[str, Any]:
        """
        Test a single key press and capture the resulting state
        
        Args:
            page: Playwright page
            key: Key to press
            test_name: Name of the test
            screenshots_dir: Directory to save screenshots
            
        Returns:
            Dictionary with test results
        """
        result = {
            "key": key,
            "test_name": test_name,
            "diff_score": 0,
            "screenshot": "",
        }
        
        try:
            # Ensure the canvas is properly focused before sending key
            await page.evaluate("""() => {
                document.body.click();
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    if (!canvas.hasAttribute('tabindex')) {
                        canvas.setAttribute('tabindex', '1');
                    }
                    canvas.focus();
                    canvas.click();
                }
            }""")
            
            # Press the key using multiple methods for better reliability
            logging.info(f"Pressing key: {key}")
            
            # Method 1: Standard press
            await page.keyboard.press(key)
            
            # Method 2: Try with down and up events
            await page.keyboard.down(key)
            await page.wait_for_timeout(50)
            await page.keyboard.up(key)
            
            # Method 3: Try sending key via JavaScript for games that use custom event listeners
            key_code = self.key_mapping.get(key, 0)
            if key_code > 0:
                await page.evaluate(f"""() => {{
                    const canvas = document.querySelector('canvas');
                    if (canvas) {{
                        const events = ['keydown', 'keypress', 'keyup'];
                        events.forEach(eventType => {{
                            const event = new KeyboardEvent(eventType, {{
                                key: '{key}',
                                keyCode: {key_code},
                                code: '{key}',
                                which: {key_code},
                                bubbles: true,
                                cancelable: true
                            }});
                            canvas.dispatchEvent(event);
                        }});
                    }}
                }}""")
                        
            # Wait for visual changes
            await page.wait_for_timeout(50)
            
            # Take a single screenshot after the key press
            screenshot_filename = f"frame_{self.frame_counter:05d}_action_{key}.png"
            screenshot = await self._save_screenshot(page, screenshots_dir, screenshot_filename)
            result["screenshot"] = screenshot
            
        except Exception as e:
            logging.error(f"Error testing key {key}: {e}")
            result["error"] = str(e)
            
        return result
    
    def _compare_screenshots(self, before_path: str, after_path: str) -> float:
        """
        Compare two screenshots and calculate a difference score.
        
        Args:
            before_path: Path to before screenshot
            after_path: Path to after screenshot
            
        Returns:
            diff_score: float between 0 and 1, where 0 is no difference and 1 is completely different
        """
        try:
            # Open images
            before_img = Image.open(before_path)
            after_img = Image.open(after_path)
            
            # Ensure same size for comparison
            if before_img.size != after_img.size:
                # Resize the smaller image to match the larger one
                if before_img.size[0] * before_img.size[1] < after_img.size[0] * after_img.size[1]:
                    before_img = before_img.resize(after_img.size, Image.Resampling.LANCZOS)
                else:
                    after_img = after_img.resize(before_img.size, Image.Resampling.LANCZOS)
            
            # Calculate difference
            diff_img = ImageChops.difference(before_img, after_img)
            
            # Calculate difference score (0 to 1)
            diff_gray = diff_img.convert('L')  # Convert to grayscale
            total_pixels = diff_gray.size[0] * diff_gray.size[1]
            diff_pixels = sum(1 for pixel in diff_gray.getdata() if pixel > 0)
            diff_score = diff_pixels / total_pixels
            
            return diff_score
            
        except Exception as e:
            logging.error(f"Error comparing screenshots: {e}")
            return 0 