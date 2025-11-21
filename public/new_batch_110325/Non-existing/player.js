// player.js - Player entity (conceptual for this narrative game)

export class Player {
  constructor() {
    this.endingsUnlocked = new Set();
    this.totalPlaythroughs = 0;
    this.currentPath = [];
    this.score = 0;
  }
  
  unlockEnding(endingId) {
    if (!this.endingsUnlocked.has(endingId)) {
      this.endingsUnlocked.add(endingId);
      // Award 100 points for each new ending discovered
      this.score += 100;
    }
  }
  
  addNodeVisitPoints() {
    // Award 10 points for visiting a new node
    this.score += 10;
  }
  
  hasUnlockedEnding(endingId) {
    return this.endingsUnlocked.has(endingId);
  }
  
  getProgress() {
    return this.endingsUnlocked.size;
  }
  
  getScore() {
    return this.score;
  }
  
  reset() {
    this.currentPath = [];
  }
}

export default Player;