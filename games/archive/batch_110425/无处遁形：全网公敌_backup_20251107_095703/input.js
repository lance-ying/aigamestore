import { gameState, GAME_PHASES } from './globals.js';
import { handleDesktopInput } from './desktop.js';
import { handleBrowserInput } from './browser.js';
import { handleDatabaseInput } from './database.js';
import { handleEmailInput } from './email.js';
import { handleChatInput } from './chat.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p, apps) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global keys
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
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
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing state inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.openApp === null) {
      handleDesktopInput(p, apps);
    } else if (gameState.openApp === "browser") {
      handleBrowserInput(p, p.key, p.keyCode);
    } else if (gameState.openApp === "database") {
      handleDatabaseInput(p, p.key, p.keyCode);
    } else if (gameState.openApp === "email") {
      handleEmailInput(p, p.key, p.keyCode);
    } else if (gameState.openApp === "chat") {
      handleChatInput(p, p.keyCode);
    }
  }
}

export function handleAutomatedInput(p, apps) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = get_automated_testing_action(gameState);
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = action.key || String.fromCharCode(action.keyCode).toLowerCase();
  
  handleInput(p, apps);
}

export function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedAppIndex = 0;
  gameState.openApp = null;
  gameState.currentCase = 1;
  gameState.casesCompleted = 0;
  gameState.searchHistory = [];
  gameState.databaseEntries = [];
  gameState.crackedAccounts = [];
  gameState.chatMessages = [];
  gameState.objectivesCompleted = 0;
  gameState.passwordAttempts = 0;
  gameState.discoveredClues.clear();
  gameState.currentDialogueStep = 0;
  gameState.dialogueChoices = [];
  gameState.frameCount = 0;
  gameState.browserSearchInput = "";
  gameState.databaseQueryInput = "";
  gameState.passwordInput = "";
  gameState.selectedChoiceIndex = 0;
  gameState.score = 0;
}