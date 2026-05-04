import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, getGameState } from './globals.js';
import { Player } from './player.js';
import { Projectile } from './projectile.js';
import { Particle } from './particle.js';
import { createStage } from './stage.js';
import { Boss } from './enemy.js';
import { drawUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Wait for p5 to be available
function initGame() {
  if (typeof window.p5 === 'undefined') {
    console.log('Waiting for p5.js to load...');
    setTimeout(initGame, 50);
    return;
  }

  const p5 = window.p5;

  let gameInstance = new p5(p => {
    let platforms = [];
    let keysPressed = {};
    
    p.setup = function() {
      p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      p.frameRate(60);
      p.randomSeed(42);
      
      // Initialize logs
      p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
      };
      
      // Log initial state
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    };
    
    p.draw = function() {
      p.background(20, 25, 40);
      
      if (gameState.gamePhase === GAME_PHASES.START) {
        drawUI(p);
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        updateGame();
        renderGame();
        drawUI(p);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        renderGame();
        drawUI(p);
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                 gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        renderGame();
        drawUI(p);
      }
    };
    
    function updateGame() {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const actions = get_automated_testing_action(gameState);
        handleAutomatedActions(actions);
      }
      
      // Update player
      if (gameState.player) {
        gameState.player.update(platforms);
        
        // Log player position periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.camera.x,
            screen_y: gameState.player.y - gameState.camera.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
        
        // Check game over
        if (gameState.player.health <= 0) {
          setGamePhase(GAME_PHASES.GAME_OVER_LOSE);
        }
      }
      
      // Update camera
      updateCamera();
      
      // Update enemies
      for (let enemy of gameState.enemies) {
        if (enemy.active) {
          const shouldShoot = enemy.update(platforms);
          if (shouldShoot) {
            createEnemyProjectile(enemy);
          }
          
          // Check collision with player
          if (gameState.player && p.collideRectRect(
            enemy.x - enemy.width / 2, enemy.y - enemy.height / 2,
            enemy.width, enemy.height,
            gameState.player.x - gameState.player.width / 2,
            gameState.player.y - gameState.player.height / 2,
            gameState.player.width, gameState.player.height
          )) {
            gameState.player.takeDamage(enemy.damage);
            createParticles(gameState.player.x, gameState.player.y, [255, 100, 100]);
          }
        }
      }
      
      // Spawn boss when reaching boss area
      if (!gameState.bossSpawned && gameState.player && gameState.player.x > 1800) {
        gameState.boss = new Boss(p, 2100, 200);
        gameState.bossSpawned = true;
        gameState.entities.push(gameState.boss);
      }
      
      // Update boss
      if (gameState.boss && gameState.boss.active) {
        const attackInfo = gameState.boss.update();
        if (attackInfo.attack) {
          createBossAttack(attackInfo.pattern);
        }
        
        // Check collision with player
        if (gameState.player && p.collideRectRect(
          gameState.boss.x - gameState.boss.width / 2,
          gameState.boss.y - gameState.boss.height / 2,
          gameState.boss.width, gameState.boss.height,
          gameState.player.x - gameState.player.width / 2,
          gameState.player.y - gameState.player.height / 2,
          gameState.player.width, gameState.player.height
        )) {
          gameState.player.takeDamage(gameState.boss.damage);
          createParticles(gameState.player.x, gameState.player.y, [255, 100, 100]);
        }
      }
      
      // Check win condition - progress to next stage
      if (gameState.bossDefeated && !gameState.boss.active) {
        // Progress to next stage
        gameState.stage++;
        if (gameState.stage > 3) {
          // Beat all stages - game complete
          setGamePhase(GAME_PHASES.GAME_OVER_WIN);
        } else {
          // Load next stage
          loadNextStage();
        }
      }
      
      // Update projectiles
      for (let proj of gameState.projectiles) {
        proj.update();
        
        // Check projectile collisions
        if (proj.active) {
          if (proj.owner === 'player') {
            // Hit enemies
            for (let enemy of gameState.enemies) {
              if (enemy.active && p.collideCircleCircle(
                proj.x, proj.y, proj.radius,
                enemy.x, enemy.y, enemy.width / 2
              )) {
                enemy.takeDamage(proj.damage);
                proj.active = false;
                createParticles(proj.x, proj.y, [255, 100, 100]);
              }
            }
            
            // Hit boss
            if (gameState.boss && gameState.boss.active && p.collideCircleCircle(
              proj.x, proj.y, proj.radius,
              gameState.boss.x, gameState.boss.y, gameState.boss.width / 2
            )) {
              gameState.boss.takeDamage(proj.damage);
              proj.active = false;
              createParticles(proj.x, proj.y, [200, 100, 255]);
            }
          } else {
            // Hit player
            if (gameState.player && p.collideCircleCircle(
              proj.x, proj.y, proj.radius,
              gameState.player.x, gameState.player.y, gameState.player.width / 2
            )) {
              gameState.player.takeDamage(proj.damage);
              proj.active = false;
              createParticles(proj.x, proj.y, [255, 100, 100]);
            }
          }
        }
      }
      
      // Update collectibles - FIXED: Better collision detection
      for (let collectible of gameState.collectibles) {
        if (collectible.active) {
          collectible.update();
          
          // Check collection - use rect-circle collision for better pickup
          if (gameState.player && p.collideCircleRect(
            collectible.x, collectible.y, collectible.radius * 2,
            gameState.player.x - gameState.player.width / 2,
            gameState.player.y - gameState.player.height / 2,
            gameState.player.width, gameState.player.height
          )) {
            if (collectible.type === 'energy') {
              gameState.score += 50;
              gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + 30);
            } else if (collectible.type === 'health') {
              gameState.player.heal(30);
            }
            collectible.active = false;
            createParticles(collectible.x, collectible.y, 
              collectible.type === 'energy' ? [100, 200, 255] : [255, 100, 100]);
          }
        }
      }
      
      // Update particles
      for (let particle of gameState.particles) {
        particle.update();
      }
      
      // Clean up inactive entities
      gameState.projectiles = gameState.projectiles.filter(p => p.active);
      gameState.particles = gameState.particles.filter(p => p.active);
      gameState.collectibles = gameState.collectibles.filter(c => c.active);
      gameState.enemies = gameState.enemies.filter(e => e.active || e.x < gameState.camera.x - 100);
    }
    
    function renderGame() {
      // Draw background
      drawBackground();
      
      // Draw platforms
      for (let platform of platforms) {
        platform.draw();
      }
      
      // Draw collectibles
      for (let collectible of gameState.collectibles) {
        collectible.draw();
      }
      
      // Draw particles
      for (let particle of gameState.particles) {
        particle.draw();
      }
      
      // Draw projectiles
      for (let proj of gameState.projectiles) {
        proj.draw();
      }
      
      // Draw enemies
      for (let enemy of gameState.enemies) {
        enemy.draw();
      }
      
      // Draw boss
      if (gameState.boss) {
        gameState.boss.draw();
      }
      
      // Draw player
      if (gameState.player) {
        gameState.player.draw();
      }
    }
    
    function drawBackground() {
      // Parallax background layers
      const scrollSpeed1 = gameState.camera.x * 0.2;
      const scrollSpeed2 = gameState.camera.x * 0.4;
      
      // Far background - vary color by stage
      const bgColors = [
        [30, 40, 70],   // Stage 1: Blue
        [50, 30, 60],   // Stage 2: Purple
        [60, 40, 30]    // Stage 3: Orange
      ];
      const bgColor = bgColors[Math.min(gameState.stage - 1, bgColors.length - 1)];
      
      p.fill(...bgColor);
      p.noStroke();
      for (let i = -1; i < 5; i++) {
        const x = (i * 200 - scrollSpeed1 % 200);
        p.rect(x, 0, 200, CANVAS_HEIGHT);
      }
      
      // Grid lines
      p.stroke(40, 60, 100, 100);
      p.strokeWeight(1);
      for (let i = 0; i < 20; i++) {
        const x = (i * 80 - scrollSpeed2 % 80);
        p.line(x, 0, x, CANVAS_HEIGHT);
      }
      
      // Middle layer
      p.fill(20, 30, 50, 150);
      for (let i = -1; i < 8; i++) {
        const x = (i * 150 - scrollSpeed2 % 150);
        p.rect(x, CANVAS_HEIGHT - 100, 150, 100);
      }
    }
    
    function updateCamera() {
      if (gameState.player) {
        // Camera follows player
        const targetX = gameState.player.x - CANVAS_WIDTH / 3;
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        
        // Clamp camera
        gameState.camera.x = Math.max(0, Math.min(
          gameState.stageWidth - CANVAS_WIDTH,
          gameState.camera.x
        ));
      }
    }
    
    function createPlayerProjectile(chargeLevel = 0) {
      if (!gameState.player) return;
      
      const player = gameState.player;
      const angle = player.aimAngle * Math.PI / 180;
      const baseAngle = player.facingRight ? 0 : Math.PI;
      const finalAngle = baseAngle + angle;
      
      // Auto-aim at nearest enemy
      let targetAngle = finalAngle;
      const nearestEnemy = findNearestEnemy();
      
      if (nearestEnemy) {
        const dx = nearestEnemy.x - player.x;
        const dy = nearestEnemy.y - player.y;
        targetAngle = Math.atan2(dy, dx);
      } else if (gameState.boss && gameState.boss.active) {
        const dx = gameState.boss.x - player.x;
        const dy = gameState.boss.y - player.y;
        if (Math.abs(dx) < 400) {
          targetAngle = Math.atan2(dy, dx);
        }
      }
      
      const speed = 8 + (chargeLevel * 2);
      const vx = Math.cos(targetAngle) * speed;
      const vy = Math.sin(targetAngle) * speed;
      
      const offsetX = Math.cos(targetAngle) * 15;
      const offsetY = Math.sin(targetAngle) * 15;
      
      const proj = new Projectile(p, player.x + offsetX, player.y + offsetY, vx, vy, 'player', chargeLevel);
      gameState.projectiles.push(proj);
      gameState.entities.push(proj);
      
      // Extra particles for charged shots
      if (chargeLevel > 0) {
        createParticles(player.x + offsetX, player.y + offsetY, [100, 200, 255]);
      }
    }
    
    function findNearestEnemy() {
      if (!gameState.player) return null;
      
      let nearest = null;
      let minDist = Infinity;
      
      for (let enemy of gameState.enemies) {
        if (!enemy.active) continue;
        const dist = Math.abs(enemy.x - gameState.player.x);
        if (dist < minDist && dist < 300) {
          minDist = dist;
          nearest = enemy;
        }
      }
      
      return nearest;
    }
    
    function createEnemyProjectile(enemy) {
      if (!gameState.player) return;
      
      const dx = gameState.player.x - enemy.x;
      const dy = gameState.player.y - enemy.y;
      const angle = Math.atan2(dy, dx);
      
      const speed = 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const proj = new Projectile(p, enemy.x, enemy.y, vx, vy, 'enemy');
      gameState.projectiles.push(proj);
      gameState.entities.push(proj);
    }
    
    function createBossAttack(pattern) {
      if (!gameState.boss || !gameState.player) return;
      
      const boss = gameState.boss;
      
      if (pattern === 0) {
        // Spread shot
        for (let i = -2; i <= 2; i++) {
          const angle = Math.atan2(
            gameState.player.y - boss.y,
            gameState.player.x - boss.x
          ) + (i * 0.3);
          
          const speed = 5;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          const proj = new Projectile(p, boss.x, boss.y, vx, vy, 'boss');
          gameState.projectiles.push(proj);
          gameState.entities.push(proj);
        }
      } else if (pattern === 1) {
        // Circle shot
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          const speed = 4;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          const proj = new Projectile(p, boss.x, boss.y, vx, vy, 'boss');
          gameState.projectiles.push(proj);
          gameState.entities.push(proj);
        }
      } else {
        // Aimed triple shot
        const angle = Math.atan2(
          gameState.player.y - boss.y,
          gameState.player.x - boss.x
        );
        
        for (let i = -1; i <= 1; i++) {
          const finalAngle = angle + (i * 0.2);
          const speed = 6;
          const vx = Math.cos(finalAngle) * speed;
          const vy = Math.sin(finalAngle) * speed;
          
          const proj = new Projectile(p, boss.x, boss.y, vx, vy, 'boss');
          gameState.projectiles.push(proj);
          gameState.entities.push(proj);
        }
      }
    }
    
    function createParticles(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 2;
        
        const particle = new Particle(p, x, y, vx, vy, color, 20 + Math.random() * 10);
        gameState.particles.push(particle);
        gameState.entities.push(particle);
      }
    }
    
    function handleAutomatedActions(actions) {
      if (!gameState.player) return;
      
      // Reset velocity for clean control
      if (!actions.left && !actions.right) {
        if (gameState.player.dashVelocity === 0) {
          gameState.player.vx *= 0.8;
        }
      }
      
      // Movement
      if (actions.left) {
        gameState.player.moveLeft();
      }
      if (actions.right) {
        gameState.player.moveRight();
      }
      
      // Jump
      if (actions.jump) {
        gameState.player.jump();
      }
      
      // Shoot
      if (actions.shoot && gameState.player.shoot()) {
        createPlayerProjectile(0);
      }
      
      // Dash
      if (actions.dash) {
        gameState.player.dash();
      }
      
      // Aim
      if (actions.aimUp) {
        gameState.player.aimUp();
      } else if (actions.aimDown) {
        gameState.player.aimDown();
      } else {
        gameState.player.aimNormal();
      }
    }
    
    function startGame() {
      // Initialize stage
      gameState.stage = 1;
      const stage = createStage(p, 1);
      platforms = stage.platforms;
      gameState.enemies = stage.enemies;
      gameState.collectibles = stage.collectibles;
      
      // Initialize player
      gameState.player = new Player(p, 50, 300);
      gameState.entities = [gameState.player, ...gameState.enemies, ...gameState.collectibles];
      
      // Reset game state
      gameState.projectiles = [];
      gameState.particles = [];
      gameState.score = 0;
      gameState.enemiesDefeated = 0;
      gameState.boss = null;
      gameState.bossSpawned = false;
      gameState.bossDefeated = false;
      gameState.camera = { x: 0, y: 0 };
      
      setGamePhase(GAME_PHASES.PLAYING);
    }
    
    function loadNextStage() {
      // Create next stage
      const stage = createStage(p, gameState.stage);
      platforms = stage.platforms;
      gameState.enemies = stage.enemies;
      gameState.collectibles = stage.collectibles;
      
      // Reset player position but keep health/energy
      gameState.player.x = 50;
      gameState.player.y = 300;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
      
      // Reset stage state
      gameState.projectiles = [];
      gameState.particles = [];
      gameState.boss = null;
      gameState.bossSpawned = false;
      gameState.bossDefeated = false;
      gameState.camera = { x: 0, y: 0 };
      gameState.entities = [gameState.player, ...gameState.enemies, ...gameState.collectibles];
    }
    
    function setGamePhase(phase) {
      gameState.gamePhase = phase;
      
      p.logs.game_info.push({
        data: { gamePhase: phase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      if (phase === GAME_PHASES.PAUSED) {
        p.noLoop();
      } else if (phase === GAME_PHASES.PLAYING) {
        p.loop();
      }
    }
    
    p.keyPressed = function(event) {
      const key = p.key.toLowerCase();
      const keyCode = p.keyCode;
      
      keysPressed[keyCode] = true;
      
      // Log input
      p.logs.inputs.push({
        input_type: "keyPressed",
        data: { key: key, keyCode: keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Game phase controls - prevent default for these keys
      if (keyCode === 13) { // ENTER
        if (event) event.preventDefault();
        if (gameState.gamePhase === GAME_PHASES.START) {
          startGame();
        }
        return false;
      } else if (keyCode === 27) { // ESC
        if (event) event.preventDefault();
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          setGamePhase(GAME_PHASES.PAUSED);
        } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          setGamePhase(GAME_PHASES.PLAYING);
        }
        return false;
      } else if (keyCode === 82) { // R
        if (event) event.preventDefault();
        if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
            gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
          setGamePhase(GAME_PHASES.START);
        }
        return false;
      }
      
      // Gameplay controls (HUMAN mode only)
      if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
        if (keyCode === 32) { // SPACE
          if (event) event.preventDefault();
          gameState.player.jump();
          return false;
        } else if (keyCode === 90) { // Z - start charging
          gameState.player.startCharging();
        } else if (keyCode === 16) { // SHIFT
          if (event) event.preventDefault();
          gameState.player.dash();
          return false;
        }
      }
      
      return false;
    };
    
    p.keyReleased = function(event) {
      const keyCode = p.keyCode;
      keysPressed[keyCode] = false;
      
      // Log input
      p.logs.inputs.push({
        input_type: "keyReleased",
        data: { key: p.key.toLowerCase(), keyCode: keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Gameplay controls (HUMAN mode only)
      if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
        if (keyCode === 90) { // Z - release charged shot
          const chargeLevel = gameState.player.releaseCharge();
          if (chargeLevel >= 0) {
            createPlayerProjectile(chargeLevel);
          }
        }
        
        // Reset aim when arrow keys released
        if (keyCode === 38 || keyCode === 40) {
          gameState.player.aimNormal();
        }
      }
      
      return false;
    };
    
    // Handle continuous key presses for HUMAN mode
    setInterval(() => {
      if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
        if (keysPressed[37]) { // LEFT
          gameState.player.moveLeft();
        }
        if (keysPressed[39]) { // RIGHT
          gameState.player.moveRight();
        }
        if (keysPressed[38]) { // UP
          gameState.player.aimUp();
        }
        if (keysPressed[40]) { // DOWN
          gameState.player.aimDown();
        }
        if (keysPressed[90]) { // Z - continue charging
          gameState.player.updateCharge();
        }
      }
    }, 1000 / 60);
  });

  // Expose game instance globally
  window.gameInstance = gameInstance;
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};