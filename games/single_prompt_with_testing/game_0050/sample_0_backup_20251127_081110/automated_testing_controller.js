// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';
import { getAvailableEvolutions, canPurchaseEvolution } from './evolution.js';

function getTestWinAction(gameState) {
  if (gameState.evolutionMenuOpen) {
    // In evolution menu - try to purchase upgrades
    const available = getAvailableEvolutions(gameState.evolutionCategory);
    
    if (available.length > 0) {
      const evolution = available[gameState.evolutionMenuIndex];
      if (canPurchaseEvolution(gameState.evolutionCategory, evolution.id)) {
        return { keyCode: 32 }; // Space to purchase
      } else {
        // Navigate to next item
        return { keyCode: 40 }; // Down
      }
    } else {
      // Switch category
      return { keyCode: 39 }; // Right
    }
  }
  
  // Strategy: Build infectivity first, then lethality
  const totalInfected = gameState.infectedPopulation / gameState.totalPopulation;
  
  // Open evolution menu periodically
  if (gameState.dnaPoints >= 5 && Math.random() < 0.1) {
    return { keyCode: 90 }; // Z to open menu
  }
  
  // Speed up time
  if (Math.random() < 0.3) {
    return { keyCode: 16 }; // Shift
  }
  
  // Navigate countries to collect DNA bubbles
  if (gameState.dnaBubbles.length > 0 && Math.random() < 0.2) {
    const bubble = gameState.dnaBubbles[0];
    const country = gameState.countries[gameState.selectedCountryIndex];
    
    if (country) {
      const dx = bubble.x - country.x;
      const dy = bubble.y - country.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 50) {
        return { keyCode: 32 }; // Space to collect
      } else {
        // Move towards bubble
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Right or Left
        } else {
          return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // Down or Up
        }
      }
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Basic testing - just explore the UI
  const actions = [90, 37, 39, 38, 40, 32]; // Z, arrows, space
  const rand = Math.random();
  
  if (rand < 0.1) {
    return { keyCode: 90 }; // Toggle evolution menu
  } else if (rand < 0.3) {
    return { keyCode: 16 }; // Speed up
  } else if (rand < 0.5) {
    return { keyCode: actions[Math.floor(Math.random() * 4) + 1] }; // Random arrow
  } else if (rand < 0.6) {
    return { keyCode: 32 }; // Space
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;