import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player1 = gameState.player1;
  const player2 = gameState.player2;
  
  if (!player1 || !player2) {
    return { player1: { left: false, right: false, jump: false },
             player2: { left: false, right: false, jump: false } };
  }
  
  const p1Input = { left: false, right: false, jump: false };
  const p2Input = { left: false, right: false, jump: false };
  
  // Strategy: Navigate both players to collect keys and reach exit
  const frameCount = gameState.frameCount;
  
  // Key positions
  const key1Pos = { x: 150, y: 180 };
  const key2Pos = { x: 300, y: 150 };
  const key3Pos = { x: 450, y: 120 };
  const exitPos = { x: 550, y: 100 };
  
  // Player 1 strategy (collect key 1, then help with others)
  if (gameState.keysCollected < 1) {
    // Go to key 1
    if (player1.x < key1Pos.x - 10) {
      p1Input.right = true;
      if (player1.y > key1Pos.y + 20 && player1.isOnGround) {
        p1Input.jump = true;
      }
    } else if (player1.x > key1Pos.x + 10) {
      p1Input.left = true;
    }
    
    // Player 2 goes to key 2
    if (player2.x < key2Pos.x - 10) {
      p2Input.right = true;
      if (player2.y > key2Pos.y + 20 && player2.isOnGround) {
        p2Input.jump = true;
      }
    } else if (player2.x > key2Pos.x + 10) {
      p2Input.left = true;
    }
  } else if (gameState.keysCollected < 2) {
    // Both converge on key 2
    if (player1.x < key2Pos.x - 10) {
      p1Input.right = true;
      if (player1.y > key2Pos.y + 20 && player1.isOnGround) {
        p1Input.jump = true;
      }
    }
    
    if (player2.x < key2Pos.x - 10) {
      p2Input.right = true;
      if (player2.y > key2Pos.y + 20 && player2.isOnGround) {
        p2Input.jump = true;
      }
    } else if (player2.x > key2Pos.x + 10) {
      p2Input.left = true;
    }
  } else if (gameState.keysCollected < 3) {
    // Both go to key 3
    if (player1.x < key3Pos.x - 10) {
      p1Input.right = true;
      if (player1.y > key3Pos.y + 20 && player1.isOnGround) {
        p1Input.jump = true;
      }
    }
    
    if (player2.x < key3Pos.x - 10) {
      p2Input.right = true;
      if (player2.y > key3Pos.y + 20 && player2.isOnGround) {
        p2Input.jump = true;
      }
    } else if (player2.x > key3Pos.x + 10) {
      p2Input.left = true;
    }
  } else {
    // Both go to exit
    if (player1.x < exitPos.x - 20) {
      p1Input.right = true;
      if (player1.y > exitPos.y + 30 && player1.isOnGround) {
        p1Input.jump = true;
      }
    }
    
    if (player2.x < exitPos.x - 20) {
      p2Input.right = true;
      if (player2.y > exitPos.y + 30 && player2.isOnGround) {
        p2Input.jump = true;
      }
    }
  }
  
  return { player1: p1Input, player2: p2Input };
}

function getBasicTestAction(gameState) {
  const frameCount = gameState.frameCount;
  const p1Input = { left: false, right: false, jump: false };
  const p2Input = { left: false, right: false, jump: false };
  
  // Simple movement test
  if (frameCount < 60) {
    p1Input.right = true;
    p2Input.right = true;
  } else if (frameCount < 120) {
    p1Input.jump = true;
    p2Input.jump = true;
  } else if (frameCount < 180) {
    p1Input.left = true;
    p2Input.left = true;
  } else if (frameCount < 240) {
    p1Input.right = true;
    p1Input.jump = true;
    p2Input.right = true;
    p2Input.jump = true;
  }
  
  return { player1: p1Input, player2: p2Input };
}

function getHazardTestAction(gameState) {
  const player1 = gameState.player1;
  const p1Input = { left: false, right: false, jump: false };
  const p2Input = { left: false, right: false, jump: false };
  
  // Move player 1 into spikes
  if (player1 && player1.x < 160) {
    p1Input.right = true;
  }
  
  return { player1: p1Input, player2: p2Input };
}

function getKeyTestAction(gameState) {
  const player1 = gameState.player1;
  const p1Input = { left: false, right: false, jump: false };
  const p2Input = { left: false, right: false, jump: false };
  
  // Navigate to first key
  const key1Pos = { x: 150, y: 180 };
  
  if (player1) {
    if (player1.x < key1Pos.x - 10) {
      p1Input.right = true;
      if (player1.y > key1Pos.y + 20 && player1.isOnGround) {
        p1Input.jump = true;
      }
    }
  }
  
  return { player1: p1Input, player2: p2Input };
}

function getRandomAction(gameState) {
  const actions = [
    { left: false, right: false, jump: false },
    { left: true, right: false, jump: false },
    { left: false, right: true, jump: false },
    { left: false, right: false, jump: true }
  ];
  
  const idx1 = Math.floor(Math.random() * actions.length);
  const idx2 = Math.floor(Math.random() * actions.length);
  
  return { 
    player1: { ...actions[idx1] },
    player2: { ...actions[idx2] }
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getHazardTestAction(gameState);
    case "TEST_4":
      return getKeyTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;