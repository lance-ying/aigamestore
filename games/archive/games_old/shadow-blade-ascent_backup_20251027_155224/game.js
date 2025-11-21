// game.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASE } from './globals.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { Projectile } from './projectile.js';
import { createLevel, drawBackground } from './level.js';
import { handleCombat, updateComboTimer } from './combat.js';
import { drawUI, drawStartScreen, drawPausedOverlay, drawGameOver } from './ui.js';
import { createSkillActivationEffect } from './particle.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let levelData;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    inputHandler = new InputHandler();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 20, 30);
    
    switch(gameState.gamePhase) {
      case GAME_PHASE.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASE.PLAYING:
        updateGame(p);
        renderGame(p);
        break;
        
      case GAME_PHASE.PAUSED:
        renderGame(p);
        drawPausedOverlay(p);
        break;
        
      case GAME_PHASE.GAME_OVER_WIN:
        drawGameOver(p, true);
        break;
        
      case GAME_PHASE.GAME_OVER_LOSE:
        drawGameOver(p, false);
        break;
    }
  };
  
  function startGame() {
    gameState.gamePhase = GAME_PHASE.PLAYING;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.loot = [];
    gameState.particles = [];
    gameState.comboCount = 0;
    gameState.comboTimer = 0;
    gameState.lastComboBonus = 0;
    
    // Create player
    gameState.player = new Player(100, 100);
    gameState.entities.push(gameState.player);
    
    // Load level
    loadLevel(1);
    
    inputHandler.reset();
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function loadLevel(levelNum) {
    levelData = createLevel(levelNum);
    gameState.platforms = levelData.platforms;
    gameState.enemies = levelData.enemies;
    gameState.projectiles = [];
    gameState.loot = [];
    gameState.cameraX = 0;
  }
  
  function updateGame(p) {
    const player = gameState.player;
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      handleAutomatedInput(p);
    }
    
    // Update player
    player.update(p, inputHandler.keys, gameState.platforms, gameState.enemies);
    
    // Log player info
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: player.x - gameState.cameraX,
        screen_y: player.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
    
    // Handle player actions
    if (inputHandler.keys.attack) {
      const hitbox = player.attack(p);
      inputHandler.keys.attack = false;
    }
    
    if (inputHandler.keys.dodge) {
      player.dodge(p);
      inputHandler.keys.dodge = false;
    }
    
    if (inputHandler.keys.skill1) {
      const skill = player.useSkill1(p);
      if (skill) {
        gameState.projectiles.push(new Projectile(skill));
        // Create bright flash effect at player position to show skill activated
        createSkillActivationFlash(p, player.x + player.width/2, player.y + player.height/2);
      }
      inputHandler.keys.skill1 = false;
    }
    
    if (inputHandler.keys.skill2) {
      const skill = player.useSkill2(p);
      if (skill) {
        gameState.projectiles.push(new Projectile(skill));
        // Create flash effect
        createSkillActivationFlash(p, player.x + player.width/2, player.y + player.height/2);
      }
      inputHandler.keys.skill2 = false;
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      enemy.update(p, player, gameState.platforms);
    }
    
    // Remove dead enemies
    gameState.enemies = gameState.enemies.filter(e => !e.dead || e.deathTimer < 40);
    
    // Update projectiles
    for (let proj of gameState.projectiles) {
      proj.update();
    }
    gameState.projectiles = gameState.projectiles.filter(p => !p.dead);
    
    // Update loot
    for (let loot of gameState.loot) {
      loot.update(gameState.platforms);
      if (loot.checkCollection(player)) {
        player.collect(loot);
      }
    }
    gameState.loot = gameState.loot.filter(l => !l.collected);
    
    // Update particles
    for (let particle of gameState.particles) {
      particle.update();
    }
    gameState.particles = gameState.particles.filter(p => !p.dead);
    
    // Handle combat
    handleCombat(p, player, gameState.enemies, gameState.projectiles, gameState.particles);
    
    // Update combo timer
    updateComboTimer();
    
    // Update camera
    const targetCameraX = player.x - CANVAS_WIDTH / 3;
    gameState.cameraX = Math.max(0, Math.min(gameState.levelWidth - CANVAS_WIDTH, targetCameraX));
    
    // Check win/lose conditions
    if (player.health <= 0) {
      gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check level completion
    const bossDefeated = gameState.enemies.every(e => !e.isBoss || e.dead);
    if (bossDefeated && gameState.enemies.filter(e => !e.dead).length === 0) {
      if (gameState.currentLevel < gameState.maxLevel) {
        gameState.currentLevel++;
        loadLevel(gameState.currentLevel);
        player.x = 100;
        player.y = 100;
        p.logs.game_info.push({
          data: { event: 'level_complete', level: gameState.currentLevel - 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function createSkillActivationFlash(p, x, y) {
    // Create bright burst of particles at player position
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      const flashParticle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: [150, 220, 255],
        size: Math.random() * 6 + 4,
        life: 20,
        maxLife: 20,
        dead: false,
        update: function() {
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.95;
          this.vy *= 0.95;
          this.life--;
          if (this.life <= 0) this.dead = true;
        },
        draw: function(p, cameraX) {
          p.push();
          const alpha = 255 * (this.life / this.maxLife);
          p.fill(this.color[0], this.color[1], this.color[2], alpha);
          p.noStroke();
          p.ellipse(this.x - cameraX, this.y, this.size, this.size);
          p.pop();
        }
      };
      gameState.particles.push(flashParticle);
    }
    
    // Add bright expanding ring
    const ring = {
      x: x,
      y: y,
      radius: 10,
      maxRadius: 60,
      life: 15,
      maxLife: 15,
      dead: false,
      update: function() {
        this.radius += 3;
        this.life--;
        if (this.life <= 0) this.dead = true;
      },
      draw: function(p, cameraX) {
        p.push();
        const alpha = 200 * (this.life / this.maxLife);
        p.noFill();
        p.stroke(200, 230, 255, alpha);
        p.strokeWeight(4);
        p.ellipse(this.x - cameraX, this.y, this.radius * 2, this.radius * 2);
        p.strokeWeight(2);
        p.stroke(255, 255, 255, alpha * 1.5);
        p.ellipse(this.x - cameraX, this.y, this.radius * 2, this.radius * 2);
        p.pop();
      }
    };
    gameState.particles.push(ring);
  }
  
  function renderGame(p) {
    // Draw background
    drawBackground(p, gameState.cameraX, gameState.currentLevel);
    
    // Draw platforms
    for (let platform of gameState.platforms) {
      platform.draw(p, gameState.cameraX);
    }
    
    // Draw loot
    for (let loot of gameState.loot) {
      loot.draw(p, gameState.cameraX);
    }
    
    // Draw projectiles
    for (let proj of gameState.projectiles) {
      proj.draw(p, gameState.cameraX);
    }
    
    // Draw enemies
    for (let enemy of gameState.enemies) {
      enemy.draw(p, gameState.cameraX);
    }
    
    // Draw player
    gameState.player.draw(p, gameState.cameraX);
    
    // Draw particles
    for (let particle of gameState.particles) {
      particle.draw(p, gameState.cameraX);
    }
    
    // Draw UI
    drawUI(p, gameState.player);
  }
  
  function handleAutomatedInput(p) {
    // Simple AI for testing
    const player = gameState.player;
    
    if (gameState.controlMode === 'TEST_1') {
      // Basic movement and attack test
      inputHandler.keys.right = true;
      if (p.frameCount % 60 === 0) {
        inputHandler.keys.attack = true;
      }
      if (p.frameCount % 90 === 0) {
        inputHandler.keys.up = true;
      } else {
        inputHandler.keys.up = false;
      }
    } else if (gameState.controlMode === 'TEST_2') {
      // Aggressive AI to win
      const nearestEnemy = findNearestEnemy(player);
      
      if (nearestEnemy) {
        const dist = nearestEnemy.x - player.x;
        
        if (Math.abs(dist) > 60) {
          inputHandler.keys.right = dist > 0;
          inputHandler.keys.left = dist < 0;
        } else {
          inputHandler.keys.right = false;
          inputHandler.keys.left = false;
          inputHandler.keys.attack = true;
        }
        
        if (player.skill1Cooldown === 0 && player.mana >= 20) {
          inputHandler.keys.skill1 = true;
        }
        
        if (player.skill2Unlocked && player.skill2Cooldown === 0 && player.mana >= 30) {
          inputHandler.keys.skill2 = true;
        }
        
        // Jump over obstacles
        if (p.frameCount % 120 === 0) {
          inputHandler.keys.up = true;
        } else {
          inputHandler.keys.up = false;
        }
        
        // Dodge occasionally
        if (player.dodgeTimer === 0 && nearestEnemy.state === 'attacking' && Math.abs(dist) < 80) {
          inputHandler.keys.dodge = true;
        }
      } else {
        inputHandler.keys.right = true;
      }
    }
  }
  
  function findNearestEnemy(player) {
    let nearest = null;
    let minDist = Infinity;
    
    for (let enemy of gameState.enemies) {
      if (enemy.dead) continue;
      const dist = Math.abs(enemy.x - player.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }
  
  p.keyPressed = function() {
    const action = inputHandler.handleKeyPressed(p, p.keyCode, p.key);
    
    if (action === 'start') {
      startGame();
    } else if (action === 'pause') {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (action === 'resume') {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (action === 'restart') {
      gameState.gamePhase = GAME_PHASE.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p, p.keyCode, p.key);
    return false;
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};