"""
Game iframe HTML generation.

This module generates HTML for embedding games in iframes with
cache busting and level selector integration.
"""

import sys
import time
from pathlib import Path

# Handle imports for both script execution and module import
try:
    from .config import GAME_SERVER_PORT
except ImportError:
    # If relative imports fail, use absolute imports (script execution)
    _package_dir = Path(__file__).parent
    _project_root = _package_dir.parent.parent.parent.resolve()
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
    from scripts.utils.fix_game_gui_v2.config import GAME_SERVER_PORT


def get_game_iframe_html(game_relative_path_from_root: str, cache_bust: bool = False, level: int = None) -> str:
    """
    Generate HTML for game iframe with aggressive cache busting.
    
    Args:
        game_relative_path_from_root: The path of the game directory relative to the project root.
                                      e.g., "games/games/snake-io" or "archive/games/games_platform/game_name"
        cache_bust: If True, adds timestamp to force reload
        level: Optional level number to load
        
    Returns:
        HTML string with iframe
    """
    timestamp = int(time.time() * 1000)
    
    # Generate unique ID for the iframe
    iframe_id = f"game-iframe-{timestamp}"
    
    # Construct game_url using the provided relative path from project root
    game_url = f"http://localhost:{GAME_SERVER_PORT}/{game_relative_path_from_root}/index.html"
    
    # Add level parameter if specified
    params = []
    if level is not None:
        params.append(f"level={level}")
    if cache_bust:
        params.append(f"v={timestamp}")
    
    if params:
        game_url += "?" + "&".join(params)
    
    # Very aggressive reload script that clears all caches
    reload_script = ""
    if cache_bust:
        reload_script = f"""
        <script>
        (function() {{
            var iframe = document.getElementById('{iframe_id}');
            if (iframe) {{
                // Method 1: Clear iframe completely and recreate
                setTimeout(function() {{
                    var parent = iframe.parentNode;
                    var newIframe = document.createElement('iframe');
                    newIframe.id = '{iframe_id}';
                    newIframe.src = iframe.src;
                    newIframe.style.cssText = 'width: 100%; height: 100%; border: none; display: block;';
                    newIframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    newIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
                    newIframe.setAttribute('tabindex', '0');
                    parent.removeChild(iframe);
                    parent.appendChild(newIframe);
                    
                    // Method 2: Force reload inside iframe after it loads
                    newIframe.onload = function() {{
                        try {{
                            newIframe.contentWindow.location.reload(true);
                        }} catch(e) {{
                            console.log('Hard reload attempted');
                        }}
                    }};
                }}, 50);
            }}
        }})();
        </script>
        """
    
    # Add postMessage listener script for level changes and level selector integration
    # This script runs at document level to access both the iframe and level selector panel
    postmessage_script = f"""
    <script>
    (function() {{
        // Use a unique identifier for this game instance
        var gameInstanceId = '{iframe_id}';
        
        // Function to find the current active iframe (searches for game iframes)
        function findActiveIframe() {{
            // First try the specific iframe ID
            var iframe = document.getElementById(gameInstanceId);
            if (iframe && iframe.contentWindow) return iframe;
            
            // Fallback: find any iframe in game containers (for when iframe is replaced)
            var gameContainers = document.querySelectorAll('[id^="game-container-"]');
            for (var i = 0; i < gameContainers.length; i++) {{
                var container = gameContainers[i];
                var iframes = container.querySelectorAll('iframe[id^="game-iframe-"]');
                // Return the last one (most recent)
                if (iframes.length > 0) {{
                    var lastIframe = iframes[iframes.length - 1];
                    if (lastIframe.contentWindow) return lastIframe;
                }}
            }}
            return null;
        }}
        
        // Global message listener for level changes (only set up once)
        if (!window.levelSelectorMessageListenerSetup) {{
            window.addEventListener('message', function(event) {{
                // Check if message is from a game iframe
                var iframe = findActiveIframe();
                if (!iframe || event.source !== iframe.contentWindow) return;
                
                if (event.data && event.data.type === 'DEV_MODE_LEVEL_CHANGED') {{
                    console.log('[Level Selector] Level changed to:', event.data.level);
                    // Update the level display in the Gradio UI
                    var levelDisplay = document.getElementById('dev-current-level-display');
                    if (levelDisplay) {{
                        levelDisplay.textContent = event.data.level || '-';
                    }}
                    var levelInput = document.getElementById('dev-level-input-gradio');
                    if (levelInput) {{
                        levelInput.value = event.data.level || '';
                    }}
                }}
            }});
            window.levelSelectorMessageListenerSetup = true;
        }}
        
        // Setup level selector buttons - retry until elements are found
        function setupLevelSelector() {{
            var loadBtn = document.getElementById('dev-load-level-btn');
            var prevBtn = document.getElementById('dev-prev-level-btn');
            var nextBtn = document.getElementById('dev-next-level-btn');
            var levelInput = document.getElementById('dev-level-input-gradio');
            
            // If buttons not found yet, retry after a short delay
            if (!loadBtn || !prevBtn || !nextBtn || !levelInput) {{
                console.log('[Level Selector] Buttons not found yet, retrying...');
                setTimeout(setupLevelSelector, 200);
                return;
            }}
            
            // Check if already set up (avoid duplicate listeners)
            if (loadBtn.dataset.setup === 'true') {{
                console.log('[Level Selector] Buttons already set up');
                return;
            }}
            
            function loadLevel(level) {{
                if (!level || level < 1) {{
                    console.warn('[Level Selector] Invalid level:', level);
                    return;
                }}
                console.log('[Level Selector] Attempting to load level:', level);
                
                var currentIframe = findActiveIframe();
                if (!currentIframe) {{
                    console.error('[Level Selector] Iframe not found');
                    return;
                }}
                
                // Try multiple methods to send message
                try {{
                    if (currentIframe.contentWindow) {{
                        currentIframe.contentWindow.postMessage({{
                            type: 'DEV_MODE_LOAD_LEVEL',
                            level: parseInt(level)
                        }}, '*');
                        console.log('[Level Selector] Message sent to iframe');
                    }} else {{
                        console.error('[Level Selector] iframe.contentWindow is null');
                    }}
                }} catch (e) {{
                    console.error('[Level Selector] Error sending message:', e);
                }}
            }}
            
            loadBtn.addEventListener('click', function() {{
                var level = levelInput ? parseInt(levelInput.value) : null;
                if (level && level > 0) {{
                    loadLevel(level);
                }} else {{
                    alert('Please enter a valid level number (1 or higher)');
                }}
            }});
            
            prevBtn.addEventListener('click', function() {{
                var current = levelInput ? parseInt(levelInput.value) || 1 : 1;
                var newLevel = current > 1 ? current - 1 : 1;
                if (levelInput) levelInput.value = newLevel;
                loadLevel(newLevel);
            }});
            
            nextBtn.addEventListener('click', function() {{
                var current = levelInput ? parseInt(levelInput.value) || 1 : 1;
                var newLevel = current + 1;
                if (levelInput) levelInput.value = newLevel;
                loadLevel(newLevel);
            }});
            
            levelInput.addEventListener('keypress', function(e) {{
                if (e.key === 'Enter') {{
                    var level = parseInt(e.target.value);
                    if (level && level > 0) {{
                        loadLevel(level);
                    }}
                }}
            }});
            
            // Mark as set up
            loadBtn.dataset.setup = 'true';
            prevBtn.dataset.setup = 'true';
            nextBtn.dataset.setup = 'true';
            levelInput.dataset.setup = 'true';
            
            console.log('[Level Selector] All buttons wired up');
        }}
        
        // Expose setup function globally so level selector component can trigger it
        window.setupLevelSelectorGlobally = function() {{
            setupLevelSelector();
            // Also try to get initial level
            var currentIframe = findActiveIframe();
            if (currentIframe && currentIframe.contentWindow) {{
                try {{
                    currentIframe.contentWindow.postMessage({{
                        type: 'DEV_MODE_GET_LEVEL'
                    }}, '*');
                }} catch (e) {{
                    console.error('[Level Selector] Error requesting initial level:', e);
                }}
            }}
        }};
        
        // Wait for iframe to be in DOM, then setup
        function waitForIframeAndSetup() {{
            var currentIframe = findActiveIframe();
            if (!currentIframe) {{
                setTimeout(waitForIframeAndSetup, 100);
                return;
            }}
            
            console.log('[Level Selector] Iframe found, setting up...');
            
            // Setup buttons (will retry if not found)
            setupLevelSelector();
            
            // Wait for iframe to load, then request initial level
            function onIframeLoad() {{
                console.log('[Level Selector] Iframe loaded');
                setTimeout(function() {{
                    var currentIframe = findActiveIframe();
                    if (currentIframe && currentIframe.contentWindow) {{
                        try {{
                            currentIframe.contentWindow.postMessage({{
                                type: 'DEV_MODE_GET_LEVEL'
                            }}, '*');
                        }} catch (e) {{
                            console.error('[Level Selector] Error requesting initial level:', e);
                        }}
                    }}
                }}, 1000);
            }}
            
            if (currentIframe.contentDocument && currentIframe.contentDocument.readyState === 'complete') {{
                onIframeLoad();
            }} else {{
                currentIframe.addEventListener('load', onIframeLoad);
            }}
        }}
        
        // Start setup process
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', waitForIframeAndSetup);
        }} else {{
            waitForIframeAndSetup();
        }}
    }})();
    </script>
    """
    
    html = f"""
    <div style="width: 100%; position: relative;" id="game-container-{timestamp}">
        <div style="width: 100%; height: 1000px; border: 1px solid #333; border-radius: 4px; overflow: hidden; background: #000;">
            <iframe 
                id="{iframe_id}"
                src="{game_url}" 
                style="width: 100%; height: 100%; border: none; display: block; transform: scale(1.0); transform-origin: top left;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                tabindex="0"
            ></iframe>
        </div>
        {reload_script}
        {postmessage_script}
    </div>
    """
    
    return html

