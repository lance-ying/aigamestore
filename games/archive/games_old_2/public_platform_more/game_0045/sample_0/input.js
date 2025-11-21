// input.js - Input handling
import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_Z,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  KEY_SHIFT,
  CHAR_ABI,
  CHAR_DD
} from './globals.js';
import { canMove, getInteractableObject, checkCollision } from './physics.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_R) {
    resetGame(p);
    return;
  }
}

export function processGameplayInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  let action = null;
  
  if (gameState.controlMode === "HUMAN") {
    action = getHumanInput(p);
  } else {
    // Get automated testing action
    if (window.get_automated_testing_action) {
      action = window.get_automated_testing_action(gameState);
    }
  }
  
  if (action) {
    executeAction(action, p);
  }
}

function getHumanInput(p) {
  const actions = [];
  
  if (p.keyIsDown(KEY_LEFT)) actions.push('LEFT');
  if (p.keyIsDown(KEY_RIGHT)) actions.push('RIGHT');
  if (p.keyIsDown(KEY_UP)) actions.push('UP');
  if (p.keyIsDown(KEY_DOWN)) actions.push('DOWN');
  if (p.keyIsDown(KEY_SHIFT)) actions.push('SPRINT');
  
  return actions.length > 0 ? actions : null;
}

export function handleDiscreteAction(action, p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (action === 'SWITCH') {
    switchCharacter(p);
  } else if (action === 'INTERACT') {
    interact(p);
  }
}

function executeAction(actions, p) {
  if (!Array.isArray(actions)) return;
  
  const character = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  if (!character) return;
  
  const sprint = actions.includes('SPRINT');
  gameState.sprintActive = sprint;
  
  let dx = 0;
  let dy = 0;
  
  if (actions.includes('LEFT')) dx -= 1;
  if (actions.includes('RIGHT')) dx += 1;
  if (actions.includes('UP')) dy -= 1;
  if (actions.includes('DOWN')) dy += 1;
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const factor = 1 / Math.sqrt(2);
    dx *= factor;
    dy *= factor;
  }
  
  if (dx !== 0 || dy !== 0) {
    moveCharacter(character, dx, dy, sprint, p);
  }
}

function moveCharacter(character, dx, dy, sprint, p) {
  const speed = sprint ? character.speed * character.sprintMultiplier : character.speed;
  const moveX = dx * speed;
  const moveY = dy * speed;
  
  if (canMove(character, moveX, moveY, gameState)) {
    character.move(dx, dy, sprint);
    
    // Update camera to follow active character
    updateCamera(character);
    
    // Log player position periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: character.x - gameState.cameraX,
        screen_y: character.y - gameState.cameraY,
        game_x: character.x,
        game_y: character.y,
        framecount: p.frameCount
      });
    }
  }
}

function updateCamera(character) {
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  
  // Center camera on character
  gameState.cameraX = character.x - CANVAS_WIDTH / 2;
  gameState.cameraY = character.y - CANVAS_HEIGHT / 2;
  
  // Clamp camera to world bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth - CANVAS_WIDTH));
  gameState.cameraY = Math.max(0, Math.min(gameState.cameraY, gameState.worldHeight - CANVAS_HEIGHT));
}

function switchCharacter(p) {
  gameState.activeCharacter = gameState.activeCharacter === CHAR_ABI ? CHAR_DD : CHAR_ABI;
  
  const newChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  updateCamera(newChar);
  
  p.logs.game_info.push({
    data: { action: 'switch_character', character: gameState.activeCharacter },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function interact(p) {
  const character = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  const interactable = getInteractableObject(character, gameState);
  
  if (interactable) {
    if (interactable.type === 'switch') {
      interactable.object.toggle();
      p.logs.game_info.push({
        data: { action: 'toggle_switch', switchId: interactable.object.id, active: interactable.object.active },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (interactable.type === 'terminal') {
      interactable.object.activate();
      gameState.storyUnlocked.push(interactable.object.message);
      
      // Check if this is the final terminal
      if (interactable.object.chapterId === 4) {
        gameState.finalTruthRevealed = true;
      }
      
      p.logs.game_info.push({
        data: { action: 'activate_terminal', chapterId: interactable.object.chapterId },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentChapter = 0;
  gameState.chaptersCompleted = 0;
  
  // Load first chapter
  const { loadChapter } = require('./levels.js');
  loadChapter(0, p, gameState);
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, chapter: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentChapter = 0;
  gameState.chaptersCompleted = 0;
  gameState.score = 0;
  gameState.storyUnlocked = [];
  gameState.finalTruthRevealed = false;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, action: 'reset' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose discrete actions for automated testing
export function triggerSwitchCharacter(p) {
  switchCharacter(p);
}

export function triggerInteract(p) {
  interact(p);
}