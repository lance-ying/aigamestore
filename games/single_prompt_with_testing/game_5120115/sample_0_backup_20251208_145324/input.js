import { gameState, MATERIALS, LEVEL_CONFIG, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Node, Constraint, Car } from './entities.js';

export function handleInput(p) {
    // Legacy hook
}

export function handleMouseMoved(p) {
    if (gameState.gamePhase === "PLAYING" && gameState.subPhase === "BUILD") {
        const snap = gameState.cursorSnap;
        // Snap to grid
        gameState.cursorX = Math.round(p.mouseX / snap) * snap;
        gameState.cursorY = Math.round(p.mouseY / snap) * snap;
        
        // Clamp to canvas
        gameState.cursorX = Math.max(0, Math.min(CANVAS_WIDTH, gameState.cursorX));
        gameState.cursorY = Math.max(0, Math.min(CANVAS_HEIGHT, gameState.cursorY));
    }
}

export function handleMousePressed(p) {
    if (gameState.gamePhase === "PLAYING" && gameState.subPhase === "BUILD") {
        // Left Click: Build/Select
        if (p.mouseButton === p.LEFT) {
            // Check if user clicked UI (simple check for top right material box)
            if (p.mouseX > CANVAS_WIDTH - 100 && p.mouseY < 50) {
                // Cycle material
                cycleMaterial();
            } else {
                performBuildSpaceAction();
            }
        }
        // Right Click: Delete
        if (p.mouseButton === p.RIGHT) {
            performDeleteAction();
        }
    }
}

export function handleKeyPress(p) {
    // Phase Transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.subPhase = "BUILD";
            resetLevel();
            return;
        }
        if (gameState.gamePhase === "PLAYING") {
            if (gameState.subPhase === "BUILD") {
                startSimulation();
            } else {
                // In Sim, Enter goes back to Build
                gameState.subPhase = "BUILD";
                resetSimulation();
            }
        }
        if (gameState.gamePhase === "GAME_OVER_WIN") {
            // Next Level
            nextLevel();
        }
        if (gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart Level
            resetLevel();
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === 82) { // R
        if (gameState.gamePhase !== "START") {
            // Restart current level
            resetLevel();
            gameState.gamePhase = "PLAYING";
        }
    }

    // Gameplay Controls
    if (gameState.gamePhase === "PLAYING" && gameState.subPhase === "BUILD") {
        handleBuildControls(p);
    }
    
    // Log
    p.logs.inputs.push({
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount
    });
}

function handleBuildControls(p) {
    const MOVE_AMT = gameState.cursorSnap;
    
    // Arrow Keys: Move Cursor
    if (p.keyCode === p.LEFT_ARROW) gameState.cursorX = Math.max(0, gameState.cursorX - MOVE_AMT);
    if (p.keyCode === p.RIGHT_ARROW) gameState.cursorX = Math.min(CANVAS_WIDTH, gameState.cursorX + MOVE_AMT);
    if (p.keyCode === p.UP_ARROW) gameState.cursorY = Math.max(0, gameState.cursorY - MOVE_AMT);
    if (p.keyCode === p.DOWN_ARROW) gameState.cursorY = Math.min(CANVAS_HEIGHT, gameState.cursorY + MOVE_AMT);
    
    // Shift: Cycle Material
    if (p.keyCode === 16) { // Shift
        cycleMaterial();
    }
    
    // Space: Action
    if (p.keyCode === 32) {
        performBuildSpaceAction();
    }
    
    // Z: Delete / Undo
    if (p.keyCode === 90) {
        performDeleteAction();
    }
}

function cycleMaterial() {
    const mats = Object.keys(MATERIALS);
    let idx = mats.indexOf(gameState.selectedMaterial);
    idx = (idx + 1) % mats.length;
    gameState.selectedMaterial = mats[idx];
}

function performBuildSpaceAction() {
    // 1. Check if cursor is on an existing node
    const hover = findNodeAt(gameState.cursorX, gameState.cursorY);
    
    if (gameState.selectedNode) {
        // We are dragging a line from selectedNode
        
        let targetNode = hover;
        
        // If no node exists at cursor, try to create one
        if (!targetNode) {
            // Check max length
            const dist = Math.hypot(gameState.cursorX - gameState.selectedNode.x, gameState.cursorY - gameState.selectedNode.y);
            const matProp = MATERIALS[gameState.selectedMaterial];
            
            if (dist <= matProp.maxLen) {
                // Check budget
                // Node cost (if new) + Edge cost
                const edgeCost = Math.ceil(dist * 0.1 * (matProp.cost / 10)); // approximate cost calc
                if (gameState.currentCost + edgeCost <= gameState.budget) {
                    targetNode = new Node(gameState.cursorX, gameState.cursorY);
                    gameState.nodes.push(targetNode);
                } else {
                    // Budget exceeded
                    return;
                }
            } else {
                // Too long
                return;
            }
        }
        
        // Try to connect selectedNode to targetNode
        if (targetNode && targetNode !== gameState.selectedNode) {
            // Check if connection already exists
            const exists = gameState.constraints.some(c => 
                (c.nodeA === gameState.selectedNode && c.nodeB === targetNode) ||
                (c.nodeB === gameState.selectedNode && c.nodeA === targetNode)
            );
            
            if (!exists) {
                const dist = Math.hypot(targetNode.x - gameState.selectedNode.x, targetNode.y - gameState.selectedNode.y);
                const matProp = MATERIALS[gameState.selectedMaterial];
                if (dist <= matProp.maxLen) {
                    const edgeCost = Math.ceil(dist * 0.1 * (matProp.cost / 10)); // Simplified cost logic
                    if (gameState.currentCost + edgeCost <= gameState.budget) {
                        gameState.constraints.push(new Constraint(gameState.selectedNode, targetNode, gameState.selectedMaterial));
                        gameState.currentCost += edgeCost;
                        
                        // Move selection to new node for chain building
                        gameState.selectedNode = targetNode;
                    }
                }
            } else {
                // If exists, just move selection
                gameState.selectedNode = targetNode;
            }
        } else if (targetNode === gameState.selectedNode) {
            // Deselect
            gameState.selectedNode = null;
        }
        
    } else {
        // No node selected
        if (hover) {
            // Select it
            gameState.selectedNode = hover;
        }
    }
}

function performDeleteAction() {
    // 1. If dragging (selectedNode), cancel drag
    if (gameState.selectedNode) {
        gameState.selectedNode = null;
        return;
    }
    
    // 2. Delete item under cursor
    const hoverNode = findNodeAt(gameState.cursorX, gameState.cursorY);
    if (hoverNode && !hoverNode.fixed) {
        // Find constraints
        const attached = gameState.constraints.filter(c => c.nodeA === hoverNode || c.nodeB === hoverNode);
        
        // Refund logic (simplified)
        attached.forEach(c => {
             const dist = Math.hypot(c.nodeA.x - c.nodeB.x, c.nodeA.y - c.nodeB.y);
             const matProp = MATERIALS[c.material];
             const edgeCost = Math.ceil(dist * 0.1 * (matProp.cost / 10));
             gameState.currentCost -= edgeCost;
        });
        
        gameState.constraints = gameState.constraints.filter(c => c.nodeA !== hoverNode && c.nodeB !== hoverNode);
        gameState.nodes = gameState.nodes.filter(n => n !== hoverNode);
    }
}

function findNodeAt(x, y) {
    return gameState.nodes.find(n => Math.hypot(n.x - x, n.y - y) < 10);
}

export function nextLevel() {
    gameState.levelIndex++;
    if (gameState.levelIndex >= LEVELS.length) {
        gameState.levelIndex = 0; // Loop back to start
        gameState.score = 0;      // Reset score on loop
    }
    resetLevel();
    gameState.gamePhase = "PLAYING";
}

export function resetLevel() {
    // Load Level Config
    const config = LEVELS[gameState.levelIndex];
    Object.assign(LEVEL_CONFIG, config);
    
    gameState.budget = config.budget;
    gameState.nodes = [];
    gameState.constraints = [];
    gameState.cars = [];
    gameState.currentCost = 0;
    gameState.levelComplete = false;
    gameState.subPhase = "BUILD";
    gameState.selectedNode = null;
    
    // Add Anchors
    LEVEL_CONFIG.anchorPoints.forEach(pt => {
        gameState.nodes.push(new Node(pt.x, pt.y, true));
    });
}

export function startSimulation() {
    gameState.subPhase = "SIMULATE";
    gameState.simFrame = 0;
    
    // Save backup of positions to restore later
    gameState.nodes.forEach(n => {
        n.savedX = n.x;
        n.savedY = n.y;
        n.oldX = n.x;
        n.oldY = n.y;
    });
    
    // Spawn Car
    gameState.cars = [new Car(LEVEL_CONFIG.anchorPoints[0].x, LEVEL_CONFIG.anchorPoints[0].y - 30)];
}

export function resetSimulation() {
    gameState.subPhase = "BUILD";
    gameState.cars = [];
    gameState.nodes.forEach(n => {
        n.x = n.savedX;
        n.y = n.savedY;
        n.oldX = n.savedX;
        n.oldY = n.savedY;
    });
    // Reset stress colors
    gameState.constraints.forEach(c => c.currentStress = 0);
}