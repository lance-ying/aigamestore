// animatronic.js - Animatronic entity class

import { gameState } from './globals.js';

export class Animatronic {
  constructor(type, difficulty) {
    this.type = type;
    this.difficulty = difficulty; // 0-20
    this.position = 0; // 0 = far away, 100 = at door/vent
    this.moveTimer = 0;
    this.moveInterval = this.calculateMoveInterval();
    this.active = true;
    this.atEntryPoint = false;
    this.attackTimer = 0;
    this.color = this.getColorByType();
    this.name = this.getNameByType();
  }
  
  getNameByType() {
    const names = {
      DOOR_LEFT: "Freddy",
      DOOR_RIGHT: "Bonnie",
      VENT_LEFT: "Chica",
      VENT_RIGHT: "Foxy",
      HOSE_LEFT: "Balloon Boy",
      HOSE_RIGHT: "Mangle",
      MUSIC_BOX: "Puppet",
      CAMERA_LEFT: "Golden F.",
      CAMERA_RIGHT: "Springtrap"
    };
    return names[this.type] || "Unknown";
  }
  
  getColorByType() {
    const colors = {
      DOOR_LEFT: [139, 69, 19],
      DOOR_RIGHT: [138, 43, 226],
      VENT_LEFT: [255, 255, 0],
      VENT_RIGHT: [220, 20, 60],
      HOSE_LEFT: [30, 144, 255],
      HOSE_RIGHT: [255, 192, 203],
      MUSIC_BOX: [0, 0, 0],
      CAMERA_LEFT: [255, 215, 0],
      CAMERA_RIGHT: [34, 139, 34]
    };
    return colors[this.type] || [128, 128, 128];
  }
  
  calculateMoveInterval() {
    // Higher difficulty = shorter interval
    const baseInterval = 300; // frames
    const minInterval = 60;
    return Math.max(minInterval, baseInterval - (this.difficulty * 10));
  }
  
  update() {
    if (!this.active) return;
    
    this.moveTimer++;
    
    // Special case: Music box animatronic
    if (this.type === "MUSIC_BOX") {
      this.updateMusicBox();
      return;
    }
    
    // Regular movement
    if (this.moveTimer >= this.moveInterval) {
      this.move();
      this.moveTimer = 0;
    }
    
    // Check if at entry point
    if (this.position >= 100) {
      this.atEntryPoint = true;
      this.attackTimer++;
    }
  }
  
  updateMusicBox() {
    // Puppet progresses when music box is not active
    if (!gameState.systems.musicBox || gameState.systems.musicBox <= 0) {
      this.position += 0.5;
    } else {
      this.position = Math.max(0, this.position - 1);
    }
    
    if (this.position >= 100) {
      this.atEntryPoint = true;
    }
  }
  
  move() {
    // Random chance to move based on difficulty
    const moveChance = this.difficulty / 20;
    if (Math.random() < moveChance) {
      this.position += 15 + Math.random() * 10;
    }
  }
  
  isBlockedByDefense() {
    switch (this.type) {
      case "DOOR_LEFT":
        return gameState.systems.leftDoor || gameState.activeEffects.doorLockTimer > 0;
      case "DOOR_RIGHT":
        return gameState.systems.rightDoor || gameState.activeEffects.doorLockTimer > 0;
      case "VENT_LEFT":
        return gameState.systems.leftVent || gameState.activeEffects.ventSealTimer > 0;
      case "VENT_RIGHT":
        return gameState.systems.rightVent || gameState.activeEffects.ventSealTimer > 0;
      case "HOSE_LEFT":
        return gameState.systems.leftHose;
      case "HOSE_RIGHT":
        return gameState.systems.rightHose;
      case "MUSIC_BOX":
        return gameState.systems.musicBox > 0;
      case "CAMERA_LEFT":
        return gameState.systems.leftCamera;
      case "CAMERA_RIGHT":
        return gameState.systems.rightCamera;
      default:
        return false;
    }
  }
  
  checkAttack() {
    if (!this.atEntryPoint) return false;
    
    // If defense is active, reset position
    if (this.isBlockedByDefense()) {
      this.position = Math.max(0, this.position - 30);
      this.atEntryPoint = false;
      this.attackTimer = 0;
      
      // Chance to earn Faz-Coin on successful block
      if (Math.random() < 0.3) {
        gameState.fazCoins++;
        gameState.coinsCollected++;
      }
      
      gameState.jumpscaresAvoided++;
      return false;
    }
    
    // Attack after being at entry point for a while
    if (this.attackTimer > 120) { // 2 seconds
      return true; // Jumpscare!
    }
    
    return false;
  }
  
  reset() {
    this.position = 0;
    this.moveTimer = 0;
    this.atEntryPoint = false;
    this.attackTimer = 0;
  }
}