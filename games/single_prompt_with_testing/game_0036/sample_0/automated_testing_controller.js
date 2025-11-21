// automated_testing_controller.js - Automated testing strategies
import { gameState } from './globals.js';
import { getSceneData } from './story_data.js';

const actionHistory = [];
const positionHistory = [];

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getWinStrategyAction(state);
    case "TEST_3":
      return getDeathTestAction(state);
    case "TEST_4":
      return getItemCollectionAction(state);
    default:
      return getRandomAction(state);
  }
}

function getBasicTestAction(state) {
  // Test basic navigation and selection
  if (state.gamePhase === "START") {
    return null; // Let human start
  }
  
  if (state.gamePhase !== "PLAYING") {
    return null;
  }
  
  const scene = getSceneData(state.currentChapter, state.currentScene);
  const numChoices = scene.choices.length;
  
  // Cycle through options
  const frameCount = actionHistory.length;
  
  if (frameCount % 60 < 20) {
    return { key: 'ArrowDown', keyCode: 40 };
  } else if (frameCount % 60 < 40) {
    return { key: 'ArrowUp', keyCode: 38 };
  } else {
    // Select first valid option
    return { key: ' ', keyCode: 32 };
  }
}

function getWinStrategyAction(state) {
  // Optimal strategy to win the game
  if (state.gamePhase === "START" || state.gamePhase !== "PLAYING") {
    return null;
  }
  
  const scene = getSceneData(state.currentChapter, state.currentScene);
  const choices = scene.choices;
  
  // Strategy: Choose options that balance stats and avoid death
  let bestChoice = 0;
  let bestScore = -Infinity;
  
  choices.forEach((choice, index) => {
    let score = 0;
    
    // Avoid death
    if (choice.outcome === 'death') {
      score -= 10000;
    }
    
    // Check if we can afford requirements
    const canAfford = 
      (!choice.requiresCharm || state.player.charm >= choice.requiresCharm) &&
      (!choice.requiresWisdom || state.player.wisdom >= choice.requiresWisdom) &&
      (!choice.requiresCourage || state.player.courage >= choice.requiresCourage);
    
    if (!canAfford) {
      score -= 5000;
    }
    
    // Prioritize balanced stat growth
    if (choice.statChanges) {
      const charm = state.player.charm + (choice.statChanges.charm || 0);
      const wisdom = state.player.wisdom + (choice.statChanges.wisdom || 0);
      const courage = state.player.courage + (choice.statChanges.courage || 0);
      
      const avg = (charm + wisdom + courage) / 3;
      const variance = 
        Math.pow(charm - avg, 2) + 
        Math.pow(wisdom - avg, 2) + 
        Math.pow(courage - avg, 2);
      
      score -= variance; // Lower variance is better
      score += charm + wisdom + courage; // Higher totals better
    }
    
    // Value items and hidden stories
    if (choice.item) score += 500;
    if (choice.hiddenStory) score += 300;
    
    // Prefer options that advance the story
    if (choice.outcome === 'win') score += 20000;
    if (choice.outcome === 'chapter_complete') score += 1000;
    if (choice.outcome === 'success') score += 100;
    
    if (score > bestScore) {
      bestScore = score;
      bestChoice = index;
    }
  });
  
  // Navigate to best choice
  if (state.selectedOption !== bestChoice) {
    if (state.selectedOption < bestChoice) {
      return { key: 'ArrowDown', keyCode: 40 };
    } else {
      return { key: 'ArrowUp', keyCode: 38 };
    }
  } else {
    // Select it
    actionHistory.push('select');
    return { key: ' ', keyCode: 32 };
  }
}

function getDeathTestAction(state) {
  // Deliberately trigger death scenarios
  if (state.gamePhase !== "PLAYING") {
    return null;
  }
  
  const scene = getSceneData(state.currentChapter, state.currentScene);
  const choices = scene.choices;
  
  // Find a death option
  let deathChoice = choices.findIndex(c => c.outcome === 'death');
  
  if (deathChoice === -1) {
    // No death option, pick risky one
    deathChoice = choices.findIndex(c => c.outcome === 'risky');
  }
  
  if (deathChoice === -1) {
    deathChoice = 0; // Default
  }
  
  // Navigate to death choice
  if (state.selectedOption !== deathChoice) {
    if (state.selectedOption < deathChoice) {
      return { key: 'ArrowDown', keyCode: 40 };
    } else {
      return { key: 'ArrowUp', keyCode: 38 };
    }
  } else {
    return { key: ' ', keyCode: 32 };
  }
}

function getItemCollectionAction(state) {
  // Focus on collecting items and finding hidden stories
  if (state.gamePhase !== "PLAYING") {
    return null;
  }
  
  const scene = getSceneData(state.currentChapter, state.currentScene);
  const choices = scene.choices;
  
  // Find choice with item or hidden story
  let targetChoice = choices.findIndex(c => c.item || c.hiddenStory);
  
  if (targetChoice === -1) {
    // No collectible, choose safe option
    targetChoice = choices.findIndex(c => c.outcome !== 'death');
    if (targetChoice === -1) targetChoice = 0;
  }
  
  // Navigate to target choice
  if (state.selectedOption !== targetChoice) {
    if (state.selectedOption < targetChoice) {
      return { key: 'ArrowDown', keyCode: 40 };
    } else {
      return { key: 'ArrowUp', keyCode: 38 };
    }
  } else {
    return { key: ' ', keyCode: 32 };
  }
}

function getRandomAction(state) {
  if (state.gamePhase !== "PLAYING") {
    return null;
  }
  
  const actions = [
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 }
  ];
  
  const rand = Math.floor(Math.random() * actions.length);
  return actions[rand];
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;