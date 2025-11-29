// controls.js - Input handling and automated testing

import { gameState } from './globals.js';

export function handleInput(p) {
  if (gameState.controlMode === 'HUMAN') {
    handleHumanInput(p);
  } else if (gameState.controlMode === 'TEST_1') {
    handleTest1(p);
  } else if (gameState.controlMode === 'TEST_2') {
    handleTest2(p);
  }
}

function handleHumanInput(p) {
  if (gameState.gamePhase !== 'PLAYING' || !gameState.player || gameState.servingPhase) return;
  
  // Left movement
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
    gameState.player.moveLeft();
  }
  
  // Right movement
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
    gameState.player.moveRight();
  }
}

// TEST_1: Basic lane movement and cup collection
let test1State = {
  phase: 'collect', // 'collect', 'avoid', 'done'
  timer: 0,
  moveTimer: 0
};

function handleTest1(p) {
  if (gameState.gamePhase !== 'PLAYING' || !gameState.player || gameState.servingPhase) return;
  
  test1State.timer++;
  test1State.moveTimer++;
  
  // Alternate between lanes every 60 frames
  if (test1State.moveTimer > 60) {
    test1State.moveTimer = 0;
    
    const currentLane = gameState.player.targetLane;
    if (currentLane === 0) {
      gameState.player.moveRight();
    } else if (currentLane === 2) {
      gameState.player.moveLeft();
    } else {
      if (p.random() > 0.5) {
        gameState.player.moveRight();
      } else {
        gameState.player.moveLeft();
      }
    }
  }
}

// TEST_2: Optimal path for high score
let test2State = {
  initialized: false,
  targetLane: 1,
  nextDecisionY: 0
};

function handleTest2(p) {
  if (gameState.gamePhase !== 'PLAYING' || !gameState.player || gameState.servingPhase) return;
  
  if (!test2State.initialized) {
    test2State.initialized = true;
    test2State.nextDecisionY = gameState.player.cups[0].body.position.y - 50;
  }
  
  const playerY = gameState.player.cups[0].body.position.y;
  
  // Make decisions at intervals
  if (playerY < test2State.nextDecisionY) {
    test2State.nextDecisionY = playerY - 50;
    
    // Find nearest collectible or gate
    const lookAheadDistance = 100;
    let bestLane = gameState.player.targetLane;
    let bestPriority = -1;
    
    gameState.entities.forEach(entity => {
      const dy = playerY - entity.body.position.y;
      if (dy > 0 && dy < lookAheadDistance) {
        let priority = 0;
        
        if (entity.constructor.name === 'Collectible' && !entity.collected) {
          priority = 10;
        } else if (entity.constructor.name === 'Gate' && !entity.activated) {
          priority = 15;
        } else if (entity.constructor.name === 'Obstacle' && !entity.hit) {
          priority = -20; // Avoid obstacles
        }
        
        if (priority > bestPriority) {
          bestPriority = priority;
          
          if (entity.lane !== undefined) {
            bestLane = entity.lane;
          } else {
            // Gates span all lanes, stay in current lane
            bestLane = gameState.player.targetLane;
          }
        }
      }
    });
    
    // Move toward best lane
    if (bestLane < gameState.player.targetLane) {
      gameState.player.moveLeft();
    } else if (bestLane > gameState.player.targetLane) {
      gameState.player.moveRight();
    }
  }
}