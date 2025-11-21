// player.js - Player entity (conceptual for this narrative game)

export class Player {
  constructor() {
    this.endingsUnlocked = new Set();
    this.totalPlaythroughs = 0;
    this.currentPath = [];
  }
  
  unlockEnding(endingId) {
    this.endingsUnlocked.add(endingId);
  }
  
  hasUnlockedEnding(endingId) {
    return this.endingsUnlocked.has(endingId);
  }
  
  getProgress() {
    return this.endingsUnlocked.size;
  }
  
  reset() {
    this.currentPath = [];
  }
}

export default Player;