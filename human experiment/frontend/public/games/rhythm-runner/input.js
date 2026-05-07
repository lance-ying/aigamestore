import { gameState, GAME_PHASES, HIT_ZONE_X } from './globals.js';
import { Particle } from './particle.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.processedKeys = {}; // Track which keys have been processed this press
  }

  handleKeyPressed(key, keyCode) {
    // Skip if already processed (key is being held down)
    if (this.processedKeys[keyCode]) return;
    this.processedKeys[keyCode] = true;
    
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (keyCode === 13) { // ENTER
        this.startGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 27) { // ESC
        this.pauseGame();
      } else if (keyCode === 37) { // LEFT ARROW - tap to hit notes in upper lane
        this.handleNoteHit(0);
      } else if (keyCode === 39) { // RIGHT ARROW - tap to hit notes in lower lane
        this.handleNoteHit(1);
      } else if (keyCode === 38) { // UP ARROW - tap to switch to upper lane
        gameState.currentLane = 0;
      } else if (keyCode === 40) { // DOWN ARROW - tap to switch to lower lane
        gameState.currentLane = 1;
      } else if (keyCode === 16) { // SHIFT - tap to activate special
        this.activateSpecial();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (keyCode === 27) { // ESC
        this.unpauseGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      if (keyCode === 82) { // R
        this.restartGame();
      }
    }
    
    // Global restart
    if (keyCode === 82 && gameState.gamePhase !== GAME_PHASES.PLAYING) {
      this.restartGame();
    }
  }

  handleKeyReleased(key, keyCode) {
    this.processedKeys[keyCode] = false;
    
    this.p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  // No longer needed for tap-based controls
  update() {
    // Tap-based controls are handled in handleKeyPressed only
  }

  startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.missedNotes = 0;
    gameState.notesHit = 0;
    gameState.perfectHits = 0;
    gameState.specialMeter = 0;
    gameState.specialActive = false;
    gameState.scoreMultiplier = 1.0;
    gameState.difficulty = 1.0;
    gameState.gameTime = 0;
    gameState.currentLane = 0;
    gameState.notes = [];
    gameState.elfins = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.entities = [gameState.player];
    
    this.p.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game started" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  pauseGame() {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    this.p.noLoop();
    
    this.p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  unpauseGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    this.p.loop();
    
    this.p.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game resumed" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.notes = [];
    gameState.elfins = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.entities = [gameState.player];
    
    this.p.logs.game_info.push({
      data: { phase: "START", message: "Game restarted" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  handleNoteHit(targetLane) {
    if (!gameState.player) return;
    
    // Find the closest note in the target lane
    let closestNote = null;
    let closestDistance = Infinity;
    
    for (let note of gameState.notes) {
      if (note.active && !note.hit && !note.missed && note.lane === targetLane) {
        const distance = Math.abs(note.x - HIT_ZONE_X);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestNote = note;
        }
      }
    }
    
    if (closestNote) {
      const accuracy = closestNote.attemptHit();
      if (accuracy) {
        gameState.player.hit();
        this.createHitParticles(closestNote.x, 
          closestNote.lane === 0 ? 150 : 250, 
          closestNote.color);
      }
    }
  }

  activateSpecial() {
    if (gameState.specialMeter >= 100 && !gameState.specialActive) {
      gameState.specialActive = true;
      gameState.specialDuration = 180;
      gameState.specialMeter = 0;
      gameState.scoreMultiplier += 1.0;
    }
  }

  createHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const particle = new Particle(this.p, x, y, color, 'hit');
      gameState.particles.push(particle);
    }
  }
}