"""
Error handling functions for browser-based game testing.
"""

import logging
import re
from typing import Dict, Any, List
from playwright.async_api import Page, ConsoleMessage

from .utils import extract_source_info, format_error_with_source

# Configure logging for local module
logger = logging.getLogger(__name__)

# Constants for error patterns
SYNTAX_ERROR_PATTERNS = [
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

RUNTIME_ERROR_PATTERNS = [
    "is not defined",
    "is undefined",
    "cannot read property",
    "cannot read properties of undefined",
    "null is not an object",
    "is not a function"
]

async def setup_page_error_handlers(page: Page, result: Dict[str, Any]) -> None:
    """
    Set up all error handlers for a page.
    
    Args:
        page: Playwright page
        result: Results dictionary to update with errors
    """
    # Initialize stack_traces field if not present
    if "stack_traces" not in result:
        result["stack_traces"] = []
        
    # Listen for console messages
    page.on("console", lambda msg: handle_console(msg, result))
    
    # Listen for page errors
    page.on("pageerror", lambda error: handle_page_error(error, result))
    
    # Listen for page crashes
    page.on("crash", lambda: logging.error("Page crashed"))
    
    # Listen for failed network requests
    page.on("requestfailed", lambda request: handle_request_failed(request, result))
    
    # Listen for resource loading errors
    page.on("response", lambda response: handle_response(response, result))


async def handle_console(msg: ConsoleMessage, result: Dict[str, Any]) -> None:
    """
    Handle console messages from the browser.
    
    Args:
        msg: Console message
        result: Results dictionary to update
    """
    msg_type = msg.type.lower()
    msg_text = f"{msg.text}"
    lower_text = msg_text.lower()
    
    # Debug log for all error messages to ensure we're seeing them
    if msg_type == "error" or "error" in lower_text:
        logging.error(f"RAW BROWSER ERROR: {msg_text}")
    
    # Check for undefined variable errors to format them concisely
    if msg_type == "error" and any(pattern in lower_text for pattern in RUNTIME_ERROR_PATTERNS):
        # Try to extract source file information
        source_file, line_number = extract_source_info(msg_text)
        # Try to match variable name for undefined errors
        var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', lower_text)
        if var_match:
            var_name = var_match.group(1)
            # Create a concise error message
            concise_msg = format_error_with_source(f"Console error: {var_name} is undefined", source_file)
            # Store in console logs
            result["console_logs"][msg_type].append(concise_msg)
            # Also store in legacy field for backwards compatibility
            result["console_errors"].append(concise_msg)
            # Store stack trace separately
            result["stack_traces"].append(msg_text)
            return
    
    # For all other messages, proceed normally
    # Store in the appropriate category
    if msg_type in result["console_logs"]:
        result["console_logs"][msg_type].append(msg_text)
    else:
        result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
    
    # Also store errors in the legacy field for backwards compatibility
    if msg_type == "error":
        result["console_errors"].append(f"error: {msg_text}")
    
    # Check for specific error patterns
    
    # Check for network errors
    if "failed to load resource" in lower_text or "net::" in lower_text:
        result["network_errors"].append(msg_text)
        
    # Check for syntax errors
    if any(pattern in lower_text for pattern in SYNTAX_ERROR_PATTERNS):
        # Extract source file information
        source_file, line_number = extract_source_info(msg_text)
        # Format concise syntax error message
        if source_file:
            concise_msg = format_error_with_source(f"Syntax error", source_file)
            result["parse_errors"].append(concise_msg)
        else:
            result["parse_errors"].append(msg_text)
        logging.error(f"Syntax error detected: {msg_text}")
        
    # Source map errors
    if "source map" in lower_text and "error" in lower_text:
        result["parse_errors"].append(msg_text)
    
    # Check for stack traces in error messages
    if "    at " in msg_text or msg_type == "error":
        # This looks like a stack trace, add to dedicated field
        result["stack_traces"].append(msg_text)
    
    # Log to Python console for debugging
    log_level = logging.INFO if msg_type != "error" else logging.ERROR
    logging.log(log_level, f"Browser console {msg_type}: {msg_text}")


async def handle_page_error(error, result: Dict[str, Any]) -> None:
    """
    Handle page errors.
    
    Args:
        error: Error object
        result: Results dictionary to update
    """
    # Try to extract source file information from the error message
    error_str = str(error)
    source_file, line_number = extract_source_info(error_str)
    
    # Check for undefined variable errors to provide concise message
    error_text = error_str.lower()
    if any(pattern in error_text for pattern in RUNTIME_ERROR_PATTERNS):
        # Try to extract the variable name for undefined variable errors
        var_match = re.search(r'([a-zA-Z0-9_$]+) is (not defined|undefined)', error_text)
        if var_match:
            var_name = var_match.group(1)
            # Create a concise error message with just the variable name and source
            concise_msg = format_error_with_source(f"Page error: {var_name} is undefined", source_file)
            result["js_exceptions"].append(concise_msg)
            result["console_errors"].append(concise_msg)
            result["console_logs"]["error"].append(concise_msg)
            logging.error(f"VARIABLE ERROR: {concise_msg}")
        else:
            # For other runtime errors, provide a concise message
            # Format the error message with source file information
            error_msg = format_error_with_source(f"Page error: {error}", source_file, line_number)
            result["js_exceptions"].append(error_msg)
            result["console_errors"].append(error_msg)
            result["console_logs"]["error"].append(error_msg)
    else:
        # For non-runtime errors, format as before
        error_msg = format_error_with_source(f"Page error: {error}", source_file, line_number)
        result["js_exceptions"].append(error_msg)
        result["console_errors"].append(error_msg)
        result["console_logs"]["error"].append(error_msg)
    
    # Store the full error with stack trace in stack_traces field for debugging
    # but don't display it in the main error messages
    logging.error(f"RAW PAGE ERROR: {error}")
    result["stack_traces"].append(str(error))
    
    # Check if it's a parse/syntax error
    if any(pattern in error_text for pattern in SYNTAX_ERROR_PATTERNS):
        # Include source file in the syntax error message if available
        parse_error_msg = format_error_with_source(f"Syntax error: {error}", source_file)
        result["parse_errors"].append(parse_error_msg)
        logging.error(f"Syntax error detected in page: {parse_error_msg}")
        
        # For SyntaxError, add a cleaner message to parse_errors
        if "syntaxerror" in error_text:
            # Try to extract just the syntax error message without stack trace
            if ": " in error_str:
                error_message = error_str.split(": ", 1)[1].split("\n")[0].strip()
                clean_error = format_error_with_source(f"Uncaught SyntaxError: {error_message}", 
                                                     source_file)
                result["parse_errors"].append(clean_error)
                logging.error(f"Uncaught SyntaxError: {clean_error}")
    
    # Explicit check for "false is an invalid identifier" error
    if "false is an invalid identifier" in error_str:
        error_msg = format_error_with_source("Uncaught SyntaxError: false is an invalid identifier", 
                                           source_file)
        result["parse_errors"].append(error_msg)
        logging.error(f"Special syntax error detected in page: {error_msg}")


async def handle_request_failed(request, result: Dict[str, Any]) -> None:
    """
    Handle failed network requests.
    
    Args:
        request: Failed request
        result: Results dictionary to update
    """
    url = request.url
    error_msg = f"Network request failed: {url}"
    result["network_errors"].append(error_msg)
    logging.error(error_msg)
    
    # Add to console_errors for backwards compatibility
    result["console_errors"].append(error_msg)
    
    # Also add to console logs for consistency
    result["console_logs"]["error"].append(error_msg)


async def handle_response(response, result: Dict[str, Any]) -> None:
    """
    Handle resource responses.
    
    Args:
        response: Response object
        result: Results dictionary to update
    """
    if response.status >= 400:  # HTTP error codes
        url = response.url
        status = response.status
        error_msg = f"Resource loading error: {url} (Status: {status})"
        result["resource_errors"].append(error_msg)
        logging.error(error_msg)
        
        # Add to console errors
        result["console_errors"].append(error_msg)
        result["console_logs"]["error"].append(error_msg)


def inject_error_detection_script() -> str:
    """
    Returns JavaScript code to inject for enhanced error detection.
    
    Returns:
        JavaScript code as a string
    """
    return r"""() => {
        // Enhanced error tracking - collect all errors
        window.jsErrors = window.jsErrors || [];
        window.moduleErrors = window.moduleErrors || [];
        window.undefinedVars = window.undefinedVars || [];
        window.stackTraces = window.stackTraces || [];
        
        // Global error handler
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Caught JS error:', message, source, lineno);
            
            // Extract just the filename from the source path
            let sourceFile = source;
            if (source) {
                // Handle file:// protocol
                if (source.startsWith('file://')) {
                    const pathParts = source.split('/');
                    sourceFile = pathParts[pathParts.length - 1];
                    if (sourceFile.includes(':')) {
                        // Remove any query parameters or fragments
                        sourceFile = sourceFile.split('?')[0].split('#')[0];
                    }
                } else {
                    // For other URLs or regular paths
                    try {
                        sourceFile = new URL(source).pathname.split('/').pop();
                    } catch (e) {
                        // If not a valid URL, try to extract the filename directly
                        sourceFile = source.split('/').pop().split('\\').pop();
                    }
                }
            }
            
            const errorInfo = {
                message: message,
                source: source,
                sourceFile: sourceFile, // Store the extracted filename
                lineno: lineno,
                colno: colno,
                stack: error ? error.stack : null,
                timestamp: new Date().toISOString(),
                context: 'interaction_test'
            };
            
            // Push to general errors collection
            window.jsErrors.push(errorInfo);
            
            // Save stack trace separately
            if (error && error.stack) {
                window.stackTraces.push(error.stack);
            } else {
                window.stackTraces.push(message + ' at ' + source + ':' + lineno + ':' + colno);
            }
            
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
                
                console.error(`Variable '${varName}' is undefined/not defined [Source: ${sourceFile}:${lineno}]. Check initialization and spelling.`);
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
                console.error(`Module/import error detected [Source: ${sourceFile}:${lineno}]: ${message}`);
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
            
            // Save stack trace if available
            if (event.reason && event.reason.stack) {
                window.stackTraces.push(event.reason.stack);
            } else {
                window.stackTraces.push(event.reason.toString());
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
    }"""


def early_error_detection_script() -> str:
    """
    Returns JavaScript code for early error detection in scripts.
    
    Returns:
        JavaScript code as a string
    """
    return r"""
    // Initialize stack traces collection
    window.stackTraces = window.stackTraces || [];
    
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
                
                // Add to stack traces
                window.stackTraces.push(`Script error: ${src}`);
            };
        }
        return element;
    };
    """


def syntax_check_script() -> str:
    """
    Returns JavaScript code for syntax error checking.
    
    Returns:
        JavaScript code as a string
    """
    return r"""() => {
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
                            // Store the stack trace
                            if (window.stackTraces && e.stack) {
                                window.stackTraces.push(e.stack);
                            }
                            // Check specifically for "false is an invalid identifier"
                            if (e.message.includes("false is an invalid identifier")) {
                                console.error("Detected critical syntax error: false is an invalid identifier");
                            }
                        }
                    }
                });
            } catch (e) {
                console.error("Error checking for syntax errors:", e);
                // Store the stack trace
                if (window.stackTraces && e.stack) {
                    window.stackTraces.push(e.stack);
                }
            }
        };
        
        // Run syntax check after a short delay
        setTimeout(window.checkForSyntaxErrors, 500);
        
        // Add additional error listeners
        window.addEventListener('error', (event) => {
            // Get source file and line information
            const sourceInfo = event.filename ? ` [Source: ${event.filename.split('/').pop()}]` : '';
            console.error(`JS Error: ${event.message}${sourceInfo}`, 'at line', event.lineno);
            
            // Store stack trace
            if (window.stackTraces) {
                if (event.error && event.error.stack) {
                    window.stackTraces.push(event.error.stack);
                } else {
                    window.stackTraces.push(`${event.message}${sourceInfo} at line ${event.lineno}`);
                }
            }
            
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
            
            // Store stack trace
            if (window.stackTraces) {
                if (event.reason && event.reason.stack) {
                    window.stackTraces.push(event.reason.stack);
                } else {
                    window.stackTraces.push(`Unhandled Promise Rejection: ${event.reason}${sourceInfo}`);
                }
            }
        });
        
        // Track resource loading errors
        const originalCreateElement = document.createElement;
        document.createElement = function() {
            const element = originalCreateElement.apply(document, arguments);
            
            if (arguments[0].toLowerCase() === 'script') {
                element.addEventListener('error', (e) => {
                    console.error(`Script load error: ${e.target.src} [Source: ${e.target.src.split('/').pop()}]`);
                    // Store in stack traces
                    if (window.stackTraces) {
                        window.stackTraces.push(`Script load error: ${e.target.src}`);
                    }
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
    }"""


async def collect_javascript_errors(page: Page, result: Dict[str, Any]) -> None:
    """
    Collect JavaScript errors from the page.
    
    Args:
        page: Playwright page
        result: Results dictionary to update
    """
    try:
        js_errors = await page.evaluate("window.jsErrors || []")
        if js_errors and len(js_errors) > 0:
            logging.info(f"Collected {len(js_errors)} JavaScript errors from enhanced tracking")
            for error in js_errors:
                # Format the error message
                error_msg = f"JavaScript Error: {error.get('message', 'Unknown error')}"
                if 'sourceFile' in error and error['sourceFile'] and 'lineno' in error:
                    error_msg += f" [Source: {error['sourceFile']}:{error.get('lineno', '?')}]"
                elif 'source' in error and error['source']:
                    # Fall back to the full source path if sourceFile is not available
                    error_msg += f" (Source: {error['source']}:{error.get('lineno', '?')})"
                    
                # Add to appropriate error collections
                result["js_exceptions"].append(error_msg)
                result["console_errors"].append(error_msg)
                result["console_logs"]["error"].append(error_msg)
                
                # Add to stack_traces if it has a stack field
                if 'stack' in error and error['stack']:
                    result["stack_traces"].append(error['stack'])
                else:
                    result["stack_traces"].append(error_msg)
                    
                logging.error(f"Enhanced JS error: {error_msg}")
        
        # Collect stack traces from the page
        stack_traces = await page.evaluate("window.stackTraces || []")
        if stack_traces and len(stack_traces) > 0:
            logging.info(f"Collected {len(stack_traces)} stack traces from enhanced tracking")
            for trace in stack_traces:
                if trace not in result["stack_traces"]:
                    result["stack_traces"].append(trace)
                    logging.info(f"Stack trace: {trace}")
        
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
                if 'sourceFile' in error and error['sourceFile'] and 'lineno' in error:
                    error_msg += f" [Source: {error['sourceFile']}:{error.get('lineno', '?')}]"
                elif 'source' in error and error['source']:
                    error_msg += f" (Source: {error['source']}:{error.get('lineno', '?')})"
                if 'modulePath' in error:
                    error_msg += f" (Module: {error['modulePath']})"
                if 'stack' in error and error['stack']:
                    error_msg += f"\nStack: {error['stack']}"
                    
                # Add to module errors and general error collections
                result["module_errors"].append(error_msg)
                result["js_exceptions"].append(error_msg)
                result["console_errors"].append(error_msg)
                result["console_logs"]["error"].append(error_msg)
                
                # Add to stack_traces if it has a stack
                if 'stack' in error and error['stack']:
                    result["stack_traces"].append(error['stack'])
                else:
                    result["stack_traces"].append(error_msg)
                    
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
                if 'sourceFile' in error and error['sourceFile'] and 'lineno' in error:
                    error_msg += f" [Source: {error['sourceFile']}:{error.get('lineno', '?')}]"
                elif 'source' in error and error['source']:
                    error_msg += f" (Source: {error['source']}:{error.get('lineno', '?')})"
                if 'stack' in error and error['stack']:
                    error_msg += f"\nStack: {error['stack']}"
                    
                # Add to undefined vars and general error collections
                result["undefined_vars"].append(error_msg)
                result["js_exceptions"].append(error_msg)
                result["console_errors"].append(error_msg)
                result["console_logs"]["error"].append(error_msg)
                
                # Add to stack_traces if it has a stack
                if 'stack' in error and error['stack']:
                    result["stack_traces"].append(error['stack'])
                else:
                    result["stack_traces"].append(error_msg)
                    
                logging.error(f"Undefined variable: {error_msg}")
    
    except Exception as e:
        logging.error(f"Error collecting enhanced error data: {e}")


def check_for_error_messages(result: Dict[str, Any]) -> bool:
    """
    Check if there are any error messages in the results.
    
    Args:
        result: Results dictionary
        
    Returns:
        Whether any error messages were found
    """
    has_error_messages = False
    error_messages = []
    
    # Check all console message types for errors
    for msg_type, messages in result["console_logs"].items():
        for msg in messages:
            if "error" in msg.lower():
                has_error_messages = True
                error_messages.append(msg)
    
    # Check JavaScript exceptions
    if result["js_exceptions"]:
        has_error_messages = True
        error_messages.extend(result["js_exceptions"])
    
    # Check network errors
    if result["network_errors"]:
        has_error_messages = True
        error_messages.extend(result["network_errors"])
    
    # Check resource errors
    if result["resource_errors"]:
        has_error_messages = True
        error_messages.extend(result["resource_errors"])
    
    # Check parse errors
    if result["parse_errors"]:
        has_error_messages = True
        error_messages.extend(result["parse_errors"])
    
    # If errors were found, add them to the console_error_message field
    if has_error_messages:
        result["console_error_message"] = "\n".join(error_messages)
    
    return has_error_messages 