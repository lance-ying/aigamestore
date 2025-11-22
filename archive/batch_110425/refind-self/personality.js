// personality.js - Personality tracking and analysis

import { gameState } from './globals.js';

export function trackAction(actionType, data = {}) {
  const action = {
    type: actionType,
    timestamp: Date.now(),
    frameCount: gameState.frameCount,
    data: data
  };
  
  gameState.actionsTracked.push(action);
  
  // Update personality traits based on action
  updatePersonalityTraits(actionType, data);
  
  // Update personality meter (increase by small amount)
  const increase = 0.5;
  gameState.personalityMeter = Math.min(100, gameState.personalityMeter + increase);
  
  // Update score
  gameState.score = Math.floor(gameState.personalityMeter);
}

function updatePersonalityTraits(actionType, data) {
  const traits = gameState.personalityTraits;
  
  switch (actionType) {
    case 'movement':
      traits.curious += 0.1;
      break;
    case 'exploration':
      traits.curious += 0.5;
      break;
    case 'dialogue_choice':
      if (data.trait) {
        traits[data.trait] = (traits[data.trait] || 0) + 1;
      }
      break;
    case 'puzzle_solved':
      traits.logical += 1;
      traits.creative += 0.5;
      break;
    case 'npc_interaction':
      traits.empathetic += 0.3;
      break;
    case 'object_interaction':
      traits.curious += 0.4;
      break;
  }
}

export function getDominantPersonalityType() {
  const traits = gameState.personalityTraits;
  let maxTrait = 'curious';
  let maxValue = traits.curious;
  
  for (const [trait, value] of Object.entries(traits)) {
    if (value > maxValue) {
      maxValue = value;
      maxTrait = trait;
    }
  }
  
  const profiles = {
    curious: {
      name: "The Explorer",
      description: "You are driven by curiosity and a desire to understand the world around you. You seek knowledge and new experiences.",
      color: [100, 200, 255]
    },
    logical: {
      name: "The Analyst",
      description: "You approach problems systematically and value rational thinking. You excel at solving complex challenges.",
      color: [150, 200, 255]
    },
    empathetic: {
      name: "The Connector",
      description: "You value relationships and understanding others. Your emotional intelligence guides your decisions.",
      color: [200, 150, 255]
    },
    decisive: {
      name: "The Leader",
      description: "You make quick decisions and take action. You're confident in your choices and direction.",
      color: [255, 200, 100]
    },
    creative: {
      name: "The Innovator",
      description: "You think outside the box and find unique solutions. Your imagination shapes your path.",
      color: [255, 150, 200]
    }
  };
  
  return profiles[maxTrait] || profiles.curious;
}

export function getPersonalityBreakdown() {
  const traits = gameState.personalityTraits;
  const total = Object.values(traits).reduce((sum, val) => sum + val, 0) || 1;
  
  const breakdown = {};
  for (const [trait, value] of Object.entries(traits)) {
    breakdown[trait] = Math.round((value / total) * 100);
  }
  
  return breakdown;
}