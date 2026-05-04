// puzzle_manager.js
import { gameState, CHAPTER_1_PUZZLES, CHAPTER_2_PUZZLES, TIMELINE_PAST, TIMELINE_FUTURE } from './globals.js';

export class PuzzleManager {
  constructor() {
    this.currentPuzzles = { past: [], future: [] };
    this.initializeChapter(1);
  }

  initializeChapter(chapterNum) {
    if (chapterNum === 1) {
      this.currentPuzzles.past = JSON.parse(JSON.stringify(CHAPTER_1_PUZZLES.past));
      this.currentPuzzles.future = JSON.parse(JSON.stringify(CHAPTER_1_PUZZLES.future));
    } else if (chapterNum === 2) {
      this.currentPuzzles.past = JSON.parse(JSON.stringify(CHAPTER_2_PUZZLES.past));
      this.currentPuzzles.future = JSON.parse(JSON.stringify(CHAPTER_2_PUZZLES.future));
    }
    
    // Reset puzzle states
    gameState.puzzleStates = { past: {}, future: {} };
  }

  getCurrentObjects(timeline) {
    return this.currentPuzzles[timeline.toLowerCase()] || [];
  }

  getObjectById(id, timeline) {
    const objects = this.getCurrentObjects(timeline);
    return objects.find(obj => obj.id === id);
  }

  examineObject(obj, timeline) {
    if (!obj || obj.examined) return null;
    
    obj.examined = true;
    
    if (obj.clue) {
      return obj.clue;
    }
    
    return `Examined ${obj.name}`;
  }

  collectItem(obj, timeline) {
    if (!obj || obj.collected || !this.canCollect(obj)) return false;
    
    obj.collected = true;
    gameState.inventory.push({
      id: obj.id,
      name: obj.name,
      timeline: timeline
    });
    
    gameState.score += 10;
    return true;
  }

  canCollect(obj) {
    return obj.id === "key" || obj.id === "book";
  }

  useItem(itemId, targetObj, timeline) {
    if (!targetObj) return { success: false, message: "No target" };
    
    // Chapter 1: Use key on box
    if (itemId === "key" && targetObj.id === "box" && timeline === TIMELINE_PAST) {
      if (!targetObj.unlocked) {
        targetObj.unlocked = true;
        gameState.score += 20;
        return { success: true, message: "Box unlocked!" };
      }
    }
    
    // Chapter 2: Use seasons on dial
    if (targetObj.id === "dial" && timeline === TIMELINE_PAST) {
      if (!targetObj.solved) {
        targetObj.solved = true;
        gameState.score += 30;
        return { success: true, message: "Dial solved!" };
      }
    }
    
    return { success: false, message: "Cannot use item here" };
  }

  interactWithObject(obj, timeline) {
    if (!obj) return { success: false, message: "Nothing to interact with" };
    
    // Chapter 1 interactions
    if (gameState.currentChapter === 1) {
      if (obj.id === "console" && timeline === TIMELINE_FUTURE) {
        if (!obj.activated) {
          obj.activated = true;
          // Activate power in future
          const door = this.getObjectById("door", TIMELINE_FUTURE);
          if (door) door.opened = true;
          gameState.score += 30;
          return { success: true, message: "Console activated! Security door opened." };
        }
      }
      
      if (obj.id === "box" && timeline === TIMELINE_PAST) {
        if (obj.unlocked && !obj.collected) {
          obj.collected = true;
          gameState.score += 20;
          return { success: true, message: "Found artifact in box!" };
        }
      }
    }
    
    // Chapter 2 interactions
    if (gameState.currentChapter === 2) {
      if (obj.id === "chest" && timeline === TIMELINE_PAST) {
        const dial = this.getObjectById("dial", TIMELINE_PAST);
        if (dial && dial.solved && !obj.opened) {
          obj.opened = true;
          gameState.score += 40;
          return { success: true, message: "Chest opened! Found temporal artifact." };
        }
      }
      
      if (obj.id === "portal" && timeline === TIMELINE_FUTURE) {
        const chest = this.getObjectById("chest", TIMELINE_PAST);
        if (chest && chest.opened && !obj.activated) {
          obj.activated = true;
          gameState.score += 50;
          return { success: true, message: "Portal activated!" };
        }
      }
    }
    
    return { success: false, message: "Cannot interact yet" };
  }

  checkChapterComplete() {
    if (gameState.currentChapter === 1) {
      const box = this.getObjectById("box", TIMELINE_PAST);
      const door = this.getObjectById("door", TIMELINE_FUTURE);
      
      if (box && box.unlocked && door && door.opened) {
        return true;
      }
    }
    
    if (gameState.currentChapter === 2) {
      const chest = this.getObjectById("chest", TIMELINE_PAST);
      const portal = this.getObjectById("portal", TIMELINE_FUTURE);
      
      if (chest && chest.opened && portal && portal.activated) {
        return true;
      }
    }
    
    return false;
  }

  advanceChapter() {
    gameState.chaptersCompleted++;
    
    if (gameState.currentChapter < 2) {
      gameState.currentChapter++;
      this.initializeChapter(gameState.currentChapter);
      gameState.selectedObjectIndex = 0;
      gameState.inventory = [];
      return false; // Not finished yet
    }
    
    return true; // Game complete
  }
}