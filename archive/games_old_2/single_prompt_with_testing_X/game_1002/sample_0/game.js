// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, BUILDING_TYPES, getGameState } from './globals.js';
import { Building } from './building.js';
import { Hero } from './hero.js';
import { Beast } from './beast.js';
import { renderUI, showMessage } from './ui.js';
import { updateWaves } from './wave_manager.js';
import { handleInput, processAction } from './input_handler.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    initializeGame(p);

    // Log initial state
    p.logs.game_info.push({
      data: `Game initialized - Phase: ${gameState.gamePhase}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(200, 220, 240);

    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p);
    }

    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleInput(p);
    }

    // Update UI message timer
    if (gameState.uiMessageTimer > 0) {
      gameState.uiMessageTimer--;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: "Game paused",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: "Game resumed",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }

    // Gameplay controls (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = {
        key: p.key,
        keyCode: p.keyCode
      };

      if (p.keyCode === 32) { // SPACE
        action.key = 'SPACE';
        processAction(p, action);
      } else if (p.keyCode === 90) { // Z
        action.key = 'Z';
        processAction(p, action);
      } else if (p.keyCode === 37) { // Arrow Left
        action.key = 'ArrowLeft';
        processAction(p, action);
      } else if (p.keyCode === 38) { // Arrow Up
        action.key = 'ArrowUp';
        processAction(p, action);
      } else if (p.keyCode === 39) { // Arrow Right
        action.key = 'ArrowRight';
        processAction(p, action);
      } else if (p.keyCode === 40) { // Arrow Down
        action.key = 'ArrowDown';
        processAction(p, action);
      }
    }
  };

  p.keyReleased = function() {
    if (p.keyCode === 16) { // SHIFT
      gameState.timeScale = 1;
    }
  };

  function initializeGame(p) {
    // Create town hall at center
    const townHall = new Building(BUILDING_TYPES.TOWN_HALL, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.buildings.push(townHall);
    gameState.entities.push(townHall);
    gameState.player = townHall;
  }

  function startGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: "Game started",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame(p) {
    // Reset all game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.food = 100;
    gameState.wood = 100;
    gameState.coal = 50;
    gameState.population = 5;
    gameState.maxPopulation = 10;
    gameState.buildings = [];
    gameState.heroes = [];
    gameState.beasts = [];
    gameState.entities = [];
    gameState.currentWave = 0;
    gameState.waveTimer = 0;
    gameState.waveActive = false;
    gameState.techLevel = 1;
    gameState.gameTime = 0;
    gameState.timeScale = 1;
    gameState.selectedBuilding = null;
    gameState.selectedHero = null;
    gameState.buildingMenuOpen = false;
    gameState.heroMenuOpen = false;
    gameState.selectedBuildingType = null;
    gameState.uiMessage = "";
    gameState.uiMessageTimer = 0;

    initializeGame(p);

    p.logs.game_info.push({
      data: "Game reset",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGame(p) {
    gameState.gameTime += gameState.timeScale;

    // Update resource consumption
    if (gameState.gameTime % 120 === 0) { // Every 2 seconds
      gameState.food -= gameState.population * 0.1;
      gameState.coal -= gameState.population * 0.05;
    }

    // Check for game over conditions
    if (gameState.food < 0) {
      gameState.food = 0;
    }

    const townHall = gameState.buildings.find(b => b.type === BUILDING_TYPES.TOWN_HALL);
    if (!townHall || !townHall.isAlive) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: "Game Over - Town Hall destroyed",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Update waves
    updateWaves(p);

    // Update all entities
    for (const entity of gameState.entities) {
      if (entity && entity.update) {
        entity.update();
      }
    }

    // Remove dead entities
    gameState.buildings = gameState.buildings.filter(b => b.isAlive);
    gameState.heroes = gameState.heroes.filter(h => h.isAlive);
    gameState.beasts = gameState.beasts.filter(b => b.isAlive);
    gameState.entities = gameState.entities.filter(e => 
      (e.isAlive !== undefined ? e.isAlive : true)
    );

    // Log player info periodically
    if (gameState.gameTime % 60 === 0 && townHall) {
      p.logs.player_info.push({
        screen_x: townHall.x,
        screen_y: townHall.y,
        game_x: townHall.x,
        game_y: townHall.y,
        framecount: p.frameCount
      });
    }
  }

  function renderGame(p) {
    // Background - icy terrain
    p.push();
    p.noStroke();
    for (let i = 0; i < 20; i++) {
      p.fill(220 - i * 2, 230 - i * 2, 240 - i);
      p.rect(0, i * 20, CANVAS_WIDTH, 20);
    }
    p.pop();

    // Render entities
    for (const building of gameState.buildings) {
      if (building && building.render) {
        building.render(p);
      }
    }

    for (const hero of gameState.heroes) {
      if (hero && hero.render) {
        hero.render(p);
      }
    }

    for (const beast of gameState.beasts) {
      if (beast && beast.render) {
        beast.render(p);
      }
    }

    // Render UI
    renderUI(p);
  }

  function renderStartScreen(p) {
    p.background(30, 50, 80);

    // Ice effects
    p.push();
    p.noStroke();
    p.fill(200, 220, 255, 50);
    for (let i = 0; i < 10; i++) {
      p.circle(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), p.random(30, 100));
    }
    p.pop();

    // Title
    p.push();
    p.fill(200, 230, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("FROST SURVIVAL", CANVAS_WIDTH / 2, 60);
    
    p.textSize(18);
    p.fill(150, 200, 255);
    p.text("Lead the Last City", CANVAS_WIDTH / 2, 100);
    p.pop();

    // Description
    p.push();
    p.fill(220, 240, 255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    const desc = [
      "Manage resources (Food, Wood, Coal) to keep your city alive.",
      "Build resource gatherers and houses to expand your civilization.",
      "Recruit heroes to defend against waves of hostile beasts.",
      "Survive 10 waves to prove you are the strongest!"
    ];
    for (let i = 0; i < desc.length; i++) {
      p.text(desc[i], CANVAS_WIDTH / 2, 140 + i * 20);
    }
    p.pop();

    // Controls
    p.push();
    p.fill(255, 255, 200);
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    const controls = [
      "SPACE - Open Build Menu / Confirm / Upgrade",
      "Z - Open Hero Menu / Cancel / Deselect",
      "Arrow Keys - Navigate Menus / Select Units",
      "SHIFT (Hold) - Speed Up Time",
      "ESC - Pause/Resume",
      "R - Restart (from Game Over)"
    ];
    let yPos = 250;
    for (const control of controls) {
      p.text(control, 50, yPos);
      yPos += 18;
    }
    p.pop();

    // Start prompt
    p.push();
    const alpha = Math.floor((Math.sin(p.frameCount * 0.1) + 1) * 127.5);
    p.fill(255, 255, 100, alpha);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    p.pop();
  }

  function renderGameOver(p) {
    p.background(20, 20, 40);

    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

    p.push();
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);

    p.fill(255);
    p.textSize(20);
    if (isWin) {
      p.text("You have proven your city is the strongest!", CANVAS_WIDTH / 2, 150);
      p.text(`Survived all ${gameState.maxWaves} waves!`, CANVAS_WIDTH / 2, 180);
    } else {
      p.text("Your city has fallen to the frost...", CANVAS_WIDTH / 2, 150);
      p.text(`Survived ${gameState.currentWave} waves`, CANVAS_WIDTH / 2, 180);
    }

    // Stats
    p.textSize(16);
    p.text(`Final Resources:`, CANVAS_WIDTH / 2, 220);
    p.text(`Food: ${Math.floor(gameState.food)}`, CANVAS_WIDTH / 2, 245);
    p.text(`Wood: ${Math.floor(gameState.wood)}`, CANVAS_WIDTH / 2, 265);
    p.text(`Coal: ${Math.floor(gameState.coal)}`, CANVAS_WIDTH / 2, 285);
    p.text(`Population: ${gameState.population}`, CANVAS_WIDTH / 2, 305);
    p.text(`Buildings: ${gameState.buildings.filter(b => b.isAlive).length}`, CANVAS_WIDTH / 2, 325);
    p.text(`Heroes: ${gameState.heroes.filter(h => h.isAlive).length}`, CANVAS_WIDTH / 2, 345);

    // Restart prompt
    const alpha = Math.floor((Math.sin(p.frameCount * 0.1) + 1) * 127.5);
    p.fill(255, 255, 100, alpha);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    p.pop();
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  gameInstance.logs.game_info.push({
    data: `Control mode changed to ${mode}`,
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};