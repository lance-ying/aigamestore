// rendering.js - Rendering functions for the game

import { 
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, GAME_PHASES, gameState
} from './globals.js';
import { LEVELS } from './levels.js';

export function drawStartScreen(p) {
  // Use rect instead of background to respect scaling/translation
  p.noStroke();
  p.fill(20, 20, 40);
  p.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  // Flashing start prompt, replacing the old title
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 100);
    p.textSize(24); // Slightly larger for prominence
    p.text("press enter to begin", GAME_WIDTH / 2, GAME_HEIGHT / 2); // Centered on canvas
  }
}

export function drawPauseIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PAUSED", GAME_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p) {
  // Use rect instead of background to respect scaling/translation
  p.noStroke();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(150, 255, 150);
    p.textSize(48);
    p.text("SUMMIT!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text("You reached the top of the mountain!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text("You ran out of lives", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
  }
  
  p.fill(200, 200, 255);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  p.text(`Level: ${gameState.currentLevel + 1}/${LEVELS.length}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
}

export function drawLevel(p, level) {
  if (!level) return;
  
  for (let row = 0; row < level.tiles.length; row++) {
    for (let col = 0; col < level.tiles[row].length; col++) {
      const tile = level.tiles[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      
      if (tile === 1) {
        // Solid platform
        p.fill(80, 80, 100);
        p.stroke(100, 100, 120);
        p.strokeWeight(1);
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 2) {
        // Spikes
        p.fill(200, 50, 50);
        p.noStroke();
        for (let i = 0; i < TILE_SIZE; i += TILE_SIZE / 3) {
          p.triangle(
            x + i, y + TILE_SIZE,
            x + i + TILE_SIZE / 6, y + TILE_SIZE / 2,
            x + i + TILE_SIZE / 3, y + TILE_SIZE
          );
        }
      } else if (tile === 3) {
        // Goal flag
        p.fill(100, 255, 100);
        p.noStroke();
        p.rect(x + TILE_SIZE / 2 - 2, y + 5, 4, TILE_SIZE - 10);
        p.fill(255, 200, 100);
        p.triangle(
          x + TILE_SIZE / 2, y + 5,
          x + TILE_SIZE / 2, y + 12,
          x + TILE_SIZE - 5, y + 8
        );
      } else if (tile === 4) {
        // Strawberry
        const key = `${gameState.currentLevel}-${row}-${col}`;
        if (!gameState.collectedStrawberries.has(key)) {
          p.fill(255, 100, 150);
          p.noStroke();
          p.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8);
          p.fill(100, 200, 100);
          p.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2 - 5, 3);
        }
      } else if (tile === 5) {
        // Climbable wall
        p.fill(60, 80, 60);
        p.noStroke();
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add texture
        p.stroke(80, 100, 80);
        for (let i = 0; i < 4; i++) {
          p.line(x + i * 5, y, x + i * 5, y + TILE_SIZE);
        }
      }
    }
  }
}

export function drawUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.noStroke();
  p.textSize(16);
  p.text(`Lives: ${gameState.lives}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 30);
  p.text(`Level: ${gameState.currentLevel + 1}/${LEVELS.length}`, 10, 50);
  
  // Show dashes
  if (gameState.player) {
    const dashText = gameState.player.dashesRemaining > 0 ? "Dash: Ready" : "Dash: Used";
    p.text(dashText, GAME_WIDTH - 120, 10);
  }
  
  p.pop();
}

export function drawBackground(p) {
  // Gradient background
  for (let y = 0; y < GAME_HEIGHT; y++) {
    const inter = y / GAME_HEIGHT;
    const c1 = [20, 20, 40];
    const c2 = [60, 40, 80];
    const col = [
      c1[0] + (c2[0] - c1[0]) * inter,
      c1[1] + (c2[1] - c1[1]) * inter,
      c1[2] + (c2[2] - c1[2]) * inter
    ];
    p.stroke(...col);
    p.line(0, y, GAME_WIDTH, y);
  }
}