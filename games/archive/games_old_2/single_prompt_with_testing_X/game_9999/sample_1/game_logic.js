// game_logic.js - Core game logic and mechanics

import { gameState, resetGameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, UNIT_STREAM_DELAY, SCORE_BASE_CLEAR, SCORE_BLUE_GATE, SCORE_PERFECT_CHAIN, SCORE_SURVIVOR, SCORE_CHAMPION_FIRST, SCORE_CHAMPION_ADDITIONAL, PENALTY_RED_GATE, MULTIPLIER_CLEAN, RANK_S, RANK_A, RANK_B, CHAMPION_ABILITY_COOLDOWN } from './globals.js';
import { Unit, Gate, EnemyBase, Cannon, Champion } from './entities.js';

export function initializeLevel(level) {
  resetGameState();
  
  const p = window.gameInstance;
  
  // Initialize cannon
  gameState.cannon = new Cannon(50, 350);
  
  // Initialize enemy base
  gameState.enemyBase = new EnemyBase();
  gameState.entities.push(gameState.enemyBase);
  
  // Initialize champions
  gameState.champions = [
    new Champion("Blaster", "Boost all units forward", (gs) => {
      gs.units.forEach(unit => {
        unit.vx *= 2;
        unit.vy *= 2;
      });
    }),
    new Champion("Multiplier", "Double all units instantly", (gs) => {
      const currentUnits = [...gs.units];
      currentUnits.forEach(unit => {
        if (unit.alive) {
          const newUnit = new Unit(unit.x, unit.y, unit.vx, unit.vy);
          newUnit.passedGates = [...unit.passedGates];
          gs.units.push(newUnit);
          gs.entities.push(newUnit);
        }
      });
    })
  ];
  
  gameState.selectedChampion = 0;
  
  // Generate gates based on level
  generateGates(level);
  
  gameState.levelStartFrame = p.frameCount;
}

function generateGates(level) {
  gameState.gates = [];
  
  // Level 1: Simple static gates
  if (level === 1) {
    gameState.gates.push(new Gate(200, 150, 2, 0));
    gameState.gates.push(new Gate(350, 250, 3, 0));
    gameState.gates.push(new Gate(200, 300, 0.5, 0));
  }
  // Level 2: Moving gates
  else if (level === 2) {
    gameState.gates.push(new Gate(180, 150, 2, 1));
    gameState.gates.push(new Gate(320, 200, 2, 1.5));
    gameState.gates.push(new Gate(450, 180, 3, 1));
    gameState.gates.push(new Gate(280, 280, 0.5, 1));
  }
  // Level 3+: More complex patterns
  else {
    const gateCount = 4 + level;
    for (let i = 0; i < gateCount; i++) {
      const x = 150 + (i * 80);
      const y = 100 + Math.sin(i) * 100;
      const mult = (i % 3 === 0) ? 0.5 : (i % 2 === 0 ? 2 : 3);
      const speed = level > 2 ? 1 + Math.random() * 0.5 : 0;
      gameState.gates.push(new Gate(x, y, mult, speed));
    }
  }
  
  gameState.entities.push(...gameState.gates);
}

export function fireUnit() {
  const cannon = gameState.cannon;
  const tip = cannon.getBarrelTip();
  
  const speed = 2.5;
  const vx = Math.cos(cannon.angle) * speed;
  const vy = Math.sin(cannon.angle) * speed;
  
  const unit = new Unit(tip.x, tip.y, vx, vy);
  gameState.units.push(unit);
  gameState.entities.push(unit);
}

export function updateGame() {
  const p = window.gameInstance;
  
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update ability cooldown
  if (gameState.abilityOnCooldown) {
    gameState.abilityCooldownTimer--;
    if (gameState.abilityCooldownTimer <= 0) {
      gameState.abilityOnCooldown = false;
    }
  }
  
  // Update stream firing
  if (gameState.streamFiring) {
    gameState.streamTimer++;
    if (gameState.streamTimer >= UNIT_STREAM_DELAY) {
      fireUnit();
      gameState.streamTimer = 0;
    }
  }
  
  // Update gates
  gameState.gates.forEach(gate => gate.update());
  
  // Update units
  gameState.units = gameState.units.filter(unit => {
    if (!unit.alive) return false;
    
    unit.update();
    
    // Check gate collisions
    gameState.gates.forEach(gate => {
      if (gate.active && gate.checkCollision(unit)) {
        if (!unit.passedGates.includes(gate)) {
          unit.passedGates.push(gate);
          
          if (gate.multiplier > 1) {
            // Blue gate - multiply units
            gameState.blueGatesPassed++;
            gameState.score += SCORE_BLUE_GATE * gate.multiplier;
            
            const multiplier = Math.floor(gate.multiplier);
            for (let i = 1; i < multiplier; i++) {
              const newUnit = new Unit(unit.x + (i - multiplier/2) * 10, unit.y, unit.vx, unit.vy);
              newUnit.passedGates = [...unit.passedGates];
              gameState.units.push(newUnit);
              gameState.entities.push(newUnit);
            }
          } else {
            // Red gate - penalty
            gameState.redGatesPassed++;
            gameState.score += PENALTY_RED_GATE;
            unit.alive = false;
          }
        }
      }
    });
    
    // Check base collision
    if (gameState.enemyBase && gameState.enemyBase.checkCollision(unit)) {
      gameState.enemyBase.takeDamage(1);
      gameState.unitsReachedBase++;
      gameState.score += SCORE_SURVIVOR;
      unit.alive = false;
      return false;
    }
    
    return unit.alive;
  });
  
  // Check win/lose conditions
  if (gameState.enemyBase && gameState.enemyBase.isDestroyed()) {
    endLevel(true);
  }
}

export function endLevel(won) {
  const p = window.gameInstance;
  
  gameState.levelEndFrame = p.frameCount;
  
  if (won) {
    // Calculate final score
    gameState.score += SCORE_BASE_CLEAR;
    
    // Perfect chain bonus
    if (gameState.redGatesPassed === 0 && gameState.blueGatesPassed > 0) {
      gameState.score += SCORE_PERFECT_CHAIN;
      gameState.score = Math.floor(gameState.score * MULTIPLIER_CLEAN);
    }
    
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function useChampionAbility() {
  if (gameState.abilityOnCooldown) return;
  
  const champion = gameState.champions[gameState.selectedChampion];
  champion.useAbility(gameState);
  
  // Track champion usage
  if (!gameState.championUsed) {
    gameState.score += SCORE_CHAMPION_FIRST;
    gameState.championUsed = true;
  } else if (!gameState.championsUsedSet.has(gameState.selectedChampion)) {
    gameState.score += SCORE_CHAMPION_ADDITIONAL;
  }
  
  gameState.championsUsedSet.add(gameState.selectedChampion);
  
  // Start cooldown
  gameState.abilityOnCooldown = true;
  gameState.abilityCooldownTimer = CHAMPION_ABILITY_COOLDOWN;
}

export function swapChampion() {
  gameState.selectedChampion = (gameState.selectedChampion + 1) % gameState.champions.length;
}

export function getRank(score) {
  if (score >= RANK_S) return 'S';
  if (score >= RANK_A) return 'A';
  if (score >= RANK_B) return 'B';
  return 'C';
}