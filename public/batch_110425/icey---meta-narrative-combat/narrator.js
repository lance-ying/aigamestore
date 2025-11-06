import { gameState } from './globals.js';

export class Narrator {
  constructor(p) {
    this.p = p;
    this.messages = {
      intro: [
        "Welcome, ICEY. Your mission is clear.",
        "Follow my instructions. Move right to begin.",
        "Enemies ahead. Eliminate them."
      ],
      defiance: [
        "That's not the way. Turn back.",
        "Why do you resist? Follow the path.",
        "Interesting... You choose your own way.",
        "You're not supposed to go there.",
        "Fine. Discover the truth yourself."
      ],
      obedience: [
        "Good. Continue forward.",
        "Exactly as planned. Proceed.",
        "You're doing well. Keep following."
      ],
      secretFound: [
        "You found something you weren't meant to see.",
        "This changes everything, doesn't it?",
        "The real story begins now."
      ],
      bossIntro: [
        "This is your final challenge.",
        "Defeat this enemy to complete your mission.",
        "Or... is there another way?"
      ]
    };
    
    this.currentMessage = "";
    this.messageQueue = [];
    this.displayTimer = 0;
    this.checkTimer = 0;
  }
  
  update() {
    const p = this.p;
    
    // Message display
    if (this.displayTimer > 0) {
      this.displayTimer--;
      if (this.displayTimer === 0) {
        this.currentMessage = "";
        gameState.narrator.active = false;
      }
    }
    
    // Check for new messages
    this.checkTimer++;
    if (this.checkTimer >= 60) { // Check every second
      this.checkTimer = 0;
      this.checkForTriggers();
    }
    
    // Process message queue
    if (this.messageQueue.length > 0 && this.displayTimer === 0) {
      this.showMessage(this.messageQueue.shift());
    }
  }
  
  checkForTriggers() {
    const player = gameState.player;
    if (!player || gameState.gamePhase !== "PLAYING") return;
    
    // Check if player is following suggested direction
    if (gameState.narrator.suggestedDirection) {
      const followingDirection = 
        (gameState.narrator.suggestedDirection === "right" && player.lastMoveDirection > 0) ||
        (gameState.narrator.suggestedDirection === "left" && player.lastMoveDirection < 0);
      
      if (followingDirection) {
        gameState.narrator.followCount++;
        if (gameState.narrator.followCount > 10 && this.p.random() < 0.1) {
          this.queueMessage(this.getRandomMessage("obedience"));
        }
      } else if (player.lastMoveDirection !== 0) {
        gameState.narrator.defyCount++;
        if (gameState.narrator.defyCount > 5 && this.p.random() < 0.15) {
          this.queueMessage(this.getRandomMessage("defiance"));
          if (!gameState.secrets.defiedNarrator) {
            gameState.secrets.defiedNarrator = true;
            gameState.score += 150;
          }
        }
      }
    }
    
    // Secret area triggers
    if (player.x > 700 && !gameState.secrets.foundHiddenArea) {
      this.queueMessage(this.getRandomMessage("secretFound"));
    }
    
    // Boss intro
    if (gameState.bosses.length > 0 && gameState.narrator.followCount === 0 && gameState.narrator.defyCount === 0) {
      this.queueMessage(this.getRandomMessage("bossIntro"));
    }
  }
  
  queueMessage(message) {
    this.messageQueue.push(message);
  }
  
  showMessage(message) {
    this.currentMessage = message;
    this.displayTimer = 180; // 3 seconds
    gameState.narrator.active = true;
    gameState.narrator.message = message;
  }
  
  getRandomMessage(category) {
    const messages = this.messages[category];
    return messages[Math.floor(this.p.random() * messages.length)];
  }
  
  suggestDirection(direction) {
    gameState.narrator.suggestedDirection = direction;
  }
  
  draw() {
    if (this.currentMessage === "" || gameState.gamePhase !== "PLAYING") return;
    
    const p = this.p;
    
    // Narrator box at top
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 10, 600, 50);
    
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.currentMessage, 300, 35);
    p.pop();
  }
}