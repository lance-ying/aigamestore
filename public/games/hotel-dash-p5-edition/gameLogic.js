import { gameState, GAME_PHASES, SELECTION_STATES, GUEST_NEEDS, ROOM_STATES } from './globals.js';
import { FloatingText } from './entities.js';

export class GameLogic {
  constructor(p, levelManager) {
    this.p = p;
    this.levelManager = levelManager;
  }

  handleSelection() {
    if (gameState.selectables.length === 0) return;
    
    const selected = gameState.selectables[gameState.cursorIndex];
    if (!selected) return;
    
    if (gameState.selectionState === SELECTION_STATES.NEUTRAL) {
      // Select a guest or staff member
      if (selected.need !== undefined) {
        // It's a guest
        if (selected.waiting && !selected.beingServed) {
          gameState.selectedEntity = selected;
          gameState.selectionState = SELECTION_STATES.GUEST_SELECTED;
        }
      } else if (selected.name === "Monica" && !selected.busy) {
        // Select Monica for cleaning
        gameState.selectedEntity = selected;
        gameState.selectionState = SELECTION_STATES.STAFF_SELECTED;
      }
    } else if (gameState.selectionState === SELECTION_STATES.GUEST_SELECTED) {
      // Assign guest to service
      const guest = gameState.selectedEntity;
      
      if (guest.need === GUEST_NEEDS.CHECKIN) {
        // Check in to a room
        if (selected.id !== undefined && selected.state === ROOM_STATES.EMPTY) {
          this.checkInGuest(guest, selected);
          gameState.selectedEntity = null;
          gameState.selectionState = SELECTION_STATES.NEUTRAL;
        }
      } else if (guest.need === GUEST_NEEDS.FOOD) {
        // Serve food from kitchen
        if (selected === gameState.kitchen && gameState.kitchen.canCook()) {
          this.serveFood(guest);
          gameState.selectedEntity = null;
          gameState.selectionState = SELECTION_STATES.NEUTRAL;
        }
      }
    } else if (gameState.selectionState === SELECTION_STATES.STAFF_SELECTED) {
      // Assign staff to task
      if (gameState.selectedEntity.name === "Monica") {
        // Clean a dirty room
        if (selected.id !== undefined && selected.state === ROOM_STATES.DIRTY) {
          this.cleanRoom(gameState.selectedEntity, selected);
          gameState.selectedEntity = null;
          gameState.selectionState = SELECTION_STATES.NEUTRAL;
        }
      }
    }
  }

  handleCancel() {
    gameState.selectedEntity = null;
    gameState.selectionState = SELECTION_STATES.NEUTRAL;
  }

  checkInGuest(guest, room) {
    const levelData = this.levelManager.getCurrentLevelData();
    const duration = levelData.serviceTimes.checkin;
    
    guest.startService(duration);
    guest.assignedRoom = room;
    room.state = ROOM_STATES.OCCUPIED;
    room.guest = guest;
  }

  serveFood(guest) {
    const levelData = this.levelManager.getCurrentLevelData();
    const duration = levelData.serviceTimes.cook;
    
    guest.startService(duration);
    gameState.kitchen.startCooking(guest);
  }

  cleanRoom(monica, room) {
    const levelData = this.levelManager.getCurrentLevelData();
    const duration = levelData.serviceTimes.clean;
    
    monica.startTask(duration, room);
    room.state = ROOM_STATES.CLEANING;
  }
}