// game.js
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  WATER_LEVEL,
  GROUND_LEVEL,
  TURN_TIME,
  WEAPON_TYPES
} from './globals.js';

import { Worm, Projectile, Terrain } from './entities.js';
import { setupCollisionHandling } from './physics.js';

let gameInstance = new p5(p => {
  let lastPlayerInfoLog = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0.6;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    setupCollisionHandling();
    initializeGame(p);
  };
  
  p.draw = function() {
    Engine.update(gameState.engine, 1000 / 60);
    
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        handleAI(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
    }
    
    if (p.keyCode === 82) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
    
    return false;
  };
  
  function initializeGame(p) {
    gameState.entities = [];
    gameState.playerWorms = [];
    gameState.enemyWorms = [];
    gameState.terrain = [];
    gameState.projectiles = [];
    gameState.explosions = [];
    gameState.currentTeam = 'player';
    gameState.currentWormIndex = 0;
    gameState.turnTimer = TURN_TIME;
    gameState.selectedWeapon = 'BAZOOKA';
    gameState.aimAngle = -45;
    gameState.power = 50;
    gameState.wind = (Math.random() - 0.5) * 20;
    gameState.hasShot = false;
    gameState.waitingForProjectile = false;
    
    // Create terrain
    createTerrain(p);
    
    // Create player worms
    const playerPositions = [
      { x: 100, y: 200 },
      { x: 150, y: 200 },
      { x: 200, y: 200 },
      { x: 250, y: 200 }
    ];
    
    for (let pos of playerPositions) {
      const worm = new Worm(p, pos.x, pos.y, 'player');
      gameState.playerWorms.push(worm);
      gameState.entities.push(worm);
    }
    
    // Create enemy worms
    const enemyPositions = [
      { x: 350, y: 200 },
      { x: 400, y: 200 },
      { x: 450, y: 200 },
      { x: 500, y: 200 }
    ];
    
    for (let pos of enemyPositions) {
      const worm = new Worm(p, pos.x, pos.y, 'enemy');
      gameState.enemyWorms.push(worm);
      gameState.entities.push(worm);
    }
    
    gameState.player = gameState.playerWorms[0];
  }
  
  function createTerrain(p) {
    // Create ground with hills
    const segments = 20;
    const segmentWidth = CANVAS_WIDTH / segments;
    
    for (let i = 0; i < segments; i++) {
      const x = i * segmentWidth + segmentWidth / 2;
      const baseHeight = 80;
      const hillHeight = Math.sin(i * 0.5) * 30;
      const height = baseHeight + hillHeight;
      const y = CANVAS_HEIGHT - height / 2;
      
      const terrain = new Terrain(p, x, y, segmentWidth, height);
      gameState.terrain.push(terrain);
      gameState.entities.push(terrain);
    }
  }
  
  function updateGame(p) {
    // Update turn timer
    if (!gameState.waitingForProjectile) {
      gameState.turnTimer -= 1 / 60;
      if (gameState.turnTimer <= 0) {
        nextTurn(p);
      }
    }
    
    // Update entities
    for (let entity of gameState.entities) {
      if (entity.update) entity.update();
    }
    
    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
      const remove = proj.update();
      return !remove;
    });
    
    // Update explosions
    gameState.explosions = gameState.explosions.filter(exp => {
      exp.timer--;
      return exp.timer > 0;
    });
    
    // Check if all projectiles finished
    if (gameState.waitingForProjectile && gameState.projectiles.length === 0) {
      gameState.waitingForProjectile = false;
      nextTurn(p);
    }
    
    // Handle player input
    if (gameState.currentTeam === 'player' && gameState.controlMode === 'HUMAN') {
      handlePlayerInput(p);
    }
    
    // Check win/lose conditions
    checkGameOver(p);
  }
  
  function handlePlayerInput(p) {
    if (gameState.waitingForProjectile) return;
    
    const activeWorm = getCurrentWorm();
    if (!activeWorm || !activeWorm.alive) return;
    
    // Movement
    if (p.keyIsDown(37) || p.keyIsDown(65)) {
      activeWorm.moveLeft();
    }
    if (p.keyIsDown(39) || p.keyIsDown(68)) {
      activeWorm.moveRight();
    }
    
    // Jump
    if (p.keyIsDown(38) || p.keyIsDown(87)) {
      activeWorm.jump();
    }
    
    // Weapon cycling
    if (p.keyIsDown(32) && !gameState.hasShot) {
      cycleWeapon();
    }
    
    // Aim
    if (p.keyIsDown(90)) {
      gameState.aimAngle = Math.max(-90, gameState.aimAngle - 1);
    }
    if (p.keyIsDown(83)) {
      gameState.aimAngle = Math.min(0, gameState.aimAngle + 1);
    }
    
    // Power
    if (p.keyIsDown(16)) {
      gameState.power = Math.min(100, gameState.power + 1);
    }
    if (p.keyIsDown(40)) {
      gameState.power = Math.max(10, gameState.power - 1);
    }
    
    // Fire
    if (p.keyIsDown(13) && !gameState.hasShot) {
      fireWeapon(p);
    }
  }
  
  function handleAI(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    if (gameState.currentTeam !== 'enemy') return;
    if (gameState.waitingForProjectile) return;
    
    const mode = gameState.controlMode;
    
    if (mode === 'TEST_1') {
      // Basic movement test
      const activeWorm = getCurrentWorm();
      if (!activeWorm || !activeWorm.alive) return;
      
      if (p.frameCount % 60 < 30) {
        activeWorm.moveRight();
      } else {
        activeWorm.moveLeft();
      }
      
      if (p.frameCount % 120 === 0) {
        activeWorm.jump();
      }
      
      if (gameState.turnTimer < 15 && !gameState.hasShot) {
        cycleWeapon();
      }
      
      if (gameState.turnTimer < 5 && !gameState.hasShot) {
        gameState.aimAngle = -45;
        gameState.power = 50;
        fireWeapon(p);
      }
    } else if (mode === 'TEST_2') {
      // Win test - fire at player worms
      const activeWorm = getCurrentWorm();
      if (!activeWorm || !activeWorm.alive) return;
      
      // Find nearest player worm
      let nearestWorm = null;
      let minDist = Infinity;
      for (let worm of gameState.playerWorms) {
        if (!worm.alive) continue;
        const dx = worm.body.position.x - activeWorm.body.position.x;
        const dy = worm.body.position.y - activeWorm.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestWorm = worm;
        }
      }
      
      if (nearestWorm && !gameState.hasShot) {
        const dx = nearestWorm.body.position.x - activeWorm.body.position.x;
        const dy = nearestWorm.body.position.y - activeWorm.body.position.y;
        gameState.aimAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        gameState.aimAngle = Math.max(-90, Math.min(0, gameState.aimAngle));
        gameState.power = 70 + Math.random() * 20;
        fireWeapon(p);
      }
    } else {
      // Normal AI behavior
      const activeWorm = getCurrentWorm();
      if (!activeWorm || !activeWorm.alive) return;
      
      // Find nearest player worm
      let nearestWorm = null;
      let minDist = Infinity;
      for (let worm of gameState.playerWorms) {
        if (!worm.alive) continue;
        const dx = worm.body.position.x - activeWorm.body.position.x;
        const dy = worm.body.position.y - activeWorm.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestWorm = worm;
        }
      }
      
      if (nearestWorm && gameState.turnTimer < 25 && !gameState.hasShot) {
        const dx = nearestWorm.body.position.x - activeWorm.body.position.x;
        const dy = nearestWorm.body.position.y - activeWorm.body.position.y;
        gameState.aimAngle = Math.atan2(dy, dx) * 180 / Math.PI - 15;
        gameState.aimAngle = Math.max(-90, Math.min(0, gameState.aimAngle));
        gameState.power = 60 + Math.random() * 30;
        fireWeapon(p);
      }
    }
  }
  
  function cycleWeapon() {
    const weapons = Object.keys(WEAPON_TYPES);
    const currentIndex = weapons.indexOf(gameState.selectedWeapon);
    const nextIndex = (currentIndex + 1) % weapons.length;
    gameState.selectedWeapon = weapons[nextIndex];
  }
  
  function fireWeapon(p) {
    const activeWorm = getCurrentWorm();
    if (!activeWorm || !activeWorm.alive) return;
    
    gameState.hasShot = true;
    gameState.waitingForProjectile = true;
    
    const angle = gameState.aimAngle * Math.PI / 180;
    const power = gameState.power / 10;
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;
    
    const weaponData = WEAPON_TYPES[gameState.selectedWeapon];
    const projectile = new Projectile(
      p,
      activeWorm.body.position.x,
      activeWorm.body.position.y,
      vx,
      vy,
      weaponData
    );
    gameState.projectiles.push(projectile);
  }
  
  function nextTurn(p) {
    gameState.hasShot = false;
    gameState.waitingForProjectile = false;
    
    // Switch to next worm in current team
    if (gameState.currentTeam === 'player') {
      let attempts = 0;
      do {
        gameState.currentWormIndex = (gameState.currentWormIndex + 1) % gameState.playerWorms.length;
        attempts++;
        if (attempts > 10) break;
      } while (!gameState.playerWorms[gameState.currentWormIndex].alive);
      
      // Switch to enemy team
      gameState.currentTeam = 'enemy';
      gameState.currentWormIndex = 0;
      
      // Find first alive enemy worm
      attempts = 0;
      while (!getCurrentWorm()?.alive && attempts < 10) {
        gameState.currentWormIndex = (gameState.currentWormIndex + 1) % gameState.enemyWorms.length;
        attempts++;
      }
    } else {
      let attempts = 0;
      do {
        gameState.currentWormIndex = (gameState.currentWormIndex + 1) % gameState.enemyWorms.length;
        attempts++;
        if (attempts > 10) break;
      } while (!gameState.enemyWorms[gameState.currentWormIndex].alive);
      
      // Switch to player team
      gameState.currentTeam = 'player';
      gameState.currentWormIndex = 0;
      
      // Find first alive player worm
      attempts = 0;
      while (!getCurrentWorm()?.alive && attempts < 10) {
        gameState.currentWormIndex = (gameState.currentWormIndex + 1) % gameState.playerWorms.length;
        attempts++;
      }
    }
    
    gameState.turnTimer = TURN_TIME;
    gameState.wind = (Math.random() - 0.5) * 20;
  }
  
  function getCurrentWorm() {
    if (gameState.currentTeam === 'player') {
      return gameState.playerWorms[gameState.currentWormIndex];
    } else {
      return gameState.enemyWorms[gameState.currentWormIndex];
    }
  }
  
  function checkGameOver(p) {
    const alivePlayerWorms = gameState.playerWorms.filter(w => w.alive).length;
    const aliveEnemyWorms = gameState.enemyWorms.filter(w => w.alive).length;
    
    if (alivePlayerWorms === 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (aliveEnemyWorms === 0) {
      gameState.gamePhase = "GAME_OVER_WIN";
      gameState.score += 1000;
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function renderStartScreen(p) {
    p.background(20, 30, 50);
    
    p.fill(255, 200, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("WORMS", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(16);
    p.text("Tactical turn-based warfare!", CANVAS_WIDTH / 2, 160);
    p.text("Eliminate all enemy worms to win.", CANVAS_WIDTH / 2, 190);
    
    p.textSize(14);
    p.text("Each worm has 100 HP. Watch the wind!", CANVAS_WIDTH / 2, 230);
    p.text("Explosions destroy terrain and damage worms.", CANVAS_WIDTH / 2, 250);
    
    p.fill(100, 255, 100);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
    
    // Draw sample worms
    p.fill(0, 150, 255);
    p.circle(200, 270, 20);
    p.fill(255, 50, 50);
    p.circle(400, 270, 20);
  }
  
  function renderGame(p) {
    // Sky
    p.background(135, 206, 235);
    
    // Water
    p.fill(30, 100, 180);
    p.noStroke();
    p.rect(0, WATER_LEVEL, CANVAS_WIDTH, CANVAS_HEIGHT - WATER_LEVEL);
    
    // Render terrain
    for (let terrain of gameState.terrain) {
      if (terrain.render) terrain.render();
    }
    
    // Render explosions
    for (let exp of gameState.explosions) {
      const progress = exp.timer / 15;
      p.push();
      p.noStroke();
      p.fill(exp.color[0], exp.color[1], exp.color[2], progress * 150);
      p.circle(exp.x, exp.y, exp.radius * 2 * (1 - progress * 0.3));
      p.fill(255, 255, 100, progress * 200);
      p.circle(exp.x, exp.y, exp.radius * (1 - progress * 0.5));
      p.pop();
    }
    
    // Render projectiles
    for (let proj of gameState.projectiles) {
      proj.render();
    }
    
    // Render worms
    for (let worm of gameState.playerWorms) {
      worm.render();
    }
    for (let worm of gameState.enemyWorms) {
      worm.render();
    }
    
    // Highlight active worm
    const activeWorm = getCurrentWorm();
    if (activeWorm && activeWorm.alive) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.circle(activeWorm.body.position.x, activeWorm.body.position.y, 25);
      p.pop();
      
      // Draw aim indicator
      if (gameState.currentTeam === 'player' && !gameState.waitingForProjectile) {
        p.push();
        p.stroke(255, 0, 0);
        p.strokeWeight(2);
        const angle = gameState.aimAngle * Math.PI / 180;
        const length = gameState.power / 2;
        p.line(
          activeWorm.body.position.x,
          activeWorm.body.position.y,
          activeWorm.body.position.x + Math.cos(angle) * length,
          activeWorm.body.position.y + Math.sin(angle) * length
        );
        p.pop();
      }
    }
    
    // UI
    renderUI(p);
  }
  
  function renderUI(p) {
    // Turn timer
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Turn: ${gameState.currentTeam.toUpperCase()}`, 10, 10);
    p.text(`Time: ${Math.ceil(gameState.turnTimer)}s`, 10, 30);
    
    // Wind
    const windText = gameState.wind > 0 ? `Wind: ${gameState.wind.toFixed(1)} →` : `Wind: ← ${Math.abs(gameState.wind).toFixed(1)}`;
    p.text(windText, 10, 50);
    
    // Weapon
    const weaponData = WEAPON_TYPES[gameState.selectedWeapon];
    p.text(`Weapon: ${weaponData.name}`, 10, 70);
    
    // Aim and power
    p.text(`Angle: ${gameState.aimAngle}°`, 10, 90);
    p.text(`Power: ${gameState.power}%`, 10, 110);
    
    // Worm counts
    const alivePlayerWorms = gameState.playerWorms.filter(w => w.alive).length;
    const aliveEnemyWorms = gameState.enemyWorms.filter(w => w.alive).length;
    p.fill(0, 150, 255);
    p.text(`Player Worms: ${alivePlayerWorms}`, CANVAS_WIDTH - 150, 10);
    p.fill(255, 50, 50);
    p.text(`Enemy Worms: ${aliveEnemyWorms}`, CANVAS_WIDTH - 150, 30);
    
    // Score
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 150, 50);
  }
  
  function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    p.pop();
  }
  
  function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.fill(100, 255, 100);
      p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    } else {
      p.fill(255, 100, 100);
      p.text("DEFEAT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    p.pop();
  }
  
  function resetGame(p) {
    // Remove all bodies from world
    for (let entity of gameState.entities) {
      if (entity.body && entity.body.id) {
        World.remove(gameState.world, entity.body);
      }
    }
    
    for (let proj of gameState.projectiles) {
      if (proj.body && proj.body.id) {
        World.remove(gameState.world, proj.body);
      }
    }
    
    gameState.gamePhase = "START";
    gameState.score = 0;
    
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    initializeGame(p);
  }
});

window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) activeBtn.classList.add('active');
};