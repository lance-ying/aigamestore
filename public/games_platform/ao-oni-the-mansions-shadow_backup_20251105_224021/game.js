// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { loadLevel } from './levels.js';
import { initTestController, getTestAction } from './testing.js';
import { 
  renderStartScreen, 
  renderGameOverScreen, 
  renderPausedIndicator, 
  renderUI,
  renderDarkness,
  renderMessages 
} from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  let lastPlayerLogFrame = -10;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 35, 45);

    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const actions = getTestAction();
      
      // Process test actions as discrete taps
      for (const keyCode of actions) {
        // Handle movement keys as discrete taps
        if (keyCode === 37 && gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.player.moveByTap('left', gameState.isRunning, p);
        } else if (keyCode === 39 && gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.player.moveByTap('right', gameState.isRunning, p);
        } else if (keyCode === 38 && gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.player.moveByTap('up', gameState.isRunning, p);
        } else if (keyCode === 40 && gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.player.moveByTap('down', gameState.isRunning, p);
        } else if (keyCode === 16) {
          gameState.isRunning = !gameState.isRunning;
        } else if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          gameState.level = 1;
          gameState.score = 0;
          loadLevel(1);
          
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase, level: gameState.level, mode: "AUTO_START" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
          handleInteraction();
        }
      }
    }

    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
      renderUI(p);
      renderDarkness(p);
      renderMessages(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      renderUI(p);
      renderDarkness(p);
      renderPausedIndicator(p);
      renderMessages(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, false);
    }

    // Log player info periodically
    if (gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount - lastPlayerLogFrame >= 10) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
        lastPlayerLogFrame = p.frameCount;
      }
    }
  };

  function updateGame(p) {
    // Don't update if game is over
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      return;
    }

    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }

    // Update Ao Onis
    for (const aoOni of gameState.aoOnis) {
      aoOni.update(p);
    }

    // Update items
    for (const item of gameState.items) {
      item.update();
    }

    // Update messages
    updateMessages();

    // Check for level completion
    if (gameState.exitZone && gameState.exitZone.checkPlayer() && !gameState.levelComplete) {
      gameState.levelComplete = true;
      
      // Award completion bonus
      gameState.score += 100;
      addMessage("Level Complete! +100", "success");
      
      // Award undetected bonus
      if (gameState.undetectedBonus) {
        gameState.score += 50;
        addMessage("Undetected Bonus! +50", "success");
      }
      
      // Check if final level
      if (gameState.level >= 5) {
        setTimeout(() => {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase, won: true, finalScore: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }, 500);
      } else {
        // Load next level
        setTimeout(() => {
          gameState.level++;
          loadLevel(gameState.level);
          addMessage(`Level ${gameState.level}`, "info");
          p.logs.game_info.push({
            data: { phase: "LEVEL_COMPLETE", nextLevel: gameState.level },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }, 1000);
      }
    }
  }

  function renderGame(p) {
    // Background
    p.fill(60, 55, 65);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Walls
    p.fill(80, 70, 75);
    p.stroke(60, 50, 55);
    p.strokeWeight(2);
    for (const wall of gameState.walls) {
      p.rect(wall.x, wall.y, wall.w, wall.h);
    }

    // Doors
    for (const door of gameState.doors) {
      door.render(p);
    }

    // Hiding spots
    for (const spot of gameState.hidingSpots) {
      spot.render(p);
    }

    // Items
    for (const item of gameState.items) {
      item.render(p);
    }

    // Exit zone
    if (gameState.exitZone) {
      gameState.exitZone.render(p);
    }

    // Ao Onis
    for (const aoOni of gameState.aoOnis) {
      aoOni.render(p);
    }

    // Player
    if (gameState.player) {
      gameState.player.render(p);
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

    if (gameState.controlMode === "HUMAN") {
      // Game phase transitions
      if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === GAME_PHASES.START) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          gameState.level = 1;
          gameState.score = 0;
          loadLevel(1);
          
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase, level: gameState.level },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.gamePhase = GAME_PHASES.PAUSED;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (p.keyCode === 82) { // R
        gameState.gamePhase = GAME_PHASES.START;
        gameState.level = 1;
        gameState.score = 0;
        gameState.inventory = [];
        gameState.hasFlashlight = false;
        gameState.flashlightOn = false;
        gameState.messages = [];
        gameState.isRunning = false;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, action: "restart" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }

      // Gameplay controls
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        if (p.keyCode === 16) { // SHIFT - toggle sprint mode
          gameState.isRunning = !gameState.isRunning;
          addMessage(gameState.isRunning ? "Sprint Mode ON" : "Sprint Mode OFF", "info");
        } else if (p.keyCode === 32) { // SPACE
          handleInteraction();
        } else if (p.keyCode === 90) { // Z
          if (gameState.hasFlashlight) {
            gameState.flashlightOn = !gameState.flashlightOn;
            addMessage(gameState.flashlightOn ? "Flashlight ON" : "Flashlight OFF", "info");
          }
        }
        
        // TAP-BASED MOVEMENT: Each arrow key press moves a fixed distance
        if (gameState.player) {
          if (p.keyCode === 37) { // Left
            gameState.player.moveByTap('left', gameState.isRunning, p);
          } else if (p.keyCode === 39) { // Right
            gameState.player.moveByTap('right', gameState.isRunning, p);
          } else if (p.keyCode === 38) { // Up
            gameState.player.moveByTap('up', gameState.isRunning, p);
          } else if (p.keyCode === 40) { // Down
            gameState.player.moveByTap('down', gameState.isRunning, p);
          }
        }
      }
    }

    return false;
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // No longer tracking key release for movement (tap-based now)
    return false;
  };

  function handleInteraction() {
    if (!gameState.player) return;

    // Check if hiding
    if (gameState.player.hiding) {
      gameState.player.unhide();
      addMessage("Left hiding spot", "info");
      return;
    }

    // Check hiding spots
    for (const spot of gameState.hidingSpots) {
      if (spot.canHide()) {
        gameState.player.hide(spot);
        spot.occupied = true;
        addMessage("Hiding...", "info");
        return;
      }
    }

    // Check doors - increased interaction range to 50 pixels
    for (const door of gameState.doors) {
      const dist = Math.hypot(
        door.x + door.w / 2 - gameState.player.x,
        door.y + door.h / 2 - gameState.player.y
      );
      if (dist < 50) {
        const result = door.interact();
        if (result === "unlocked") {
          addMessage("Door unlocked!", "success");
        } else if (result === "locked") {
          addMessage("Door is locked. Need key!", "warning");
        } else if (result === "opened") {
          addMessage("Door opened", "info");
        }
        return;
      }
    }

    // Check items
    for (const item of gameState.items) {
      if (item.checkPickup()) {
        item.collect();
        return;
      }
    }
  }
});

// Message system
function addMessage(text, type = "info") {
  if (!gameState.messages) {
    gameState.messages = [];
  }
  gameState.messages.push({
    text: text,
    type: type,
    time: 120 // frames to display
  });
}

function updateMessages() {
  if (!gameState.messages) {
    gameState.messages = [];
    return;
  }
  
  for (let i = gameState.messages.length - 1; i >= 0; i--) {
    gameState.messages[i].time--;
    if (gameState.messages[i].time <= 0) {
      gameState.messages.splice(i, 1);
    }
  }
}

// Expose globally
window.addMessage = addMessage;

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  initTestController(mode);
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};