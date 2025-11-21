// controls.js - Input handling and control modes

import { gameState, CONTROL_MODES, GAME_PHASES } from './globals.js';

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.player.finished) return;
  
  // Apply control mode
  switch (gameState.controlMode) {
    case CONTROL_MODES.HUMAN:
      handleHumanControls(p);
      break;
    case CONTROL_MODES.TEST_1:
      handleTest1Controls(p);
      break;
    case CONTROL_MODES.TEST_2:
      handleTest2Controls(p);
      break;
    case CONTROL_MODES.TEST_3:
      handleTest3Controls(p);
      break;
    case CONTROL_MODES.TEST_4:
      handleTest4Controls(p);
      break;
    case CONTROL_MODES.TEST_5:
      handleTest5Controls(p);
      break;
    case CONTROL_MODES.TEST_6:
      handleTest6Controls(p);
      break;
    case CONTROL_MODES.TEST_7:
      handleTest7Controls(p);
      break;
  }
}

function handleHumanControls(p) {
  // Use input state for smooth controls
  if (gameState.inputState.left) {
    gameState.player.steerLeft();
  }
  if (gameState.inputState.right) {
    gameState.player.steerRight();
  }
}

function handleTest1Controls(p) {
  // TEST_1: Basic movement and collection
  // Stay in center lane and collect blocks
  const centerLane = 2;
  if (gameState.player.targetLane < centerLane) {
    gameState.player.steerRight();
  } else if (gameState.player.targetLane > centerLane) {
    gameState.player.steerLeft();
  }
}

function handleTest2Controls(p) {
  // TEST_2: Optimal racing for win
  // Collect blocks efficiently and build bridges quickly
  
  // Find nearest block
  let nearestBlock = null;
  let nearestDist = Infinity;
  
  gameState.blocks.forEach(block => {
    if (block.collected) return;
    const dx = block.x - gameState.player.body.position.x;
    const dy = block.worldY - gameState.player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dy < 150 && dy > -50 && dist < nearestDist) {
      nearestBlock = block;
      nearestDist = dist;
    }
  });
  
  // Find next bridge
  let nextBridge = null;
  gameState.bridges.forEach(bridge => {
    const dy = bridge.worldY - gameState.player.worldY;
    if (dy < 200 && dy > 0) {
      if (!nextBridge || dy < (nextBridge.worldY - gameState.player.worldY)) {
        nextBridge = bridge;
      }
    }
  });
  
  if (nextBridge && gameState.player.blocks < nextBridge.requiredBlocks && nearestBlock) {
    // Need blocks for bridge
    const blockLane = Math.floor((nearestBlock.x - 110) / 80);
    if (blockLane < gameState.player.targetLane) {
      gameState.player.steerLeft();
    } else if (blockLane > gameState.player.targetLane) {
      gameState.player.steerRight();
    }
  } else if (nearestBlock && nearestDist < 100) {
    // Opportunistic collection
    const blockLane = Math.floor((nearestBlock.x - 110) / 80);
    if (blockLane < gameState.player.targetLane) {
      gameState.player.steerLeft();
    } else if (blockLane > gameState.player.targetLane) {
      gameState.player.steerRight();
    }
  } else {
    // Center lane
    const centerLane = 2;
    if (gameState.player.targetLane < centerLane) {
      gameState.player.steerRight();
    } else if (gameState.player.targetLane > centerLane) {
      gameState.player.steerLeft();
    }
  }
}

function handleTest3Controls(p) {
  // TEST_3: Collision testing - intentionally collide with AI
  // Find nearest AI and steer toward it
  let nearestAI = null;
  let nearestDist = Infinity;
  
  gameState.aiRacers.forEach(ai => {
    const dx = ai.body.position.x - gameState.player.body.position.x;
    const dy = ai.worldY - gameState.player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (Math.abs(dy) < 100 && dist < nearestDist) {
      nearestAI = ai;
      nearestDist = dist;
    }
  });
  
  if (nearestAI) {
    const aiLane = nearestAI.targetLane;
    if (aiLane < gameState.player.targetLane) {
      gameState.player.steerLeft();
    } else if (aiLane > gameState.player.targetLane) {
      gameState.player.steerRight();
    }
  }
}

function handleTest4Controls(p) {
  // TEST_4: Bridge building mechanics
  // Collect exactly enough blocks for first bridge
  const firstBridge = gameState.bridges[0];
  
  if (gameState.player.blocks < firstBridge.requiredBlocks) {
    // Collect blocks
    let nearestBlock = null;
    let nearestDist = Infinity;
    
    gameState.blocks.forEach(block => {
      if (block.collected) return;
      const dx = block.x - gameState.player.body.position.x;
      const dy = block.worldY - gameState.player.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dy < 200 && dy > -50 && dist < nearestDist) {
        nearestBlock = block;
        nearestDist = dist;
      }
    });
    
    if (nearestBlock) {
      const blockLane = Math.floor((nearestBlock.x - 110) / 80);
      if (blockLane < gameState.player.targetLane) {
        gameState.player.steerLeft();
      } else if (blockLane > gameState.player.targetLane) {
        gameState.player.steerRight();
      }
    }
  } else {
    // Center and proceed
    const centerLane = 2;
    if (gameState.player.targetLane < centerLane) {
      gameState.player.steerRight();
    } else if (gameState.player.targetLane > centerLane) {
      gameState.player.steerLeft();
    }
  }
}

function handleTest5Controls(p) {
  // TEST_5: Observe AI behavior - don't interfere
  // Stay in leftmost lane
  if (gameState.player.targetLane > 0) {
    gameState.player.steerLeft();
  }
}

function handleTest6Controls(p) {
  // TEST_6: Pause/restart testing
  // Just stay centered
  const centerLane = 2;
  if (gameState.player.targetLane < centerLane && p.frameCount % 60 === 0) {
    gameState.player.steerRight();
  } else if (gameState.player.targetLane > centerLane && p.frameCount % 60 === 30) {
    gameState.player.steerLeft();
  }
}

function handleTest7Controls(p) {
  // TEST_7: Lane steering boundaries
  // Rapidly change lanes
  if (p.frameCount % 30 < 15) {
    gameState.player.steerLeft();
  } else {
    gameState.player.steerRight();
  }
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Advance level on win
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        gameState.level++;
      }
      resetGame(p);
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.START, level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (p.keyCode === 37 || p.keyCode === 65) {
      gameState.inputState.left = true;
    }
    if (p.keyCode === 39 || p.keyCode === 68) {
      gameState.inputState.right = true;
    }
  }
  
  return false;
}

export function handleKeyReleased(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (p.keyCode === 37 || p.keyCode === 65) {
    gameState.inputState.left = false;
  }
  if (p.keyCode === 39 || p.keyCode === 68) {
    gameState.inputState.right = false;
  }
  
  return false;
}

function resetGame(p) {
  // Clean up physics bodies
  if (gameState.player && gameState.player.body) {
    Matter.World.remove(gameState.world, gameState.player.body);
  }
  gameState.aiRacers.forEach(ai => {
    if (ai.body) {
      Matter.World.remove(gameState.world, ai.body);
    }
  });
  gameState.droppedBlocks.forEach(block => {
    if (block.body) {
      Matter.World.remove(gameState.world, block.body);
    }
  });
  
  // Reset state
  gameState.player = null;
  gameState.aiRacers = [];
  gameState.blocks = [];
  gameState.bridges = [];
  gameState.droppedBlocks = [];
  gameState.entities = [];
  gameState.camera = { y: 0 };
  gameState.raceFinished = false;
  gameState.finishResults = [];
  gameState.inputState = { left: false, right: false };
}