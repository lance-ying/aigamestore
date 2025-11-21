import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';
import { Player } from './player.js';
import { handleInput, logInput, logPlayerInfo } from './input_handler.js';
import { WaveManager } from './wave_manager.js';
import { Narrator } from './narrator.js';
import { updateParticles, drawParticles } from './particles.js';

const p5 = window.p5;

let waveManager = null;
let narrator = null;
let lastPlayerLogFrame = 0;

const gameInstance = new p5(p => {
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
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize managers
    waveManager = new WaveManager(p);
    narrator = new Narrator(p);
  };
  
  p.draw = function() {
    p.background(20, 15, 30);
    
    switch(gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame();
        drawGame();
        break;
      case "PAUSED":
        drawGame();
        drawPauseScreen();
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGame();
        drawGameOverScreen();
        break;
    }
  };
  
  function drawStartScreen() {
    p.push();
    
    // Title
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("ICEY", CANVAS_WIDTH / 2, 80);
    
    // Subtitle with glitch effect
    p.textSize(16);
    p.fill(200, 100, 255);
    p.text("A Meta-Narrative Action Experience", CANVAS_WIDTH / 2, 120);
    
    // Description
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    const desc = "Battle through waves of enemies in fast-paced combat.\nFollow the narrator's guidance... or defy them to uncover secrets.\nYour choices shape the story.";
    p.text(desc, CANVAS_WIDTH / 2, 160);
    
    // Controls
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.fill(200, 200, 255);
    p.text("CONTROLS:", 50, 240);
    p.fill(255);
    p.text("Arrow Keys: Move / Jump (Up)", 50, 260);
    p.text("Space: Light Attack (fast combos)", 50, 275);
    p.text("Shift: Heavy Attack (powerful)", 50, 290);
    p.text("Z: Dash (dodge with invincibility)", 50, 305);
    
    p.text("ESC: Pause    R: Restart", 50, 330);
    
    // Objectives
    p.fill(200, 255, 200);
    p.text("OBJECTIVES:", 320, 240);
    p.fill(255);
    p.text("• Defeat all enemy waves", 320, 260);
    p.text("• Survive the boss battle", 320, 275);
    p.text("• Build combos for higher scores", 320, 290);
    p.text("• Explore and discover secrets", 320, 305);
    
    // Start prompt
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    if (p.frameCount % 60 < 40) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    }
    
    p.pop();
  }
  
  function updateGame() {
    // Handle input
    handleInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info periodically
      if (p.frameCount - lastPlayerLogFrame >= 30) {
        logPlayerInfo(p);
        lastPlayerLogFrame = p.frameCount;
      }
      
      // Update camera to follow player
      const targetCameraX = gameState.player.x - CANVAS_WIDTH / 2;
      gameState.cameraX += (targetCameraX - gameState.cameraX) * 0.1;
      gameState.cameraX = p.constrain(gameState.cameraX, gameState.worldBounds.left, gameState.worldBounds.right - CANVAS_WIDTH);
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Update bosses
    for (const boss of gameState.bosses) {
      boss.update();
    }
    
    // Update particles
    updateParticles();
    
    // Check collisions
    checkCollisions();
    
    // Update wave manager
    waveManager.update();
    
    // Update narrator
    narrator.update();
    
    // Check combo timeout
    if (p.frameCount - gameState.lastHitTime > 60) {
      gameState.combo = 0;
    }
    
    // Check game over
    if (gameState.player && gameState.player.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", reason: "Player health depleted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function checkCollisions() {
    const player = gameState.player;
    if (!player) return;
    
    const attackBox = player.getAttackBox();
    
    if (attackBox) {
      // Check enemy hits
      for (const enemy of gameState.enemies) {
        if (!enemy.dead) {
          const hit = p.collideRectRect(
            attackBox.x - attackBox.width/2,
            attackBox.y - attackBox.height/2,
            attackBox.width,
            attackBox.height,
            enemy.x - enemy.width/2,
            enemy.y - enemy.height,
            enemy.width,
            enemy.height
          );
          
          if (hit) {
            enemy.takeDamage(attackBox.damage);
          }
        }
      }
      
      // Check boss hits
      for (const boss of gameState.bosses) {
        if (!boss.dead) {
          const hit = p.collideRectRect(
            attackBox.x - attackBox.width/2,
            attackBox.y - attackBox.height/2,
            attackBox.width,
            attackBox.height,
            boss.x - boss.width/2,
            boss.y - boss.height,
            boss.width,
            boss.height
          );
          
          if (hit) {
            boss.takeDamage(attackBox.damage);
          }
        }
      }
    }
  }
  
  function drawGame() {
    p.push();
    
    // Background layers for depth
    p.fill(30, 20, 50);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Grid background
    p.stroke(50, 40, 70, 100);
    p.strokeWeight(1);
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      p.line(i - (gameState.cameraX * 0.3) % 40, 0, i - (gameState.cameraX * 0.3) % 40, CANVAS_HEIGHT);
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Ground
    p.fill(40, 35, 60);
    p.noStroke();
    p.rect(0, GROUND_Y + 20, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 20);
    
    // Ground line
    p.stroke(100, 200, 255, 150);
    p.strokeWeight(2);
    p.line(0, GROUND_Y + 20, CANVAS_WIDTH, GROUND_Y + 20);
    
    p.pop();
    
    // Draw particles
    drawParticles(p);
    
    // Draw enemies
    for (const enemy of gameState.enemies) {
      enemy.draw();
    }
    
    // Draw bosses
    for (const boss of gameState.bosses) {
      boss.draw();
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Draw UI
    drawUI();
    
    // Draw narrator
    narrator.draw();
    
    // Wave manager UI
    waveManager.draw();
  }
  
  function drawUI() {
    p.push();
    
    // Score
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
    
    // Combo
    if (gameState.combo > 1) {
      p.fill(255, 215, 0);
      p.textSize(24);
      p.text(`${gameState.combo}x COMBO!`, CANVAS_WIDTH - 10, 35);
    }
    
    // Player health
    if (gameState.player) {
      p.fill(50);
      p.noStroke();
      p.rect(10, CANVAS_HEIGHT - 30, 200, 20);
      
      const healthPercent = gameState.player.health / gameState.player.maxHealth;
      p.fill(...(healthPercent > 0.5 ? [100, 255, 100] : healthPercent > 0.25 ? [255, 255, 100] : [255, 100, 100]));
      p.rect(10, CANVAS_HEIGHT - 30, 200 * healthPercent, 20);
      
      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);
      p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 15, CANVAS_HEIGHT - 20);
    }
    
    // Secrets indicator
    if (gameState.secrets.defiedNarrator || gameState.secrets.foundHiddenArea) {
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text("🌟 Secrets Discovered 🌟", CANVAS_WIDTH / 2, 10);
    }
    
    p.pop();
  }
  
  function drawPauseScreen() {
    p.push();
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
  
  function drawGameOverScreen() {
    p.push();
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.fill(100, 255, 100);
      p.textSize(48);
      
      if (gameState.secrets.unlockedSecretEnding) {
        p.text("TRUE ENDING", CANVAS_WIDTH / 2, 120);
        p.fill(255, 215, 0);
        p.textSize(16);
        p.text("You defied the narrator and discovered the truth.", CANVAS_WIDTH / 2, 160);
      } else {
        p.text("MISSION COMPLETE", CANVAS_WIDTH / 2, 120);
        p.fill(255);
        p.textSize(16);
        p.text("You followed the path and completed your mission.", CANVAS_WIDTH / 2, 160);
      }
    } else {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    }
    
    // Final stats
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
    p.text(`Max Combo: ${gameState.maxCombo}x`, CANVAS_WIDTH / 2, 240);
    
    if (gameState.secrets.defiedNarrator) {
      p.fill(255, 215, 0);
      p.textSize(14);
      p.text("⭐ Defied the Narrator", CANVAS_WIDTH / 2, 280);
    }
    if (gameState.secrets.foundHiddenArea) {
      p.fill(255, 215, 0);
      p.text("⭐ Found Hidden Area", CANVAS_WIDTH / 2, 300);
    }
    
    // Restart prompt
    p.fill(100, 200, 255);
    p.textSize(20);
    if (p.frameCount % 60 < 40) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
    }
    
    p.pop();
  }
  
  p.keyPressed = function() {
    logInput(p, p.key, p.keyCode, "keyPressed");
    
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase.includes("GAME_OVER")) {
        resetToStart();
      }
    }
  };
  
  function startGame() {
    resetGameState();
    
    // Create player
    gameState.player = new Player(p, 300, GROUND_Y);
    gameState.entities.push(gameState.player);
    
    // Set game phase
    gameState.gamePhase = "PLAYING";
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initial narrator message
    narrator.showMessage("Welcome, ICEY. Follow my instructions.");
    narrator.suggestDirection("right");
    
    // Spawn first wave
    waveManager.spawnNextWave();
  }
  
  function resetToStart() {
    resetGameState();
    gameState.gamePhase = "START";
    gameState.player = null;
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game reset" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn", "test_5_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn",
    "TEST_5": "test_5_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};