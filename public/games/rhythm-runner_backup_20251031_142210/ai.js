import { gameState, HIT_ZONE_X } from './globals.js';

export class AIController {
  constructor(p) {
    this.p = p;
    this.actionQueue = [];
  }

  update() {
    if (gameState.controlMode === 'HUMAN') return null;
    
    if (gameState.controlMode === 'TEST_1') {
      return this.basicTest();
    } else if (gameState.controlMode === 'TEST_2') {
      return this.winTest();
    }
    
    return null;
  }

  basicTest() {
    const actions = [];
    
    // Find notes near hit zone
    for (let note of gameState.notes) {
      if (note.active && !note.hit && !note.missed) {
        const distance = Math.abs(note.x - HIT_ZONE_X);
        if (distance < 30) {
          // Switch to correct lane
          if (gameState.currentLane !== note.lane) {
            actions.push({ type: 'switchLane', lane: note.lane });
          }
          // Hit the note
          actions.push({ type: 'hit', lane: note.lane });
        }
      }
    }
    
    return actions;
  }

  winTest() {
    const actions = [];
    
    // Perfect timing hits
    for (let note of gameState.notes) {
      if (note.active && !note.hit && !note.missed) {
        const distance = Math.abs(note.x - HIT_ZONE_X);
        if (distance < 15) { // Perfect timing
          if (gameState.currentLane !== note.lane) {
            actions.push({ type: 'switchLane', lane: note.lane });
          }
          actions.push({ type: 'hit', lane: note.lane });
        }
      }
    }
    
    // Use special when available
    if (gameState.specialMeter >= 100) {
      actions.push({ type: 'special' });
    }
    
    return actions;
  }

  executeActions(actions, inputHandler) {
    if (!actions) return;
    
    for (let action of actions) {
      if (action.type === 'switchLane') {
        gameState.currentLane = action.lane;
      } else if (action.type === 'hit') {
        inputHandler.handleNoteHit(action.lane);
      } else if (action.type === 'special') {
        inputHandler.activateSpecial();
      }
    }
  }
}