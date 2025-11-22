// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE, gameState, CONTROL_HUMAN } from './globals.js';
import { Player } from './player.js';
import { updateParticles, renderParticles, updateGoldDrops, renderGoldDrops } from './particles.js';
import { renderUI } from './ui.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { checkMissionComplete } from './mission.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize player
    gameState.player = new Player(100, 200);
    gameState.entities.push(gameState.player);

    // Log initial state
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Background
    p.background(30, 30, 50);

    // Render game based on phase
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      renderGameplay(p);
    }

    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGameplay(p);
    }

    // Render UI
    renderUI(p);

    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };

  function updateGameplay(p) {
    // Process automated input
    processAutomatedInput(p);

    // Update player
    if (gameState.player) {
      // Handle continuous movement
      if (p.keyIsDown(37)) { // LEFT
        gameState.player.moveLeft();
      }
      if (p.keyIsDown(39)) { // RIGHT
        gameState.player.moveRight();
      }

      gameState.player.update();
    }

    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }

    // Update skill cooldowns
    if (gameState.skills.shadowStrike.cooldown > 0) {
      gameState.skills.shadowStrike.cooldown--;
    }
    if (gameState.skills.ninjaFury.cooldown > 0) {
      gameState.skills.ninjaFury.cooldown--;
    }

    // Update particles
    updateParticles(gameState.particles);

    // Update gold drops
    const goldCollected = updateGoldDrops(gameState.goldDrops, gameState.player);
    if (goldCollected > 0) {
      gameState.goldCollected += goldCollected;
      gameState.score += goldCollected;
    }

    // Check mission completion
    checkMissionComplete();

    // Check game over
    if (gameState.playerStats.health <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: "Game Over - Player defeated",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function renderGameplay(p) {
    // Draw ground
    p.fill(40, 60, 40);
    p.noStroke();
    p.rect(0, 340, CANVAS_WIDTH, 60);

    // Draw background elements
    drawBackground(p);

    // Render particles
    renderParticles(p, gameState.particles);

    // Render gold drops
    renderGoldDrops(p, gameState.goldDrops);

    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }

    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
  }

  function drawBackground(p) {
    p.push();
    
    // Sky gradient effect
    for (let i = 0; i < 10; i++) {
      const alpha = 20 - i * 2;
      p.fill(50, 50, 80, alpha);
      p.noStroke();
      p.rect(0, i * 30, CANVAS_WIDTH, 30);
    }

    // Moon
    p.fill(200, 200, 220, 100);
    p.noStroke();
    p.circle(500, 60, 50);

    // Stars
    p.fill(255, 255, 200, 150);
    const starPositions = [
      [50, 30], [120, 50], [200, 40], [280, 60], [350, 35],
      [450, 80], [520, 45], [80, 90], [180, 85], [400, 100]
    ];
    
    for (const [x, y] of starPositions) {
      p.circle(x, y, 3);
    }

    // Ground details
    p.fill(35, 55, 35);
    p.noStroke();
    for (let i = 0; i < 20; i++) {
      const x = (i * 40 + p.frameCount * 0.1) % (CANVAS_WIDTH + 40);
      p.rect(x - 20, 340, 30, 5);
    }

    p.pop();
  }

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;