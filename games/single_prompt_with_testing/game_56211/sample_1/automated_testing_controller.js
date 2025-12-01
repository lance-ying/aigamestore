import { evaluateHand } from './utils.js';

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") return null;
    
    // Test 1: Random Survival
    if (gameState.controlMode === "TEST_1") {
        if (gameState.roundPhase === "SHOP") {
            // Randomly buy or next
            if (Math.random() < 0.3) return { keyCode: 32 }; // Buy/Next
            if (Math.random() < 0.5) return { keyCode: 39 }; // Right
            return { keyCode: 32 }; // Just hit next eventually
        }
        
        // Blind Phase
        // Randomly move and select
        const r = Math.random();
        if (r < 0.2) return { keyCode: 37 }; // Left
        if (r < 0.4) return { keyCode: 39 }; // Right
        if (r < 0.7) return { keyCode: 32 }; // Select
        if (r < 0.9) return { keyCode: 38 }; // Play
        return { keyCode: 40 }; // Discard
    }
    
    // Test 2: Optimal Play (Greedy)
    if (gameState.controlMode === "TEST_2") {
        if (gameState.roundPhase === "SHOP") {
            // Buy everything affordable then next
            const item = gameState.shopItems[gameState.selectedIndex];
            if (item && gameState.money >= item.cost) {
                return { keyCode: 32 }; // Buy
            }
            // Move to next if current too expensive or null
            if (gameState.selectedIndex < gameState.shopItems.length) {
                return { keyCode: 39 }; // Move Right
            }
            return { keyCode: 32 }; // Next Round
        }
        
        // Blind Phase - Find best hand
        // Heuristic: Check all combinations of 5 cards? Too slow.
        // Simple: Sort by rank, pick highest counts.
        
        // If nothing selected, logic to select best cards
        const selectedCount = gameState.hand.filter(c => c.isSelected).length;
        
        if (selectedCount === 0) {
            // Find best hand indices
            // Simply select first 5 for now to ensure action
            // Or select pairs
            const cardToSelect = gameState.hand.findIndex((c, i) => !c.isSelected);
            const dist = cardToSelect - gameState.selectedIndex;
            if (dist !== 0) return { keyCode: dist > 0 ? 39 : 37 };
            return { keyCode: 32 };
        }
        
        // Play if 5 selected or Flush found
        if (selectedCount >= 1) return { keyCode: 38 }; // Play
    }
    
    return null;
}