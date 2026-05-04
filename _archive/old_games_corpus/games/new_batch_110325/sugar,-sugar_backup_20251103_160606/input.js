// input.js - Input handling and control modes

import { gameState, GAME_PHASES, CONTROL_MODES, DRAWING_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
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
  
  if (p.keyCode === 27) { // ESC - Pause/Unpause or cancel drawing
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // If in middle of drawing, cancel it
      if (gameState.drawingPhase !== DRAWING_PHASES.IDLE) {
        cancelDrawing();
      } else {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 82) { // R - Reset level
    if (gameState.gamePhase === GAME_PHASES.PLAYING ||
        gameState.gamePhase === GAME_PHASES.PAUSED ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetLevel(p);
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
}

function handleGameplayInput(p) {
  // Space - handle cursor activation and drawing phase progression
  if (p.keyCode === 32) { // SPACE
    if (!gameState.cursor.active) {
      // Activate cursor
      gameState.cursor.active = true;
      gameState.cursor.x = CANVAS_WIDTH / 2;
      gameState.cursor.y = CANVAS_HEIGHT / 2;
    } else if (!gameState.cursor.drawingMode) {
      // Enter drawing mode
      gameState.cursor.drawingMode = true;
      gameState.drawingPhase = DRAWING_PHASES.FIRST_POINT;
    } else {
      // Progress through drawing phases
      handleDrawingPhaseProgression(p);
    }
  }
  
  // Arrow keys - handled in updateDrawing for continuous movement
}

function handleDrawingPhaseProgression(p) {
  switch (gameState.drawingPhase) {
    case DRAWING_PHASES.FIRST_POINT:
      // Place first point
      gameState.firstPoint = { x: gameState.cursor.x, y: gameState.cursor.y };
      gameState.drawingPhase = DRAWING_PHASES.SECOND_POINT;
      break;
      
    case DRAWING_PHASES.SECOND_POINT:
      // Place second point
      gameState.secondPoint = { x: gameState.cursor.x, y: gameState.cursor.y };
      // Initialize control point at midpoint
      gameState.controlPoint = {
        x: (gameState.firstPoint.x + gameState.secondPoint.x) / 2,
        y: (gameState.firstPoint.y + gameState.secondPoint.y) / 2
      };
      gameState.drawingPhase = DRAWING_PHASES.CONTROL_POINT;
      break;
      
    case DRAWING_PHASES.CONTROL_POINT:
      // Finalize curved barrier
      finalizeCurvedBarrier(p);
      break;
  }
}

function cancelDrawing() {
  gameState.drawingPhase = DRAWING_PHASES.IDLE;
  gameState.firstPoint = null;
  gameState.secondPoint = null;
  gameState.controlPoint = null;
  gameState.cursor.drawingMode = false;
}

function finalizeCurvedBarrier(p) {
  if (!gameState.firstPoint || !gameState.secondPoint || !gameState.controlPoint) return;
  
  // Create curved barrier as multiple small segments
  const segments = 20; // Number of segments to approximate the curve
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = quadraticBezier(
      gameState.firstPoint,
      gameState.controlPoint,
      gameState.secondPoint,
      t
    );
    points.push(point);
  }
  
  // Create barriers for each segment
  for (let i = 0; i < points.length - 1; i++) {
    const barrier = new Barrier(
      points[i].x,
      points[i].y,
      points[i + 1].x,
      points[i + 1].y,
      false
    );
    gameState.barriers.push(barrier);
    gameState.entities.push(barrier);
  }
  
  // Reset drawing state
  cancelDrawing();
}

function quadraticBezier(p0, p1, p2, t) {
  // Quadratic Bezier curve formula
  const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
  const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
  return { x, y };
}

export function updateDrawing(p) {
  const speed = 5;
  let dx = 0, dy = 0;
  
  if (p.keyIsDown(37)) dx = -speed; // LEFT
  if (p.keyIsDown(39)) dx = speed;  // RIGHT
  if (p.keyIsDown(38)) dy = -speed; // UP
  if (p.keyIsDown(40)) dy = speed;  // DOWN
  
  if (dx !== 0 || dy !== 0) {
    if (gameState.cursor.active) {
      if (gameState.drawingPhase === DRAWING_PHASES.CONTROL_POINT) {
        // Move control point
        gameState.controlPoint.x = Math.max(0, Math.min(CANVAS_WIDTH, gameState.controlPoint.x + dx));
        gameState.controlPoint.y = Math.max(0, Math.min(CANVAS_HEIGHT, gameState.controlPoint.y + dy));
      } else {
        // Move cursor
        gameState.cursor.x = Math.max(0, Math.min(CANVAS_WIDTH, gameState.cursor.x + dx));
        gameState.cursor.y = Math.max(0, Math.min(CANVAS_HEIGHT, gameState.cursor.y + dy));
      }
    }
  }
}

function resetLevel(p) {
  startLevel(p, gameState.currentLevel);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { event: 'level_reset', level: gameState.currentLevel },
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
  // Test level reset and progression
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
  
  // Fill cups to trigger win
  if (gameState.testFrameCount > 50 && gameState.testFrameCount % 5 === 0) {
    gameState.spawners.forEach(spawner => {
      for (let i = 0; i < 3; i++) {
        spawner.spawn();
      }
    });
  }
}