import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

export class TestController {
  constructor(p) {
    this.p = p;
    this.actionTimer = 0;
    this.actionInterval = 500;
    this.testPhase = 0;
  }

  update(deltaTime) {
    if (gameState.controlMode === CONTROL_MODES.HUMAN) return null;
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
    
    this.actionTimer += deltaTime;
    
    if (this.actionTimer >= this.actionInterval) {
      this.actionTimer = 0;
      return this.getNextAction();
    }
    
    return null;
  }

  getNextAction() {
    if (gameState.controlMode === CONTROL_MODES.TEST_1) {
      return this.getBasicTestAction();
    } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
      return this.getWinTestAction();
    }
    
    return null;
  }

  getBasicTestAction() {
    // Simple test: navigate and select randomly
    const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'SELECT'];
    return actions[Math.floor(this.p.random(actions.length))];
  }

  getWinTestAction() {
    // Intelligent test to try to win
    const current = gameState.selectables[gameState.cursorIndex];
    
    // If no selection, try to find and select a waiting guest
    if (!gameState.selectedEntity) {
      const waitingGuests = gameState.guests.filter(g => g.waiting && !g.beingServed);
      
      if (waitingGuests.length > 0) {
        const targetGuest = waitingGuests[0];
        const idx = gameState.selectables.indexOf(targetGuest);
        
        if (idx !== -1) {
          if (gameState.cursorIndex === idx) {
            return 'SELECT';
          } else {
            // Navigate towards guest
            if (idx > gameState.cursorIndex) {
              return 'DOWN';
            } else {
              return 'UP';
            }
          }
        }
      }
    } else {
      // Guest selected, find appropriate service
      const guest = gameState.selectedEntity;
      
      if (guest.need === 'CHECKIN') {
        // Find empty room
        const emptyRoom = gameState.rooms.find(r => r.state === 'EMPTY');
        if (emptyRoom) {
          const idx = gameState.selectables.indexOf(emptyRoom);
          if (gameState.cursorIndex === idx) {
            return 'SELECT';
          } else {
            return idx > gameState.cursorIndex ? 'RIGHT' : 'LEFT';
          }
        }
      } else if (guest.need === 'FOOD') {
        // Select kitchen
        const idx = gameState.selectables.indexOf(gameState.kitchen);
        if (gameState.cursorIndex === idx) {
          return 'SELECT';
        } else {
          return 'UP';
        }
      }
    }
    
    // Default: navigate
    return ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(this.p.random(4))];
  }
}