// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, PLAY_PHASES, ROLES } from './globals.js';

// Test 1: Basic testing - random valid actions
function getBasicTestAction(state) {
  const phase = state.playPhase;
  const player = state.player;
  
  if (!player || !player.alive) {
    return null;
  }
  
  // Night phase - select random target
  if (phase === PLAY_PHASES.NIGHT) {
    if (player.role === ROLES.TOWNIE) {
      return null; // No action for townies
    }
    
    if (player.role === ROLES.KILLER && state.killerTarget === -1) {
      // Random selection
      if (Math.random() < 0.05) {
        return { keyCode: 40, key: 'ArrowDown' }; // Navigate
      }
      if (Math.random() < 0.1) {
        return { keyCode: 32, key: ' ' }; // Confirm
      }
    } else if (player.role === ROLES.DOCTOR && state.doctorTarget === -1) {
      if (Math.random() < 0.05) {
        return { keyCode: 40, key: 'ArrowDown' };
      }
      if (Math.random() < 0.1) {
        return { keyCode: 32, key: ' ' };
      }
    } else if (player.role === ROLES.SHERIFF && state.sheriffTarget === -1) {
      if (Math.random() < 0.05) {
        return { keyCode: 40, key: 'ArrowDown' };
      }
      if (Math.random() < 0.1) {
        return { keyCode: 32, key: ' ' };
      }
    }
  }
  
  // Voting phase
  if (phase === PLAY_PHASES.DAY_VOTING && !state.hasVoted) {
    if (Math.random() < 0.05) {
      return { keyCode: 40, key: 'ArrowDown' };
    }
    if (Math.random() < 0.1) {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  // Trial judgment
  if (phase === PLAY_PHASES.TRIAL_JUDGMENT && !state.hasVoted && state.playerIndex !== state.onTrial) {
    if (Math.random() < 0.05) {
      return { keyCode: 39, key: 'ArrowRight' };
    }
    if (Math.random() < 0.1) {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  return null;
}

// Test 2: Win strategy - identify and eliminate the killer
function getWinStrategyAction(state) {
  const phase = state.playPhase;
  const player = state.player;
  
  if (!player || !player.alive) {
    return null;
  }
  
  // Night phase actions
  if (phase === PLAY_PHASES.NIGHT) {
    if (player.role === ROLES.SHERIFF && state.sheriffTarget === -1) {
      // Systematically investigate players
      const uninvestigated = state.players
        .map((p, i) => ({ index: i, investigated: state.investigationResults.some(r => r.target === i) }))
        .filter(p => !p.investigated && p.index !== state.playerIndex && state.players[p.index].alive);
      
      if (uninvestigated.length > 0) {
        const targetIndex = uninvestigated[0].index;
        const optionIndex = state.menuOptions.findIndex(opt => opt.index === targetIndex);
        
        if (optionIndex !== -1) {
          if (state.selectedOption < optionIndex) {
            return { keyCode: 40, key: 'ArrowDown' };
          } else if (state.selectedOption > optionIndex) {
            return { keyCode: 38, key: 'ArrowUp' };
          } else {
            return { keyCode: 32, key: ' ' };
          }
        }
      }
      
      // Investigate anyone if no uninvestigated
      if (state.selectedOption === 0 && state.menuOptions.length > 0) {
        return { keyCode: 32, key: ' ' };
      }
    } else if (player.role === ROLES.DOCTOR && state.doctorTarget === -1) {
      // Protect Sheriff if known, or random high-value target
      const sheriffIndex = state.players.findIndex(p => p.alive && p.role === ROLES.SHERIFF);
      if (sheriffIndex !== -1 && sheriffIndex !== state.playerIndex) {
        const optionIndex = state.menuOptions.findIndex(opt => opt.index === sheriffIndex);
        
        if (optionIndex !== -1) {
          if (state.selectedOption < optionIndex) {
            return { keyCode: 40, key: 'ArrowDown' };
          } else if (state.selectedOption > optionIndex) {
            return { keyCode: 38, key: 'ArrowUp' };
          } else {
            return { keyCode: 32, key: ' ' };
          }
        }
      }
      
      // Protect self or first option
      if (state.selectedOption === 0) {
        return { keyCode: 32, key: ' ' };
      }
    } else if (player.role === ROLES.KILLER && state.killerTarget === -1) {
      // Target Doctor or Sheriff first, then others
      const priorityTargets = state.players
        .map((p, i) => ({ index: i, role: p.role, alive: p.alive }))
        .filter(p => p.alive && p.index !== state.playerIndex)
        .sort((a, b) => {
          const priority = { [ROLES.SHERIFF]: 3, [ROLES.DOCTOR]: 2, [ROLES.TOWNIE]: 1 };
          return (priority[b.role] || 0) - (priority[a.role] || 0);
        });
      
      if (priorityTargets.length > 0) {
        const targetIndex = priorityTargets[0].index;
        const optionIndex = state.menuOptions.findIndex(opt => opt.index === targetIndex);
        
        if (optionIndex !== -1) {
          if (state.selectedOption < optionIndex) {
            return { keyCode: 40, key: 'ArrowDown' };
          } else if (state.selectedOption > optionIndex) {
            return { keyCode: 38, key: 'ArrowUp' };
          } else {
            return { keyCode: 32, key: ' ' };
          }
        }
      }
    }
  }
  
  // Voting phase - vote for known killer or suspicious players
  if (phase === PLAY_PHASES.DAY_VOTING && !state.hasVoted) {
    // Check investigation results for killer
    const knownKiller = state.investigationResults.find(r => r.isKiller);
    
    if (knownKiller && state.players[knownKiller.target].alive) {
      const optionIndex = state.menuOptions.findIndex(opt => opt.index === knownKiller.target);
      
      if (optionIndex !== -1) {
        if (state.selectedOption < optionIndex) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else if (state.selectedOption > optionIndex) {
          return { keyCode: 38, key: 'ArrowUp' };
        } else {
          return { keyCode: 32, key: ' ' };
        }
      }
    }
    
    // Vote for random alive player if no info
    if (state.menuOptions.length > 0) {
      if (state.selectedOption === 0) {
        return { keyCode: 32, key: ' ' };
      }
      if (Math.random() < 0.1) {
        return { keyCode: 40, key: 'ArrowDown' };
      }
    }
  }
  
  // Trial judgment - vote guilty if known killer, otherwise use judgment
  if (phase === PLAY_PHASES.TRIAL_JUDGMENT && !state.hasVoted && state.playerIndex !== state.onTrial) {
    const accused = state.onTrial;
    const isKnownKiller = state.investigationResults.some(r => r.target === accused && r.isKiller);
    
    if (isKnownKiller) {
      // Vote guilty
      if (state.selectedOption !== 0) {
        return { keyCode: 37, key: 'ArrowLeft' };
      } else {
        return { keyCode: 32, key: ' ' };
      }
    } else {
      // Check if confirmed innocent
      const isKnownInnocent = state.investigationResults.some(r => r.target === accused && !r.isKiller);
      
      if (isKnownInnocent) {
        // Vote innocent
        if (state.selectedOption !== 1) {
          return state.selectedOption < 1 ? 
            { keyCode: 39, key: 'ArrowRight' } : 
            { keyCode: 37, key: 'ArrowLeft' };
        } else {
          return { keyCode: 32, key: ' ' };
        }
      } else {
        // Abstain if unsure
        if (state.selectedOption !== 2) {
          return { keyCode: 39, key: 'ArrowRight' };
        } else {
          return { keyCode: 32, key: ' ' };
        }
      }
    }
  }
  
  return null;
}

// Test 3: Survival strategy - focus on self-preservation
function getSurvivalStrategyAction(state) {
  const phase = state.playPhase;
  const player = state.player;
  
  if (!player || !player.alive) {
    return null;
  }
  
  // Night phase
  if (phase === PLAY_PHASES.NIGHT) {
    if (player.role === ROLES.DOCTOR && state.doctorTarget === -1) {
      // Protect self
      const selfIndex = state.menuOptions.findIndex(opt => opt.index === state.playerIndex);
      
      if (selfIndex !== -1) {
        if (state.selectedOption < selfIndex) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else if (state.selectedOption > selfIndex) {
          return { keyCode: 38, key: 'ArrowUp' };
        } else {
          return { keyCode: 32, key: ' ' };
        }
      }
    } else if (player.role === ROLES.SHERIFF && state.sheriffTarget === -1) {
      // Investigate quickly
      if (state.selectedOption === 0 && state.menuOptions.length > 0) {
        return { keyCode: 32, key: ' ' };
      }
    } else if (player.role === ROLES.KILLER && state.killerTarget === -1) {
      // Kill quickly
      if (state.selectedOption === 0 && state.menuOptions.length > 0) {
        return { keyCode: 32, key: ' ' };
      }
    }
  }
  
  // Voting - vote for someone else randomly
  if (phase === PLAY_PHASES.DAY_VOTING && !state.hasVoted) {
    if (state.menuOptions.length > 0) {
      // Avoid voting for self
      const nonSelfOptions = state.menuOptions.filter(opt => opt.index !== state.playerIndex);
      if (nonSelfOptions.length > 0) {
        const currentOption = state.menuOptions[state.selectedOption];
        if (currentOption.index === state.playerIndex && state.selectedOption < state.menuOptions.length - 1) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else {
          return { keyCode: 32, key: ' ' };
        }
      }
    }
  }
  
  // Trial - vote innocent on self, random otherwise
  if (phase === PLAY_PHASES.TRIAL_JUDGMENT && !state.hasVoted && state.playerIndex !== state.onTrial) {
    if (Math.random() < 0.5) {
      // Vote innocent
      if (state.selectedOption !== 1) {
        return state.selectedOption < 1 ? 
          { keyCode: 39, key: 'ArrowRight' } : 
          { keyCode: 37, key: 'ArrowLeft' };
      } else {
        return { keyCode: 32, key: ' ' };
      }
    } else {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  return null;
}

export function get_automated_testing_action(state) {
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getWinStrategyAction(state);
    case "TEST_3":
      return getSurvivalStrategyAction(state);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;