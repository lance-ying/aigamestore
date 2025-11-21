import { LEVELS } from './levels.js';
import { gameState, GAME_PHASES, GUEST_NEEDS, ROOM_STATES } from './globals.js';
import { Guest, Room, Kitchen, Reception, Staff } from './entities.js';

export class LevelManager {
  constructor(p) {
    this.p = p;
    this.currentLevelData = null;
  }

  loadLevel(levelNum) {
    if (levelNum < 1 || levelNum > LEVELS.length) return false;
    
    this.currentLevelData = LEVELS[levelNum - 1];
    gameState.currentLevel = levelNum;
    
    // Clear existing entities
    gameState.guests = [];
    gameState.rooms = [];
    gameState.selectables = [];
    gameState.floatingTexts = [];
    
    // Reset game state
    gameState.score = 0;
    gameState.dissatisfiedCount = 0;
    gameState.satisfiedCount = 0;
    gameState.levelTimer = 0;
    gameState.guestSpawnTimer = 0;
    gameState.cursorIndex = 0;
    gameState.selectedEntity = null;
    gameState.selectionState = "NEUTRAL";
    
    // Set level parameters
    gameState.levelTimeLimit = this.currentLevelData.timeLimit;
    gameState.maxDissatisfied = this.currentLevelData.maxDissatisfied;
    gameState.targetCoins = this.currentLevelData.targetCoins;
    gameState.guestSpawnInterval = this.currentLevelData.guestArrivalInterval[0];
    
    // Create hotel layout
    this.createHotelLayout();
    
    return true;
  }

  createHotelLayout() {
    const p = this.p;
    const roomCount = this.currentLevelData.rooms;
    
    // Create Reception
    gameState.reception = new Reception(p, 30, 50, 80, 50);
    gameState.selectables.push(gameState.reception);
    
    // Create Kitchen
    gameState.kitchen = new Kitchen(p, 30, 130, 80, 60, this.currentLevelData.kitchenStoves);
    gameState.selectables.push(gameState.kitchen);
    
    // Create Rooms in a grid
    const roomWidth = 70;
    const roomHeight = 55;
    const startX = 150;
    const startY = 50;
    const cols = 4;
    const spacingX = 85;
    const spacingY = 70;
    
    for (let i = 0; i < roomCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      
      const room = new Room(p, x, y, roomWidth, roomHeight, i + 1);
      gameState.rooms.push(room);
      gameState.selectables.push(room);
    }
    
    // Create Staff
    gameState.staff.ted = new Staff(p, 70, 290, "Ted", "👨‍🍳");
    gameState.selectables.push(gameState.staff.ted);
    
    gameState.staff.monica = new Staff(p, 150, 290, "Monica", "👩‍💼");
    gameState.selectables.push(gameState.staff.monica);
  }

  update(deltaTime) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Update timer
    gameState.levelTimer += deltaTime;
    
    // Check time limit
    if (gameState.levelTimer >= gameState.levelTimeLimit) {
      this.checkLevelCompletion();
      return;
    }
    
    // Spawn guests
    gameState.guestSpawnTimer += deltaTime;
    if (gameState.guestSpawnTimer >= gameState.guestSpawnInterval) {
      this.spawnGuest();
      gameState.guestSpawnTimer = 0;
      
      // Randomize next spawn interval
      const min = this.currentLevelData.guestArrivalInterval[0];
      const max = this.currentLevelData.guestArrivalInterval[1];
      gameState.guestSpawnInterval = this.p.random(min, max);
    }
    
    // Update guests
    for (let i = gameState.guests.length - 1; i >= 0; i--) {
      const guest = gameState.guests[i];
      const result = guest.update(deltaTime);
      
      if (result === 'dissatisfied') {
        this.handleDissatisfiedGuest(guest);
        gameState.guests.splice(i, 1);
        const idx = gameState.selectables.indexOf(guest);
        if (idx !== -1) gameState.selectables.splice(idx, 1);
      } else if (result === 'satisfied') {
        this.handleSatisfiedGuest(guest);
        gameState.guests.splice(i, 1);
        const idx = gameState.selectables.indexOf(guest);
        if (idx !== -1) gameState.selectables.splice(idx, 1);
      }
    }
    
    // Update rooms
    gameState.rooms.forEach(room => room.update(deltaTime));
    
    // Update kitchen
    gameState.kitchen.update(deltaTime);
    
    // Update staff
    gameState.staff.ted.update(deltaTime);
    gameState.staff.monica.update(deltaTime);
    
    // Update floating texts
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
      if (gameState.floatingTexts[i].update(deltaTime)) {
        gameState.floatingTexts.splice(i, 1);
      }
    }
    
    // Check cursor bounds
    if (gameState.cursorIndex >= gameState.selectables.length) {
      gameState.cursorIndex = Math.max(0, gameState.selectables.length - 1);
    }
  }

  spawnGuest() {
    const p = this.p;
    const needs = this.currentLevelData.guestNeeds;
    const randomNeed = needs[Math.floor(p.random(needs.length))];
    
    const guest = new Guest(
      p, 
      70, 
      50 + gameState.guests.length * 15,
      randomNeed,
      this.currentLevelData.guestPatience
    );
    
    gameState.guests.push(guest);
    gameState.selectables.push(guest);
  }

  handleDissatisfiedGuest(guest) {
    gameState.dissatisfiedCount++;
    
    // Add floating text
    const FloatingText = require('./entities.js').FloatingText;
    gameState.floatingTexts.push(
      new FloatingText(this.p, guest.x, guest.y, '-50', [255, 100, 100])
    );
    
    // Clean up if guest was assigned to a room
    if (guest.assignedRoom) {
      guest.assignedRoom.state = ROOM_STATES.DIRTY;
      guest.assignedRoom.guest = null;
    }
    
    // Check lose condition
    if (gameState.dissatisfiedCount > gameState.maxDissatisfied) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      this.p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", reason: "Too many dissatisfied guests" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  handleSatisfiedGuest(guest) {
    gameState.satisfiedCount++;
    
    // Calculate score based on patience remaining
    let scoreGain = 0;
    
    if (guest.need === GUEST_NEEDS.CHECKIN) {
      scoreGain = 50;
    } else if (guest.need === GUEST_NEEDS.FOOD) {
      scoreGain = 30;
    } else if (guest.need === GUEST_NEEDS.CLEANING) {
      scoreGain = 20;
    }
    
    // Bonus for fast service
    const patiencePercent = guest.patience / guest.maxPatience;
    if (patiencePercent > 0.75) {
      scoreGain += 10;
    }
    
    // Satisfaction bonus
    scoreGain += 20;
    
    gameState.score += scoreGain;
    
    // Add floating text
    const FloatingText = require('./entities.js').FloatingText;
    gameState.floatingTexts.push(
      new FloatingText(this.p, guest.x, guest.y, `+${scoreGain}`, [100, 255, 100])
    );
    
    // Clean up assigned room
    if (guest.assignedRoom) {
      guest.assignedRoom.state = ROOM_STATES.DIRTY;
      guest.assignedRoom.guest = null;
    }
  }

  checkLevelCompletion() {
    if (gameState.score >= gameState.targetCoins && 
        gameState.dissatisfiedCount <= gameState.maxDissatisfied) {
      
      if (gameState.currentLevel >= LEVELS.length) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        this.p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", level: gameState.currentLevel },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
        this.p.logs.game_info.push({
          data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      this.p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", reason: "Time up, target not met" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  getCurrentLevelData() {
    return this.currentLevelData;
  }
}