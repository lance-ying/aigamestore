// game.js - Main game loop with p5.js and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  OBJECTIVES
} from './globals.js';

import { Player, Boss, DamageNumber } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { 
  renderStartScreen, 
  renderPausedOverlay, 
  renderGameOver,
  renderHUD,
  renderShopOverlay
} from './ui.js';

let gameInstance = new p5(p => {
  let lastPlayerInfoLog = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for this game

    gameState.engine = engine;
    gameState.world = world;

    // Setup collision handling
    setupCollisionHandling(engine);

    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize objectives
    gameState.objectives = JSON.parse(JSON.stringify(OBJECTIVES));
  };

  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);

    // Handle control modes
    if (gameState.controlMode !== "HUMAN") {
      handleAutomatedControl();
    }

    // Update game logic based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        updateGame();
        renderGame();
        break;
      case GAME_PHASES.PAUSED:
        renderGame();
        renderPausedOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  function initializeGameplay() {
    // Clear existing entities
    gameState.entities.forEach(entity => {
      if (entity.body) {
        World.remove(gameState.world, entity.body);
      }
    });
    gameState.entities = [];
    gameState.damageNumbers = [];
    gameState.particles = [];

    // Reset game state
    gameState.currentStage = 1;
    gameState.currency = 0;
    gameState.totalDamage = 0;
    gameState.totalHits = 0;
    gameState.weaponsUsed = new Set();
    gameState.weaponHits = {};
    gameState.currentWeaponIndex = 0;
    gameState.attackCooldown = 0;
    gameState.completedObjectives = new Set();
    gameState.stageStartTime = p.millis();
    gameState.shopMode = false;

    // Reset weapons
    gameState.weapons.forEach((weapon, idx) => {
      if (idx === 0) {
        weapon.unlocked = true;
      } else {
        weapon.unlocked = false;
      }
      weapon.level = 1;
    });

    // Create player
    gameState.player = new Player(p, 150, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);

    // Create boss
    createBoss();

    // Log player initial position
    p.logs.player_info.push({
      screen_x: gameState.player.body.position.x,
      screen_y: gameState.player.body.position.y,
      game_x: gameState.player.body.position.x,
      game_y: gameState.player.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function createBoss() {
    if (gameState.boss && gameState.boss.body) {
      World.remove(gameState.world, gameState.boss.body);
    }
    
    gameState.boss = new Boss(p, 450, CANVAS_HEIGHT / 2, gameState.currentStage);
    gameState.entities.push(gameState.boss);
    gameState.stageStartTime = p.millis();
  }

  function updateGame() {
    // Update attack cooldown
    if (gameState.attackCooldown > 0) {
      gameState.attackCooldown--;
    }

    // Update entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update();
      }
    });

    // Update damage numbers
    gameState.damageNumbers = gameState.damageNumbers.filter(num => {
      num.update();
      return !num.isDead();
    });

    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life--;
      return particle.life > 0;
    });

    // Check if boss is defeated
    if (gameState.boss && gameState.boss.isDead()) {
      handleBossDefeat();
    }

    // Check objectives
    checkObjectives();
  }

  function renderGame() {
    // Background
    p.background(40, 40, 60);

    // Ground
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    // Render particles
    gameState.particles.forEach(particle => {
      p.push();
      const alpha = (particle.life / 30) * 255;
      p.fill(...particle.color, alpha);
      p.noStroke();
      p.circle(particle.x, particle.y, 5);
      p.pop();
    });

    // Render entities
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
      }
    });

    // Render damage numbers
    gameState.damageNumbers.forEach(num => {
      num.render();
    });

    // Render HUD
    renderHUD(p);

    // Render shop overlay if active
    if (gameState.shopMode) {
      renderShopOverlay(p);
    }
  }

  function handleAttack() {
    if (gameState.player && gameState.boss && !gameState.shopMode) {
      if (gameState.player.attack()) {
        const weapon = gameState.weapons[gameState.currentWeaponIndex];
        const baseDamage = weapon.damage * Math.pow(1.1, (weapon.level || 1) - 1);
        const actualDamage = gameState.boss.takeDamage(baseDamage);
        
        // Update stats
        gameState.totalDamage += actualDamage;
        gameState.totalHits++;
        gameState.currency += Math.floor(actualDamage * 0.5);
        gameState.weaponsUsed.add(weapon.name);
        
        // Track weapon-specific hits
        if (!gameState.weaponHits[weapon.name]) {
          gameState.weaponHits[weapon.name] = 0;
        }
        gameState.weaponHits[weapon.name]++;

        // Create damage number
        gameState.damageNumbers.push(
          new DamageNumber(p, gameState.boss.body.position.x, gameState.boss.body.position.y - 60, actualDamage)
        );
      }
    }
  }

  function switchWeapon(direction) {
    const unlockedWeapons = gameState.weapons.filter(w => w.unlocked);
    if (unlockedWeapons.length <= 1) return;

    let currentIndex = gameState.weapons.findIndex((w, idx) => 
      w.unlocked && idx === gameState.currentWeaponIndex
    );
    
    let newIndex = gameState.currentWeaponIndex;
    do {
      newIndex += direction;
      if (newIndex < 0) newIndex = gameState.weapons.length - 1;
      if (newIndex >= gameState.weapons.length) newIndex = 0;
    } while (!gameState.weapons[newIndex].unlocked);

    gameState.currentWeaponIndex = newIndex;
  }

  function upgradeWeapon() {
    const weapon = gameState.weapons[gameState.currentWeaponIndex];
    const upgradeCost = 100 * (weapon.level || 1);
    
    if (gameState.currency >= upgradeCost) {
      gameState.currency -= upgradeCost;
      weapon.level = (weapon.level || 1) + 1;
    }
  }

  function buyWeapon() {
    for (let weapon of gameState.weapons) {
      if (!weapon.unlocked && gameState.currency >= weapon.cost) {
        gameState.currency -= weapon.cost;
        weapon.unlocked = true;
        weapon.level = 1;
        gameState.currentWeaponIndex = gameState.weapons.indexOf(weapon);
        return;
      }
    }
  }

  function handleBossDefeat() {
    // Award currency for completion
    const timeBonus = Math.max(0, 100 - Math.floor((p.millis() - gameState.stageStartTime) / 1000));
    gameState.currency += 200 + timeBonus;

    // Progress to next stage
    gameState.currentStage++;
    
    if (gameState.currentStage > gameState.maxStages) {
      // Victory!
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, victory: true },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Create next boss
      createBoss();
    }
  }

  function checkObjectives() {
    gameState.objectives.forEach((obj, idx) => {
      if (gameState.completedObjectives.has(idx)) return;

      let completed = false;

      switch (obj.type) {
        case "damage":
          completed = gameState.totalDamage >= obj.requirement;
          break;
        case "hits":
          completed = gameState.totalHits >= obj.requirement;
          break;
        case "time":
          const elapsedTime = p.millis() - gameState.stageStartTime;
          completed = elapsedTime <= obj.requirement && gameState.boss && gameState.boss.isDead();
          break;
        case "weapons":
          completed = gameState.weaponsUsed.size >= obj.requirement;
          break;
        case "weapon_hits":
          const weaponHits = gameState.weaponHits[obj.weapon] || 0;
          completed = weaponHits >= obj.requirement;
          break;
      }

      if (completed) {
        gameState.completedObjectives.add(idx);
        gameState.currency += obj.reward;
        
        // Visual feedback
        for (let i = 0; i < 10; i++) {
          gameState.particles.push({
            x: CANVAS_WIDTH / 2,
            y: 50,
            vx: p.random(-3, 3),
            vy: p.random(-4, -1),
            life: 60,
            color: [255, 215, 0]
          });
        }
      }
    });
  }

  function handleAutomatedControl() {
    if (gameState.gamePhase === GAME_PHASES.START && p.frameCount % 60 === 0) {
      // Auto-start after delay
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGameplay();
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING, automated: true },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.controlMode === "TEST_1") {
        // Basic testing: attack every 15 frames, switch weapons every 60
        if (p.frameCount % 15 === 0) {
          handleAttack();
        }
        if (p.frameCount % 60 === 0) {
          switchWeapon(1);
        }
        // Stop after 300 frames or boss defeated
        if (p.frameCount > 360) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        }
      } else if (gameState.controlMode === "TEST_2") {
        // Rapid win test: attack every 3 frames
        if (p.frameCount % 3 === 0) {
          handleAttack();
        }
        // Buy weapons when possible
        if (p.frameCount % 100 === 0) {
          buyWeapon();
        }
      }
    }
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGameplay();
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) {
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

    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE - Attack
        handleAttack();
      }

      if (p.keyCode === 37) { // LEFT - Previous weapon
        switchWeapon(-1);
      }

      if (p.keyCode === 39) { // RIGHT - Next weapon
        switchWeapon(1);
      }

      if (p.keyCode === 38) { // UP - Upgrade weapon
        upgradeWeapon();
      }

      if (p.keyCode === 40) { // DOWN - Buy weapon
        buyWeapon();
      }
    }

    return false;
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    return false;
  };
});

window.gameInstance = gameInstance;