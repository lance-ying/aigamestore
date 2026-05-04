import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  ROUND_TIME,
  MIN_SCORE_TO_WIN,
  KEY_ARROW_UP,
  KEY_ARROW_DOWN
} from './globals.js';
import { Card } from './card.js';
import { Particle } from './particle.js';

export class GameManager {
  constructor(p) {
    this.p = p;
    this.usedCombinations = new Set();
    this.startTime = 0;
    this.particles = [];
  }

  init() {
    gameState.score = 0;
    gameState.skips = 0;
    gameState.timeRemaining = ROUND_TIME;
    gameState.totalCardsShown = 0;
    gameState.cardChangeAnimation = 0;
    gameState.framesSinceLastAction = 0;
    gameState.lastActionTime = 0;
    this.usedCombinations.clear();
    this.particles = [];
    gameState.entities = [];
    
    // Generate first card
    this.generateNewCard();
  }

  startGame() {
    this.init();
    gameState.gamePhase = PHASE_PLAYING;
    this.startTime = Date.now();
    
    this.p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, action: "game_started" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  generateNewCard() {
    gameState.currentCard = Card.generateRandom(this.p, this.usedCombinations);
    gameState.totalCardsShown++;
    gameState.cardChangeAnimation = 1.0;
  }

  handleCorrectGuess() {
    gameState.score++;
    gameState.lastActionTime = Date.now();
    
    // Create success particles
    this.createParticles(this.p.width / 2, this.p.height / 2, 'success');
    
    this.p.logs.player_info.push({
      screen_x: this.p.width / 2,
      screen_y: this.p.height / 2,
      game_x: this.p.width / 2,
      game_y: this.p.height / 2,
      framecount: this.p.frameCount,
      data: { action: "correct_guess", score: gameState.score }
    });
    
    this.generateNewCard();
  }

  handleSkip() {
    gameState.skips++;
    gameState.lastActionTime = Date.now();
    
    this.p.logs.player_info.push({
      screen_x: this.p.width / 2,
      screen_y: this.p.height / 2,
      game_x: this.p.width / 2,
      game_y: this.p.height / 2,
      framecount: this.p.frameCount,
      data: { action: "skip", skips: gameState.skips }
    });
    
    this.generateNewCard();
  }

  createParticles(x, y, type) {
    const colors = type === 'success' 
      ? [[255, 215, 0], [255, 165, 0], [255, 140, 0], [255, 215, 0]]
      : [[100, 150, 255], [150, 150, 255], [200, 150, 255]];
    
    const particleCount = type === 'success' ? 20 : 10;
    
    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(this.p.random(colors.length))];
      const particleType = this.p.random() > 0.5 ? 'confetti' : 'star';
      this.particles.push(new Particle(this.p, x, y, color, particleType));
    }
  }

  update() {
    if (gameState.gamePhase !== PHASE_PLAYING) return;

    gameState.framesSinceLastAction++;
    
    // Update time
    const elapsed = (Date.now() - this.startTime) / 1000;
    gameState.timeRemaining = Math.max(0, ROUND_TIME - elapsed);
    
    // Update animation
    if (gameState.cardChangeAnimation > 0) {
      gameState.cardChangeAnimation -= 0.05;
    }
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.update();
      return !p.isDead();
    });
    
    // Check game over
    if (gameState.timeRemaining <= 0) {
      this.endGame();
    }
  }

  endGame() {
    if (gameState.score >= MIN_SCORE_TO_WIN) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    }
    
    this.p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        final_score: gameState.score,
        skips: gameState.skips,
        cards_shown: gameState.totalCardsShown
      },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  handleInput(keyCode) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    if (keyCode === KEY_ARROW_UP) {
      this.handleCorrectGuess();
    } else if (keyCode === KEY_ARROW_DOWN) {
      this.handleSkip();
    }
  }

  renderParticles() {
    this.particles.forEach(p => p.render());
  }
}