// input.js - Input handling
import { gameState, GAME_PHASES, GAME_STATES, MINIGAME_TYPES } from './globals.js';

export function handleKeyPressed(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  const ENTER = 13, ESC = 27, R = 82, SPACE = 32, SHIFT = 16;
  const LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;
  
  // Global controls
  if (keyCode === ENTER && gameState.gamePhase === GAME_PHASES.START) {
    startGame(p);
    return;
  }
  
  if (keyCode === ESC && gameState.gamePhase === GAME_PHASES.PLAYING) {
    togglePause(p);
    return;
  }
  
  if (keyCode === R && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
    restartGame(p);
    return;
  }
  
  // State-specific controls
  if (gameState.gamePhase === GAME_PHASES.START) {
    handleStartScreenInput(p, keyCode);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, keyCode);
  }
}

export function handleKeyReleased(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.currentState === GAME_STATES.MINIGAME_PLAYING && gameState.miniGameData) {
    const SPACE = 32;
    const LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;
    
    if (gameState.miniGameData.type === MINIGAME_TYPES.SHAVING) {
      if (keyCode === SPACE) {
        gameState.miniGameData.razorActive = false;
      }
    } else if (gameState.miniGameData.type === MINIGAME_TYPES.SHOWERING) {
      if (keyCode === SPACE) {
        gameState.miniGameData.sprayActive = false;
      }
    } else if (gameState.miniGameData.type === MINIGAME_TYPES.MAZE) {
      gameState.miniGameData.handleInput(keyCode, false);
    }
  }
}

function handleStartScreenInput(p, keyCode) {
  const SPACE = 32, SHIFT = 16;
  const UP_ARROW = 38, DOWN_ARROW = 40;
  
  if (gameState.currentState === GAME_STATES.MENU) {
    if (keyCode === UP_ARROW) {
      gameState.menuSelection = (gameState.menuSelection - 1 + 3) % 3;
    } else if (keyCode === DOWN_ARROW) {
      gameState.menuSelection = (gameState.menuSelection + 1) % 3;
    } else if (keyCode === SPACE) {
      if (gameState.menuSelection === 0) {
        gameState.currentState = GAME_STATES.ANIMAL_SELECT;
      } else if (gameState.menuSelection === 1) {
        gameState.currentState = GAME_STATES.INSTRUCTIONS;
      } else if (gameState.menuSelection === 2) {
        gameState.currentState = GAME_STATES.HIGH_SCORES;
      }
    }
  } else if (gameState.currentState === GAME_STATES.INSTRUCTIONS || 
             gameState.currentState === GAME_STATES.HIGH_SCORES) {
    if (keyCode === SHIFT) {
      gameState.currentState = GAME_STATES.MENU;
    }
  }
}

function handlePlayingInput(p, keyCode) {
  const SPACE = 32, SHIFT = 16;
  const LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;
  
  if (gameState.currentState === GAME_STATES.ANIMAL_SELECT) {
    if (keyCode === LEFT_ARROW) {
      gameState.animalSelection = Math.max(0, gameState.animalSelection - 1);
      gameState.minigameSelection = 0;
    } else if (keyCode === RIGHT_ARROW) {
      gameState.animalSelection = Math.min(gameState.animals.length - 1, gameState.animalSelection + 1);
      gameState.minigameSelection = 0;
    } else if (keyCode === UP_ARROW) {
      if (gameState.animalSelection >= 0) {
        const animal = gameState.animals[gameState.animalSelection];
        gameState.minigameSelection = Math.max(0, gameState.minigameSelection - 1);
      }
    } else if (keyCode === DOWN_ARROW) {
      if (gameState.animalSelection >= 0) {
        const animal = gameState.animals[gameState.animalSelection];
        gameState.minigameSelection = Math.min(animal.availableMiniGames.length - 1, 
                                               gameState.minigameSelection + 1);
      }
    } else if (keyCode === SPACE) {
      if (gameState.animalSelection >= 0) {
        const animal = gameState.animals[gameState.animalSelection];
        if (gameState.minigameSelection >= 0 && 
            gameState.minigameSelection < animal.availableMiniGames.length) {
          gameState.selectedAnimal = animal;
          gameState.selectedMinigame = animal.availableMiniGames[gameState.minigameSelection];
          gameState.currentState = GAME_STATES.MINIGAME_INTRO;
        }
      }
    }
  } else if (gameState.currentState === GAME_STATES.MINIGAME_INTRO) {
    if (keyCode === SPACE) {
      startMiniGame(p);
    } else if (keyCode === SHIFT) {
      gameState.currentState = GAME_STATES.ANIMAL_SELECT;
    }
  } else if (gameState.currentState === GAME_STATES.MINIGAME_PLAYING) {
    if (gameState.miniGameData) {
      // Handle minigame-specific input
      if (gameState.miniGameData.type === MINIGAME_TYPES.SHAVING) {
        if (keyCode === LEFT_ARROW) {
          gameState.miniGameData.cursorX = Math.max(150, gameState.miniGameData.cursorX - 5);
        } else if (keyCode === RIGHT_ARROW) {
          gameState.miniGameData.cursorX = Math.min(450, gameState.miniGameData.cursorX + 5);
        } else if (keyCode === UP_ARROW) {
          gameState.miniGameData.cursorY = Math.max(80, gameState.miniGameData.cursorY - 5);
        } else if (keyCode === DOWN_ARROW) {
          gameState.miniGameData.cursorY = Math.min(320, gameState.miniGameData.cursorY + 5);
        } else if (keyCode === SPACE) {
          gameState.miniGameData.razorActive = true;
        }
      } else if (gameState.miniGameData.type === MINIGAME_TYPES.SHOWERING) {
        if (keyCode === LEFT_ARROW) {
          gameState.miniGameData.cursorX = Math.max(150, gameState.miniGameData.cursorX - 5);
        } else if (keyCode === RIGHT_ARROW) {
          gameState.miniGameData.cursorX = Math.min(450, gameState.miniGameData.cursorX + 5);
        } else if (keyCode === UP_ARROW) {
          gameState.miniGameData.cursorY = Math.max(80, gameState.miniGameData.cursorY - 5);
        } else if (keyCode === DOWN_ARROW) {
          gameState.miniGameData.cursorY = Math.min(320, gameState.miniGameData.cursorY + 5);
        } else if (keyCode === SPACE) {
          gameState.miniGameData.sprayActive = true;
        }
      } else if (gameState.miniGameData.type === MINIGAME_TYPES.MAZE) {
        gameState.miniGameData.handleInput(keyCode, true);
      } else if (gameState.miniGameData.type === MINIGAME_TYPES.FEEDING) {
        if (keyCode === LEFT_ARROW) {
          gameState.miniGameData.cursorX = Math.max(50, gameState.miniGameData.cursorX - 5);
        } else if (keyCode === RIGHT_ARROW) {
          gameState.miniGameData.cursorX = Math.min(550, gameState.miniGameData.cursorX + 5);
        } else if (keyCode === SPACE) {
          gameState.miniGameData.handleGrab();
        }
      }
    }
  } else if (gameState.currentState === GAME_STATES.MINIGAME_COMPLETE) {
    if (keyCode === SPACE) {
      checkLevelProgress(p);
    }
  } else if (gameState.currentState === GAME_STATES.LEVEL_COMPLETE) {
    if (keyCode === SPACE) {
      advanceLevel(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentState = GAME_STATES.ANIMAL_SELECT;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, state: gameState.currentState },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function togglePause(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.noLoop();
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.loop();
  }
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentState = GAME_STATES.MENU;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.miniGamesCompletedThisLevel = 0;
  gameState.failedMiniGamesCount = 0;
  gameState.menuSelection = 0;
  gameState.animalSelection = 0;
  gameState.minigameSelection = 0;
  
  // Reinitialize
  const { createAnimals } = require('./animal.js');
  const { LEVEL_CONFIG } = require('./globals.js');
  gameState.animals = createAnimals(LEVEL_CONFIG[0]);
  
  p.logs.game_info.push({
    data: { action: 'restart', gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}

function startMiniGame(p) {
  const { createMiniGame } = require('./minigames.js');
  gameState.miniGameData = createMiniGame(gameState.selectedMinigame, gameState.currentLevel);
  gameState.currentState = GAME_STATES.MINIGAME_PLAYING;
  
  p.logs.game_info.push({
    data: { 
      state: gameState.currentState, 
      minigame: gameState.selectedMinigame,
      animal: gameState.selectedAnimal.type
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function checkLevelProgress(p) {
  const { LEVEL_CONFIG } = require('./globals.js');
  const config = LEVEL_CONFIG[gameState.currentLevel - 1];
  
  // Check if level complete
  const avgHappiness = gameState.animals.reduce((sum, a) => sum + a.happiness, 0) / gameState.animals.length;
  
  if (gameState.miniGamesCompletedThisLevel >= config.requiredCompletions &&
      avgHappiness >= config.happinessThreshold) {
    gameState.currentState = GAME_STATES.LEVEL_COMPLETE;
  } else {
    gameState.currentState = GAME_STATES.ANIMAL_SELECT;
  }
}

function advanceLevel(p) {
  if (gameState.currentLevel >= 5) {
    // Game won!
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.currentState = GAME_STATES.GAME_WIN;
    
    // Save high score
    gameState.highScores.push(gameState.score);
    gameState.highScores.sort((a, b) => b - a);
    gameState.highScores = gameState.highScores.slice(0, 10);
    
    p.noLoop();
  } else {
    gameState.currentLevel++;
    gameState.miniGamesCompletedThisLevel = 0;
    gameState.failedMiniGamesCount = 0;
    
    // Create new animals
    const { createAnimals } = require('./animal.js');
    const { LEVEL_CONFIG } = require('./globals.js');
    gameState.animals = createAnimals(LEVEL_CONFIG[gameState.currentLevel - 1]);
    
    gameState.currentState = GAME_STATES.ANIMAL_SELECT;
  }
  
  p.logs.game_info.push({
    data: { 
      action: 'level_advance',
      level: gameState.currentLevel,
      gamePhase: gameState.gamePhase
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}