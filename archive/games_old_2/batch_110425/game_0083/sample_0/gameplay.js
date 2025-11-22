// gameplay.js - Core gameplay logic

import { gameState, GAME_PHASE } from './globals.js';

export function updateGameplay(p) {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING) return;
  
  // Update player
  if (gameState.player) {
    updatePlayerMovement(p);
    gameState.player.update(p);
    
    // Track position for testing
    if (p.frameCount % 10 === 0) {
      gameState.positionHistory.push({
        x: gameState.player.x,
        y: gameState.player.y,
        frame: p.frameCount
      });
      
      // Keep history manageable
      if (gameState.positionHistory.length > 100) {
        gameState.positionHistory.shift();
      }
    }
  }
  
  // Update NPCs
  gameState.npcs.forEach(npc => npc.update(p));
  
  // Update puzzles
  gameState.interactables.forEach(item => item.update(p));
  
  // Check for interactions
  if (gameState.keysPressed[32] && p.frameCount - gameState.lastInteractionFrame > 30) { // SPACE
    handleInteraction(p);
    gameState.lastInteractionFrame = p.frameCount;
  }
  
  // Check win condition
  if (gameState.personalityMeter >= 100 && gameState.gamePhase === GAME_PHASE.PLAYING) {
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { message: "Win condition achieved", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updatePlayerMovement(p) {
  let dx = 0;
  let dy = 0;
  
  // Get movement from control mode
  if (gameState.controlMode === 'HUMAN') {
    // Arrow keys
    if (gameState.keysPressed[37]) dx -= 1; // LEFT
    if (gameState.keysPressed[39]) dx += 1; // RIGHT
    if (gameState.keysPressed[38]) dy -= 1; // UP
    if (gameState.keysPressed[40]) dy += 1; // DOWN
  } else {
    // Automated testing mode
    const action = window.get_automated_testing_action(gameState);
    if (action) {
      if (action.left) dx -= 1;
      if (action.right) dx += 1;
      if (action.up) dy -= 1;
      if (action.down) dy += 1;
      
      // Handle interactions
      if (action.interact && p.frameCount - gameState.lastInteractionFrame > 30) {
        handleInteraction(p);
        gameState.lastInteractionFrame = p.frameCount;
      }
      
      // Handle dialogue/puzzle confirmations
      if (action.confirm) {
        gameState.keysPressed[90] = true; // Z key
        setTimeout(() => { gameState.keysPressed[90] = false; }, 100);
      }
    }
  }
  
  // Apply movement with sprint
  const isSprinting = gameState.keysPressed[16]; // SHIFT
  if (dx !== 0 || dy !== 0) {
    gameState.player.move(dx, dy, isSprinting);
    
    // Record movement action
    if (p.frameCount % 60 === 0) { // Record every second
      recordMovementAction();
    }
  }
}

function handleInteraction(p) {
  if (!gameState.player) return;
  
  // Check for NPC interaction
  for (const npc of gameState.npcs) {
    if (npc.canInteract()) {
      const dialogue = npc.interact(p);
      gameState.activeDialogue = {
        speaker: npc.name,
        text: dialogue.text,
        choices: dialogue.choices || [],
        selectedChoice: 0
      };
      
      // Record interaction
      gameState.actionsRecorded++;
      gameState.actionHistory.push({
        type: 'npc_interaction',
        npc: npc.name,
        timestamp: Date.now()
      });
      gameState.personalityMeter = Math.min(100, gameState.actionsRecorded * 2.5);
      
      return;
    }
  }
  
  // Check for puzzle interaction
  for (const item of gameState.interactables) {
    if (item.canInteract && item.canInteract() && !item.solved) {
      item.activate();
      
      // Record interaction
      gameState.actionsRecorded++;
      gameState.actionHistory.push({
        type: 'puzzle_interaction',
        puzzleId: item.id,
        timestamp: Date.now()
      });
      
      return;
    }
  }
}

function recordMovementAction() {
  gameState.actionsRecorded++;
  gameState.actionHistory.push({
    type: 'movement',
    timestamp: Date.now()
  });
  gameState.personalityMeter = Math.min(100, gameState.actionsRecorded * 2.5);
}

export function checkPuzzleSolved(puzzleId) {
  const puzzle = gameState.interactables.find(i => i.id === puzzleId);
  if (puzzle && puzzle.solved && !gameState.puzzlesSolved.includes(puzzleId)) {
    gameState.puzzlesSolved.push(puzzleId);
    gameState.actionsRecorded += 5; // Bonus for solving puzzle
    gameState.actionHistory.push({
      type: 'puzzle_solved',
      puzzleId,
      timestamp: Date.now()
    });
    gameState.personalityMeter = Math.min(100, gameState.actionsRecorded * 2.5);
  }
}