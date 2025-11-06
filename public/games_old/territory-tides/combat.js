export function resolveCombat(p, attackerArmies, defenderArmies) {
  const attackerDice = Math.min(3, attackerArmies);
  const defenderDice = Math.min(2, defenderArmies);
  
  const attackerRolls = [];
  for (let i = 0; i < attackerDice; i++) {
    attackerRolls.push(Math.floor(p.random(1, 7)));
  }
  attackerRolls.sort((a, b) => b - a);
  
  const defenderRolls = [];
  for (let i = 0; i < defenderDice; i++) {
    defenderRolls.push(Math.floor(p.random(1, 7)));
  }
  defenderRolls.sort((a, b) => b - a);
  
  let attackerLosses = 0;
  let defenderLosses = 0;
  
  for (let i = 0; i < Math.min(attackerRolls.length, defenderRolls.length); i++) {
    if (attackerRolls[i] > defenderRolls[i]) {
      defenderLosses++;
    } else {
      attackerLosses++;
    }
  }
  
  return {
    attackerRolls,
    defenderRolls,
    attackerLosses,
    defenderLosses
  };
}