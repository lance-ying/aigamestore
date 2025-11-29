// testAutomation.js - Automated testing

import { gameState, GRID_SIZE } from './globals.js';
import { executePlayerTurn, executeAITurn } from './combat.js';
import { useAbility } from './abilities.js';

export function runAutomatedTest(p) {
  if (gameState.controlMode === "TEST_1") {
    runTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p);
  } else if (gameState.controlMode === "TEST_3") {
    runTest3(p);
  }
}

function runTest1(p) {
  // TEST_1: Basic mechanics testing
  if (gameState.gamePhase === "START") {
    if (gameState.testTimer > 30) {
      gameState.gamePhase = "PLAYING";
      gameState.testTimer = 0;
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", test: "TEST_1" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (gameState.isPlayerTurn) {
      if (gameState.testTimer % 30 === 0) {
        // Fire at semi-random positions
        gameState.cursorX = (gameState.testPhase % GRID_SIZE);
        gameState.cursorY = Math.floor(gameState.testPhase / GRID_SIZE) % GRID_SIZE;
        executePlayerTurn(p);
        gameState.testPhase++;
      }
    } else {
      if (gameState.testTimer % 60 === 30) {
        executeAITurn(p);
      }
    }
    
    // Stop after 15 shots
    if (gameState.testPhase > 15) {
      gameState.gamePhase = "PAUSED";
    }
  }
  
  gameState.testTimer++;
}

function runTest2(p) {
  // TEST_2: Win condition test - systematic destruction
  if (gameState.gamePhase === "START") {
    if (gameState.testTimer > 30) {
      gameState.gamePhase = "PLAYING";
      gameState.testTimer = 0;
      
      // Generate target list to hit all AI ships
      gameState.testTargets = [];
      for (let ship of gameState.aiShips) {
        for (let pos of ship.positions) {
          gameState.testTargets.push({ x: pos.x, y: pos.y });
        }
      }
      
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", test: "TEST_2", targets: gameState.testTargets.length },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (gameState.isPlayerTurn) {
      if (gameState.testTimer % 20 === 0 && gameState.testTargets.length > 0) {
        const target = gameState.testTargets.shift();
        gameState.cursorX = target.x;
        gameState.cursorY = target.y;
        executePlayerTurn(p);
        
        // Use abilities when available
        if (gameState.testPhase % 5 === 0 && gameState.selectedAbility) {
          if (gameState.playerResources >= 2) {
            useAbility(gameState.selectedAbility, p);
          }
        }
        
        gameState.testPhase++;
      }
    }
    // Don't let AI attack in win test
  }
  
  gameState.testTimer++;
}

function runTest3(p) {
  // TEST_3: Lose condition test - let AI win
  if (gameState.gamePhase === "START") {
    if (gameState.testTimer > 30) {
      gameState.gamePhase = "PLAYING";
      gameState.testTimer = 0;
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", test: "TEST_3" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === "PLAYING") {
    // Only let AI attack, player does nothing
    if (!gameState.isPlayerTurn) {
      if (gameState.testTimer % 30 === 0) {
        executeAITurn(p);
      }
    } else {
      // Player passes turn by shooting random unused spot occasionally
      if (gameState.testTimer % 90 === 0) {
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (!gameState.aiGrid.isTargeted(x, y)) {
              gameState.cursorX = x;
              gameState.cursorY = y;
              executePlayerTurn(p);
              return;
            }
          }
        }
      }
    }
  }
  
  gameState.testTimer++;
}