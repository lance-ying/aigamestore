// interaction.js - Mouse interaction handling

import { gameState, GAME_PHASE, TILE_SIZE } from './globals.js';
import { tillPlot, plantCrop, harvestPlot, placeBuilding, collectAnimal, upgradeFarmhouse } from './game-logic.js';

let p;

export function initInteraction(p5Instance) {
  p = p5Instance;
}

export function handleMousePressed() {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) return;
  
  const mouseX = p.mouseX + gameState.camera.x;
  const mouseY = p.mouseY + gameState.camera.y;
  
  // Check UI buttons first
  if (p.mouseY >= 340 && p.mouseY <= 370) {
    handleUIButtonClick();
    return;
  }
  
  // Check for house upgrade button
  if (p.mouseY >= 300 && p.mouseY <= 330 && p.mouseX >= 490 && p.mouseX <= 570) {
    if (gameState.level >= 21 && gameState.farmHouseLevel === 0) {
      upgradeFarmhouse();
      return;
    }
  }
  
  // Calculate grid position
  const gridX = Math.floor(mouseX / TILE_SIZE);
  const gridY = Math.floor(mouseY / TILE_SIZE);
  
  // Check if clicking on animal
  for (let animal of gameState.animals) {
    const ax = animal.x + TILE_SIZE / 2;
    const ay = animal.y + TILE_SIZE / 2;
    if (p.dist(mouseX, mouseY, ax, ay) < 16) {
      collectAnimal(animal);
      return;
    }
  }
  
  // Check if placing building
  if (gameState.selectedBuilding) {
    placeBuilding(gameState.selectedBuilding, gridX, gridY);
    gameState.selectedBuilding = null;
    return;
  }
  
  // Get clicked plot
  const plot = gameState.farmPlots.find(p => p.gridX === gridX && p.gridY === gridY);
  if (!plot) return;
  
  // Handle plot interaction
  if (plot.state === "empty") {
    tillPlot(gridX, gridY);
  } else if (plot.state === "tilled" && gameState.selectedCrop) {
    plantCrop(gameState.selectedCrop);
  } else if (plot.state === "ready") {
    harvestPlot(gridX, gridY);
  }
}

function handleUIButtonClick() {
  const y = p.mouseY;
  if (y < 300 || y > 330) return;
  
  let x = 10;
  
  // Till button
  if (p.mouseX >= x && p.mouseX <= x + 60) {
    // Till action via click
    return;
  }
  x += 70;
  
  // Wheat seed
  if (gameState.level >= 1) {
    if (p.mouseX >= x && p.mouseX <= x + 60) {
      gameState.selectedCrop = gameState.selectedCrop === "WHEAT" ? null : "WHEAT";
      gameState.selectedBuilding = null;
      return;
    }
    x += 70;
  }
  
  // Corn seed
  if (gameState.level >= 6) {
    if (p.mouseX >= x && p.mouseX <= x + 60) {
      gameState.selectedCrop = gameState.selectedCrop === "CORN" ? null : "CORN";
      gameState.selectedBuilding = null;
      return;
    }
    x += 70;
  }
  
  // Buildings
  const buildings = [
    { type: "BARN", level: 1 },
    { type: "MILL", level: 6 },
    { type: "BAKERY", level: 11 },
    { type: "SAWMILL", level: 16 }
  ];
  
  for (let bInfo of buildings) {
    if (gameState.level >= bInfo.level) {
      if (p.mouseX >= x && p.mouseX <= x + 70) {
        gameState.selectedBuilding = gameState.selectedBuilding === bInfo.type ? null : bInfo.type;
        gameState.selectedCrop = null;
        return;
      }
      x += 80;
    }
  }
}