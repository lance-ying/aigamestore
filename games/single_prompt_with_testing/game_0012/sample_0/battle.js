// battle.js - Battle system

import { 
  gameState, 
  BATTLE_MENU, 
  BATTLE_ANIMATING, 
  BATTLE_ENEMY_TURN,
  BATTLE_VICTORY,
  BATTLE_CAPTURE,
  SUBPHASE_BATTLE
} from './globals.js';
import { calculateDamage, attemptCapture, Creo } from './creo.js';
import { SKILLS } from './creo_data.js';

export function initBattle(p, enemyCreo, isWild = true, trainer = null) {
  gameState.inBattle = true;
  gameState.subPhase = SUBPHASE_BATTLE;
  gameState.battleState = BATTLE_MENU;
  gameState.enemyCreo = enemyCreo;
  gameState.isWildBattle = isWild;
  gameState.currentEnemy = trainer;
  
  // Set player's active Creo
  if (gameState.playerTeam.length > 0) {
    gameState.playerCreo = gameState.playerTeam[0];
  }
  
  gameState.battleMessage = `A wild ${enemyCreo.name} appeared!`;
  if (!isWild && trainer) {
    gameState.battleMessage = `Trainer sent out ${enemyCreo.name}!`;
  }
  
  gameState.battleMenu.mainMenu = 0;
  gameState.battleMenu.skillMenu = 0;
  gameState.battleMenu.switchMenu = 0;
  gameState.battleAnimation = null;
  
  gameState.totalBattles++;
  
  p.logs.game_info.push({
    data: { event: "BATTLE_START", enemy: enemyCreo.name, isWild },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function endBattle(p, victory = false) {
  if (victory && !gameState.isWildBattle && gameState.currentEnemy) {
    gameState.currentEnemy.defeated = true;
    gameState.trainersDefeated++;
  }
  
  gameState.inBattle = false;
  gameState.subPhase = "OVERWORLD";
  gameState.battleState = BATTLE_MENU;
  gameState.playerCreo = null;
  gameState.enemyCreo = null;
  gameState.currentEnemy = null;
  
  p.logs.game_info.push({
    data: { event: "BATTLE_END", victory },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function executeBattleAction(p, action) {
  if (!gameState.playerCreo || !gameState.enemyCreo) return;
  
  const player = gameState.playerCreo;
  const enemy = gameState.enemyCreo;
  
  if (action.type === "ATTACK") {
    const skillId = player.skills[action.skillIndex || 0];
    const damage = calculateDamage(player, enemy, skillId);
    const skill = SKILLS[skillId];
    
    gameState.battleMessage = `${player.name} used ${skill.name}! Dealt ${damage} damage!`;
    const defeated = enemy.takeDamage(damage);
    
    gameState.battleAnimation = {
      type: "ATTACK",
      timer: 30,
      skillId: skillId
    };
    
    gameState.battleState = BATTLE_ANIMATING;
    
    if (defeated) {
      setTimeout(() => {
        handleBattleVictory(p);
      }, 500);
      return;
    }
    
    // Enemy turn after animation
    setTimeout(() => {
      enemyTurn(p);
    }, 500);
  }
  else if (action.type === "CAPTURE") {
    if (!gameState.isWildBattle) {
      gameState.battleMessage = "Can't capture trainer's Creo!";
      return;
    }
    
    if (gameState.captureItems <= 0) {
      gameState.battleMessage = "No capture items left!";
      return;
    }
    
    gameState.captureItems--;
    const success = attemptCapture(enemy);
    
    if (success) {
      gameState.battleMessage = `Successfully captured ${enemy.name}!`;
      gameState.playerTeam.push(enemy);
      gameState.creosCaptured++;
      gameState.battleState = BATTLE_CAPTURE;
      
      setTimeout(() => {
        endBattle(p, true);
      }, 1000);
    } else {
      gameState.battleMessage = `${enemy.name} broke free!`;
      gameState.battleAnimation = {
        type: "CAPTURE_FAIL",
        timer: 30
      };
      
      setTimeout(() => {
        enemyTurn(p);
      }, 500);
    }
  }
  else if (action.type === "SWITCH") {
    const newCreoIndex = action.creoIndex;
    if (newCreoIndex >= 0 && newCreoIndex < gameState.playerTeam.length) {
      const newCreo = gameState.playerTeam[newCreoIndex];
      if (newCreo.isAlive() && newCreo !== gameState.playerCreo) {
        gameState.playerCreo = newCreo;
        gameState.battleMessage = `Go, ${newCreo.name}!`;
        
        setTimeout(() => {
          enemyTurn(p);
        }, 500);
      }
    }
  }
}

function enemyTurn(p) {
  if (!gameState.enemyCreo || !gameState.playerCreo) return;
  
  gameState.battleState = BATTLE_ENEMY_TURN;
  
  const enemy = gameState.enemyCreo;
  const player = gameState.playerCreo;
  
  // Simple AI: use random skill
  const skillIndex = Math.floor(Math.random() * enemy.skills.length);
  const skillId = enemy.skills[skillIndex];
  const damage = calculateDamage(enemy, player, skillId);
  const skill = SKILLS[skillId];
  
  gameState.battleMessage = `Enemy ${enemy.name} used ${skill.name}! Dealt ${damage} damage!`;
  const defeated = player.takeDamage(damage);
  
  gameState.battleAnimation = {
    type: "ENEMY_ATTACK",
    timer: 30,
    skillId: skillId
  };
  
  if (defeated) {
    // Check if player has other Creo
    const aliveCreo = gameState.playerTeam.filter(c => c.isAlive());
    if (aliveCreo.length === 0) {
      setTimeout(() => {
        handleBattleDefeat(p);
      }, 500);
      return;
    } else {
      // Force switch
      gameState.battleMessage = `${player.name} fainted! Choose another Creo!`;
      gameState.battleState = BATTLE_MENU;
      gameState.battleMenu.mainMenu = 3; // Force switch menu
      return;
    }
  }
  
  setTimeout(() => {
    gameState.battleState = BATTLE_MENU;
  }, 500);
}

function handleBattleVictory(p) {
  gameState.battleState = BATTLE_VICTORY;
  
  // Award exp
  const expGained = Math.floor(gameState.enemyCreo.level * 5);
  gameState.battleMessage = `Victory! ${gameState.playerCreo.name} gained ${expGained} EXP!`;
  
  const leveledUp = gameState.playerCreo.gainExp(expGained);
  if (leveledUp) {
    gameState.battleMessage += ` Level up! Now level ${gameState.playerCreo.level}!`;
  }
  
  setTimeout(() => {
    endBattle(p, true);
  }, 2000);
}

function handleBattleDefeat(p) {
  gameState.battleMessage = "All your Creo fainted! Game Over!";
  
  setTimeout(() => {
    gameState.gamePhase = "GAME_OVER_LOSE";
    endBattle(p, false);
  }, 2000);
}

export function updateBattleAnimation() {
  if (gameState.battleAnimation) {
    gameState.battleAnimation.timer--;
    if (gameState.battleAnimation.timer <= 0) {
      gameState.battleAnimation = null;
    }
  }
}