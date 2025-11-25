// game_logic.js - Core game logic

import { gameState, GAME_PHASES, PLAY_PHASES, ROLES, ROLE_INFO } from './globals.js';
import { Player } from './player.js';

export function initializeGame(p) {
  // Reset game state
  gameState.players = [];
  gameState.currentDay = 1;
  gameState.playPhase = PLAY_PHASES.NIGHT;
  gameState.phaseTimer = 0;
  gameState.nightTarget = -1;
  gameState.votingTarget = -1;
  gameState.votes = {};
  gameState.onTrial = -1;
  gameState.hasVoted = false;
  gameState.investigationResults = [];
  gameState.selectedOption = 0;
  gameState.showRoleCard = false;
  gameState.score = 0;
  
  // Create 7 players with roles
  const roles = assignRoles(7);
  
  for (let i = 0; i < 7; i++) {
    const player = new Player(i, roles[i], i === 0);
    gameState.players.push(player);
    
    if (i === 0) {
      gameState.player = player;
      gameState.playerIndex = 0;
    }
  }
  
  updateCounts();
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "GAME_START", playerRole: gameState.player.role },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function assignRoles(numPlayers) {
  // 1 Killer, 1 Doctor, 1 Sheriff, rest Townies
  const roles = [
    ROLES.KILLER,
    ROLES.DOCTOR,
    ROLES.SHERIFF
  ];
  
  // Fill rest with townies
  while (roles.length < numPlayers) {
    roles.push(ROLES.TOWNIE);
  }
  
  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  return roles;
}

export function updateCounts() {
  gameState.aliveCount = gameState.players.filter(p => p.alive).length;
  gameState.townCount = gameState.players.filter(p => p.alive && p.role !== ROLES.KILLER).length;
  gameState.killerCount = gameState.players.filter(p => p.alive && p.role === ROLES.KILLER).length;
}

export function updateGameLogic(p) {
  // Update all players
  gameState.players.forEach(player => {
    if (player.alive) {
      player.update(p.frameCount);
    }
  });
  
  // Phase timer
  gameState.phaseTimer++;
  
  // Handle phase transitions and AI actions
  handlePhaseLogic(p);
  
  // Check win/lose conditions
  checkGameOver(p);
}

function handlePhaseLogic(p) {
  const phase = gameState.playPhase;
  
  switch (phase) {
    case PLAY_PHASES.NIGHT:
      handleNightPhase(p);
      break;
    case PLAY_PHASES.NIGHT_RESULT:
      if (gameState.phaseTimer > 120) {
        startDayPhase(p);
      }
      break;
    case PLAY_PHASES.DAY_DISCUSSION:
      if (gameState.phaseTimer > 240) {
        startVotingPhase(p);
      }
      break;
    case PLAY_PHASES.DAY_VOTING:
      handleVotingPhase(p);
      break;
    case PLAY_PHASES.TRIAL_DEFENSE:
      if (gameState.phaseTimer > 120) {
        startTrialJudgment(p);
      }
      break;
    case PLAY_PHASES.TRIAL_JUDGMENT:
      handleTrialJudgment(p);
      break;
    case PLAY_PHASES.TRIAL_RESULT:
      if (gameState.phaseTimer > 120) {
        startNightPhase(p);
      }
      break;
  }
}

function handleNightPhase(p) {
  // AI players make their night actions
  if (gameState.phaseTimer === 30) {
    executeNightActions(p);
  }
  
  // Check if all actions are done
  const allActionsComplete = checkAllNightActionsComplete();
  
  if (allActionsComplete && gameState.phaseTimer > 60) {
    resolveNightActions(p);
  }
}

function executeNightActions(p) {
  // Killer chooses target
  const killer = gameState.players.find(p => p.alive && p.role === ROLES.KILLER);
  if (killer && !killer.isPlayerControlled) {
    const targets = gameState.players.filter((p, i) => p.alive && i !== killer.index);
    if (targets.length > 0) {
      gameState.killerTarget = targets[Math.floor(Math.random() * targets.length)].index;
    }
  }
  
  // Doctor chooses target
  const doctor = gameState.players.find(p => p.alive && p.role === ROLES.DOCTOR);
  if (doctor && !doctor.isPlayerControlled) {
    const targets = gameState.players.filter((p, i) => p.alive);
    if (targets.length > 0) {
      gameState.doctorTarget = targets[Math.floor(Math.random() * targets.length)].index;
    }
  }
  
  // Sheriff chooses target
  const sheriff = gameState.players.find(p => p.alive && p.role === ROLES.SHERIFF);
  if (sheriff && !sheriff.isPlayerControlled) {
    const targets = gameState.players.filter((p, i) => p.alive && i !== sheriff.index);
    if (targets.length > 0) {
      gameState.sheriffTarget = targets[Math.floor(Math.random() * targets.length)].index;
    }
  }
}

function checkAllNightActionsComplete() {
  const player = gameState.player;
  
  if (!player.alive) return true;
  
  if (player.role === ROLES.KILLER) {
    return gameState.killerTarget !== -1;
  } else if (player.role === ROLES.DOCTOR) {
    return gameState.doctorTarget !== -1;
  } else if (player.role === ROLES.SHERIFF) {
    return gameState.sheriffTarget !== -1;
  }
  
  return true; // Townies don't have night actions
}

function resolveNightActions(p) {
  let deathOccurred = false;
  let savedByDoctor = false;
  
  // Check if doctor saved the target
  if (gameState.doctorTarget === gameState.killerTarget) {
    savedByDoctor = true;
  } else if (gameState.killerTarget !== -1) {
    gameState.players[gameState.killerTarget].alive = false;
    deathOccurred = true;
  }
  
  // Log night results
  p.logs.game_info.push({
    data: { 
      phase: "NIGHT_RESOLVED",
      killerTarget: gameState.killerTarget,
      savedByDoctor: savedByDoctor,
      deathOccurred: deathOccurred
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  updateCounts();
  
  gameState.playPhase = PLAY_PHASES.NIGHT_RESULT;
  gameState.phaseTimer = 0;
}

function startDayPhase(p) {
  gameState.currentDay++;
  gameState.playPhase = PLAY_PHASES.DAY_DISCUSSION;
  gameState.phaseTimer = 0;
  
  p.logs.game_info.push({
    data: { phase: "DAY_START", day: gameState.currentDay },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startVotingPhase(p) {
  gameState.playPhase = PLAY_PHASES.DAY_VOTING;
  gameState.phaseTimer = 0;
  gameState.votes = {};
  gameState.votingTarget = -1;
  gameState.hasVoted = false;
  gameState.selectedOption = 0;
  
  // Build menu options
  gameState.menuOptions = gameState.players
    .map((p, i) => ({ index: i, name: p.name, alive: p.alive }))
    .filter(p => p.alive);
  
  // AI votes
  setTimeout(() => aiVote(p), 100);
}

function aiVote(p) {
  gameState.players.forEach((player, i) => {
    if (!player.isPlayerControlled && player.alive) {
      const aliveIndices = gameState.players
        .map((p, idx) => ({ idx, alive: p.alive }))
        .filter(p => p.alive && p.idx !== i)
        .map(p => p.idx);
      
      if (aliveIndices.length > 0) {
        const vote = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
        gameState.votes[i] = vote;
      }
    }
  });
}

function handleVotingPhase(p) {
  // Check if voting is complete
  if (gameState.hasVoted && gameState.phaseTimer > 60) {
    tallyVotes(p);
  }
}

function tallyVotes(p) {
  const voteCounts = {};
  
  Object.values(gameState.votes).forEach(target => {
    voteCounts[target] = (voteCounts[target] || 0) + 1;
  });
  
  // Find player with most votes
  let maxVotes = 0;
  let accused = -1;
  
  Object.entries(voteCounts).forEach(([target, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      accused = parseInt(target);
    }
  });
  
  if (accused !== -1 && maxVotes >= Math.floor(gameState.aliveCount / 2)) {
    gameState.onTrial = accused;
    gameState.playPhase = PLAY_PHASES.TRIAL_DEFENSE;
    gameState.phaseTimer = 0;
    
    p.logs.game_info.push({
      data: { phase: "TRIAL_START", accused: accused },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // No one voted out
    startNightPhase(p);
  }
}

function startTrialJudgment(p) {
  gameState.playPhase = PLAY_PHASES.TRIAL_JUDGMENT;
  gameState.phaseTimer = 0;
  gameState.trialVotes = { guilty: 0, innocent: 0, abstain: 0 };
  gameState.hasVoted = false;
  gameState.selectedOption = 0;
  
  // AI votes
  setTimeout(() => aiTrialVote(p), 100);
}

function aiTrialVote(p) {
  gameState.players.forEach((player, i) => {
    if (!player.isPlayerControlled && player.alive && i !== gameState.onTrial) {
      const vote = Math.random();
      if (vote < 0.4) {
        gameState.trialVotes.guilty++;
      } else if (vote < 0.8) {
        gameState.trialVotes.innocent++;
      } else {
        gameState.trialVotes.abstain++;
      }
    }
  });
}

function handleTrialJudgment(p) {
  if (gameState.hasVoted && gameState.phaseTimer > 60) {
    resolveTrialJudgment(p);
  }
}

function resolveTrialJudgment(p) {
  const guilty = gameState.trialVotes.guilty;
  const innocent = gameState.trialVotes.innocent;
  
  if (guilty > innocent) {
    gameState.players[gameState.onTrial].alive = false;
    updateCounts();
    
    // Award points based on role eliminated
    const eliminatedRole = gameState.players[gameState.onTrial].role;
    if (eliminatedRole === ROLES.KILLER) {
      gameState.score += 500;
    } else {
      gameState.score += 50;
    }
  }
  
  p.logs.game_info.push({
    data: { 
      phase: "TRIAL_RESOLVED",
      target: gameState.onTrial,
      guilty: guilty > innocent
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.playPhase = PLAY_PHASES.TRIAL_RESULT;
  gameState.phaseTimer = 0;
}

function startNightPhase(p) {
  gameState.playPhase = PLAY_PHASES.NIGHT;
  gameState.phaseTimer = 0;
  gameState.nightTarget = -1;
  gameState.killerTarget = -1;
  gameState.doctorTarget = -1;
  gameState.sheriffTarget = -1;
  gameState.selectedOption = 0;
  
  // Build menu options for night actions
  if (gameState.player.alive) {
    if (gameState.player.role === ROLES.KILLER) {
      gameState.menuOptions = gameState.players
        .map((p, i) => ({ index: i, name: p.name, alive: p.alive }))
        .filter((p, i) => p.alive && i !== gameState.playerIndex);
    } else if (gameState.player.role === ROLES.DOCTOR) {
      gameState.menuOptions = gameState.players
        .map((p, i) => ({ index: i, name: p.name, alive: p.alive }))
        .filter(p => p.alive);
    } else if (gameState.player.role === ROLES.SHERIFF) {
      gameState.menuOptions = gameState.players
        .map((p, i) => ({ index: i, name: p.name, alive: p.alive }))
        .filter((p, i) => p.alive && i !== gameState.playerIndex);
    }
  }
  
  p.logs.game_info.push({
    data: { phase: "NIGHT_START", day: gameState.currentDay },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function checkGameOver(p) {
  // Town wins if Killer is dead
  if (gameState.killerCount === 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 1000;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", result: "WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  // Killer wins if equal or more Killers than Town
  else if (gameState.killerCount >= gameState.townCount) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", result: "LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}