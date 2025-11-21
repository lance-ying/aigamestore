/**
 * Universal Dev Mode for Level Debugging
 * 
 * Features:
 * - Press 'L' key to open level selector
 * - URL parameter ?level=X to jump directly to a level
 * - Shows current level info overlay
 * - Keyboard shortcuts: L (level selector), N (next level), P (previous level)
 * 
 * Usage: Add <script src="dev_mode.js"></script> before game.js in index.html
 */

(function() {
  'use strict';

  const DEV_MODE_KEY = 'L'; // Press L to open level selector
  const NEXT_LEVEL_KEY = 'N';
  const PREV_LEVEL_KEY = 'P';
  const TOGGLE_INFO_KEY = 'I';

  let devModeActive = false;
  let showInfoOverlay = false;
  let levelSelectorVisible = false;
  let currentLevelInput = '';

  // Try to detect game state and level functions
  function getGameState() {
    // Try multiple ways to access game state
    if (window.getGameState && typeof window.getGameState === 'function') {
      return window.getGameState();
    }
    if (window.gameState) {
      return window.gameState;
    }
    if (window.gameInstance && window.gameInstance.gameState) {
      return window.gameInstance.gameState;
    }
    // Try to access from p5 instance
    if (window.gameInstance && window.gameInstance._setupDone) {
      // Access via p5 instance
      const p = window.gameInstance;
      if (p.gameState) return p.gameState;
    }
    return null;
  }

  function getCurrentLevel() {
    const state = getGameState();
    if (!state) return null;
    return state.currentLevel !== undefined ? state.currentLevel : null;
  }

  function getTotalLevels() {
    const state = getGameState();
    if (!state) return null;
    
    // Try different ways to get total levels
    if (state.totalLevels !== undefined) return state.totalLevels;
    if (state.maxLevel !== undefined) return state.maxLevel;
    if (state.LEVELS && Array.isArray(state.LEVELS)) return state.LEVELS.length;
    if (state.levels && Array.isArray(state.levels)) return state.levels.length;
    if (state.LEVEL_CONFIGS && Array.isArray(state.LEVEL_CONFIGS)) return state.LEVEL_CONFIGS.length;
    if (state.levelConfigs && Array.isArray(state.levelConfigs)) return state.levelConfigs.length;
    
    // Try global functions
    if (window.getTotalLevels && typeof window.getTotalLevels === 'function') {
      return window.getTotalLevels();
    }
    if (window.getLevelCount && typeof window.getLevelCount === 'function') {
      return window.getLevelCount();
    }
    
    return null;
  }

  function loadLevel(levelNum) {
    console.log(`[DEV MODE] Attempting to load level ${levelNum}`);
    
    const state = getGameState();
    
    // Try different ways to load a level
    if (window.loadLevel && typeof window.loadLevel === 'function') {
      console.log('[DEV MODE] Using window.loadLevel()');
      try {
        window.loadLevel(levelNum);
        // After calling window.loadLevel, ensure level is set and clear player/entities
        // so games that initialize in draw() will re-initialize
        if (state) {
          state.currentLevel = levelNum;
          if (state.level !== undefined) {
            state.level = levelNum;
          }
          // Clear player/entities to force re-initialization (for games like wenjia)
          if (state.player !== undefined) {
            state.player = null;
          }
          if (state.entities !== undefined) {
            state.entities = [];
          }
          if (state.platforms !== undefined) {
            state.platforms = [];
          }
          if (state.enemies !== undefined) {
            state.enemies = [];
          }
          // Ensure game is in playing phase
          if (state.gamePhase !== undefined) {
            state.gamePhase = "PLAYING";
          }
        }
        return true;
      } catch (e) {
        console.error('[DEV MODE] Error calling window.loadLevel:', e);
        // Fall through to try other methods
      }
    }
    if (window.initializeLevel && typeof window.initializeLevel === 'function') {
      console.log('[DEV MODE] Using window.initializeLevel()');
      try {
        const p = window.gameInstance || window.p;
        if (p) {
          window.initializeLevel(p, levelNum);
        } else {
          window.initializeLevel(levelNum);
        }
        if (state) {
          state.currentLevel = levelNum;
          if (state.level !== undefined) {
            state.level = levelNum;
          }
        }
        return true;
      } catch (e) {
        console.error('[DEV MODE] Error calling window.initializeLevel:', e);
        // Fall through to try other methods
      }
    }
    if (window.startLevel && typeof window.startLevel === 'function') {
      console.log('[DEV MODE] Using window.startLevel()');
      try {
        const p = window.gameInstance || window.p;
        if (p) {
          window.startLevel(p, levelNum);
        } else {
          window.startLevel(levelNum);
        }
        if (state) {
          state.currentLevel = levelNum;
          if (state.level !== undefined) {
            state.level = levelNum;
          }
        }
        return true;
      } catch (e) {
        console.error('[DEV MODE] Error calling window.startLevel:', e);
        // Fall through to try other methods
      }
    }
    
    // Try to set level in game state and reset game
    // (state already declared at top of function)
    if (state) {
      console.log('[DEV MODE] Setting currentLevel in gameState');
      const oldLevel = state.currentLevel;
      
      // Set level before reset (some games might preserve it)
      state.currentLevel = levelNum;
      // Also try setting 'level' property (some games use different property names)
      if (state.level !== undefined) {
        state.level = levelNum;
      }
      
      // Try to call generateLevel if it exists (for procedurally generated games)
      if (window.generateLevel && typeof window.generateLevel === 'function') {
        console.log('[DEV MODE] Calling window.generateLevel()');
        const p = window.gameInstance || window.p;
        if (p) {
          window.generateLevel(p);
        }
      }
      
      // Try to call reset/start functions
      if (window.resetGame && typeof window.resetGame === 'function') {
        console.log('[DEV MODE] Calling window.resetGame()');
        try {
          const p = window.gameInstance || window.p;
          if (p) {
            window.resetGame(p);
          } else {
            window.resetGame();
          }
        } catch (e) {
          console.error('[DEV MODE] Error calling resetGame:', e);
        }
        
        // CRITICAL: Set level again AFTER reset (resetGame might have reset it to 1)
        state.currentLevel = levelNum;
        if (state.level !== undefined) {
          state.level = levelNum;
        }
        
        // Clear player/entities to force re-initialization (for games like wenjia)
        if (state.player !== undefined) {
          state.player = null;
        }
        if (state.entities !== undefined) {
          state.entities = [];
        }
        
        // Also try generateLevel after reset if available
        if (window.generateLevel && typeof window.generateLevel === 'function') {
          try {
            const p = window.gameInstance || window.p;
            if (p) {
              window.generateLevel(p);
            } else {
              window.generateLevel();
            }
          } catch (e) {
            console.error('[DEV MODE] Error calling generateLevel:', e);
          }
        }
        // Try to start the game
        if (window.startGame && typeof window.startGame === 'function') {
          console.log('[DEV MODE] Calling window.startGame()');
          try {
            const p = window.gameInstance || window.p;
            if (p) {
              window.startGame(p);
            } else {
              window.startGame();
            }
          } catch (e) {
            console.error('[DEV MODE] Error calling startGame:', e);
          }
          
          // CRITICAL: Set level again AFTER startGame (startGame might reset it)
          state.currentLevel = levelNum;
          if (state.level !== undefined) {
            state.level = levelNum;
          }
          
          // Clear player again in case startGame created one
          if (state.player !== undefined) {
            state.player = null;
          }
        } else if (state.gamePhase !== undefined) {
          // Try to set game phase to PLAYING
          state.gamePhase = "PLAYING";
          console.log('[DEV MODE] Set gamePhase to PLAYING');
        }
        
        // Final safety: set level one more time after a short delay
        // This ensures it's set even if there are async operations
        setTimeout(() => {
          const state = getGameState();
          if (state) {
            state.currentLevel = levelNum;
            if (state.level !== undefined) {
              state.level = levelNum;
            }
            // Clear player to force re-initialization
            if (state.player !== undefined) {
              state.player = null;
            }
            // Try to trigger level generation if available
            if (window.generateLevel && typeof window.generateLevel === 'function') {
              try {
                const p = window.gameInstance || window.p;
                if (p) {
                  window.generateLevel(p);
                } else {
                  window.generateLevel();
                }
              } catch (e) {
                console.error('[DEV MODE] Error in delayed generateLevel:', e);
              }
            }
          }
        }, 50);
        
        return true;
      }
      if (window.startGame && typeof window.startGame === 'function') {
        console.log('[DEV MODE] Calling window.startGame()');
        try {
          const p = window.gameInstance || window.p;
          if (p) {
            window.startGame(p);
          } else {
            window.startGame();
          }
        } catch (e) {
          console.error('[DEV MODE] Error calling startGame:', e);
        }
        
        // CRITICAL: Set level again AFTER startGame
        state.currentLevel = levelNum;
        if (state.level !== undefined) {
          state.level = levelNum;
        }
        
        // Clear player to force re-initialization
        if (state.player !== undefined) {
          state.player = null;
        }
        
        // Final safety: set level after a short delay
        setTimeout(() => {
          const state = getGameState();
          if (state) {
            state.currentLevel = levelNum;
            if (state.level !== undefined) {
              state.level = levelNum;
            }
            if (state.player !== undefined) {
              state.player = null;
            }
            if (window.generateLevel && typeof window.generateLevel === 'function') {
              try {
                const p = window.gameInstance || window.p;
                if (p) {
                  window.generateLevel(p);
                } else {
                  window.generateLevel();
                }
              } catch (e) {
                console.error('[DEV MODE] Error in delayed generateLevel:', e);
              }
            }
          }
        }, 50);
        
        return true;
      }
      
      // If no reset/start functions, just set level and clear player to force re-init
      if (state) {
        state.currentLevel = levelNum;
        if (state.level !== undefined) {
          state.level = levelNum;
        }
        // Clear player/entities to force re-initialization (for games like wenjia)
        if (state.player !== undefined) {
          state.player = null;
        }
        if (state.entities !== undefined) {
          state.entities = [];
        }
        if (state.platforms !== undefined) {
          state.platforms = [];
        }
        if (state.enemies !== undefined) {
          state.enemies = [];
        }
        if (state.gamePhase !== undefined) {
          state.gamePhase = "PLAYING";
        }
      }
      
      // If we set the level but no reset function, at least we tried
      console.log('[DEV MODE] Level set in gameState, but no reset/start function found');
      return true;
    }
    
    console.warn('[DEV MODE] Could not load level - no game state or load functions found');
    return false;
  }

  function nextLevel() {
    const current = getCurrentLevel();
    const total = getTotalLevels();
    if (current === null || total === null) return false;
    
    const next = current < total ? current + 1 : 1;
    return loadLevel(next);
  }

  function prevLevel() {
    const current = getCurrentLevel();
    const total = getTotalLevels();
    if (current === null || total === null) return false;
    
    const prev = current > 1 ? current - 1 : total;
    return loadLevel(prev);
  }

  // Create level selector UI
  function createLevelSelector() {
    const overlay = document.createElement('div');
    overlay.id = 'dev-level-selector';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #00ff00;
      border-radius: 8px;
      padding: 20px;
      z-index: 10000;
      color: #fff;
      font-family: monospace;
      min-width: 300px;
      display: none;
    `;
    
    overlay.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #00ff00;">Level Selector</h3>
        <div style="margin-bottom: 10px; color: #ccc;">
          Current Level: <span id="dev-current-level">-</span>
          ${getTotalLevels() ? ` / ${getTotalLevels()}` : ''}
        </div>
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: #ccc;">Jump to Level:</label>
        <input type="number" id="dev-level-input" 
               style="width: 100%; padding: 8px; background: #222; color: #fff; border: 1px solid #555; border-radius: 4px; font-size: 16px;"
               min="1" placeholder="Enter level number">
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button id="dev-load-level" 
                style="flex: 1; padding: 10px; background: #00ff00; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
          Load Level
        </button>
        <button id="dev-close-selector" 
                style="flex: 1; padding: 10px; background: #666; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
          Close (ESC)
        </button>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="dev-prev-level" 
                style="flex: 1; padding: 8px; background: #444; color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">
          ← Prev (P)
        </button>
        <button id="dev-next-level" 
                style="flex: 1; padding: 8px; background: #444; color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">
          Next (N) →
        </button>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444; font-size: 12px; color: #888;">
        <div>Shortcuts:</div>
        <div>L - Open this selector</div>
        <div>N - Next level</div>
        <div>P - Previous level</div>
        <div>I - Toggle info overlay</div>
        <div>ESC - Close selector</div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event handlers
    document.getElementById('dev-load-level').addEventListener('click', () => {
      const input = document.getElementById('dev-level-input');
      const level = parseInt(input.value);
      if (level > 0) {
        loadLevel(level);
        updateLevelSelector();
      }
    });
    
    document.getElementById('dev-close-selector').addEventListener('click', () => {
      hideLevelSelector();
    });
    
    document.getElementById('dev-prev-level').addEventListener('click', () => {
      prevLevel();
      updateLevelSelector();
    });
    
    document.getElementById('dev-next-level').addEventListener('click', () => {
      nextLevel();
      updateLevelSelector();
    });
    
    document.getElementById('dev-level-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const level = parseInt(e.target.value);
        if (level > 0) {
          loadLevel(level);
          updateLevelSelector();
        }
      }
    });
    
    return overlay;
  }

  // Create info overlay
  function createInfoOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'dev-info-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #00ff00;
      border-radius: 4px;
      padding: 10px;
      z-index: 9999;
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      display: none;
      min-width: 200px;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function updateLevelSelector() {
    const selector = document.getElementById('dev-level-selector');
    if (!selector) return;
    
    const current = getCurrentLevel();
    const total = getTotalLevels();
    
    const currentLevelSpan = document.getElementById('dev-current-level');
    if (currentLevelSpan) {
      currentLevelSpan.textContent = current !== null ? current : '-';
    }
    
    const input = document.getElementById('dev-level-input');
    if (input && current !== null) {
      input.value = current;
      if (total) {
        input.max = total;
      }
    }
  }

  function showLevelSelector() {
    let selector = document.getElementById('dev-level-selector');
    if (!selector) {
      selector = createLevelSelector();
    }
    selector.style.display = 'block';
    levelSelectorVisible = true;
    updateLevelSelector();
    document.getElementById('dev-level-input')?.focus();
  }

  function hideLevelSelector() {
    const selector = document.getElementById('dev-level-selector');
    if (selector) {
      selector.style.display = 'none';
    }
    levelSelectorVisible = false;
  }

  function updateInfoOverlay() {
    const overlay = document.getElementById('dev-info-overlay');
    if (!overlay) return;
    
    if (!showInfoOverlay) {
      overlay.style.display = 'none';
      return;
    }
    
    const current = getCurrentLevel();
    const total = getTotalLevels();
    const state = getGameState();
    
    let info = '<div style="font-weight: bold; margin-bottom: 5px;">DEV MODE</div>';
    info += `<div>Level: ${current !== null ? current : '?'}${total ? ` / ${total}` : ''}</div>`;
    
    if (state) {
      if (state.gamePhase !== undefined) {
        info += `<div>Phase: ${state.gamePhase}</div>`;
      }
      if (state.score !== undefined) {
        info += `<div>Score: ${state.score}</div>`;
      }
    }
    
    info += '<div style="margin-top: 5px; font-size: 10px; color: #888;">Press I to toggle</div>';
    
    overlay.innerHTML = info;
    overlay.style.display = 'block';
  }

  // Keyboard event handler
  function handleKeyPress(e) {
    // Only handle if not typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape' && levelSelectorVisible) {
        hideLevelSelector();
        e.preventDefault();
      }
      return;
    }
    
    const key = e.key.toUpperCase();
    
    if (key === DEV_MODE_KEY) {
      if (levelSelectorVisible) {
        hideLevelSelector();
      } else {
        showLevelSelector();
      }
      e.preventDefault();
    } else if (key === NEXT_LEVEL_KEY && !levelSelectorVisible) {
      nextLevel();
      updateInfoOverlay();
      e.preventDefault();
    } else if (key === PREV_LEVEL_KEY && !levelSelectorVisible) {
      prevLevel();
      updateInfoOverlay();
      e.preventDefault();
    } else if (key === 'I' && !levelSelectorVisible) {
      showInfoOverlay = !showInfoOverlay;
      updateInfoOverlay();
      e.preventDefault();
    }
  }

  // Check URL parameter on load
  function checkUrlParameter() {
    const params = new URLSearchParams(window.location.search);
    const levelParam = params.get('level');
    if (levelParam) {
      const level = parseInt(levelParam);
      if (level > 0) {
        // Wait a bit for game to initialize
        setTimeout(() => {
          loadLevel(level);
          console.log(`[DEV MODE] Loaded level ${level} from URL parameter`);
        }, 500);
      }
    }
  }

  // Listen for postMessage from parent window (for Gradio GUI integration)
  function setupPostMessageListener() {
    window.addEventListener('message', function(event) {
      // Listen for messages from parent window
      if (event.data && event.data.type === 'DEV_MODE_LOAD_LEVEL') {
        const level = event.data.level;
        if (level && level > 0) {
          console.log(`[DEV MODE] Received level load request from parent: ${level}`);
          loadLevel(level);
          updateInfoOverlay();
          if (levelSelectorVisible) {
            updateLevelSelector();
          }
          // Notify parent of level change
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'DEV_MODE_LEVEL_CHANGED',
              level: level
            }, '*');
          }
        }
      }
    });
    
    // Wrap loadLevel to notify parent when level changes
    const originalLoadLevel = window.loadLevel || loadLevel;
    if (typeof originalLoadLevel === 'function') {
      // Create a wrapper that notifies parent
      const wrappedLoadLevel = function(levelNum) {
        const result = originalLoadLevel(levelNum);
        // Notify parent after a short delay to ensure level is loaded
        setTimeout(() => {
          const current = getCurrentLevel();
          if (window.parent && window.parent !== window && current !== null) {
            window.parent.postMessage({
              type: 'DEV_MODE_LEVEL_CHANGED',
              level: current
            }, '*');
          }
        }, 100);
        return result;
      };
      // Replace the global loadLevel if it exists
      if (window.loadLevel) {
        window.loadLevel = wrappedLoadLevel;
      }
    }
    
    // Also hook into our internal loadLevel function
    const internalLoadLevel = loadLevel;
    loadLevel = function(levelNum) {
      const result = internalLoadLevel(levelNum);
      // Notify parent after a short delay
      setTimeout(() => {
        const current = getCurrentLevel();
        if (window.parent && window.parent !== window && current !== null) {
          window.parent.postMessage({
            type: 'DEV_MODE_LEVEL_CHANGED',
            level: current
          }, '*');
        }
      }, 100);
      return result;
    };
  }

  // Initialize
  function init() {
    // Create overlays
    createInfoOverlay();
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyPress);
    
    // Setup postMessage listener for parent window communication
    setupPostMessageListener();
    
    // Check URL parameter
    checkUrlParameter();
    
    // Update info overlay periodically
    setInterval(() => {
      if (showInfoOverlay) {
        updateInfoOverlay();
      }
    }, 500);
    
    console.log('[DEV MODE] Initialized. Press L to open level selector, N/P for next/prev, I for info overlay');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

