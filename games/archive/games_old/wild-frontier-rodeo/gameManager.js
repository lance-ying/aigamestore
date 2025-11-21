// gameManager.js - Game logic and state management

import { gameState, GAME_PHASES, LEVEL_CONFIG, ANIMAL_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { Animal } from './animal.js';
import { Obstacle } from './obstacle.js';

export class GameManager {
  constructor(p) {
    this.p = p;
    this.lastSpawnTime = 0;
    this.levelStartTime = 0;
    this.particles = [];
  }

  init() {
    // Load high score
    const saved = localStorage.getItem('wildFrontierHighScore');
    gameState.highScore = saved ? parseInt(saved) : 0;
  }

  startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.entities = [];
    gameState.consecutiveJumps = 0;
    gameState.backgroundOffset = 0;
    
    this.startLevel();
    
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  startLevel() {
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    gameState.levelTimer = config.duration;
    gameState.entities = [];
    gameState.isJumping = false;
    this.lastSpawnTime = 0;
    this.levelStartTime = Date.now();
    this.particles = [];

    // Create player
    gameState.player = new Player(150, CANVAS_HEIGHT - 150);
    gameState.entities.push(gameState.player);

    // Spawn initial animal for player to start on
    const initialAnimal = this.spawnAnimal(150, CANVAS_HEIGHT - 100);
    gameState.currentAnimal = initialAnimal;
    gameState.player.landOnAnimal(initialAnimal);
    gameState.ridingTimer = initialAnimal.ridingDuration;

    // Spawn a few more animals ahead
    for (let i = 1; i <= 3; i++) {
      this.spawnAnimal(300 + i * 150, CANVAS_HEIGHT - 100 - Math.random() * 40);
    }
  }

  update() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    const elapsed = Date.now() - this.levelStartTime;

    // Update level timer
    gameState.levelTimer = Math.max(0, config.duration - elapsed);

    // Check level completion
    if (gameState.levelTimer <= 0) {
      this.completeLevel();
      return;
    }

    // Update riding timer
    if (gameState.currentAnimal && !gameState.isJumping) {
      gameState.ridingTimer -= this.p.deltaTime;
      
      // Score for riding time
      if (this.p.frameCount % 6 === 0) {
        gameState.score += 1;
      }

      // Buck off if timer expires
      if (gameState.ridingTimer <= 0) {
        this.buckPlayer();
      }

      // Apply steering to current animal
      if (this.p.keyIsDown(37)) { // Left
        gameState.currentAnimal.x = Math.max(
          gameState.currentAnimal.width / 2 + 20,
          gameState.currentAnimal.x - 3
        );
      }
      if (this.p.keyIsDown(39)) { // Right
        gameState.currentAnimal.x = Math.min(
          CANVAS_WIDTH - gameState.currentAnimal.width / 2 - 20,
          gameState.currentAnimal.x + 3
        );
      }
    }

    // Update entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      entity.update(this.p.frameCount);

      // Remove inactive entities
      if (entity.isActive === false) {
        if (entity === gameState.currentAnimal) {
          gameState.currentAnimal = null;
        }
        gameState.entities.splice(i, 1);
      }
    }

    // Check collisions
    this.checkCollisions();

    // Spawn new entities
    this.spawnEntities(config);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      p.y += p.vy;
      p.x += p.vx;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check if player is dead
    if (!gameState.player.isAlive) {
      this.gameOver();
    }

    // Update background offset
    gameState.backgroundOffset += 1 * config.speedMultiplier;

    // Log player info periodically
    if (this.p.frameCount % 30 === 0) {
      this.p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: this.p.frameCount
      });
    }
  }

  buckPlayer() {
    if (gameState.currentAnimal) {
      gameState.isJumping = true;
      gameState.player.velocityY = -10;
      gameState.player.velocityX = gameState.currentAnimal.velocityX * 0.3;
      gameState.currentAnimal = null;
      
      // Create particle effect
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: gameState.player.x,
          y: gameState.player.y + 15,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2 - 3,
          life: 20,
          color: [200, 150, 100]
        });
      }
    }
  }

  spawnAnimal(x, y) {
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    const types = config.animalTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Adjust riding duration based on level
    let durationMod = 1.0;
    if (gameState.currentLevel >= 4) {
      durationMod = 0.75;
    }
    if (gameState.currentLevel >= 5) {
      durationMod = 0.6;
    }
    
    const animal = new Animal(type, x, y, config.speedMultiplier);
    animal.ridingDuration = animal.ridingDuration * durationMod;
    
    gameState.entities.push(animal);
    return animal;
  }

  spawnObstacle(x, y) {
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    const types = ['ROCK', 'TREE', 'FENCE'];
    const type = types[Math.floor(Math.random() * types.length)];
    const obstacle = new Obstacle(type, x, y, config.speedMultiplier);
    gameState.entities.push(obstacle);
  }

  spawnEntities(config) {
    const now = Date.now();
    if (now - this.lastSpawnTime > config.spawnInterval) {
      this.lastSpawnTime = now;

      // Spawn animal
      const x = CANVAS_WIDTH + 50;
      const y = CANVAS_HEIGHT - 100 - Math.random() * 60;
      this.spawnAnimal(x, y);

      // Maybe spawn obstacle
      if (Math.random() < config.obstacleChance) {
        const obstacleX = x + 100 + Math.random() * 200;
        const obstacleY = CANVAS_HEIGHT - 50;
        this.spawnObstacle(obstacleX, obstacleY);
      }
    }
  }

  checkCollisions() {
    if (!gameState.player) return;

    const player = gameState.player;

    // Check landing on animals
    if (gameState.isJumping) {
      for (const entity of gameState.entities) {
        if (entity instanceof Animal && entity.isActive) {
          const bounds = entity.getBounds();
          
          // Check if player is falling and overlaps animal
          if (player.velocityY > 0 &&
              player.x > bounds.left && player.x < bounds.right &&
              player.y + player.height / 2 > bounds.top &&
              player.y - player.height / 2 < bounds.bottom) {
            
            player.landOnAnimal(entity);
            
            // Create landing particles
            for (let i = 0; i < 6; i++) {
              this.particles.push({
                x: player.x + (Math.random() - 0.5) * 20,
                y: player.y + 15,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * -2,
                life: 15,
                color: [255, 200, 100]
              });
            }
            break;
          }
        }
      }
    }

    // Check obstacle collisions
    for (const entity of gameState.entities) {
      if (entity instanceof Obstacle && entity.isActive) {
        const bounds = entity.getBounds();
        
        // Check collision with player or current animal
        const checkX = gameState.currentAnimal ? gameState.currentAnimal.x : player.x;
        const checkY = gameState.currentAnimal ? gameState.currentAnimal.y : player.y;
        const checkW = gameState.currentAnimal ? gameState.currentAnimal.width : player.width;
        const checkH = gameState.currentAnimal ? gameState.currentAnimal.height : player.height;
        
        if (checkX + checkW / 2 > bounds.left &&
            checkX - checkW / 2 < bounds.right &&
            checkY + checkH / 2 > bounds.top &&
            checkY - checkH / 2 < bounds.bottom) {
          
          // Hit obstacle - buck player
          if (gameState.currentAnimal) {
            this.buckPlayer();
          }
          entity.isActive = false;
        }
      }
    }
  }

  completeLevel() {
    gameState.score += 500;
    
    if (gameState.currentLevel >= 5) {
      // Won the game!
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      this.saveHighScore();
      
      this.p.logs.game_info.push({
        data: { phase: gameState.gamePhase, score: gameState.score },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Next level
      gameState.currentLevel++;
      this.startLevel();
      
      this.p.logs.game_info.push({
        data: { phase: 'LEVEL_UP', level: gameState.currentLevel },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  gameOver() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    this.saveHighScore();
    
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase, score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  saveHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('wildFrontierHighScore', gameState.highScore.toString());
    }
  }

  handleJump() {
    if (gameState.currentAnimal && !gameState.isJumping) {
      gameState.player.jump(gameState.currentAnimal);
      gameState.currentAnimal = null;
    }
  }
}