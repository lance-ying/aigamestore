// input.js - Input handling and control modes

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Barrier } from './entities.js';
import { startLevel } from './game.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition controls
  if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    startLevel(p, gameState.currentLevel);
  }
  
  if (p.keyCode === 27) { // ESC - Pause/Unpause
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
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetToStart(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p);
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Stop drawing when arrow key released
    if ([37, 38, 39, 40].includes(p.keyCode)) {
      if (gameState.isDrawing) {
        finishDrawing(p);
      }
    }
  }
}

function handleGameplayInput(p) {
  // Space - spawn burst
  if (p.keyCode === 32) { // SPACE
    gameState.spawners.forEach(spawner => {
      for (let i = 0; i < 5; i++) {
        spawner.spawn();
      }
    });
  }
  
  // D - delete last barrier
  if (p.keyCode === 68) { // D
    deleteLastBarrier();
  }
  
  // Arrow keys - start drawing
  if ([37, 38, 39, 40].includes(p.keyCode)) {
    if (!gameState.isDrawing) {
      startDrawing(p);
    }
  }
}

function startDrawing(p) {
  gameState.isDrawing = true;
  gameState.currentDrawStart = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  gameState.drawingPoints = [{ ...gameState.currentDrawStart }];
}

export function updateDrawing(p) {
  if (!gameState.isDrawing) return;
  
  const speed = 5;
  let dx = 0, dy = 0;
  
  if (p.keyIsDown(37)) dx = -speed; // LEFT
  if (p.keyIsDown(39)) dx = speed;  // RIGHT
  if (p.keyIsDown(38)) dy = -speed; // UP
  if (p.keyIsDown(40)) dy = speed;  // DOWN
  
  if (dx !== 0 || dy !== 0) {
    const lastPoint = gameState.drawingPoints[gameState.drawingPoints.length - 1];
    const newPoint = {
      x: Math.max(0, Math.min(CANVAS_WIDTH, lastPoint.x + dx)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, lastPoint.y + dy))
    };
    gameState.drawingPoints.push(newPoint);
  }
}

function finishDrawing(p) {
  if (!gameState.isDrawing) return;
  
  if (gameState.drawingPoints.length > 1) {
    const start = gameState.drawingPoints[0];
    const end = gameState.drawingPoints[gameState.drawingPoints.length - 1];
    
    // Only create barrier if it's long enough
    const length = Math.sqrt(
      (end.x - start.x) ** 2 + (end.y - start.y) ** 2
    );
    
    if (length > 20) {
      const barrier = new Barrier(start.x, start.y, end.x, end.y, false);
      gameState.barriers.push(barrier);
      gameState.entities.push(barrier);
    }
  }
  
  gameState.isDrawing = false;
  gameState.drawingPoints = [];
}

function deleteLastBarrier() {
  // Delete the last non-static barrier
  for (let i = gameState.barriers.length - 1; i >= 0; i--) {
    if (!gameState.barriers[i].isStatic) {
      gameState.barriers[i].remove();
      gameState.barriers.splice(i, 1);
      break;
    }
  }
}

function resetToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Automated testing control modes
export function handleTestMode(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
  
  gameState.testFrameCount++;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      runTest1(p);
      break;
    case CONTROL_MODES.TEST_2:
      runTest2(p);
      break;
    case CONTROL_MODES.TEST_3:
      runTest3(p);
      break;
    case CONTROL_MODES.TEST_4:
      runTest4(p);
      break;
    case CONTROL_MODES.TEST_5:
      runTest5(p);
      break;
    case CONTROL_MODES.TEST_6:
      runTest6(p);
      break;
    case CONTROL_MODES.TEST_7:
      runTest7(p);
      break;
  }
}

function runTest1(p) {
  // Test basic physics and barrier drawing
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn) {
    // Draw some test barriers
    const barrier1 = new Barrier(100, 200, 250, 250, false);
    const barrier2 = new Barrier(350, 250, 500, 200, false);
    const barrier3 = new Barrier(200, 300, 400, 320, false);
    gameState.barriers.push(barrier1, barrier2, barrier3);
    gameState.entities.push(barrier1, barrier2, barrier3);
    gameState.testBarriersDrawn = true;
  }
  
  // Spawn particles regularly
  if (gameState.testFrameCount % 15 === 0) {
    gameState.spawners.forEach(spawner => spawner.spawn());
  }
}

function runTest2(p) {
  // Test win condition - draw optimal barriers and spawn lots of sugar
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn) {
    // Draw funneling barriers toward cups
    gameState.cups.forEach((cup, i) => {
      const funnelX = cup.x;
      const funnelTop = 150;
      const barrier1 = new Barrier(funnelX - 100, funnelTop, funnelX - 20, cup.y - cup.height / 2, false);
      const barrier2 = new Barrier(funnelX + 100, funnelTop, funnelX + 20, cup.y - cup.height / 2, false);
      gameState.barriers.push(barrier1, barrier2);
      gameState.entities.push(barrier1, barrier2);
    });
    gameState.testBarriersDrawn = true;
  }
  
  // Spawn particles rapidly
  if (gameState.testFrameCount % 5 === 0) {
    gameState.spawners.forEach(spawner => {
      for (let i = 0; i < 3; i++) {
        spawner.spawn();
      }
    });
  }
}

function runTest3(p) {
  // Test overflow - direct all sugar to first cup
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn && gameState.cups.length > 0) {
    const targetCup = gameState.cups[0];
    const barrier1 = new Barrier(50, 100, targetCup.x - 30, targetCup.y - 30, false);
    const barrier2 = new Barrier(550, 100, targetCup.x + 30, targetCup.y - 30, false);
    gameState.barriers.push(barrier1, barrier2);
    gameState.entities.push(barrier1, barrier2);
    gameState.testBarriersDrawn = true;
  }
  
  // Spawn many particles
  if (gameState.testFrameCount % 3 === 0) {
    gameState.spawners.forEach(spawner => {
      for (let i = 0; i < 5; i++) {
        spawner.spawn();
      }
    });
  }
}

function runTest4(p) {
  // Test color filters
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn && gameState.colorFilters.length > 0) {
    // Draw barriers to guide particles through filters
    gameState.colorFilters.forEach((filter, i) => {
      const barrier = new Barrier(
        filter.x - 50, 80,
        filter.x, filter.y + filter.height / 2 + 20,
        false
      );
      gameState.barriers.push(barrier);
      gameState.entities.push(barrier);
    });
    gameState.testBarriersDrawn = true;
  }
  
  if (gameState.testFrameCount % 10 === 0) {
    gameState.spawners.forEach(spawner => spawner.spawn());
  }
}

function runTest5(p) {
  // Test gravity switches
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn && gameState.gravitySwitches.length > 0) {
    const gswitch = gameState.gravitySwitches[0];
    const barrier = new Barrier(100, gswitch.y - 50, gswitch.x - 50, gswitch.y - 10, false);
    gameState.barriers.push(barrier);
    gameState.entities.push(barrier);
    gameState.testBarriersDrawn = true;
  }
  
  if (gameState.testFrameCount % 10 === 0) {
    gameState.spawners.forEach(spawner => spawner.spawn());
  }
}

function runTest6(p) {
  // Test teleporters
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn && gameState.teleporters.length > 0) {
    const teleporter = gameState.teleporters[0];
    const barrier = new Barrier(
      50, 100,
      teleporter.entrance.x - 10, teleporter.entrance.y - 30,
      false
    );
    gameState.barriers.push(barrier);
    gameState.entities.push(barrier);
    gameState.testBarriersDrawn = true;
  }
  
  if (gameState.testFrameCount % 10 === 0) {
    gameState.spawners.forEach(spawner => spawner.spawn());
  }
}

function runTest7(p) {
  // Test barrier deletion and level progression
  if (gameState.testFrameCount === 30 && !gameState.testBarriersDrawn) {
    // Draw multiple barriers
    for (let i = 0; i < 5; i++) {
      const barrier = new Barrier(
        100 + i * 80, 150,
        120 + i * 80, 250,
        false
      );
      gameState.barriers.push(barrier);
      gameState.entities.push(barrier);
    }
    gameState.testBarriersDrawn = true;
  }
  
  // Delete barriers periodically
  if (gameState.testFrameCount > 50 && gameState.testFrameCount < 150 && gameState.testFrameCount % 20 === 0) {
    deleteLastBarrier();
  }
  
  // Then fill cups to trigger win
  if (gameState.testFrameCount > 150 && gameState.testFrameCount % 5 === 0) {
    gameState.spawners.forEach(spawner => {
      for (let i = 0; i < 3; i++) {
        spawner.spawn();
      }
    });
  }
}