import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCKS, TOOL_NAMES } from './globals.js';
import { textureManager } from './textures.js';
import { VoxelWorld } from './voxel_world.js';
import { Player } from './player.js';
import { raycastVoxels } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Setup Main Components
function init() {
    // Container
    const container = document.getElementById('game-container') || document.body;
    gameState.gameContainer = container;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
    gameState.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100);
    gameState.camera = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false }); // False for voxel style
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);
    gameState.sunLight = sun;

    // Initialize Textures
    textureManager.init();

    // Selection Highlight Box
    const boxGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const edges = new THREE.EdgesGeometry(boxGeo);
    const highlight = new THREE.LineSegments(edges, boxMat);
    highlight.visible = false;
    scene.add(highlight);
    gameState.highlightMesh = highlight;

    // Setup UI
    setupUI();

    // Input Handling
    setupInputs();

    // Seed Random
    Math.seedrandom(42);

    // Initial log
    window.logs.game_info.push({ status: "INIT", timestamp: Date.now() });
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Reset or Create World
    if (gameState.voxelWorld) {
        // Clear old meshes
        for (let key in gameState.voxelWorld.meshes) {
            gameState.scene.remove(gameState.voxelWorld.meshes[key]);
        }
    }
    
    gameState.voxelWorld = new VoxelWorld();
    gameState.player = new Player();
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    
    window.logs.game_info.push({ status: "STARTED", timestamp: Date.now() });
}

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.keyCode] = true;
        window.logs.inputs.push({ type: 'down', key: e.key, code: e.keyCode, frame: gameState.frameCount });

        // Phase Controls
        if (e.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") startGame();
        }
        if (e.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        if (e.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "START";
            }
        }

        // Gameplay Controls
        if (gameState.gamePhase === "PLAYING") {
            // Shift (16) to Cycle Tool
            if (e.keyCode === 16) {
                gameState.selectedToolIndex = (gameState.selectedToolIndex + 1) % TOOL_NAMES.length;
            }
            
            // Z (90) for Action
            if (e.keyCode === 90) {
                performAction();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.keyCode] = false;
        window.logs.inputs.push({ type: 'up', key: e.key, code: e.keyCode, frame: gameState.frameCount });
    });
}

function performAction() {
    if (!gameState.targetBlock) return;
    
    const world = gameState.voxelWorld;
    const toolIdx = gameState.selectedToolIndex;
    
    // Tool 5 is REMOVER
    if (toolIdx === 5) {
        // Break Block
        world.setBlock(gameState.targetBlock.x, gameState.targetBlock.y, gameState.targetBlock.z, BLOCKS.AIR);
    } else {
        // Place Block
        if (gameState.placePosition) {
            // Don't place inside player
            const pBox = new THREE.Box3().setFromCenterAndSize(
                gameState.player.position, 
                gameState.player.dimensions
            );
            const bBox = new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(gameState.placePosition.x + 0.5, gameState.placePosition.y + 0.5, gameState.placePosition.z + 0.5),
                new THREE.Vector3(1, 1, 1)
            );
            
            if (!pBox.intersectsBox(bBox)) {
                // Map tool index to block ID (Tool 0 -> Block 1, etc.)
                // Tools: Dirt(0)->1, Stone(1)->2, Wood(2)->3, Brick(3)->4, Leaf(4)->5
                const blockId = toolIdx + 1;
                world.setBlock(gameState.placePosition.x, gameState.placePosition.y, gameState.placePosition.z, blockId);
            }
        }
    }
}

function updateRaycast() {
    if (!gameState.player || !gameState.voxelWorld) return;

    // Cast ray from camera center
    const start = gameState.camera.position.clone();
    const direction = new THREE.Vector3();
    gameState.camera.getWorldDirection(direction);
    
    const hit = raycastVoxels(start, direction, 6); // 6 blocks reach
    
    // Check if we hit something AND it has a valid face (not inside block)
    if (hit && hit.face) {
        gameState.targetBlock = hit;
        
        // Calculate placement position (neighbor)
        gameState.placePosition = {
            x: hit.x + hit.face.x,
            y: hit.y + hit.face.y,
            z: hit.z + hit.face.z
        };
        
        // Update highlight
        gameState.highlightMesh.visible = true;
        gameState.highlightMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    } else {
        // If inside block or no hit, disable selection
        gameState.targetBlock = null;
        gameState.placePosition = null;
        gameState.highlightMesh.visible = false;
    }
}

let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    gameState.deltaTime = deltaTime;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        // Update Player
        if (gameState.player) {
            gameState.player.update(deltaTime);
            
            // Check Game Over (Fell out of world)
            if (gameState.player.position.y < -10) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            }
        }
        
        // Update World (Meshes)
        if (gameState.voxelWorld) {
            gameState.voxelWorld.update();
        }
        
        // Update Raycast/Interaction
        updateRaycast();
    }

    // Render Scene
    if (gameState.renderer && gameState.scene && gameState.camera) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
    
    // Render UI
    renderUI();
}

// Start
init();