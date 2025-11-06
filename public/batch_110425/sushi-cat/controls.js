// controls.js - Input handling and control modes

import { gameState, CANVAS_WIDTH } from './globals.js';
import { SushiCat } from './entities.js';

export function handleInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p);
  } else if (gameState.controlMode === "TEST_1") {
    handleTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    handleTest2(p);
  }
}

function handleHumanInput(p) {
  // Move drop position
  if (!gameState.catDropped) {
    if (p.keyIsDown(37)) { // LEFT
      gameState.dropPositionX = Math.max(40, gameState.dropPositionX - 3);
    }
    if (p.keyIsDown(39)) { // RIGHT
      gameState.dropPositionX = Math.min(CANVAS_WIDTH - 40, gameState.dropPositionX + 3);
    }
  }
}

function handleTest1(p) {
  // Basic testing - drop from various positions
  gameState.testTimer++;
  
  if (!gameState.catDropped && gameState.testTimer > 60) {
    // Drop from different positions
    if (gameState.testState === 0) {
      gameState.dropPositionX = CANVAS_WIDTH * 0.25;
    } else if (gameState.testState === 1) {
      gameState.dropPositionX = CANVAS_WIDTH * 0.5;
    } else if (gameState.testState === 2) {
      gameState.dropPositionX = CANVAS_WIDTH * 0.75;
    }
    
    dropCat(p);
    gameState.testState++;
    gameState.testTimer = 0;
  }
  
  // Wait for cat to fall
  if (gameState.player && gameState.player.body.position.y > CANVAS_HEIGHT + 50) {
    gameState.testTimer = 50; // Speed up next drop
  }
}

function handleTest2(p) {
  // Win condition test - force collect sushi
  gameState.testTimer++;
  
  if (!gameState.catDropped && gameState.testTimer > 30) {
    // Drop from optimal position
    gameState.dropPositionX = CANVAS_WIDTH * 0.5;
    dropCat(p);
    gameState.testTimer = 0;
  }
  
  // Force collect all sushi quickly
  if (gameState.player && gameState.testTimer > 10) {
    gameState.sushiPieces.forEach(sushi => {
      if (!sushi.collected && gameState.bellyMeter < 100) {
        sushi.collect();
      }
    });
  }
}

export function dropCat(p) {
  if (gameState.catDropped || gameState.dropsRemaining <= 0) return;
  
  gameState.player = new SushiCat(p, gameState.dropPositionX, 80);
  gameState.catDropped = true;
  
  p.logs.player_info.push({
    screen_x: gameState.dropPositionX,
    screen_y: 80,
    game_x: gameState.dropPositionX,
    game_y: 80,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}