// combat.js

export function rollDice(numDice, p) {
  const rolls = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(p.random(1, 7)));
  }
  return rolls.sort((a, b) => b - a); // Sort descending
}

export function resolveCombat(attacker, defender, p) {
  // Attacker rolls up to 3 dice (limited by armies - 1)
  const attackerDice = Math.min(3, attacker.armies - 1);
  const defenderDice = Math.min(2, defender.armies);
  
  const attackRolls = rollDice(attackerDice, p);
  const defenderRolls = rollDice(defenderDice, p);
  
  let attackerLosses = 0;
  let defenderLosses = 0;
  
  // Compare highest dice
  if (attackRolls[0] > defenderRolls[0]) {
    defenderLosses++;
  } else {
    attackerLosses++;
  }
  
  // Compare second highest if both have 2+ dice
  if (attackRolls.length > 1 && defenderRolls.length > 1) {
    if (attackRolls[1] > defenderRolls[1]) {
      defenderLosses++;
    } else {
      attackerLosses++;
    }
  }
  
  return {
    attackRolls,
    defenderRolls,
    attackerLosses,
    defenderLosses
  };
}

export function executeCombat(attackingTerritory, defendingTerritory, p) {
  const result = resolveCombat(attackingTerritory, defendingTerritory, p);
  
  attackingTerritory.armies -= result.attackerLosses;
  defendingTerritory.armies -= result.defenderLosses;
  
  // If defender has no armies left, attacker conquers
  if (defendingTerritory.armies <= 0) {
    const previousOwner = defendingTerritory.owner;
    defendingTerritory.owner = attackingTerritory.owner;
    // Move armies (leave 1 behind)
    const armiesToMove = attackingTerritory.armies - 1;
    defendingTerritory.armies = armiesToMove;
    attackingTerritory.armies = 1;
    
    return {
      ...result,
      conquered: true,
      previousOwner
    };
  }
  
  return {
    ...result,
    conquered: false
  };
}