const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './globals.js';
import { Player, Zombie, Obstacle, FuelPickup, BackgroundObject } from './entities.js';
import { setupPhysics } from './physics.js';

let groundBody;

function initializeGame(p) {
  gameState.entities = [];
  gameState.bullets = [];
  gameState.backgroundObjects = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.fuel = GAME_CONFIG.INITIAL_FUEL;
  gameState.armor = GAME_CONFIG.INITIAL_ARMOR;
  gameState.cameraX = 0;
  gameState.lastPlayerLogX = 0;
  gameState.lastPlayerLogY = 0;
  
  World.clear(gameState.world);
  Engine.clear(gameState.engine);
  
  groundBody = Bodies.rectangle(3000, 395, 6000, 30, {
    label: 'ground',
    isStatic: true,
    friction: 0.8
  });
  World.add(gameState.world, groundBody);
  
  gameState.player = new Player(p, 100, 300);
  
  for (let i = 0; i < 20; i++) {
    const x = 200 + Math.random() * 4000;
    const y = 350;
    const type = Math.random() > 0.5 ? 'building' : 'tree';
    gameState.backgroundObjects.push(new BackgroundObject(x, y, type));
  }
  
  for (let i = 0; i < 10; i++) {
    spawnZombie(p);
  }
  
  for (let i = 0; i < 5; i++) {
    spawnObstacle(p);
  }
}

function spawnZombie(p) {
  if (gameState.entities.length >= GAME_CONFIG.MAX_ENTITIES_ON_SCREEN) return;
  
  const x = gameState.cameraX + CANVAS_WIDTH + 50 + Math.random() * 200;
  const y = 320;
  const zombie = new Zombie(p, x, y);
  gameState.entities.push(zombie);
}

function spawnObstacle(p) {
  if (gameState.entities.length >= GAME_CONFIG.MAX_ENTITIES_ON_SCREEN) return;
  
  const x = gameState.cameraX + CANVAS_WIDTH + 50 + Math.random() * 300;
  const y = 340;
  const type = Math.random() > 0.5 ? 'barrel' : 'crate';
  const obstacle = new Obstacle(p, x, y, type);
  gameState.entities.push(obstacle);
}

function spawnFuelPickup(p) {
  if (gameState.entities.length >= GAME_CONFIG.MAX_ENTITIES_ON_SCREEN) return;
  
  const x = gameState.cameraX + CANVAS_WIDTH + 50 + Math.random() * 400;
  const y = 340;
  const fuel = new FuelPickup(p, x, y);
  gameState.entities.push(fuel);
}

function updateGame(p) {
  if (gameState.player) {
    gameState.player.update();
    
    const targetCameraX = gameState.player.body.position.x - 200;
    gameState.cameraX += (targetCameraX - gameState.cameraX) * GAME_CONFIG.CAMERA_FOLLOW_SPEED;
  }
  
  gameState.entities = gameState.entities.filter(entity => entity.update());
  gameState.bullets = gameState.bullets.filter(bullet => bullet.update());
  
  if (Math.random() < GAME_CONFIG.ZOMBIE_SPAWN_RATE) {
    spawnZombie(p);
  }
  
  if (Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE) {
    spawnObstacle(p);
  }
  
  if (Math.random() < GAME_CONFIG.FUEL_PICKUP_SPAWN_RATE) {
    spawnFuelPickup(p);
  }
  
  handleInput(p);
  
  if (gameState.armor <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", reason: "armor depleted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (gameState.distance >= GAME_CONFIG.SAFE_ZONE_DISTANCE) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", distance: gameState.distance },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (gameState.fuel <= 0 && gameState.player && gameState.player.body.velocity.x < 0.5) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", reason: "out of fuel" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleInput(p) {
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(39) || p.keyIsDown(68)) {
      gameState.player.accelerate();
      gameState.player.isBoosting = false;
    }
    if (p.keyIsDown(37) || p.keyIsDown(65)) {
      gameState.player.brake();
      gameState.player.isBoosting = false;
    }
    if (p.keyIsDown(38) || p.keyIsDown(87)) {
      gameState.player.boost();
    } else {
      gameState.player.isBoosting = false;
    }
    if (p.keyIsDown(32)) {
      gameState.player.shoot();
    }
  } else if (gameState.controlMode === "TEST_1") {
    if (p.frameCount % 30 === 0) {
      gameState.player.accelerate();
    }
    if (p.frameCount % 60 === 0) {
      gameState.player.shoot();
    }
  } else if (gameState.controlMode === "TEST_2") {
    gameState.player.boost();
    if (p.frameCount % 20 === 0) {
      gameState.player.shoot();
    }
  }
}

function renderGame(p) {
  p.background(80, 90, 100);
  
  p.fill(60, 70, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 200);
  
  gameState.backgroundObjects.forEach(obj => obj.render(p));
  
  p.fill(100, 80, 60);
  p.noStroke();
  p.rect(0, 365, CANVAS_WIDTH, 35);
  
  if (gameState.player) {
    gameState.player.render();
  }
  
  gameState.entities.forEach(entity => {
    entity.render();
  });
  
  gameState.bullets.forEach(bullet => {
    bullet.render();
  });
  
  const safeZoneScreenX = (GAME_CONFIG.SAFE_ZONE_DISTANCE + 100) - gameState.cameraX;
  if (safeZoneScreenX > 0 && safeZoneScreenX < CANVAS_WIDTH) {
    p.fill(0, 255, 0, 100);
    p.rect(safeZoneScreenX, 0, 50, CANVAS_HEIGHT);
    p.fill(0, 255, 0);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text('SAFE\nZONE', safeZoneScreenX + 25, CANVAS_HEIGHT / 2);
  }
  
  renderHUD(p);
}

function renderHUD(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Distance: ${Math.floor(gameState.distance)}m / ${GAME_CONFIG.SAFE_ZONE_DISTANCE}m`, 10, 28);
  
  p.fill(255, 200, 0);
  p.text('Fuel:', 200, 10);
  p.fill(50);
  p.rect(240, 10, 102, 16);
  p.fill(255, 200, 0);
  p.rect(241, 11, gameState.fuel, 14);
  
  p.fill(100, 200, 255);
  p.text('Armor:', 200, 28);
  p.fill(50);
  p.rect(240, 28, 102, 16);
  p.fill(100, 200, 255);
  p.rect(241, 29, gameState.armor, 14);
  
  if (gameState.fuel < 20) {
    if (p.frameCount % 30 < 15) {
      p.fill(255, 0, 0);
      p.textSize(12);
      p.text('LOW FUEL!', 360, 10);
    }
  }
  
  if (gameState.armor < 20) {
    if (p.frameCount % 30 < 15) {
      p.fill(255, 0, 0);
      p.textSize(12);
      p.text('LOW ARMOR!', 360, 28);
    }
  }
}

function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  p.fill(255, 100, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('APOCALYPSE DRIVE', CANVAS_WIDTH / 2, 100);
  
  p.fill(200);
  p.textSize(16);
  p.text('Survive the zombie wasteland!', CANVAS_WIDTH / 2, 160);
  p.text('Reach the safe zone 3000m away', CANVAS_WIDTH / 2, 180);
  
  p.fill(150);
  p.textSize(14);
  p.text('Arrow Keys / WASD: Drive', CANVAS_WIDTH / 2, 230);
  p.text('Space: Fire Gun', CANVAS_WIDTH / 2, 250);
  p.text('Up/W: Boost (uses more fuel)', CANVAS_WIDTH / 2, 270);
  
  if (p.frameCount % 60 < 40) {
    p.fill(0, 255, 0);
    p.textSize(20);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  }
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver(p) {
  p.background(20, 20, 30);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(0, 255, 0);
    p.textSize(56);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(18);
    p.text('You reached the safe zone!', CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 0, 0);
    p.textSize(56);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(18);
    p.text('Your vehicle was destroyed', CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 260);
  
  if (p.frameCount % 60 < 40) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
  }
}

function resetGame(p) {
  initializeGame(p);
  gameState.gamePhase = "START";
  
  p.logs.game_info.push({
    data: { gamePhase: "START", action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 1;
    
    setupPhysics(p);
    
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
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
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
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
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
});

window.gameInstance = gameInstance;