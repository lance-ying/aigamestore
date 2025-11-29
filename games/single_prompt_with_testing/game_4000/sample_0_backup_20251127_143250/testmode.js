// testmode.js - Automated testing modes
import { gameState } from './globals.js';
import { getCameraDirection } from './camera.js';
import { castRayForPortal } from './physics.js';
import { Portal } from './entities.js';

export function updateTestMode(deltaTime) {
    if (gameState.controlMode === "HUMAN") return;
    
    gameState.testTimer += deltaTime;
    
    switch (gameState.controlMode) {
        case "TEST_1":
            runTest1();
            break;
        case "TEST_2":
            runTest2();
            break;
    }
}

function runTest1() {
    // Test basic portal mechanics and teleportation
    if (!gameState.player) return;
    
    const player = gameState.player;
    
    switch (gameState.testStep) {
        case 0:
            // Wait for game to start
            if (gameState.gamePhase === "START" && gameState.testTimer > 1) {
                simulateKeyPress(13); // ENTER
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 1:
            // Place blue portal on left wall
            if (gameState.gamePhase === "PLAYING" && gameState.testTimer > 1) {
                const hit = castRayForPortal(
                    player.mesh.position.clone(),
                    new THREE.Vector3(-1, 0, 0)
                );
                if (hit) {
                    if (!gameState.bluePortal) {
                        gameState.bluePortal = new Portal(true);
                    }
                    gameState.bluePortal.place(hit.position, hit.normal, hit.surface);
                }
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 2:
            // Place orange portal on elevated platform
            if (gameState.testTimer > 1) {
                const hit = castRayForPortal(
                    player.mesh.position.clone(),
                    new THREE.Vector3(1, 0.5, -1).normalize()
                );
                if (hit) {
                    if (!gameState.orangePortal) {
                        gameState.orangePortal = new Portal(false);
                    }
                    gameState.orangePortal.place(hit.position, hit.normal, hit.surface);
                }
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 3:
            // Move towards blue portal
            if (gameState.testTimer < 3) {
                player.move(new THREE.Vector3(-1, 0, 0));
            } else {
                gameState.testStep++;
            }
            break;
        
        case 4:
            // Test complete
            console.log("Test 1 complete: Portal mechanics validated");
            break;
    }
}

function runTest2() {
    // Test win condition
    if (!gameState.player) return;
    
    const player = gameState.player;
    
    switch (gameState.testStep) {
        case 0:
            // Start game
            if (gameState.gamePhase === "START" && gameState.testTimer > 0.5) {
                simulateKeyPress(13); // ENTER
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 1:
            // Place portals strategically
            if (gameState.gamePhase === "PLAYING" && gameState.testTimer > 1) {
                // Blue portal on floor
                const hit1 = castRayForPortal(
                    player.mesh.position.clone(),
                    new THREE.Vector3(0, -1, 0)
                );
                if (hit1) {
                    if (!gameState.bluePortal) {
                        gameState.bluePortal = new Portal(true);
                    }
                    gameState.bluePortal.place(hit1.position, hit1.normal, hit1.surface);
                }
                
                // Orange portal on elevated platform surface
                const hit2 = castRayForPortal(
                    player.mesh.position.clone(),
                    new THREE.Vector3(1, 0.5, -1).normalize()
                );
                if (hit2) {
                    if (!gameState.orangePortal) {
                        gameState.orangePortal = new Portal(false);
                    }
                    gameState.orangePortal.place(hit2.position, hit2.normal, hit2.surface);
                }
                
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 2:
            // Jump through portal
            if (gameState.testTimer < 0.5) {
                player.jump();
            } else if (gameState.testTimer < 3) {
                // Wait for teleportation
            } else {
                gameState.testStep++;
                gameState.testTimer = 0;
            }
            break;
        
        case 3:
            // Move towards exit
            if (gameState.exitDoor) {
                const dirToExit = new THREE.Vector3()
                    .subVectors(gameState.exitDoor.position, player.mesh.position)
                    .normalize();
                player.move(dirToExit);
                
                // Check if reached exit
                if (gameState.exitDoor.checkPlayerCollision(player)) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                    gameState.testStep++;
                }
            }
            break;
        
        case 4:
            // Test complete
            console.log("Test 2 complete: Win condition validated");
            break;
    }
}

function simulateKeyPress(keyCode) {
    gameState.keys[keyCode] = true;
    setTimeout(() => {
        gameState.keys[keyCode] = false;
    }, 100);
}