import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES, MAPS } from './globals.js';
import { canStartWave } from './waveManager.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("2112TD: TOWER DEFENSE", CANVAS_WIDTH / 2, 60);
  
  p.textSize(14);
  p.fill(200, 200, 220);
  p.text("Defend your command center against waves of alien invaders!", CANVAS_WIDTH / 2, 110);
  p.text("Deploy towers strategically along the path.", CANVAS_WIDTH / 2, 130);
  p.text("Survive 5 waves on each map to progress!", CANVAS_WIDTH / 2, 150);
  
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO BEGIN", CANVAS_WIDTH / 2, 350);
}

export function renderMapSelection(p) {
  const mapData = MAPS[gameState.currentMap];
  p.background(...mapData.bgColor);
  
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("SELECT MAP", CANVAS_WIDTH / 2, 40);
  
  const maps = Object.keys(MAPS);
  const boxWidth = 150;
  const boxHeight = 120;
  const spacing = 30;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  const startY = 100;
  
  for (let i = 0; i < maps.length; i++) {
    const mapKey = maps[i];
    const map = MAPS[mapKey];
    const x = startX + i * (boxWidth + spacing);
    const y = startY;
    
    const isSelected = gameState.selectedMapKey === mapKey;
    
    p.push();
    p.fill(...(isSelected ? [100, 200, 255, 150] : [50, 50, 80, 180]));
    p.stroke(isSelected ? [100, 200, 255] : [100, 100, 150]);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, y, boxWidth, boxHeight, 5);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(map.name, x + boxWidth / 2, y + 10);
    
    p.textSize(14);
    p.fill(200, 200, 200);
    p.text(map.difficulty, x + boxWidth / 2, y + 35);
    
    p.textSize(11);
    p.fill(180, 180, 180);
    p.text(`5 Waves`, x + boxWidth / 2, y + 60);
    p.text(`Start: $${map.startMoney}`, x + boxWidth / 2, y + 80);
    p.pop();
  }
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Arrow Keys: Select Map | Enter: Start Map", CANVAS_WIDTH / 2, 260);
  
  renderPath(p);
  renderCommandCenter(p);
}

export function renderMapComplete(p) {
  const mapData = MAPS[gameState.currentMap];
  p.background(...mapData.bgColor);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MAP COMPLETE!", CANVAS_WIDTH / 2, 100);
  
  p.textSize(20);
  p.fill(200, 200, 220);
  p.text(`${mapData.name} - ${mapData.difficulty}`, CANVAS_WIDTH / 2, 160);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  p.text(`Money: $${gameState.money}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER to continue", CANVAS_WIDTH / 2, 280);
  p.text("PRESS R to restart game", CANVAS_WIDTH / 2, 310);
}

export function renderPauseIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  p.textSize(20);
  p.fill(200, 200, 220);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Waves Completed: ${gameState.wave}`, CANVAS_WIDTH / 2, 190);
  p.text(`Money: $${gameState.money}`, CANVAS_WIDTH / 2, 220);
  
  if (!isWin) {
    p.textSize(16);
    p.fill(255, 150, 150);
    p.text(`Command Center Destroyed`, CANVAS_WIDTH / 2, 260);
  }
  
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}

export function renderUI(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Money: $${gameState.money}`, 10, 10);
  
  const maxWaves = MAPS[gameState.currentMap].maxWaves;
  p.text(`Wave: ${gameState.wave}/${maxWaves}`, 10, 25);
  p.text(`Score: ${gameState.score}`, 10, 40);
  
  const healthPercent = Math.max(0, gameState.commandCenterHealth / 100);
  p.fill(255, 0, 0);
  p.rect(10, 55, 100, 10);
  p.fill(0, 255, 0);
  p.rect(10, 55, 100 * healthPercent, 10);
  p.fill(255);
  p.text(`Base: ${Math.floor(gameState.commandCenterHealth)}%`, 10, 70);
  
  const mapData = MAPS[gameState.currentMap];
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(200, 200, 255);
  p.text(mapData.name, CANVAS_WIDTH - 10, 10);
  p.text(mapData.difficulty, CANVAS_WIDTH - 10, 25);
  
  if (gameState.placementMode && gameState.selectedTowerType) {
    const towerData = TOWER_TYPES[gameState.selectedTowerType];
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(`Placing: ${towerData.name} ($${towerData.cost})`, CANVAS_WIDTH / 2, 10);
    p.text(`Range: ${towerData.range} | Damage: ${towerData.damage}`, CANVAS_WIDTH / 2, 28);
  }
  
  // Wave start button
  if (canStartWave()) {
    p.fill(100, 255, 100, 200);
    p.stroke(100, 255, 100);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 70, 160, 30, 5);
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`START WAVE ${gameState.wave + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 55);
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text("(Press W)", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
  }
  
  renderTowerSelector(p);
  p.pop();
}

export function renderTowerSelector(p) {
  const types = Object.keys(TOWER_TYPES);
  const boxWidth = 70;
  const boxHeight = 50;
  const spacing = 5;
  const startX = CANVAS_WIDTH - (boxWidth + spacing) * types.length - 10;
  const startY = CANVAS_HEIGHT - boxHeight - 100;
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const towerData = TOWER_TYPES[type];
    const x = startX + i * (boxWidth + spacing);
    const y = startY;
    
    const isSelected = gameState.selectedTowerIndex === i;
    
    p.push();
    p.fill(...(isSelected ? [255, 255, 100, 100] : [50, 50, 80, 180]));
    p.stroke(isSelected ? [255, 255, 100] : [100, 100, 150]);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, y, boxWidth, boxHeight);
    
    p.fill(...towerData.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(x + boxWidth / 2, y + boxHeight / 2 - 5, 15, 15);
    p.rectMode(p.CORNER);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(8);
    p.text(towerData.name, x + boxWidth / 2, y + boxHeight - 15);
    p.text(`$${towerData.cost}`, x + boxWidth / 2, y + boxHeight - 7);
    p.pop();
  }
}

export function renderPath(p) {
  const mapData = MAPS[gameState.currentMap];
  p.push();
  p.stroke(...mapData.pathColor);
  p.strokeWeight(30);
  p.noFill();
  p.beginShape();
  for (const point of gameState.path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  p.pop();
}

export function renderTowerPreview(p) {
  if (!gameState.placementMode || !gameState.selectedTowerType) return;
  
  const towerData = TOWER_TYPES[gameState.selectedTowerType];
  const isValid = isTowerPositionValid(gameState.previewX, gameState.previewY);
  
  p.push();
  p.fill(...towerData.color, 100);
  p.stroke(...(isValid ? [0, 255, 0] : [255, 0, 0]));
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(gameState.previewX, gameState.previewY, 20, 20);
  
  p.noFill();
  p.stroke(...towerData.color, 80);
  p.strokeWeight(1);
  p.ellipse(gameState.previewX, gameState.previewY, towerData.range * 2);
  p.pop();
}

function isTowerPositionValid(x, y) {
  for (const tower of gameState.towers) {
    const dist = Math.sqrt((tower.x - x) ** 2 + (tower.y - y) ** 2);
    if (dist < 30) return false;
  }
  
  let minDist = Infinity;
  for (const pos of gameState.validTowerPositions) {
    const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
    minDist = Math.min(minDist, dist);
  }
  
  return minDist < 25;
}

export function renderCommandCenter(p) {
  const lastPoint = gameState.path[gameState.path.length - 1];
  
  p.push();
  p.fill(50, 150, 255);
  p.stroke(100, 200, 255);
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(lastPoint.x - 30, lastPoint.y, 40, 40);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("HQ", lastPoint.x - 30, lastPoint.y);
  p.pop();
}