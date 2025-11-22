import { gameState, PHASE } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (keyCode === 13) {
    if (gameState.gamePhase === "START") {
      startGame();
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING", message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      handleEnterInGame(p);
    }
  } else if (keyCode === 27) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) {
    if (gameState.gamePhase === "GAME_OVER") {
      resetToStart();
      p.logs.game_info.push({
        data: { gamePhase: "START", message: "Restart to menu" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
    if (keyCode === 37) {
      handleArrowLeft();
    } else if (keyCode === 39) {
      handleArrowRight();
    } else if (keyCode === 38) {
      handleArrowUp();
    } else if (keyCode === 40) {
      handleArrowDown();
    } else if (keyCode === 32) {
      handleSpace(p);
    } else if (keyCode === 16) {
      handleShift(p);
    } else if (keyCode === 90) {
      handleZ(p);
    }
  }
}

function startGame() {
  import('./game.js').then(module => {
    module.initializeLevel(gameState.currentLevel);
    gameState.gamePhase = "PLAYING";
    gameState.highlightedTerritoryIndex = 0;
  });
}

function resetToStart() {
  gameState.gamePhase = "START";
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.territories = [];
  gameState.continents = [];
  gameState.players = [];
  gameState.selectedTerritoryId1 = null;
  gameState.selectedTerritoryId2 = null;
  gameState.highlightedTerritoryIndex = 0;
  gameState.reinforcementPool = 0;
  gameState.armiesToMove = 0;
  gameState.hasFortifiedThisTurn = false;
  gameState.currentPhase = PHASE.REINFORCE;
  gameState.currentPlayerId = 0;
  gameState.combatResults = null;
  gameState.combatAnimationFrames = 0;
  gameState.turnNumber = 1;
}

function handleArrowLeft() {
  if (gameState.combatResults) return;
  
  if (gameState.highlightedTerritoryIndex > 0) {
    gameState.highlightedTerritoryIndex--;
  } else {
    gameState.highlightedTerritoryIndex = gameState.territories.length - 1;
  }
}

function handleArrowRight() {
  if (gameState.combatResults) return;
  
  if (gameState.highlightedTerritoryIndex < gameState.territories.length - 1) {
    gameState.highlightedTerritoryIndex++;
  } else {
    gameState.highlightedTerritoryIndex = 0;
  }
}

function handleEnterInGame(p) {
  if (gameState.combatResults) return;
  
  const highlightedTerritory = gameState.territories[gameState.highlightedTerritoryIndex];
  if (!highlightedTerritory) return;
  
  handleTerritorySelect(p, highlightedTerritory.id);
}

function handleArrowUp() {
  if (gameState.currentPhase === PHASE.REINFORCE && gameState.selectedTerritoryId1 !== null) {
    if (gameState.armiesToMove < gameState.reinforcementPool) {
      gameState.armiesToMove++;
    }
  } else if (gameState.currentPhase === PHASE.ATTACK && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 !== null) {
    const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
    if (source) {
      const maxAttackers = Math.min(3, source.armies - 1);
      if (gameState.armiesToMove < maxAttackers) {
        gameState.armiesToMove++;
      }
    }
  } else if (gameState.currentPhase === PHASE.FORTIFY && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 !== null) {
    const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
    if (source) {
      const maxMove = source.armies - 1;
      if (gameState.armiesToMove < maxMove) {
        gameState.armiesToMove++;
      }
    }
  }
}

function handleArrowDown() {
  if (gameState.armiesToMove > 0) {
    gameState.armiesToMove--;
  }
}

function handleSpace(p) {
  if (gameState.currentPhase === PHASE.REINFORCE && gameState.selectedTerritoryId1 !== null && gameState.armiesToMove > 0) {
    const territory = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
    if (territory && territory.ownerId === gameState.currentPlayerId) {
      territory.addArmies(gameState.armiesToMove);
      gameState.reinforcementPool -= gameState.armiesToMove;
      gameState.armiesToMove = 0;
      gameState.selectedTerritoryId1 = null;
      
      logPlayerInfo(p);
    }
  } else if (gameState.currentPhase === PHASE.ATTACK && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 !== null && gameState.armiesToMove > 0) {
    executeAttack(p);
  } else if (gameState.currentPhase === PHASE.FORTIFY && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 !== null && gameState.armiesToMove > 0) {
    executeFortify(p);
  }
}

function handleShift(p) {
  if (gameState.currentPhase === PHASE.REINFORCE) {
    gameState.currentPhase = PHASE.ATTACK;
    gameState.reinforcementPool = 0;
  } else if (gameState.currentPhase === PHASE.ATTACK) {
    gameState.currentPhase = PHASE.FORTIFY;
  } else if (gameState.currentPhase === PHASE.FORTIFY) {
    endPlayerTurn(p);
  }
  
  gameState.selectedTerritoryId1 = null;
  gameState.selectedTerritoryId2 = null;
  gameState.armiesToMove = 0;
}

function handleZ(p) {
  endPlayerTurn(p);
}

function executeAttack(p) {
  const attacker = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
  const defender = gameState.territories.find(t => t.id === gameState.selectedTerritoryId2);
  
  if (!attacker || !defender) return;
  
  import('./combat.js').then(module => {
    const combatResult = module.resolveCombat(p, gameState.armiesToMove, defender.armies);
    
    gameState.combatResults = combatResult;
    gameState.combatAnimationFrames = 0;
    
    setTimeout(() => {
      attacker.removeArmies(combatResult.attackerLosses);
      defender.removeArmies(combatResult.defenderLosses);
      
      if (defender.armies === 0) {
        const movedArmies = gameState.armiesToMove;
        defender.changeOwner(attacker.ownerId, movedArmies);
        attacker.removeArmies(movedArmies);
        
        gameState.score += 10;
        
        const defenderPlayer = gameState.players.find(pl => pl.id !== attacker.ownerId && pl.getTerritoriesOwned(gameState.territories).length === 0);
        if (defenderPlayer) {
          gameState.score += 100;
        }
      }
      
      gameState.combatResults = null;
      gameState.selectedTerritoryId1 = null;
      gameState.selectedTerritoryId2 = null;
      gameState.armiesToMove = 0;
      
      logPlayerInfo(p);
      checkWinCondition(p);
    }, 1500);
  });
}

function executeFortify(p) {
  const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
  const target = gameState.territories.find(t => t.id === gameState.selectedTerritoryId2);
  
  if (!source || !target) return;
  
  source.removeArmies(gameState.armiesToMove);
  target.addArmies(gameState.armiesToMove);
  
  gameState.hasFortifiedThisTurn = true;
  gameState.selectedTerritoryId1 = null;
  gameState.selectedTerritoryId2 = null;
  gameState.armiesToMove = 0;
  
  logPlayerInfo(p);
  
  endPlayerTurn(p);
}

function endPlayerTurn(p) {
  const currentPlayer = gameState.players[gameState.currentPlayerId];
  if (currentPlayer) {
    const territoriesOwned = currentPlayer.getTerritoriesOwned(gameState.territories);
    gameState.score += territoriesOwned.length * 10;
    
    const continentsOwned = currentPlayer.getContinentsOwned(gameState.territories, gameState.continents);
    gameState.score += continentsOwned.length * 50;
  }
  
  gameState.currentPhase = PHASE.AI_TURN;
  gameState.selectedTerritoryId1 = null;
  gameState.selectedTerritoryId2 = null;
  gameState.armiesToMove = 0;
  gameState.hasFortifiedThisTurn = false;
  
  setTimeout(() => {
    import('./game.js').then(module => {
      module.executeAITurns(p);
    });
  }, 500);
}

function checkWinCondition(p) {
  const playerTerritories = gameState.territories.filter(t => t.ownerId === 0);
  
  if (playerTerritories.length === gameState.territories.length) {
    gameState.score += 500;
    
    const totalArmies = playerTerritories.reduce((sum, t) => sum + t.armies, 0);
    gameState.score += totalArmies * 10;
    
    if (gameState.currentLevel < 3) {
      setTimeout(() => {
        gameState.currentLevel++;
        import('./game.js').then(module => {
          module.initializeLevel(gameState.currentLevel);
          gameState.currentPhase = PHASE.REINFORCE;
          gameState.currentPlayerId = 0;
        });
      }, 2000);
    } else {
      setTimeout(() => {
        gameState.gamePhase = "GAME_OVER";
        updateHighScore();
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER", result: "WIN" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }, 2000);
    }
  } else if (playerTerritories.length === 0) {
    gameState.gamePhase = "GAME_OVER";
    updateHighScore();
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER", result: "LOSE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('territoryTidesHighScore', gameState.highScore.toString());
    }
  }
}

function logPlayerInfo(p) {
  const player = gameState.players[0];
  if (player) {
    const territories = player.getTerritoriesOwned(gameState.territories);
    if (territories.length > 0) {
      const firstTerritory = territories[0];
      p.logs.player_info.push({
        screen_x: firstTerritory.centerPos.x,
        screen_y: firstTerritory.centerPos.y,
        game_x: firstTerritory.centerPos.x,
        game_y: firstTerritory.centerPos.y,
        framecount: p.frameCount
      });
    }
  }
}

function handleTerritorySelect(p, territoryId) {
  const territory = gameState.territories.find(t => t.id === territoryId);
  if (!territory) return;
  
  if (gameState.currentPhase === PHASE.REINFORCE) {
    if (territory.ownerId === gameState.currentPlayerId) {
      gameState.selectedTerritoryId1 = territoryId;
      gameState.selectedTerritoryId2 = null;
      gameState.armiesToMove = Math.min(1, gameState.reinforcementPool);
    }
  } else if (gameState.currentPhase === PHASE.ATTACK) {
    if (gameState.selectedTerritoryId1 === null) {
      if (territory.ownerId === gameState.currentPlayerId && territory.armies > 1) {
        gameState.selectedTerritoryId1 = territoryId;
        gameState.selectedTerritoryId2 = null;
        gameState.armiesToMove = 0;
      }
    } else {
      const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
      if (source && source.isAdjacentTo(territoryId) && territory.ownerId !== gameState.currentPlayerId) {
        gameState.selectedTerritoryId2 = territoryId;
        gameState.armiesToMove = Math.min(1, Math.min(3, source.armies - 1));
      } else if (territory.ownerId === gameState.currentPlayerId && territory.armies > 1) {
        gameState.selectedTerritoryId1 = territoryId;
        gameState.selectedTerritoryId2 = null;
        gameState.armiesToMove = 0;
      }
    }
  } else if (gameState.currentPhase === PHASE.FORTIFY && !gameState.hasFortifiedThisTurn) {
    if (gameState.selectedTerritoryId1 === null) {
      if (territory.ownerId === gameState.currentPlayerId && territory.armies > 1) {
        gameState.selectedTerritoryId1 = territoryId;
        gameState.selectedTerritoryId2 = null;
        gameState.armiesToMove = 0;
      }
    } else {
      const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
      if (source && source.isAdjacentTo(territoryId) && territory.ownerId === gameState.currentPlayerId) {
        gameState.selectedTerritoryId2 = territoryId;
        gameState.armiesToMove = Math.min(1, source.armies - 1);
      } else if (territory.ownerId === gameState.currentPlayerId && territory.armies > 1) {
        gameState.selectedTerritoryId1 = territoryId;
        gameState.selectedTerritoryId2 = null;
        gameState.armiesToMove = 0;
      }
    }
  }
}