// testing.js - Automated testing controllers
import { gameState, PHASE_PLAYING, CONTROL_TEST_1, CONTROL_TEST_2 } from './globals.js';
import { startDoughPrep, applyIngredient, placeInOven, removeFromOven, slicePizza, 
         serveCustomer } from './gameLogic.js';

export function getTestAction() {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  if (gameState.controlMode === CONTROL_TEST_1) {
    return getBasicTestAction();
  } else if (gameState.controlMode === CONTROL_TEST_2) {
    return getWinTestAction();
  }
  
  return null;
}

function getBasicTestAction() {
  // Basic testing: make a simple cheese pizza
  if (gameState.actionDuration > 0) return null;
  
  if (gameState.pizzasInPrep.length === 0) {
    startDoughPrep();
    return;
  }
  
  const pizza = gameState.pizzasInPrep[0];
  gameState.selectedPizza = pizza;
  
  if (pizza.state === "DOUGH") {
    applyIngredient("sauce");
  } else if (pizza.state === "SAUCED") {
    applyIngredient("cheese");
  } else if (pizza.state === "CHEESED") {
    placeInOven(pizza);
  } else if (pizza.state === "BAKED" && !pizza.inOven) {
    slicePizza(pizza);
  } else if (pizza.state === "SLICED") {
    const customer = gameState.customerQueueCounter[0] || gameState.customerQueueDriveThru[0];
    if (customer && customer.order.toppings.length === 0) {
      serveCustomer(pizza, customer);
    }
  }
}

function getWinTestAction() {
  // Advanced testing: make pizzas to match orders efficiently
  if (gameState.actionDuration > 0) return null;
  
  // Find customer with simplest order
  const allCustomers = [...gameState.customerQueueCounter, ...gameState.customerQueueDriveThru];
  if (allCustomers.length === 0) return null;
  
  allCustomers.sort((a, b) => a.order.toppings.length - b.order.toppings.length);
  const targetCustomer = allCustomers[0];
  const targetOrder = targetCustomer.order;
  
  // Find or create matching pizza
  let matchingPizza = null;
  for (let pizza of gameState.pizzasInPrep) {
    if (pizza.state === "SLICED" && pizza.matchesOrder(targetOrder)) {
      matchingPizza = pizza;
      break;
    }
  }
  
  if (matchingPizza) {
    serveCustomer(matchingPizza, targetCustomer);
    return;
  }
  
  // Find pizza in progress
  let pizzaInProgress = null;
  for (let pizza of gameState.pizzasInPrep) {
    if (pizza.state !== "SLICED") {
      pizzaInProgress = pizza;
      break;
    }
  }
  
  if (!pizzaInProgress) {
    // Make new pizza if we have room
    if (gameState.pizzasInPrep.length < 3) {
      startDoughPrep();
    }
    return;
  }
  
  gameState.selectedPizza = pizzaInProgress;
  
  // Progress the pizza
  if (pizzaInProgress.state === "DOUGH") {
    applyIngredient("sauce");
  } else if (pizzaInProgress.state === "SAUCED") {
    applyIngredient("cheese");
  } else if (pizzaInProgress.state === "CHEESED") {
    // Add required toppings
    let needsTopping = false;
    for (let topping of targetOrder.toppings) {
      if (!pizzaInProgress.hasTopping(topping)) {
        applyIngredient(topping);
        needsTopping = true;
        break;
      }
    }
    if (!needsTopping) {
      placeInOven(pizzaInProgress);
    }
  } else if (pizzaInProgress.state === "TOPPED" && !pizzaInProgress.inOven) {
    placeInOven(pizzaInProgress);
  } else if (pizzaInProgress.state === "BAKED" && pizzaInProgress.inOven) {
    removeFromOven(pizzaInProgress);
  } else if (pizzaInProgress.state === "BAKED" && !pizzaInProgress.inOven) {
    slicePizza(pizzaInProgress);
  }
}

export function executeTestAction() {
  const action = getTestAction();
  if (action) {
    action();
  }
}