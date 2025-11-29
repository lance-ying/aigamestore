// input.js - Input handling
import { gameState, GAME_PHASES, PLAY_PHASES, GENRES, THEMES } from './globals.js';
import { resetCurrentProgram } from './program.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER - Start game
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.playPhase = PLAY_PHASES.SELECT_GENRE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 82) { // R - Restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Game-specific controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  switch (gameState.playPhase) {
    case PLAY_PHASES.SELECT_GENRE:
      handleGenreInput(p, keyCode);
      break;
    case PLAY_PHASES.SELECT_THEME:
      handleThemeInput(p, keyCode);
      break;
    case PLAY_PHASES.SELECT_TALENT:
      handleTalentInput(p, keyCode);
      break;
    case PLAY_PHASES.DESIGN_STUDIO:
      handleStudioInput(p, keyCode);
      break;
    case PLAY_PHASES.RESULTS:
      handleResultsInput(p, keyCode);
      break;
  }
}

function handleGenreInput(p, keyCode) {
  const unlockedGenres = GENRES.filter(g => g.unlocked);
  
  if (keyCode === 38) { // UP
    gameState.selectedGenreIndex = Math.max(0, gameState.selectedGenreIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedGenreIndex = Math.min(unlockedGenres.length - 1, gameState.selectedGenreIndex + 1);
  } else if (keyCode === 32) { // SPACE - Select
    if (unlockedGenres.length > 0) {
      gameState.currentProgram.genre = unlockedGenres[gameState.selectedGenreIndex].id;
      gameState.playPhase = PLAY_PHASES.SELECT_THEME;
      gameState.selectedThemeIndex = 0;
    }
  } else if (keyCode === 16) { // SHIFT - Skip to talent
    if (gameState.currentProgram.genre) {
      gameState.playPhase = PLAY_PHASES.SELECT_TALENT;
    }
  }
}

function handleThemeInput(p, keyCode) {
  const unlockedThemes = THEMES.filter(t => t.unlocked);
  
  if (keyCode === 38) { // UP
    gameState.selectedThemeIndex = Math.max(0, gameState.selectedThemeIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedThemeIndex = Math.min(unlockedThemes.length - 1, gameState.selectedThemeIndex + 1);
  } else if (keyCode === 32) { // SPACE - Select
    if (unlockedThemes.length > 0) {
      gameState.currentProgram.theme = unlockedThemes[gameState.selectedThemeIndex].id;
      gameState.playPhase = PLAY_PHASES.SELECT_TALENT;
      gameState.selectedTalentIndex = 0;
    }
  } else if (keyCode === 90) { // Z - Back
    gameState.playPhase = PLAY_PHASES.SELECT_GENRE;
  } else if (keyCode === 16) { // SHIFT - Skip to talent
    if (gameState.currentProgram.theme) {
      gameState.playPhase = PLAY_PHASES.SELECT_TALENT;
    }
  }
}

function handleTalentInput(p, keyCode) {
  const availableTalent = gameState.availableTalent.filter(t => !t.hired);
  
  if (keyCode === 38) { // UP
    gameState.selectedTalentIndex = Math.max(0, gameState.selectedTalentIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedTalentIndex = Math.min(availableTalent.length - 1, gameState.selectedTalentIndex + 1);
  } else if (keyCode === 32) { // SPACE - Hire
    if (availableTalent.length > 0) {
      const talent = availableTalent[gameState.selectedTalentIndex];
      if (!gameState.currentProgram.host) {
        gameState.currentProgram.host = talent;
        talent.hired = true;
      } else if (gameState.currentProgram.guests.length < 3) {
        gameState.currentProgram.guests.push(talent);
        talent.hired = true;
      }
    }
  } else if (keyCode === 90) { // Z - Remove last
    if (gameState.currentProgram.guests.length > 0) {
      const removed = gameState.currentProgram.guests.pop();
      removed.hired = false;
    } else if (gameState.currentProgram.host) {
      gameState.currentProgram.host.hired = false;
      gameState.currentProgram.host = null;
    }
  } else if (keyCode === 16) { // SHIFT - Go to studio design
    if (gameState.currentProgram.host) {
      gameState.playPhase = PLAY_PHASES.DESIGN_STUDIO;
      gameState.cursorX = 0;
      gameState.cursorY = 0;
    }
  }
}

function handleStudioInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(7, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(5, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE - Place/Remove
    const currentCell = gameState.studioGrid[gameState.cursorY][gameState.cursorX];
    if (currentCell === null) {
      // Place selected set piece
      const unlockedPieces = gameState.SET_PIECES?.filter(s => s.unlocked) || [];
      if (unlockedPieces.length > 0 && gameState.selectedSetPieceIndex < unlockedPieces.length) {
        const piece = unlockedPieces[gameState.selectedSetPieceIndex];
        gameState.studioGrid[gameState.cursorY][gameState.cursorX] = piece.id;
        gameState.currentProgram.setPieces.push(piece.id);
      }
    } else {
      // Remove piece
      gameState.studioGrid[gameState.cursorY][gameState.cursorX] = null;
      const index = gameState.currentProgram.setPieces.indexOf(currentCell);
      if (index > -1) {
        gameState.currentProgram.setPieces.splice(index, 1);
      }
    }
  } else if (keyCode === 37 || keyCode === 39) { // Arrows for set piece selection
    if (keyCode === 37) {
      gameState.selectedSetPieceIndex = Math.max(0, gameState.selectedSetPieceIndex - 1);
    } else {
      const unlockedPieces = gameState.SET_PIECES?.filter(s => s.unlocked) || [];
      gameState.selectedSetPieceIndex = Math.min(unlockedPieces.length - 1, gameState.selectedSetPieceIndex + 1);
    }
  } else if (keyCode === 16) { // SHIFT - Start production
    if (gameState.currentProgram.host) {
      gameState.playPhase = PLAY_PHASES.PRODUCING;
      gameState.productionTimer = 0;
    }
  }
}

function handleResultsInput(p, keyCode) {
  if (keyCode === 32) { // SPACE - Continue
    resetCurrentProgram();
    gameState.playPhase = PLAY_PHASES.SELECT_GENRE;
    gameState.selectedGenreIndex = 0;
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  // Only process automated input in PLAYING phase
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  // Get action from automated controller
  const action = window.get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    handleKeyPressed(p, action.keyCode);
  }
}