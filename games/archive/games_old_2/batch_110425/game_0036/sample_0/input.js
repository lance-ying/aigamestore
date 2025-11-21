// input.js
import { gameState, GAME_PHASES, BATTLE_PHASES } from './globals.js';
import { initializeBattle, getAvailableActions, getValidTargets, executeAction, processEnemyTurn, checkBattleEnd } from './battle.js';
import { openTransmutationMenu, closeTransmutationMenu, addItemToKiln, startTransmutation } from './transmutation.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Transmutation menu toggle
  if (keyCode === 16) { // SHIFT
    if (gameState.transmutationMenu) {
      closeTransmutationMenu();
    } else {
      openTransmutationMenu();
    }
    return;
  }
  
  if (gameState.transmutationMenu) {
    handleTransmutationInput(keyCode);
    return;
  }
  
  // Battle input
  if (gameState.battlePhase === BATTLE_PHASES.EXECUTING || 
      gameState.battlePhase === BATTLE_PHASES.ENEMY_TURN ||
      gameState.currentAnimation) {
    return;
  }
  
  if (gameState.battlePhase === BATTLE_PHASES.SELECT_CHARACTER) {
    if (keyCode === 38) { // UP
      gameState.selectedCharacterIndex = Math.max(0, gameState.selectedCharacterIndex - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedCharacterIndex = Math.min(gameState.party.length - 1, gameState.selectedCharacterIndex + 1);
    } else if (keyCode === 32) { // SPACE
      const character = gameState.party[gameState.selectedCharacterIndex];
      if (character.isAlive() && !character.actionTaken) {
        gameState.battlePhase = BATTLE_PHASES.SELECT_ACTION;
        gameState.selectedActionIndex = 0;
      }
    }
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_ACTION) {
    const character = gameState.party[gameState.selectedCharacterIndex];
    const actions = getAvailableActions(character);
    
    if (keyCode === 38) { // UP
      gameState.selectedActionIndex = Math.max(0, gameState.selectedActionIndex - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedActionIndex = Math.min(actions.length - 1, gameState.selectedActionIndex + 1);
    } else if (keyCode === 32) { // SPACE
      gameState.battlePhase = BATTLE_PHASES.SELECT_TARGET;
      gameState.selectedTargetIndex = 0;
    } else if (keyCode === 90) { // Z
      gameState.battlePhase = BATTLE_PHASES.SELECT_CHARACTER;
    }
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_TARGET) {
    const character = gameState.party[gameState.selectedCharacterIndex];
    const actions = getAvailableActions(character);
    const action = actions[gameState.selectedActionIndex];
    const targets = getValidTargets(action);
    
    if (keyCode === 38) { // UP
      gameState.selectedTargetIndex = Math.max(0, gameState.selectedTargetIndex - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedTargetIndex = Math.min(targets.length - 1, gameState.selectedTargetIndex + 1);
    } else if (keyCode === 32) { // SPACE
      const target = targets[gameState.selectedTargetIndex];
      executeAction(character, action, target);
      character.actionTaken = true;
      
      // Check if all party members acted
      const allActed = gameState.party.every(p => !p.isAlive() || p.actionTaken);
      
      if (allActed || checkBattleEnd()) {
        // Reset actions and move to enemy turn
        gameState.party.forEach(p => p.actionTaken = false);
        setTimeout(() => {
          if (!checkBattleEnd()) {
            gameState.battlePhase = BATTLE_PHASES.ENEMY_TURN;
            processEnemyTurnSequence();
          }
        }, 600);
      } else {
        gameState.battlePhase = BATTLE_PHASES.SELECT_CHARACTER;
      }
    } else if (keyCode === 90) { // Z
      gameState.battlePhase = BATTLE_PHASES.SELECT_ACTION;
    }
  }
}

function processEnemyTurnSequence() {
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
  
  let enemyIndex = 0;
  const processNextEnemy = () => {
    if (enemyIndex < aliveEnemies.length && !checkBattleEnd()) {
      processEnemyTurn();
      enemyIndex++;
      setTimeout(processNextEnemy, 800);
    } else {
      gameState.battlePhase = BATTLE_PHASES.SELECT_CHARACTER;
    }
  };
  
  processNextEnemy();
}

function handleTransmutationInput(keyCode) {
  if (keyCode === 90) { // Z to close
    closeTransmutationMenu();
  } else if (keyCode === 32 && gameState.kilnItems.length === 2) { // SPACE to transmute
    startTransmutation();
  } else if (keyCode >= 49 && keyCode <= 57) { // 1-9 to add items
    const itemIndex = keyCode - 49;
    addItemToKiln(itemIndex);
  }
}

function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentFloor = 1;
  gameState.score = 0;
  gameState.battlesWon = 0;
  gameState.totalDamageDealt = 0;
  gameState.inventory = [];
  gameState.transmutationMenu = false;
  gameState.kilnItems = [];
  gameState.enemies = [];
  gameState.entities = [];
  
  // Don't reset party, just restore HP/MP
  gameState.party.forEach(member => {
    member.hp = member.maxHp;
    member.mp = member.maxMp;
  });
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleKeyPressed(p, action.key, action.keyCode);
    }
  }
}