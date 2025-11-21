import { CANVAS_WIDTH, CANVAS_HEIGHT, STATION_WIDTH, STATIONS, COLORS, FLAVORS, TOPPINGS, SETTINGS } from './globals.js';
import { Sundae } from './sundae.js';

export function drawStations(p, gameState) {
  // Draw station backgrounds
  for (let i = 0; i < 4; i++) {
    p.fill(i === gameState.player.currentStation ? COLORS.STATION_ACTIVE : COLORS.STATION_BG);
    p.rect(i * STATION_WIDTH, 0, STATION_WIDTH, CANVAS_HEIGHT);
    
    // Station dividers
    p.stroke(100);
    p.line(i * STATION_WIDTH, 0, i * STATION_WIDTH, CANVAS_HEIGHT);
    p.noStroke();
    
    // Station labels
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.textAlign(p.CENTER);
    
    const stationNames = ["Order", "Build", "Blend", "Top"];
    p.text(stationNames[i], i * STATION_WIDTH + STATION_WIDTH / 2, 30);
    
    // Draw completion indicator
    if (gameState.stationProgress[i]) {
      p.fill(0, 200, 0);
      p.ellipse(i * STATION_WIDTH + STATION_WIDTH - 20, 20, 10, 10);
    }
  }
  
  // Draw current station content
  switch (gameState.player.currentStation) {
    case STATIONS.ORDER:
      drawOrderStation(p, gameState);
      break;
    case STATIONS.BUILD:
      drawBuildStation(p, gameState);
      break;
    case STATIONS.BLEND:
      drawBlendStation(p, gameState);
      break;
    case STATIONS.TOP:
      drawTopStation(p, gameState);
      break;
  }
}

function drawOrderStation(p, gameState) {
  const stationX = 0;
  const stationY = 50;
  
  p.fill(COLORS.TEXT);
  p.textSize(14);
  p.textAlign(p.CENTER);
  
  if (gameState.customers.length > 0) {
    // Draw the first customer in line
    const customer = gameState.customers[0];
    customer.draw(p, stationX + STATION_WIDTH / 2, stationY + 100);
    customer.drawOrder(p, stationX + STATION_WIDTH / 2 - 30, stationY + 100);
    
    // Draw take order button
    const buttonY = stationY + 200;
    p.fill(gameState.player.selectedOption === 0 ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
    p.rect(stationX + 20, buttonY, STATION_WIDTH - 40, 30);
    p.fill(255);
    p.text("Take Order", stationX + STATION_WIDTH / 2, buttonY + 20);
    
    // Show waiting customers count
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT);
    p.text(`Waiting: ${gameState.customers.length - 1}`, stationX + 10, CANVAS_HEIGHT - 20);
  } else {
    p.text("Waiting for customers...", stationX + STATION_WIDTH / 2, stationY + 100);
  }
  
  // Draw current score
  p.textAlign(p.CENTER);
  p.text(`Tips: $${gameState.tips}`, stationX + STATION_WIDTH / 2, CANVAS_HEIGHT - 40);
  p.text(`Served: ${gameState.servedCustomers}/${SETTINGS.DAILY_GOAL}`, stationX + STATION_WIDTH / 2, CANVAS_HEIGHT - 20);
}

function drawBuildStation(p, gameState) {
  const stationX = STATION_WIDTH;
  const stationY = 50;
  
  if (!gameState.currentOrder) {
    p.fill(COLORS.TEXT);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text("Take an order first!", stationX + STATION_WIDTH / 2, stationY + 100);
    return;
  }
  
  // Draw flavor selection
  p.fill(COLORS.TEXT);
  p.textSize(14);
  p.textAlign(p.CENTER);
  p.text("Select Flavor:", stationX + STATION_WIDTH / 2, stationY + 20);
  
  for (let i = 0; i < FLAVORS.length; i++) {
    const y = stationY + 50 + i * 30;
    p.fill(i === gameState.player.selectedOption ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
    p.rect(stationX + 20, y, STATION_WIDTH - 40, 25);
    
    p.fill(255);
    p.text(FLAVORS[i].name, stationX + STATION_WIDTH / 2, y + 17);
  }
  
  // Draw pour button
  const pourY = stationY + 220;
  p.fill(gameState.player.selectedOption === FLAVORS.length ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, pourY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Pour (Hold Z)", stationX + STATION_WIDTH / 2, pourY + 20);
  
  // Draw confirm button
  const confirmY = stationY + 260;
  p.fill(gameState.player.selectedOption === FLAVORS.length + 1 ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, confirmY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Confirm", stationX + STATION_WIDTH / 2, confirmY + 20);
  
  // Draw sundae preview
  if (gameState.currentSundae) {
    gameState.currentSundae.draw(p, stationX + STATION_WIDTH / 2, stationY + 150);
    
    // Draw pour meter
    p.fill(COLORS.TEXT);
    p.text(`Amount: ${Math.round(gameState.currentSundae.amount)}%`, stationX + STATION_WIDTH / 2, stationY + 300);
    
    p.fill(200);
    p.rect(stationX + 20, stationY + 320, STATION_WIDTH - 40, 10);
    
    // Optimal range
    p.fill(0, 200, 0, 100);
    const optimalWidth = (SETTINGS.POUR_OPTIMAL_MAX - SETTINGS.POUR_OPTIMAL_MIN) / 100 * (STATION_WIDTH - 40);
    const optimalX = stationX + 20 + (SETTINGS.POUR_OPTIMAL_MIN / 100 * (STATION_WIDTH - 40));
    p.rect(optimalX, stationY + 320, optimalWidth, 10);
    
    // Current amount
    p.fill(0, 0, 200);
    const amountWidth = (gameState.currentSundae.amount / 100) * (STATION_WIDTH - 40);
    p.rect(stationX + 20, stationY + 320, amountWidth, 10);
  }
  
  // Draw target amount from order
  if (gameState.currentOrder) {
    p.fill(COLORS.TEXT);
    p.text(`Target: ${Math.round(gameState.currentOrder.amount)}%`, stationX + STATION_WIDTH / 2, stationY + 340);
  }
}

function drawBlendStation(p, gameState) {
  const stationX = STATION_WIDTH * 2;
  const stationY = 50;
  
  if (!gameState.currentSundae || !gameState.currentOrder) {
    p.fill(COLORS.TEXT);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text("Build a sundae first!", stationX + STATION_WIDTH / 2, stationY + 100);
    return;
  }
  
  // Draw sundae
  gameState.currentSundae.draw(p, stationX + STATION_WIDTH / 2, stationY + 150);
  
  // Draw blend button
  const blendY = stationY + 220;
  p.fill(gameState.player.selectedOption === 0 ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, blendY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Blend (Space)", stationX + STATION_WIDTH / 2, blendY + 20);
  
  // Draw confirm button
  const confirmY = stationY + 260;
  p.fill(gameState.player.selectedOption === 1 ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, confirmY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Confirm", stationX + STATION_WIDTH / 2, confirmY + 20);
  
  // Draw blend meter
  p.fill(COLORS.TEXT);
  p.text(`Blend: ${Math.round(gameState.currentSundae.blendTime)}/${SETTINGS.BLEND_TIME}`, 
         stationX + STATION_WIDTH / 2, stationY + 300);
  
  p.fill(200);
  p.rect(stationX + 20, stationY + 320, STATION_WIDTH - 40, 10);
  
  // Optimal range
  p.fill(0, 200, 0, 100);
  const optimalWidth = (SETTINGS.BLEND_OPTIMAL_MAX - SETTINGS.BLEND_OPTIMAL_MIN) / SETTINGS.BLEND_TIME * (STATION_WIDTH - 40);
  const optimalX = stationX + 20 + (SETTINGS.BLEND_OPTIMAL_MIN / SETTINGS.BLEND_TIME * (STATION_WIDTH - 40));
  p.rect(optimalX, stationY + 320, optimalWidth, 10);
  
  // Current blend
  p.fill(0, 0, 200);
  const blendWidth = (gameState.currentSundae.blendTime / SETTINGS.BLEND_TIME) * (STATION_WIDTH - 40);
  p.rect(stationX + 20, stationY + 320, Math.min(blendWidth, STATION_WIDTH - 40), 10);
  
  // Draw target blend from order
  if (gameState.currentOrder) {
    p.fill(COLORS.TEXT);
    p.text(`Target: ${Math.round(gameState.currentOrder.blendTime)}`, stationX + STATION_WIDTH / 2, stationY + 340);
  }
}

function drawTopStation(p, gameState) {
  const stationX = STATION_WIDTH * 3;
  const stationY = 50;
  
  if (!gameState.currentSundae || !gameState.currentOrder) {
    p.fill(COLORS.TEXT);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text("Blend a sundae first!", stationX + STATION_WIDTH / 2, stationY + 100);
    return;
  }
  
  // Draw sundae
  gameState.currentSundae.draw(p, stationX + STATION_WIDTH / 2, stationY + 150);
  
  // Draw topping selection
  p.fill(COLORS.TEXT);
  p.textSize(14);
  p.textAlign(p.CENTER);
  p.text("Select Topping:", stationX + STATION_WIDTH / 2, stationY + 20);
  
  for (let i = 0; i < TOPPINGS.length; i++) {
    const y = stationY + 50 + i * 30;
    p.fill(i === gameState.player.selectedOption ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
    p.rect(stationX + 20, y, STATION_WIDTH - 40, 25);
    
    p.fill(255);
    p.text(TOPPINGS[i].name, stationX + STATION_WIDTH / 2, y + 17);
  }
  
  // Draw place button
  const placeY = stationY + 220;
  p.fill(gameState.player.selectedOption === TOPPINGS.length ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, placeY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Place (Space)", stationX + STATION_WIDTH / 2, placeY + 20);
  
  // Draw serve button
  const serveY = stationY + 260;
  p.fill(gameState.player.selectedOption === TOPPINGS.length + 1 ? COLORS.BUTTON_HOVER : COLORS.BUTTON);
  p.rect(stationX + 20, serveY, STATION_WIDTH - 40, 30);
  p.fill(255);
  p.text("Serve", stationX + STATION_WIDTH / 2, serveY + 20);
  
  // Draw required toppings info
  p.fill(COLORS.TEXT);
  p.textAlign(p.LEFT);
  p.text("Required toppings:", stationX + 20, stationY + 300);
  
  for (let i = 0; i < gameState.currentOrder.toppings.length; i++) {
    const topping = gameState.currentOrder.toppings[i];
    p.text(`- ${topping.name}`, stationX + 30, stationY + 320 + i * 20);
  }
}

export function handleStationInteraction(p, gameState, keyCode) {
  switch (gameState.player.currentStation) {
    case STATIONS.ORDER:
      return handleOrderStation(p, gameState, keyCode);
    case STATIONS.BUILD:
      return handleBuildStation(p, gameState, keyCode);
    case STATIONS.BLEND:
      return handleBlendStation(p, gameState, keyCode);
    case STATIONS.TOP:
      return handleTopStation(p, gameState, keyCode);
  }
  return false;
}

function handleOrderStation(p, gameState, keyCode) {
  if (gameState.customers.length === 0) return false;
  
  if (keyCode === 32 && gameState.player.selectedOption === 0) { // SPACE on Take Order
    // Take the customer's order
    gameState.currentOrder = gameState.customers[0].order;
    gameState.currentSundae = new Sundae(gameState.currentOrder.flavor);
    gameState.waitingCustomers.push(gameState.customers.shift());
    gameState.stationProgress[STATIONS.ORDER] = true;
    return true;
  }
  
  return false;
}

function handleBuildStation(p, gameState, keyCode) {
  if (!gameState.currentOrder || !gameState.currentSundae) return false;
  
  if (keyCode === 38) { // UP
    gameState.player.selectedOption = Math.max(0, gameState.player.selectedOption - 1);
    return true;
  } else if (keyCode === 40) { // DOWN
    gameState.player.selectedOption = Math.min(FLAVORS.length + 1, gameState.player.selectedOption + 1);
    return true;
  } else if (keyCode === 32) { // SPACE
    if (gameState.player.selectedOption < FLAVORS.length) {
      // Select flavor
      gameState.currentSundae.flavor = FLAVORS[gameState.player.selectedOption];
      return true;
    } else if (gameState.player.selectedOption === FLAVORS.length + 1) {
      // Confirm
      if (gameState.currentSundae.amount > 0) {
        gameState.stationProgress[STATIONS.BUILD] = true;
        return true;
      }
    }
  } else if (keyCode === 90 && gameState.player.selectedOption === FLAVORS.length) { // Z for Pour
    // Pour ingredient
    if (gameState.currentSundae.amount < SETTINGS.POUR_MAX) {
      gameState.currentSundae.amount += SETTINGS.POUR_RATE;
      return true;
    }
  }
  
  return false;
}

function handleBlendStation(p, gameState, keyCode) {
  if (!gameState.currentOrder || !gameState.currentSundae) return false;
  
  if (keyCode === 38) { // UP
    gameState.player.selectedOption = Math.max(0, gameState.player.selectedOption - 1);
    return true;
  } else if (keyCode === 40) { // DOWN
    gameState.player.selectedOption = Math.min(1, gameState.player.selectedOption + 1);
    return true;
  } else if (keyCode === 32) { // SPACE
    if (gameState.player.selectedOption === 0) {
      // Blend
      if (gameState.currentSundae.blendTime < SETTINGS.BLEND_TIME) {
        gameState.currentSundae.blendTime += 1;
        if (gameState.currentSundae.blendTime >= SETTINGS.BLEND_TIME) {
          gameState.currentSundae.blended = true;
        }
      }
      return true;
    } else if (gameState.player.selectedOption === 1) {
      // Confirm
      if (gameState.currentSundae.blendTime > 0) {
        gameState.stationProgress[STATIONS.BLEND] = true;
        return true;
      }
    }
  }
  
  return false;
}

function handleTopStation(p, gameState, keyCode) {
  if (!gameState.currentOrder || !gameState.currentSundae) return false;
  
  if (keyCode === 38) { // UP
    gameState.player.selectedOption = Math.max(0, gameState.player.selectedOption - 1);
    return true;
  } else if (keyCode === 40) { // DOWN
    gameState.player.selectedOption = Math.min(TOPPINGS.length + 1, gameState.player.selectedOption + 1);
    return true;
  } else if (keyCode === 32) { // SPACE
    if (gameState.player.selectedOption < TOPPINGS.length) {
      // Select topping
      return true;
    } else if (gameState.player.selectedOption === TOPPINGS.length) {
      // Place topping
      const selectedTopping = TOPPINGS[Math.min(gameState.player.selectedOption, TOPPINGS.length - 1)];
      
      // Find a position based on existing toppings
      const baseX = STATION_WIDTH * 3 + STATION_WIDTH / 2;
      const baseY = 150;
      
      // Add some randomness to placement
      const x = baseX + p.random(-20, 20);
      const y = baseY + p.random(-20, 20);
      
      gameState.currentSundae.toppings.push({
        ...selectedTopping,
        position: { x, y }
      });
      
      return true;
    } else if (gameState.player.selectedOption === TOPPINGS.length + 1) {
      // Serve
      const customer = gameState.waitingCustomers[0];
      if (customer) {
        const satisfaction = customer.calculateSatisfaction(gameState.currentSundae);
        gameState.tips += customer.tip;
        gameState.servedCustomers += 1;
        
        // Remove the customer from waiting list
        gameState.waitingCustomers.shift();
        
        // Reset current order and sundae
        gameState.currentOrder = null;
        gameState.currentSundae = null;
        
        // Reset station progress
        for (let i = 0; i < 4; i++) {
          gameState.stationProgress[i] = false;
        }
        
        // Check win condition
        if (gameState.servedCustomers >= SETTINGS.DAILY_GOAL) {
          gameState.gamePhase = "GAME_OVER_WIN";
          
          // Log game over win
          p.logs.game_info.push({
            game_status: "GAME_OVER_WIN",
            data: { score: gameState.tips, customers_served: gameState.servedCustomers },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        gameState.player.selectedOption = 0;
        return true;
      }
    }
  }
  
  return false;
}