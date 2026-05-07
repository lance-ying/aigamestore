import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, MYSTERY_THRESHOLD_1, MYSTERY_THRESHOLD_2 } from './globals.js';
import { setupWorld } from './world.js';
import { Car } from './entities.js';
import { setupInputs, inputs, logInputs } from './input.js';
import { checkCollisions } from './physics.js';
import { setupUI, renderUI } from './ui.js';
import { randomChoice, lerp } from './utils.js';

// Init
function init() {
    // Setup Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.position = 'relative';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    gameState.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 500);
    gameState.camera = camera;

    // Setup Game World
    setupWorld();

    // Create Player
    // Fix: Spawn car away from the central building (Depot is at 0,0)
    const player = new Car(0, 2, 20); 
    gameState.player = player;

    // UI
    setupUI();
    
    // Inputs
    setupInputs();

    // Default to HUMAN mode and start game phase
    gameState.controlMode = window.controlMode;
    if (gameState.controlMode === "HUMAN") {
        gameState.gamePhase = "START"; // Start screen for human players
    }

    // Start Loop
    requestAnimationFrame(gameLoop);
}

// Main Loop
let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;

    update(dt);
    render();
}

function update(dt) {
    if (gameState.gamePhase !== "PLAYING") {
        // Simple idle rotation for start screen
        if (gameState.gamePhase === "START") {
            gameState.camera.position.x = Math.sin(Date.now() * 0.0005) * 50;
            gameState.camera.position.z = Math.cos(Date.now() * 0.0005) * 50;
            gameState.camera.position.y = 30;
            gameState.camera.lookAt(0, 0, 0);
        }
        return;
    }

    // Always use human inputs
    const activeInputs = inputs;
    logInputs();

    // Update Player
    gameState.player.update(dt, activeInputs);

    // Update Camera Controls
    const camSpeed = 2.0;
    if (activeInputs.camLeft) gameState.cameraYaw += camSpeed * dt;
    if (activeInputs.camRight) gameState.cameraYaw -= camSpeed * dt;
    if (activeInputs.camUp) gameState.cameraPitch = Math.min(gameState.cameraPitch + camSpeed * dt, 1.2);
    if (activeInputs.camDown) gameState.cameraPitch = Math.max(gameState.cameraPitch - camSpeed * dt, 0.1);

    // Camera Follow Logic
    updateCamera();

    // Collisions
    // Collect all collidables
    const obstacles = [...gameState.buildings, ...gameState.trees];
    checkCollisions(gameState.player, obstacles);

    // Interaction Logic
    handleInteractions(activeInputs);

    // Mystery Logic
    updateMysterySystem(dt);
    
    // Interactables animations
    gameState.interactables.forEach(z => z.update(dt));
    
    // Fuel Check
    if (gameState.fuel <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

function updateCamera() {
    const playerPos = gameState.player.mesh.position;
    const playerRot = gameState.player.mesh.rotation.y;
    
    let targetPos = new THREE.Vector3();
    let lookAtPos = playerPos.clone();

    if (gameState.cameraMode === "FOLLOW") {
        // Orbit Camera
        // Calculate offset based on Yaw (relative to car) and Pitch
        const totalYaw = playerRot + gameState.cameraYaw + Math.PI; // +PI to look at back
        const dist = gameState.cameraDistance;
        const yOffset = Math.sin(gameState.cameraPitch) * dist;
        const hDist = Math.cos(gameState.cameraPitch) * dist;
        
        const xOffset = Math.sin(totalYaw) * hDist;
        const zOffset = Math.cos(totalYaw) * hDist;

        targetPos.set(
            playerPos.x + xOffset,
            playerPos.y + yOffset,
            playerPos.z + zOffset
        );
        
        lookAtPos.y += 1.5;

        // Smart Camera: Avoid clipping through buildings/trees
        // Cast ray from car to camera
        const rayOrigin = lookAtPos.clone();
        const direction = new THREE.Vector3().subVectors(targetPos, rayOrigin);
        const fullDist = direction.length();
        direction.normalize();

        const raycaster = new THREE.Raycaster(rayOrigin, direction, 0, fullDist);
        
        // Collect obstacles for camera occlusion
        const obstacles = [
            ...gameState.buildings.map(b => b.mesh), 
            ...gameState.trees
        ];

        const intersects = raycaster.intersectObjects(obstacles);
        if (intersects.length > 0) {
            // If blocked, move camera to the hit point (plus a small buffer towards the car)
            const hit = intersects[0];
            targetPos.copy(hit.point).add(direction.multiplyScalar(-0.5));
            // Also lift slightly to maintain view if very close
            if (hit.distance < 4) targetPos.y += 1.0;
        }

    } else if (gameState.cameraMode === "TOP") {
        targetPos.set(playerPos.x, 50, playerPos.z);
    }

    // Smooth lerp
    gameState.camera.position.lerp(targetPos, 0.15);
    gameState.camera.lookAt(lookAtPos);
}

function handleInteractions(currInputs) {
    if (currInputs.space && !currInputs.prevSpace) {
        // Debounce handling inside input logic ideally, but check here
        
        let zoneFound = null;
        for (const zone of gameState.interactables) {
            if (zone.checkInteraction(gameState.player.mesh)) {
                zoneFound = zone;
                break;
            }
        }
        
        if (zoneFound) {
            if (zoneFound.type === 'PICKUP' && !gameState.hasPackage) {
                // Pick up
                gameState.hasPackage = true;
                // Assign random delivery destination
                const destinations = gameState.interactables.filter(z => z.type === 'DELIVER');
                const dest = randomChoice(destinations);
                gameState.currentObjective = dest;
                playSoundFeedback('pickup');
            } else if (zoneFound.type === 'DELIVER' && gameState.hasPackage && gameState.currentObjective === zoneFound) {
                // Deliver
                gameState.hasPackage = false;
                gameState.currentObjective = null;
                gameState.deliveriesCompleted++;
                gameState.money += 15.50; // Low wage lol
                gameState.score += 100;
                playSoundFeedback('deliver');
            }
        }
        
        currInputs.prevSpace = true;
    }
    
    if (!currInputs.space) currInputs.prevSpace = false;
}

function updateMysterySystem(dt) {
    // Progressive strangeness
    const completed = gameState.deliveriesCompleted;
    
    if (completed >= MYSTERY_THRESHOLD_1) {
        // Fog gets thicker
        const targetDensity = 0.02 + (completed * 0.005);
        gameState.scene.fog.density = lerp(gameState.scene.fog.density, targetDensity, dt * 0.1);
        
        // Sky darkens
        const hex = gameState.scene.background.getHex();
        if (hex > 0x111111) {
            gameState.scene.background.lerp(new THREE.Color(0x111111), dt * 0.05);
        }
        
        // Show watchers occasionally
        if (Math.random() < 0.01) {
            const watcher = randomChoice(gameState.mysteryEntities);
            watcher.mesh.visible = !watcher.mesh.visible;
        }
    }
    
    if (completed >= MYSTERY_THRESHOLD_2) {
        gameState.worldState.glitchIntensity = 0.02;
    }
}

// Placeholder sound visual feedback (since no audio allowed)
function playSoundFeedback(type) {
    // Log for debug
    console.log(`[Sound Effect]: ${type}`);
    // ui logic handles visual feedback
}

function render() {
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Init when module loads
window.onload = init;