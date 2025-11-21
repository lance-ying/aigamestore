// world.js - World navigation and object interaction
import { gameState, SCREENS, OPPONENTS, TRAINING_TYPES } from './globals.js';
import { startTraining } from './training.js';
import { startBattle } from './battle.js';

export function initializeWorld() {
  gameState.worldObjects = [];
  
  // Add training dojos
  TRAINING_TYPES.forEach((training, index) => {
    gameState.worldObjects.push({
      type: 'training',
      trainingId: training.id,
      name: training.name,
      x: 100 + index * 100,
      y: 150,
      color: training.color
    });
  });
  
  // Add opponents
  OPPONENTS.forEach((opponent, index) => {
    gameState.worldObjects.push({
      type: 'opponent',
      opponentId: opponent.id,
      name: opponent.name,
      x: 100 + index * 100,
      y: 280,
      opponent: opponent
    });
  });
  
  gameState.selectedObject = 0;
}

export function updateWorld(p) {
  // World updates can go here
}

export function handleWorldInput(keyCode, p) {
  const objects = gameState.worldObjects;
  
  if (keyCode === 37) { // LEFT
    gameState.selectedObject = Math.max(0, gameState.selectedObject - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedObject = Math.min(objects.length - 1, gameState.selectedObject + 1);
  } else if (keyCode === 32) { // SPACE - interact
    const obj = objects[gameState.selectedObject];
    if (obj) {
      if (obj.type === 'training') {
        gameState.screen = SCREENS.TRAINING_GAME;
        startTraining(obj.trainingId, p);
      } else if (obj.type === 'opponent') {
        if (!gameState.defeatedOpponents.includes(obj.opponentId)) {
          gameState.screen = SCREENS.BATTLE;
          startBattle(obj.opponent);
        }
      }
    }
  } else if (keyCode === 90) { // Z - equipment menu
    gameState.screen = SCREENS.EQUIPMENT;
    gameState.menuSelection = 0;
  }
}

export function renderWorld(p) {
  // Sky
  p.fill(135, 206, 235);
  p.rect(0, 0, 600, 300);
  
  // Ground
  p.fill(100, 200, 100);
  p.rect(0, 300, 600, 100);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text("Duck Training World", 300, 10);
  
  // Stats display
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(0);
  const stats = `Power: ${gameState.player.power} | Health: ${gameState.player.maxHealth} | Defence: ${gameState.player.defence} | Speed: ${gameState.player.speed} | Special: ${gameState.player.special}`;
  p.text(stats, 10, 40);
  p.text(`Wins: ${gameState.player.wins} | Currency: ${gameState.player.currency}`, 10, 60);
  
  // Draw world objects
  gameState.worldObjects.forEach((obj, index) => {
    const isSelected = index === gameState.selectedObject;
    const isDefeated = obj.type === 'opponent' && gameState.defeatedOpponents.includes(obj.opponentId);
    
    if (obj.type === 'training') {
      // Dojo building
      p.fill(...obj.color);
      p.rect(obj.x - 30, obj.y - 40, 60, 60);
      p.fill(100, 50, 0);
      p.triangle(obj.x - 35, obj.y - 40, obj.x + 35, obj.y - 40, obj.x, obj.y - 70);
      
      // Label
      p.fill(255);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(10);
      p.text(obj.name.split(' ')[0], obj.x, obj.y + 25);
      
    } else if (obj.type === 'opponent') {
      // Opponent duck
      const color = isDefeated ? [100, 100, 100] : [255, 100, 100];
      drawWorldDuck(p, obj.x, obj.y, 25, color);
      
      // Label
      p.fill(isDefeated ? 100 : 255);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(10);
      p.text(isDefeated ? `${obj.name} (Defeated)` : obj.name, obj.x, obj.y + 30);
    }
    
    // Selection indicator
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(obj.x - 40, obj.y - 50, 80, 85);
      p.noStroke();
      p.strokeWeight(1);
    }
  });
  
  // Player duck
  drawWorldDuck(p, gameState.player.x, gameState.player.y, 30, [255, 200, 0]);
  
  // Instructions
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Arrow Keys: Select | SPACE: Interact | Z: Equipment", 300, 365);
}

function drawWorldDuck(p, x, y, size, color) {
  p.push();
  p.translate(x, y);
  
  // Body
  p.fill(...color);
  p.ellipse(0, 0, size * 1.5, size);
  
  // Head
  p.ellipse(-size * 0.5, -size * 0.5, size, size);
  
  // Beak
  p.fill(255, 150, 0);
  p.triangle(-size * 0.8, -size * 0.5, -size * 1.2, -size * 0.3, -size * 1.2, -size * 0.7);
  
  // Eye
  p.fill(0);
  p.circle(-size * 0.6, -size * 0.6, size * 0.2);
  
  // Wing
  p.fill(...color.map(c => Math.floor(c * 0.8)));
  p.ellipse(size * 0.3, 0, size * 0.6, size * 0.4);
  
  p.pop();
}