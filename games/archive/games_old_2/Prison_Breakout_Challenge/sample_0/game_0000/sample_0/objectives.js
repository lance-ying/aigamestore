// objectives.js - Interactive objectives
import { gameState } from './globals.js';

export class Objective {
  constructor(type, x, y, data = {}) {
    this.type = type; // "KEY", "DOOR", "SWITCH", "EXIT"
    this.x = x;
    this.y = y;
    this.completed = false;
    this.active = data.active !== undefined ? data.active : true;
    this.data = data;
    this.glowPhase = 0;
  }

  interact() {
    if (this.completed || !this.active) return false;

    if (this.type === "KEY") {
      this.completed = true;
      gameState.keysCollected++;
      gameState.score += 100;
      gameState.objectivesCompleted++;
      return true;
    } else if (this.type === "DOOR") {
      if (gameState.keysCollected >= (this.data.requiredKeys || 1)) {
        this.completed = true;
        gameState.score += 200;
        gameState.objectivesCompleted++;
        return true;
      }
    } else if (this.type === "SWITCH") {
      this.completed = true;
      gameState.score += 50;
      gameState.objectivesCompleted++;
      return true;
    } else if (this.type === "EXIT") {
      if (gameState.objectivesCompleted >= gameState.totalObjectives) {
        return true;
      }
    }
    return false;
  }

  update(p) {
    this.glowPhase = (this.glowPhase + 0.05) % (Math.PI * 2);
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    if (this.completed && this.type !== "DOOR" && this.type !== "EXIT") return;

    p.push();
    
    if (this.type === "KEY") {
      const glow = Math.sin(this.glowPhase) * 30 + 225;
      p.fill(glow, glow, 0);
      p.noStroke();
      p.ellipse(screenX, this.y, 20, 20);
      p.fill(255, 255, 0);
      p.ellipse(screenX, this.y, 15, 15);
      p.fill(glow, glow, 0);
      p.rect(screenX - 3, this.y, 6, 10);
      p.rect(screenX + 3, this.y + 5, 4, 3);
    } else if (this.type === "DOOR") {
      if (this.completed) {
        p.fill(50, 200, 50);
      } else {
        p.fill(139, 69, 19);
      }
      p.rect(screenX - 40, this.y - 50, 80, 100);
      p.fill(0);
      p.ellipse(screenX - 20, this.y, 5, 5);
      
      if (!this.completed) {
        p.fill(255, 0, 0);
        p.textAlign(p.CENTER);
        p.textSize(10);
        p.text("LOCKED", screenX, this.y - 60);
      } else {
        p.fill(0, 255, 0);
        p.textAlign(p.CENTER);
        p.textSize(10);
        p.text("OPEN", screenX, this.y - 60);
      }
    } else if (this.type === "SWITCH") {
      p.fill(this.completed ? 255 : 50, this.completed ? 0 : 255, 0);
      p.rect(screenX - 15, this.y - 15, 30, 30);
      p.fill(0);
      p.rect(screenX - 10, this.y - 10, 20, 20);
      p.fill(this.completed ? 255 : 50, this.completed ? 0 : 255, 0);
      p.ellipse(screenX, this.y, 8, 8);
    } else if (this.type === "EXIT") {
      const canExit = gameState.objectivesCompleted >= gameState.totalObjectives;
      if (canExit) {
        const glow = Math.sin(this.glowPhase) * 50 + 200;
        p.fill(0, glow, 0);
      } else {
        p.fill(100, 100, 100);
      }
      p.rect(screenX - 40, this.y - 60, 80, 120);
      p.fill(255);
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("EXIT", screenX, this.y - 70);
      if (canExit) {
        p.fill(0, 255, 0);
        p.textSize(10);
        p.text("READY!", screenX, this.y);
      }
    }
    
    p.pop();
  }
}