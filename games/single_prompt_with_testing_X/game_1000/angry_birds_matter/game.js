// game.js - Main game logic and loop

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Composite, Events, Runner } = Matter;

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  logs,
  logGameInfo,
  logInput,
  logPlayerInfo,
  getGameState
} from './globals.js';

import { Bird, Pig, StructureBlock, Slingshot } from './entities.js';
import { setupCollisionHandling, cleanupDestroyedBodies } from './physics.js';
import { getTestAction } from './automated_testing_controller.js';

// Initialize seedrandom
Math.seedrandom(42);

let frameCount = 0;
const keys = {};

// Initialize the game
function init() {
  // Setup canvas
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  gameState.canvas = canvas;
  gameState.ctx = ctx;
  
  // Create Matter.js engine
  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 0.8;
  
  gameState.engine = engine;
  gameState.world = world;
  gameState.frameCount = 0;
  
  // Setup collision handling
  setupCollisionHandling(engine);
  
  // Setup input handlers
  setupInputHandlers();
  
  // Create ground
  const ground = Bodies.rectangle(300, 390, 600, 20, {
    isStatic: true,
    label: 'ground',
    friction: 0.8
  });
  World.add(world, ground);
  gameState.ground = ground;
  
  logGameInfo({ message: 'Game initialized' });
  
  // Start game loop
  gameLoop();
}

function setupInputHandlers() {
  document.addEventListener('keydown', (e) => {
    const keyCode = e.keyCode;
    
    // Handle test mode override
    if (gameState.controlMode !== 'HUMAN') {
      return;
    }
    
    if (!keys[keyCode]) {
      keys[keyCode] = true;
      logInput('keydown', { key: e.key, keyCode: keyCode });
      handleKeyDown(keyCode);
    }
  });
  
  document.addEventListener('keyup', (e) => {
    const keyCode = e.keyCode;
    
    if (gameState.controlMode !== 'HUMAN') {
      return;
    }
    
    keys[keyCode] = false;
    logInput('keyup', { key: e.key, keyCode: keyCode });
    handleKeyUp(keyCode);
  });
}

function handleKeyDown(keyCode) {
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    startGame();
  }
  
  // ESC - Pause
  if (keyCode === 27 && gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    logGameInfo({ message: 'Game paused' });
  } else if (keyCode === 27 && gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    logGameInfo({ message: 'Game resumed' });
  }
  
  // R - Restart
  if (keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                         gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
    resetToStart();
  }
  
  // Game controls during PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // SPACE - Pull/Release slingshot
    if (keyCode === 32) {
      if (gameState.slingshotState === 'READY') {
        gameState.slingshotState = 'PULLING';
        gameState.pullbackDistance = 0;
        gameState.launchAngle = -45;
        gameState.launchPower = 20;
      }
    }
  }
}

function handleKeyUp(keyCode) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // SPACE release - Launch bird
    if (keyCode === 32 && gameState.slingshotState === 'PULLING') {
      launchBird();
    }
  }
}

function startGame() {
  // Clear old entities
  if (gameState.world) {
    gameState.birds.forEach(bird => {
      if (bird.body) World.remove(gameState.world, bird.body);
    });
    gameState.pigs.forEach(pig => {
      if (pig.body) World.remove(gameState.world, pig.body);
    });
    gameState.structures.forEach(structure => {
      if (structure.body) World.remove(gameState.world, structure.body);
    });
  }
  
  gameState.birds = [];
  gameState.pigs = [];
  gameState.structures = [];
  gameState.score = 0;
  gameState.currentBirdIndex = 0;
  gameState.totalBirds = 3;
  gameState.slingshotState = 'READY';
  
  // Create slingshot
  gameState.slingshot = new Slingshot(120, 280);
  
  // Create level
  createLevel1();
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  logGameInfo({ message: 'Game started', score: 0 });
}

function createLevel1() {
  // Create birds
  for (let i = 0; i < gameState.totalBirds; i++) {
    const bird = new Bird(50 + i * 25, 320);
    gameState.birds.push(bird);
    if (i === 0) {
      gameState.player = bird;
      World.add(gameState.world, bird.body);
      Body.setStatic(bird.body, true);
    }
  }
  
  // Create structure (tower)
  const structureX = 400;
  const structureY = 350;
  
  // Base
  gameState.structures.push(new StructureBlock(structureX - 40, structureY, 15, 60, 'wood'));
  gameState.structures.push(new StructureBlock(structureX + 40, structureY, 15, 60, 'wood'));
  
  // Middle platform
  gameState.structures.push(new StructureBlock(structureX, structureY - 40, 90, 15, 'wood'));
  
  // Second level
  gameState.structures.push(new StructureBlock(structureX - 35, structureY - 75, 15, 50, 'glass'));
  gameState.structures.push(new StructureBlock(structureX + 35, structureY - 75, 15, 50, 'glass'));
  
  // Top platform
  gameState.structures.push(new StructureBlock(structureX, structureY - 110, 80, 15, 'stone'));
  
  // Add all structures to world
  gameState.structures.forEach(structure => {
    World.add(gameState.world, structure.body);
  });
  
  // Create pigs
  const pig1 = new Pig(structureX, structureY - 65);
  const pig2 = new Pig(structureX - 25, structureY - 135);
  const pig3 = new Pig(structureX + 25, structureY - 135);
  
  gameState.pigs.push(pig1, pig2, pig3);
  gameState.pigs.forEach(pig => {
    World.add(gameState.world, pig.body);
  });
  
  gameState.pigsRemaining = gameState.pigs.length;
  gameState.totalPigs = gameState.pigs.length;
}

function launchBird() {
  if (!gameState.player || gameState.slingshotState !== 'PULLING') return;
  
  const bird = gameState.player;
  Body.setStatic(bird.body, false);
  
  // Calculate launch velocity based on angle and power
  const angleRad = (gameState.launchAngle * Math.PI) / 180;
  const force = gameState.launchPower * 0.5; // Increased from 0.015 to 0.5 for proper slingshot effect
  
  const velocityX = Math.cos(angleRad) * force;
  const velocityY = Math.sin(angleRad) * force;
  
  Body.setVelocity(bird.body, { x: velocityX, y: velocityY });
  bird.launched = true;
  
  gameState.slingshotState = 'FLYING';
  
  logPlayerInfo();
}

function updateGame() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Handle test mode inputs
  if (gameState.controlMode !== 'HUMAN') {
    const action = getTestAction(gameState);
    if (action !== null) {
      if (action > 0) {
        if (!keys[action]) {
          keys[action] = true;
          logInput('keydown', { keyCode: action, testMode: gameState.controlMode });
          handleKeyDown(action);
        }
      } else {
        const keyCode = -action;
        if (keys[keyCode]) {
          keys[keyCode] = false;
          logInput('keyup', { keyCode: keyCode, testMode: gameState.controlMode });
          handleKeyUp(keyCode);
        }
      }
    }
  }
  
  // Update slingshot pulling
  if (gameState.slingshotState === 'PULLING') {
    // Adjust angle with UP/DOWN
    if (keys[38]) { // UP
      gameState.launchAngle -= 1;
      if (gameState.launchAngle < -85) gameState.launchAngle = -85;
    }
    if (keys[40]) { // DOWN
      gameState.launchAngle += 1;
      if (gameState.launchAngle > -10) gameState.launchAngle = -10;
    }
    
    // Adjust power with LEFT/RIGHT (or use DOWN for more power)
    if (keys[37]) { // LEFT - less power
      gameState.launchPower -= 0.5;
      if (gameState.launchPower < 5) gameState.launchPower = 5;
    }
    if (keys[39]) { // RIGHT - more power
      gameState.launchPower += 0.5;
      if (gameState.launchPower > 50) gameState.launchPower = 50;
    }
    
    // Additional power control
    if (keys[40]) { // DOWN also increases power
      gameState.launchPower += 0.3;
      if (gameState.launchPower > 50) gameState.launchPower = 50;
    }
    
    // Update bird position for visual feedback
    if (gameState.player) {
      const angleRad = (gameState.launchAngle * Math.PI) / 180;
      const pullback = Math.min(gameState.launchPower * 1.5, 80);
      
      const birdX = gameState.slingshot.x - Math.cos(angleRad) * pullback;
      const birdY = gameState.slingshot.y - Math.sin(angleRad) * pullback;
      
      Body.setPosition(gameState.player.body, { x: birdX, y: birdY });
    }
    
    gameState.pullbackDistance = gameState.launchPower;
  }
  
  // Check if bird has settled after launch
  if (gameState.slingshotState === 'FLYING' && gameState.player) {
    const vel = gameState.player.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    
    // Bird has settled
    if (speed < 0.5 || gameState.player.body.position.y > CANVAS_HEIGHT + 50) {
      gameState.slingshotState = 'LAUNCHED';
      
      // Move to next bird
      setTimeout(() => {
        prepareNextBird();
      }, 1000);
    }
  }
  
  // Check win/lose conditions
  if (gameState.pigsRemaining <= 0 && gameState.pigs.length > 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    logGameInfo({ message: 'Level complete!', score: gameState.score });
  } else if (gameState.currentBirdIndex >= gameState.totalBirds && 
             gameState.slingshotState === 'READY' && 
             gameState.pigsRemaining > 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    logGameInfo({ message: 'Out of birds!', score: gameState.score });
  }
  
  // Cleanup destroyed bodies
  cleanupDestroyedBodies(gameState.world);
}

function prepareNextBird() {
  if (gameState.slingshotState !== 'LAUNCHED') return;
  
  gameState.currentBirdIndex++;
  
  if (gameState.currentBirdIndex < gameState.totalBirds) {
    const nextBird = gameState.birds[gameState.currentBirdIndex];
    gameState.player = nextBird;
    
    World.add(gameState.world, nextBird.body);
    Body.setStatic(nextBird.body, true);
    Body.setPosition(nextBird.body, { x: gameState.slingshot.x, y: gameState.slingshot.y + 30 });
    
    gameState.slingshotState = 'READY';
  } else {
    gameState.player = null;
    gameState.slingshotState = 'READY';
  }
}

function resetToStart() {
  gameState.gamePhase = GAME_PHASES.START;
  logGameInfo({ message: 'Reset to start screen' });
}

function render() {
  const ctx = gameState.ctx;
  const canvas = gameState.canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw sky background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(ctx);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawGame(ctx);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawGame(ctx);
    drawPausedOverlay(ctx);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    drawGame(ctx);
    drawWinScreen(ctx);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGame(ctx);
    drawLoseScreen(ctx);
  }
}

function drawStartScreen(ctx) {
  // Title
  ctx.fillStyle = '#DD0000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Red's First Flight", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  ctx.fillStyle = '#333';
  ctx.font = '18px Arial';
  ctx.fillText('Launch Red to destroy structures and hit all pigs!', CANVAS_WIDTH / 2, 140);
  
  ctx.font = '16px Arial';
  ctx.fillText('CONTROLS:', CANVAS_WIDTH / 2, 180);
  ctx.font = '14px Arial';
  ctx.fillText('SPACE: Pull back / Release slingshot', CANVAS_WIDTH / 2, 205);
  ctx.fillText('UP/DOWN: Adjust angle', CANVAS_WIDTH / 2, 225);
  ctx.fillText('LEFT/RIGHT: Adjust power', CANVAS_WIDTH / 2, 245);
  ctx.fillText('ESC: Pause', CANVAS_WIDTH / 2, 265);
  
  // Objective
  ctx.font = '16px Arial';
  ctx.fillText('OBJECTIVE:', CANVAS_WIDTH / 2, 300);
  ctx.font = '14px Arial';
  ctx.fillText('Eliminate all green pigs with limited birds!', CANVAS_WIDTH / 2, 320);
  
  // Start prompt
  ctx.fillStyle = '#DD0000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

function drawGame(ctx) {
  // Draw ground
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(0, 380, CANVAS_WIDTH, 20);
  
  // Draw grass
  ctx.fillStyle = '#90EE90';
  for (let i = 0; i < CANVAS_WIDTH; i += 10) {
    ctx.fillRect(i, 377, 5, 3);
  }
  
  // Draw slingshot
  if (gameState.slingshot) {
    const isPulling = gameState.slingshotState === 'PULLING';
    const pullX = isPulling && gameState.player ? gameState.player.body.position.x : 0;
    const pullY = isPulling && gameState.player ? gameState.player.body.position.y : 0;
    
    gameState.slingshot.draw(ctx, gameState.cameraX, gameState.cameraY, 
                             gameState.player, isPulling, pullX, pullY);
  }
  
  // Draw trajectory preview when pulling
  if (gameState.slingshotState === 'PULLING' && gameState.player) {
    drawTrajectoryPreview(ctx);
  }
  
  // Draw structures
  gameState.structures.forEach(structure => {
    structure.draw(ctx, gameState.cameraX, gameState.cameraY);
  });
  
  // Draw pigs
  gameState.pigs.forEach(pig => {
    pig.draw(ctx, gameState.cameraX, gameState.cameraY);
  });
  
  // Draw birds
  gameState.birds.forEach((bird, idx) => {
    if (bird.body && bird.body.parent) {
      bird.draw(ctx, gameState.cameraX, gameState.cameraY);
    }
  });
  
  // Draw UI
  drawUI(ctx);
}

function drawTrajectoryPreview(ctx) {
  if (!gameState.player) return;
  
  const angleRad = (gameState.launchAngle * Math.PI) / 180;
  const force = gameState.launchPower * 0.5; // Match the launch force multiplier
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  
  const startX = gameState.player.body.position.x;
  const startY = gameState.player.body.position.y;
  
  ctx.moveTo(startX, startY);
  
  let vx = Math.cos(angleRad) * force;
  let vy = Math.sin(angleRad) * force;
  let x = startX;
  let y = startY;
  
  // Simulate trajectory
  for (let i = 0; i < 60; i++) {
    vy += 0.8 * 0.5; // Gravity (match world gravity)
    x += vx * 1.5;
    y += vy * 1.5;
    
    if (i % 2 === 0) {
      ctx.lineTo(x, y);
    }
    
    if (y > 380 || x > 700 || x < 0) break;
  }
  
  ctx.stroke();
  
  // Draw dots along trajectory for better visibility
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  x = startX;
  y = startY;
  vx = Math.cos(angleRad) * force;
  vy = Math.sin(angleRad) * force;
  
  for (let i = 0; i < 60; i += 5) {
    for (let j = 0; j < 5; j++) {
      vy += 0.8 * 0.5;
      x += vx * 1.5;
      y += vy * 1.5;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    if (y > 380 || x > 700 || x < 0) break;
  }
  
  ctx.setLineDash([]);
}

function drawUI(ctx) {
  // Score
  ctx.fillStyle = '#333';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${gameState.score}`, 10, 25);
  
  // Birds remaining
  ctx.fillText(`Birds: ${gameState.totalBirds - gameState.currentBirdIndex}`, 10, 50);
  
  // Pigs remaining
  ctx.fillText(`Pigs: ${gameState.pigsRemaining}`, 10, 75);
  
  // Power indicator when pulling
  if (gameState.slingshotState === 'PULLING') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH - 120, 10, 110, 60);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Angle: ${Math.round(gameState.launchAngle)}°`, CANVAS_WIDTH - 110, 30);
    ctx.fillText(`Power: ${Math.round(gameState.launchPower)}`, CANVAS_WIDTH - 110, 50);
  }
}

function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  ctx.font = '20px Arial';
  ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function drawWinScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 128, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  ctx.font = '24px Arial';
  ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  ctx.font = 'bold 20px Arial';
  ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function drawLoseScreen(ctx) {
  ctx.fillStyle = 'rgba(128, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('OUT OF BIRDS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  ctx.font = '24px Arial';
  ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  ctx.font = 'bold 20px Arial';
  ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  frameCount++;
  gameState.frameCount = frameCount;
  
  // Update Matter.js physics
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    Engine.update(gameState.engine, 1000 / 60);
    updateGame();
  }
  
  // Render
  render();
}

// Initialize when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', init);
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  logGameInfo({ message: `Control mode changed to ${mode}` });
  
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