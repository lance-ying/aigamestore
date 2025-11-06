// combat.js - Combat system

import { gameState } from './globals.js';
import { PLAYING_SUBSTATES } from './globals.js';

export function initiateCombat(combatZone) {
  if (combatZone.defeated) return false;
  
  const availableHeroes = gameState.heroes.filter(h => h.isRecruited && !h.isDefeated);
  if (availableHeroes.length === 0) return false;
  
  gameState.combatData = {
    zone: combatZone,
    heroes: availableHeroes.map(h => ({ ...h })),
    enemies: combatZone.enemies.map(e => ({ ...e })),
    turn: 0,
    isPlayerTurn: true,
    selectedHero: 0,
    selectedEnemy: 0,
    combatLog: [],
    combatOver: false,
    playerWon: false,
    animations: []
  };
  
  gameState.playingSubstate = PLAYING_SUBSTATES.COMBAT;
  return true;
}

export function processCombatTurn(action) {
  if (!gameState.combatData || gameState.combatData.combatOver) return;
  
  const { heroes, enemies, selectedHero, selectedEnemy } = gameState.combatData;
  
  if (gameState.combatData.isPlayerTurn) {
    // Player attacks
    const hero = heroes[selectedHero];
    const enemy = enemies[selectedEnemy];
    
    if (hero && enemy && enemy.isAlive()) {
      const damage = enemy.takeDamage(hero.atk);
      gameState.combatData.combatLog.push(`${hero.name} attacks ${enemy.name} for ${Math.floor(damage)} damage!`);
      
      // Create damage animation
      gameState.combatData.animations.push({
        type: "damage",
        x: 450,
        y: 100 + selectedEnemy * 60,
        value: Math.floor(damage),
        timer: 30
      });
      
      if (!enemy.isAlive()) {
        gameState.combatData.combatLog.push(`${enemy.name} defeated!`);
        gameState.score += enemy.scoreReward;
      }
    }
    
    gameState.combatData.isPlayerTurn = false;
  } else {
    // Enemy attacks
    const aliveEnemies = enemies.filter(e => e.isAlive());
    const aliveHeroes = heroes.filter(h => h.currentHP > 0);
    
    if (aliveEnemies.length > 0 && aliveHeroes.length > 0) {
      const enemy = aliveEnemies[0];
      const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      
      const damage = targetHero.takeDamage(enemy.atk);
      gameState.combatData.combatLog.push(`${enemy.name} attacks ${targetHero.name} for ${Math.floor(damage)} damage!`);
      
      // Create damage animation
      const heroIndex = heroes.indexOf(targetHero);
      gameState.combatData.animations.push({
        type: "damage",
        x: 150,
        y: 100 + heroIndex * 60,
        value: Math.floor(damage),
        timer: 30
      });
      
      if (targetHero.currentHP === 0) {
        gameState.combatData.combatLog.push(`${targetHero.name} defeated!`);
      }
    }
    
    gameState.combatData.isPlayerTurn = true;
    gameState.combatData.turn++;
  }
  
  // Check combat end conditions
  checkCombatEnd();
}

export function checkCombatEnd() {
  if (!gameState.combatData) return;
  
  const { heroes, enemies } = gameState.combatData;
  const aliveEnemies = enemies.filter(e => e.isAlive());
  const aliveHeroes = heroes.filter(h => h.currentHP > 0);
  
  if (aliveEnemies.length === 0) {
    // Player wins
    gameState.combatData.combatOver = true;
    gameState.combatData.playerWon = true;
    gameState.combatData.combatLog.push("VICTORY!");
    
    // Award XP and mark zone as defeated
    const xpPerHero = enemies.reduce((sum, e) => sum + e.xpReward, 0);
    heroes.forEach(hero => {
      const actualHero = gameState.heroes.find(h => h.id === hero.id);
      if (actualHero) {
        actualHero.gainXP(xpPerHero);
        actualHero.currentHP = hero.currentHP;
      }
    });
    
    gameState.combatData.zone.defeated = true;
    gameState.score += 500; // Combat completion bonus
    
    // Survival bonus if all heroes survived
    if (aliveHeroes.length === heroes.length) {
      const bonusPoints = Math.floor(enemies.length * 50 * 0.5);
      gameState.score += bonusPoints;
      gameState.combatData.combatLog.push(`Survival Bonus: +${bonusPoints} points!`);
    }
    
  } else if (aliveHeroes.length === 0) {
    // Player loses
    gameState.combatData.combatOver = true;
    gameState.combatData.playerWon = false;
    gameState.combatData.combatLog.push("DEFEAT!");
  }
}

export function exitCombat() {
  if (gameState.combatData && gameState.combatData.playerWon) {
    gameState.playingSubstate = PLAYING_SUBSTATES.EXPLORE;
    gameState.combatData = null;
    gameState.turnCount++;
  } else if (gameState.combatData && !gameState.combatData.playerWon) {
    // All heroes defeated - game over
    gameState.gamePhase = "GAME_OVER_LOSE";
    gameState.combatData = null;
  }
}