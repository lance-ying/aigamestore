import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { generatePath, generateValidTowerPositions } from './pathGeneration.js';
import { handleKeyPressed, updatePlacementPreview } from './input.js';
import { updateWaveSpawning } from './waveManager.js';
import { renderStartScreen, renderMapComplete, renderGameOverScreen, renderUI, renderPath, renderTowerPreview, renderCommandCenter } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    gameState.currentMap = "EASY";
    gameState.path = generatePath(gameState.currentMap);
    gameState.validTowerPositions = generateValidTowerPositions(gameState.path);
    
    p.logs.game_info.push({
      data: { phase: "START", initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === "MAP_COMPLETE") {
      renderMapComplete(p);
      return;
    }
    
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOverScreen(p);
      return;
    }
    
    if (gameState.gamePhase === "PLAYING") {
      updateGame(p);
    }
    
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  function updateGame(p) {
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      for (const keyCode of actions) {
        handleKeyPressed(p, String.fromCharCode(keyCode), keyCode);
      }
    }
    
    gameState.framesSinceLastAction++;
    
    gameState.gameSpeed = p.keyIsDown(16) ? 2 : 1;
    
    updateWaveSpawning(p);
    
    updatePlacementPreview(p);
    
    for (const tower of gameState.towers) {
      tower.update(gameState.enemies, gameState.projectiles, gameState.gameSpeed);
    }
    
    for (const projectile of gameState.projectiles) {
      projectile.update(gameState.gameSpeed);
    }
    
    gameState.projectiles = gameState.projectiles.filter(proj => !proj.dead);
    
    for (const enemy of gameState.enemies) {
      enemy.update(gameState.gameSpeed);
      
      if (enemy.reachedGoal && !enemy.dead) {
        gameState.commandCenterHealth -= 10;
        gameState.enemiesReachedGoal++;
        enemy.dead = true;
        
        if (gameState.commandCenterHealth <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", wave: gameState.wave },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    const deadEnemies = gameState.enemies.filter(e => e.dead && !e.reachedGoal);
    for (const enemy of deadEnemies) {
      gameState.money += enemy.reward;
      gameState.score += enemy.reward * 10;
    }
    
    gameState.enemies = gameState.enemies.filter(e => !e.dead);
  }
  
  function renderGame(p) {
    const mapData = gameState.currentMap ? window.MAPS[gameState.currentMap] : { bgColor: [20, 30, 50] };
    p.background(...mapData.bgColor);
    
    renderPath(p);
    renderCommandCenter(p);
    
    for (const tower of gameState.towers) {
      tower.render(p);
    }
    
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
    
    for (const projectile of gameState.projectiles) {
      projectile.render(p);
    }
    
    renderTowerPreview(p);
    renderUI(p);
    
    if (p.frameCount % 10 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: gameState.previewX,
        screen_y: gameState.previewY,
        game_x: gameState.previewX,
        game_y: gameState.previewY,
        framecount: p.frameCount
      });
    }
  }
});

window.gameInstance = gameInstance;
window.MAPS = { EASY: { name: "Desert Outpost", difficulty: "Easy", bgColor: [40, 35, 25], pathColor: [80, 70, 50], maxWaves: 5, startMoney: 250 }, MEDIUM: { name: "Arctic Base", difficulty: "Medium", bgColor: [25, 30, 40], pathColor: [60, 80, 100], maxWaves: 5, startMoney: 200 }, HARD: { name: "Volcanic Ridge", difficulty: "Hard", bgColor: [30, 20, 20], pathColor: [100, 40, 30], maxWaves: 5, startMoney: 150 } };

window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const btnId = modeMap[mode];
  if (btnId) {
    document.getElementById(btnId).classList.add('active');
  }
};
</code/>

<code filename="rendering.js">
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES, MAPS } from './globals.js';
import { canStartWave } from './waveManager.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("press enter to begin", CANVAS_WIDTH / 2, 60);
  
  p.textSize(14);
  p.fill(200, 200, 220);
  p.text("Defend your command center against waves of alien invaders!", CANVAS_WIDTH / 2, 110);
  p.text("Deploy towers strategically along the path.", CANVAS_WIDTH / 2, 130);
  p.text("Survive 5 waves on each map to progress!", CANVAS_WIDTH / 2, 150);
  p.text("Complete EASY, MEDIUM, and HARD maps to win!", CANVAS_WIDTH / 2, 170);
  
  // Removed the redundant "PRESS ENTER TO BEGIN" as the main title now serves this purpose.
}

export function renderMapSelection(p) {
  // This function is no longer used but kept for compatibility
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
  
  if (gameState.currentMap === "HARD") {
    p.text("ALL MAPS COMPLETE!", CANVAS_WIDTH / 2, 260);
    p.text("PRESS ENTER to claim victory", CANVAS_WIDTH / 2, 290);
  } else {
    const nextMap = gameState.currentMap === "EASY" ? "MEDIUM" : "HARD";
    p.text(`PRESS ENTER to continue to ${nextMap}`, CANVAS_WIDTH / 2, 280);
  }
  p.text("PRESS R to restart game", CANVAS_WIDTH / 2, 310);
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
  
  if (isWin) {
    p.text("All maps completed!", CANVAS_WIDTH / 2, 140);
  }
  
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  p.text(`Waves Completed: ${gameState.wave}`, CANVAS_WIDTH / 2, 200);
  p.text(`Money: $${gameState.money}`, CANVAS_WIDTH / 2, 230);
  
  if (!isWin) {
    p.textSize(16);
    p.fill(255, 150, 150);
    p.text(`Command Center Destroyed`, CANVAS_WIDTH / 2, 270);
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
    const btnW = 160;
    const btnH = 30;
    const btnX = 10;
    const btnY = CANVAS_HEIGHT - 50;
    
    p.fill(100, 255, 100, 200);
    p.stroke(100, 255, 100);
    p.strokeWeight(2);
    p.rect(btnX, btnY, btnW, btnH, 5);
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`START WAVE ${gameState.wave + 1}`, btnX + btnW / 2, btnY + btnH / 2);
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text("(Press W)", btnX + btnW / 2, btnY + btnH + 12);
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
  const startY = CANVAS_HEIGHT - boxHeight - 10; // Moved to absolute bottom
  
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