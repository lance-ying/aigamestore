import { gameState, TOWER_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  const actions = {
    up: false,
    down: false,
    left: false,
    right: false,
    place: false,
    upgrade: false,
    ability: false,
    selectTower: 0
  };
  
  // Strategic tower placement and upgrade logic
  const frame = gameState.framesSinceWaveStart || 0;
  
  // Phase 1: Build initial archer defense (first 2 waves)
  if (gameState.currentWave < 2) {
    if (gameState.towers.length < 3 && gameState.gold >= 70) {
      actions.selectTower = 1; // Archer
      actions.place = true;
    }
  }
  
  // Phase 2: Add mage towers for area damage (waves 3-5)
  else if (gameState.currentWave < 5) {
    if (gameState.towers.filter(t => t.type === 2).length < 2 && gameState.gold >= 100) {
      actions.selectTower = 2; // Mage
      actions.place = true;
    } else if (gameState.towers.length < 5 && gameState.gold >= 70) {
      actions.selectTower = 1; // Archer
      actions.place = true;
    }
    
    // Upgrade existing towers
    if (gameState.gold >= 120 && frame % 100 === 0) {
      const weakTower = gameState.towers.find(t => t.tier < 2);
      if (weakTower) {
        gameState.selectedTower = weakTower;
        actions.upgrade = true;
      }
    }
  }
  
  // Phase 3: Add barracks for blocking (waves 6-8)
  else if (gameState.currentWave < 8) {
    if (gameState.towers.filter(t => t.type === 3).length < 2 && gameState.gold >= 80) {
      actions.selectTower = 3; // Barracks
      actions.place = true;
    }
    
    // Upgrade key towers to tier 3
    if (gameState.gold >= 180 && frame % 120 === 0) {
      const goodTower = gameState.towers.find(t => t.tier < 3 && t.kills > 5);
      if (goodTower) {
        gameState.selectedTower = goodTower;
        actions.upgrade = true;
      }
    }
  }
  
  // Phase 4: Final wave preparation
  else {
    // Upgrade all towers
    if (gameState.gold >= 120 && frame % 80 === 0) {
      const upgradeable = gameState.towers.find(t => t.tier < 3);
      if (upgradeable) {
        gameState.selectedTower = upgradeable;
        actions.upgrade = true;
      }
    }
    
    // Fill remaining spots with druid towers
    if (gameState.towers.length < 8 && gameState.gold >= 90) {
      actions.selectTower = 4; // Druid
      actions.place = true;
    }
  }
  
  // Hero movement strategy
  if (gameState.hero) {
    const enemies = gameState.enemies.filter(e => e.alive);
    if (enemies.length > 0) {
      // Move hero towards furthest enemy along path
      const target = enemies.reduce((best, e) => 
        e.pathProgress > best.pathProgress ? e : best
      );
      
      const dx = target.x - gameState.hero.x;
      const dy = target.y - gameState.hero.y;
      
      if (Math.abs(dx) > 30) {
        actions.right = dx > 0;
        actions.left = dx < 0;
      }
      if (Math.abs(dy) > 30) {
        actions.down = dy > 0;
        actions.up = dy < 0;
      }
      
      // Use ability when many enemies nearby
      const nearbyEnemies = enemies.filter(e => {
        const dist = Math.sqrt(
          (e.x - gameState.hero.x) ** 2 + 
          (e.y - gameState.hero.y) ** 2
        );
        return dist < 150;
      });
      
      if (nearbyEnemies.length >= 3 && gameState.hero.abilityReady) {
        actions.ability = true;
      }
    }
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  const actions = {
    up: false,
    down: false,
    left: false,
    right: false,
    place: false,
    upgrade: false,
    ability: false,
    selectTower: 0
  };
  
  // Simple strategy: place towers when affordable
  if (gameState.gold >= 70 && gameState.towers.length < 4) {
    actions.selectTower = 1; // Archer
    actions.place = true;
  } else if (gameState.gold >= 100 && gameState.towers.filter(t => t.type === 2).length < 2) {
    actions.selectTower = 2; // Mage
    actions.place = true;
  }
  
  // Move hero randomly
  if (gameState.hero && Math.random() < 0.1) {
    const rand = Math.random();
    if (rand < 0.25) actions.up = true;
    else if (rand < 0.5) actions.down = true;
    else if (rand < 0.75) actions.left = true;
    else actions.right = true;
  }
  
  return actions;
}

function getUpgradeTestAction(gameState) {
  const actions = {
    up: false,
    down: false,
    left: false,
    right: false,
    place: false,
    upgrade: false,
    ability: false,
    selectTower: 0
  };
  
  // Place initial towers
  if (gameState.towers.length < 3 && gameState.gold >= 70) {
    actions.selectTower = 1;
    actions.place = true;
  }
  
  // Focus on upgrading
  if (gameState.gold >= 80 && gameState.towers.length > 0) {
    const tower = gameState.towers.find(t => t.tier < 3);
    if (tower) {
      gameState.selectedTower = tower;
      actions.upgrade = true;
    }
  }
  
  return actions;
}

function getHeroTestAction(gameState) {
  const actions = {
    up: false,
    down: false,
    left: false,
    right: false,
    place: false,
    upgrade: false,
    ability: false,
    selectTower: 0
  };
  
  // Focus on hero movement and abilities
  if (gameState.hero) {
    const enemies = gameState.enemies.filter(e => e.alive);
    if (enemies.length > 0) {
      const target = enemies[0];
      const dx = target.x - gameState.hero.x;
      const dy = target.y - gameState.hero.y;
      
      actions.right = dx > 20;
      actions.left = dx < -20;
      actions.down = dy > 20;
      actions.up = dy < -20;
      
      if (gameState.hero.abilityReady && enemies.length >= 2) {
        actions.ability = true;
      }
    }
  }
  
  // Minimal tower placement
  if (gameState.towers.length < 2 && gameState.gold >= 70) {
    actions.selectTower = 1;
    actions.place = true;
  }
  
  return actions;
}

function getRandomAction(gameState) {
  return {
    up: Math.random() < 0.05,
    down: Math.random() < 0.05,
    left: Math.random() < 0.05,
    right: Math.random() < 0.05,
    place: Math.random() < 0.02,
    upgrade: Math.random() < 0.01,
    ability: Math.random() < 0.01,
    selectTower: Math.random() < 0.05 ? Math.floor(Math.random() * 4) + 1 : 0
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getUpgradeTestAction(gameState);
    case "TEST_4":
      return getHeroTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;