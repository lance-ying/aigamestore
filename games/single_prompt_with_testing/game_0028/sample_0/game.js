// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, 
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
         KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_Z,
         KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, STAGE_BOUNDS, RESPAWN_TIME } from './globals.js';
import { Fighter, Projectile, SpecialObject } from './entities.js';
import { createStage, renderBackground } from './stage.js';
import { checkAttackCollisions, checkProjectileCollisions, checkPlatformCollisions } from './combat.js';
import { getOpponentInputs } from './ai.js';
import { renderStartScreen, renderGameUI, renderPauseOverlay, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastAttack = null;
  let lastSpecial = null;
  
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame();
    
    // Log initial state
    logGameInfo("Game initialized");
  };
  
  p.draw = function() {
    // Single background call
    renderBackground(p);
    
    gameState.frameCount++;
    
    switch(gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame();
        renderGame();
        renderGameUI(p);
        break;
        
      case PHASE_PAUSED:
        renderGame();
        renderGameUI(p);
        renderPauseOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGame();
        renderGameOverScreen(p);
        break;
    }
  };
  
  function initializeGame() {
    gameState.platforms = createStage();
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.effects = [];
    gameState.player = null;
    gameState.opponent = null;
    gameState.playerKOs = 0;
    gameState.opponentKOs = 0;
    gameState.frameCount = 0;
  }
  
  function startGame() {
    // Create player
    gameState.player = new Fighter(150, 100, true, gameState.selectedCharacter);
    
    // Create opponent (random character different from player)
    let opponentChar = (gameState.selectedCharacter + 1 + Math.floor(Math.random() * 3)) % 4;
    gameState.opponent = new Fighter(450, 100, false, opponentChar);
    
    gameState.entities = [gameState.player, gameState.opponent];
    gameState.playerKOs = 0;
    gameState.opponentKOs = 0;
    gameState.roundStartTimer = 60;
    
    logGameInfo("Game started");
  }
  
  function updateGame() {
    // Round start countdown
    if (gameState.roundStartTimer > 0) {
      gameState.roundStartTimer--;
      return;
    }
    
    // Handle respawns
    if (gameState.respawnTimer > 0) {
      gameState.respawnTimer--;
      if (gameState.respawnTimer === 0) {
        respawnFighters();
      }
      return;
    }
    
    // Get inputs
    const playerInputs = getPlayerInputs();
    const opponentInputs = getOpponentInputs();
    
    // Update fighters
    if (gameState.player && gameState.player.isAlive) {
      gameState.player.handleInput(playerInputs);
      gameState.player.update(p);
      checkPlatformCollisions(p, gameState.player);
      
      // Log player position occasionally
      if (gameState.frameCount % 30 === 0) {
        logPlayerInfo();
      }
    }
    
    if (gameState.opponent && gameState.opponent.isAlive) {
      gameState.opponent.handleInput(opponentInputs);
      gameState.opponent.update(p);
      checkPlatformCollisions(p, gameState.opponent);
    }
    
    // Process attacks
    if (playerInputs.space || playerInputs.z) {
      const attack = playerInputs.space ? 
        gameState.player.performLightAttack() : 
        gameState.player.performStrongAttack();
      if (attack) {
        checkAttackCollisions(p, gameState.player, attack);
      }
    }
    
    // Process specials
    if (playerInputs.shift && gameState.player.specialCooldown === 0) {
      const special = gameState.player.performSpecialAttack(playerInputs);
      if (special) {
        createSpecialEffect(special);
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      proj.update();
      if (!proj.active) {
        gameState.projectiles.splice(i, 1);
      }
    }
    checkProjectileCollisions(p);
    
    // Update special objects
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      if (gameState.entities[i] instanceof SpecialObject) {
        gameState.entities[i].update();
        if (!gameState.entities[i].active) {
          gameState.entities.splice(i, 1);
        }
      }
    }
    
    // Update effects
    for (let i = gameState.effects.length - 1; i >= 0; i--) {
      gameState.effects[i].update();
      if (!gameState.effects[i].active) {
        gameState.effects.splice(i, 1);
      }
    }
    
    // Check for KOs
    checkKOs();
  }
  
  function renderGame() {
    // Render platforms
    for (let platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Render special objects
    for (let entity of gameState.entities) {
      if (entity instanceof SpecialObject) {
        entity.render(p);
      }
    }
    
    // Render projectiles
    for (let proj of gameState.projectiles) {
      proj.render(p);
    }
    
    // Render fighters
    if (gameState.player && gameState.player.isAlive) {
      gameState.player.render(p);
    }
    if (gameState.opponent && gameState.opponent.isAlive) {
      gameState.opponent.render(p);
    }
    
    // Render effects
    for (let effect of gameState.effects) {
      effect.render(p);
    }
  }
  
  function getPlayerInputs() {
    if (gameState.controlMode === "HUMAN") {
      return {
        left: p.keyIsDown(KEY_LEFT),
        right: p.keyIsDown(KEY_RIGHT),
        up: p.keyIsDown(KEY_UP),
        down: p.keyIsDown(KEY_DOWN),
        space: p.keyIsDown(KEY_SPACE),
        shift: p.keyIsDown(KEY_SHIFT),
        z: p.keyIsDown(KEY_Z)
      };
    } else {
      // Automated testing
      const actions = get_automated_testing_action(gameState);
      return {
        left: actions.includes(KEY_LEFT),
        right: actions.includes(KEY_RIGHT),
        up: actions.includes(KEY_UP),
        down: actions.includes(KEY_DOWN),
        space: actions.includes(KEY_SPACE),
        shift: actions.includes(KEY_SHIFT),
        z: actions.includes(KEY_Z)
      };
    }
  }
  
  function createSpecialEffect(special) {
    // Create projectile or special object based on character
    switch(special.character) {
      case 0: // Fire - Projectile
        const fireProj = new Projectile(
          special.x + (special.owner.facingRight ? 40 : -40),
          special.y + 20,
          (special.owner.facingRight ? 8 : -8),
          special.direction === 'up' ? -6 : (special.direction === 'down' ? 6 : 0),
          special.owner,
          8,
          120
        );
        gameState.projectiles.push(fireProj);
        break;
        
      case 1: // Water - Puddle
        const puddle = new SpecialObject(special.x, special.y + 40, 'puddle', special.owner);
        gameState.entities.push(puddle);
        break;
        
      case 2: // Air - Wind current
        const wind = new SpecialObject(
          special.x + (special.owner.facingRight ? 60 : -60),
          special.y,
          'wind',
          special.owner
        );
        gameState.entities.push(wind);
        break;
        
      case 3: // Earth - Rock
        const rock = new SpecialObject(special.x, special.y + 30, 'rock', special.owner);
        gameState.entities.push(rock);
        break;
    }
  }
  
  function checkKOs() {
    let playerKOd = false;
    let opponentKOd = false;
    
    if (gameState.player && !gameState.player.isAlive) {
      playerKOd = true;
      gameState.opponentKOs++;
      gameState.player.lives--;
    }
    
    if (gameState.opponent && !gameState.opponent.isAlive) {
      opponentKOd = true;
      gameState.playerKOs++;
      gameState.opponent.lives--;
    }
    
    if (playerKOd || opponentKOd) {
      // Check win conditions
      if (gameState.playerKOs >= gameState.KO_LIMIT) {
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        logGameInfo("Player wins!");
        return;
      }
      if (gameState.opponentKOs >= gameState.KO_LIMIT) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        logGameInfo("Opponent wins!");
        return;
      }
      
      // Start respawn
      gameState.respawnTimer = RESPAWN_TIME;
    }
  }
  
  function respawnFighters() {
    if (gameState.player && !gameState.player.isAlive) {
      gameState.player.x = 150;
      gameState.player.y = 100;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
      gameState.player.damage = 0;
      gameState.player.isAlive = true;
      gameState.player.hitstun = 0;
    }
    
    if (gameState.opponent && !gameState.opponent.isAlive) {
      gameState.opponent.x = 450;
      gameState.opponent.y = 100;
      gameState.opponent.vx = 0;
      gameState.opponent.vy = 0;
      gameState.opponent.damage = 0;
      gameState.opponent.isAlive = true;
      gameState.opponent.hitstun = 0;
    }
    
    gameState.roundStartTimer = 60;
  }
  
  p.keyPressed = function() {
    logInput("keyPressed", p.key, p.keyCode);
    
    switch(gameState.gamePhase) {
      case PHASE_START:
        if (p.keyCode === KEY_ENTER) {
          gameState.gamePhase = PHASE_PLAYING;
          startGame();
          logGameInfo("Transitioned to PLAYING");
        } else if (p.keyCode === KEY_LEFT) {
          gameState.selectedCharacter = (gameState.selectedCharacter - 1 + 4) % 4;
        } else if (p.keyCode === KEY_RIGHT) {
          gameState.selectedCharacter = (gameState.selectedCharacter + 1) % 4;
        }
        break;
        
      case PHASE_PLAYING:
        if (p.keyCode === KEY_ESC) {
          gameState.gamePhase = PHASE_PAUSED;
          logGameInfo("Game paused");
        }
        break;
        
      case PHASE_PAUSED:
        if (p.keyCode === KEY_ESC) {
          gameState.gamePhase = PHASE_PLAYING;
          logGameInfo("Game resumed");
        }
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        if (p.keyCode === KEY_R) {
          gameState.gamePhase = PHASE_START;
          initializeGame();
          logGameInfo("Restarted to START");
        }
        break;
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    logInput("keyReleased", p.key, p.keyCode);
    return false;
  };
  
  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      gamePhase: gameState.gamePhase,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        damage: gameState.player.damage,
        lives: gameState.player.lives,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
function getGameState() {
  return gameState;
}
window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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