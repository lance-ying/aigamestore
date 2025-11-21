// gameLogic.js - Core game logic functions
import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PASSENGER_PICKUP_TIME, BUS_TYPES } from './globals.js';
import { Passenger } from './passenger.js';

export function initializeRoute(p, busStops) {
  gameState.currentRoute = busStops;
  gameState.routeProgress = 0;
  gameState.passengers = 0;
  gameState.accidents = 0;
  gameState.stopTimer = 0;
  gameState.atStop = false;
  gameState.currentStopIndex = -1;
  
  // Reset visited status
  for (let stop of busStops) {
    stop.visited = false;
  }
}

export function updateRouteProgress(p, bus, busStops, passengers) {
  if (gameState.routeProgress >= busStops.length) {
    return;
  }

  const currentStop = busStops[gameState.routeProgress];
  const atCurrentStop = currentStop.checkArrival(bus.x, bus.y);

  // Check if bus is at stop and moving slowly
  if (atCurrentStop && Math.abs(bus.speed) < 0.5) {
    if (!gameState.atStop) {
      gameState.atStop = true;
      gameState.currentStopIndex = gameState.routeProgress;
      gameState.stopTimer = 0;
    }
    
    gameState.stopTimer++;
    
    // Pick up passengers
    if (gameState.stopTimer === 15 && !currentStop.visited) {
      const pickupCount = Math.min(currentStop.waitingPassengers, gameState.maxPassengers - gameState.passengers);
      gameState.passengers += pickupCount;
      
      // Create boarding animations
      for (let i = 0; i < pickupCount; i++) {
        const passenger = new Passenger(p, bus.x + p.random(-10, 10), bus.y + p.random(-10, 10), true);
        passengers.push(passenger);
      }
    }
    
    // Drop off passengers and complete stop
    if (gameState.stopTimer >= PASSENGER_PICKUP_TIME) {
      if (!currentStop.visited) {
        // Drop off some passengers
        const dropoffCount = p.floor(gameState.passengers * 0.4);
        gameState.passengers -= dropoffCount;
        
        // Create exiting animations
        for (let i = 0; i < dropoffCount; i++) {
          const passenger = new Passenger(p, bus.x + p.random(-10, 10), bus.y + p.random(-10, 10), false);
          passengers.push(passenger);
        }
        
        currentStop.visited = true;
        gameState.routeProgress++;
        
        // Award credits for completing stop
        gameState.credits += 50;
      }
      
      gameState.atStop = false;
      gameState.currentStopIndex = -1;
      gameState.stopTimer = 0;
    }
  } else {
    gameState.atStop = false;
    gameState.currentStopIndex = -1;
    gameState.stopTimer = 0;
  }
}

export function checkWinCondition() {
  if (gameState.routeProgress >= gameState.currentRoute.length) {
    gameState.completedRoutes++;
    
    // Bonus for no accidents
    if (gameState.accidents === 0) {
      gameState.credits += 200;
    } else {
      gameState.credits += 100;
    }
    
    // Unlock new bus if enough credits
    if (gameState.unlockedBuses < BUS_TYPES.length) {
      const nextBusCost = BUS_TYPES[gameState.unlockedBuses].cost;
      if (gameState.credits >= nextBusCost) {
        gameState.unlockedBuses++;
        gameState.currentBusType = gameState.unlockedBuses - 1;
      }
    }
    
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    return true;
  }
  return false;
}

export function checkLoseCondition() {
  if (gameState.timeRemaining <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return true;
  }
  
  if (gameState.accidents >= 3) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return true;
  }
  
  return false;
}

export function handleCollisions(bus, obstacles) {
  const busCorners = bus.getCorners();
  
  for (let obstacle of obstacles) {
    if (obstacle.checkCollision(busCorners)) {
      // Push bus back slightly
      bus.x -= bus.vx * 1.5;
      bus.y -= bus.vy * 1.5;
      bus.speed *= -0.3;
      
      // Record accident
      gameState.accidents++;
      
      return true;
    }
  }
  
  return false;
}