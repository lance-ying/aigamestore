// utils.js - Utility functions
import { gameState, EQUIPMENT } from './globals.js';

export function calculateDamage(attacker, defender) {
  const baseDamage = attacker.power;
  const reduction = Math.floor(defender.defence * 0.5);
  const damage = Math.max(1, baseDamage - reduction);
  return damage;
}

export function getTotalStats(player) {
  const stats = {
    power: player.power,
    defence: player.defence,
    health: player.maxHealth,
    speed: player.speed,
    special: player.special
  };
  
  // Add weapon bonus
  if (player.equippedWeapon) {
    const weapon = EQUIPMENT.weapons.find(w => w.id === player.equippedWeapon);
    if (weapon) stats.power += weapon.power;
  }
  
  // Add costume bonus
  if (player.equippedCostume) {
    const costume = EQUIPMENT.costumes.find(c => c.id === player.equippedCostume);
    if (costume) stats.defence += costume.defence;
  }
  
  return stats;
}

export function unlockEquipment(currency) {
  let unlocked = [];
  
  EQUIPMENT.weapons.forEach(weapon => {
    if (!weapon.unlocked && currency >= weapon.cost) {
      weapon.unlocked = true;
      unlocked.push(weapon.name);
      if (!gameState.unlockedEquipment.includes(weapon.id)) {
        gameState.unlockedEquipment.push(weapon.id);
      }
    }
  });
  
  EQUIPMENT.costumes.forEach(costume => {
    if (!costume.unlocked && currency >= costume.cost) {
      costume.unlocked = true;
      unlocked.push(costume.name);
      if (!gameState.unlockedEquipment.includes(costume.id)) {
        gameState.unlockedEquipment.push(costume.id);
      }
    }
  });
  
  return unlocked;
}

export function resetBattle() {
  gameState.inBattle = false;
  gameState.currentOpponent = null;
  gameState.battleTurn = "PLAYER";
  gameState.battleLog = [];
  gameState.battleAction = null;
  gameState.selectedAction = 0;
}

export function getNextOpponent() {
  const availableOpponents = gameState.worldObjects.filter(
    obj => obj.type === 'opponent' && !gameState.defeatedOpponents.includes(obj.opponentId)
  );
  return availableOpponents.length > 0 ? availableOpponents[0] : null;
}