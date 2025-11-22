// testing.js - Automated testing controllers
import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getTest1Action(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getTest2Action(p);
  }
  return null;
}

function getTest1Action(p) {
  // Basic testing - just start and move around
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13, type: 'press' }; // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const cycle = Math.floor(p.frameCount / 30) % 8;
    if (p.frameCount % 30 === 0) {
      if (cycle < 4) {
        return { keyCode: 37 + cycle, type: 'press' }; // Arrow keys
      } else if (cycle === 4) {
        return { keyCode: 32, type: 'press' }; // Space
      } else if (cycle === 7) {
        return { keyCode: 32, type: 'release' }; // Space release
      }
    }
  }
  return null;
}

function getTest2Action(p) {
  // Win testing - make smart moves
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13, type: 'press' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isAnimating) {
    // Simple strategy: find any valid 2-dot path
    if (!gameState.isSpaceHeld) {
      // Find a dot with an adjacent same-color dot
      for (let row = 0; row < gameState.gridRows; row++) {
        for (let col = 0; col < gameState.gridCols; col++) {
          const dot = gameState.grid[row][col];
          if (!dot) continue;
          
          // Check right neighbor
          if (col < gameState.gridCols - 1) {
            const right = gameState.grid[row][col + 1];
            if (right && dot.color[0] === right.color[0] && 
                dot.color[1] === right.color[1] && 
                dot.color[2] === right.color[2]) {
              // Move cursor to this dot
              if (gameState.cursorX !== col || gameState.cursorY !== row) {
                if (gameState.cursorX < col) return { keyCode: 39, type: 'press' };
                if (gameState.cursorX > col) return { keyCode: 37, type: 'press' };
                if (gameState.cursorY < row) return { keyCode: 40, type: 'press' };
                if (gameState.cursorY > row) return { keyCode: 38, type: 'press' };
              } else {
                return { keyCode: 32, type: 'press' }; // Select
              }
            }
          }
          
          // Check down neighbor
          if (row < gameState.gridRows - 1) {
            const down = gameState.grid[row + 1][col];
            if (down && dot.color[0] === down.color[0] && 
                dot.color[1] === down.color[1] && 
                dot.color[2] === down.color[2]) {
              if (gameState.cursorX !== col || gameState.cursorY !== row) {
                if (gameState.cursorX < col) return { keyCode: 39, type: 'press' };
                if (gameState.cursorX > col) return { keyCode: 37, type: 'press' };
                if (gameState.cursorY < row) return { keyCode: 40, type: 'press' };
                if (gameState.cursorY > row) return { keyCode: 38, type: 'press' };
              } else {
                return { keyCode: 32, type: 'press' };
              }
            }
          }
        }
      }
    } else if (gameState.currentPath.length === 1) {
      // Move to adjacent same-color dot
      const dot = gameState.currentPath[0];
      const directions = [
        { dx: 1, dy: 0, key: 39 },
        { dx: 0, dy: 1, key: 40 },
        { dx: -1, dy: 0, key: 37 },
        { dx: 0, dy: -1, key: 38 }
      ];
      
      for (let dir of directions) {
        const newX = dot.gridX + dir.dx;
        const newY = dot.gridY + dir.dy;
        if (newX >= 0 && newX < gameState.gridCols && 
            newY >= 0 && newY < gameState.gridRows) {
          const neighbor = gameState.grid[newY][newX];
          if (neighbor && dot.color[0] === neighbor.color[0] && 
              dot.color[1] === neighbor.color[1] && 
              dot.color[2] === neighbor.color[2]) {
            return { keyCode: dir.key, type: 'press' };
          }
        }
      }
    } else if (gameState.currentPath.length >= 2) {
      return { keyCode: 32, type: 'release' }; // Complete path
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 60) {
      return { keyCode: 82, type: 'press' }; // R
    }
  }
  return null;
}