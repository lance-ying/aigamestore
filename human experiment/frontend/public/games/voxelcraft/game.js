import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCKS, TOOL_NAMES } from './globals.js';
import { textureManager } from './textures.js';
import { VoxelWorld } from './voxel_world.js';
import { Player } from './player.js';
import { raycastVoxels, checkCollision } from './physics.js';
import { setupUI, renderUI } from './ui.js';

// Mobs
let mobs = [];

class Mob {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.dimensions = new THREE.Vector3(0.8, 0.8, 0.8);
        this.dead = false;
        
        // Mesh
        const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const mat = new THREE.MeshLambertMaterial({ color: 0x55ff55 }); // Slime green
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        gameState.scene.add(this.mesh);
        
        // AI State
        this.moveDir = new THREE.Vector3();
        this.changeDirTimer = 0;
    }
    
    update(deltaTime) {
        if (this.dead) return;
        
        // AI: Random wander + Chase
        this.changeDirTimer -= deltaTime;
        if (this.changeDirTimer <= 0) {
            this.changeDirTimer = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            this.moveDir.set(Math.cos(angle), 0, Math.sin(angle));
        }
        
        // Chase player if close
        if (gameState.player) {
            const dist = this.position.distanceTo(gameState.player.position);
            if (dist < 8) {
                this.moveDir.subVectors(gameState.player.position, this.position).normalize();
                this.moveDir.y = 0;
            }
        }

        // Apply movement
        this.velocity.x = this.moveDir.x * 2.0;
        this.velocity.z = this.moveDir.z * 2.0;
        
        // Gravity
        this.velocity.y -= 25.0 * deltaTime;
        
        // Physics
        const result = checkCollision(this.position, this.dimensions, this.velocity, deltaTime);
        
        // Hop if hitting wall or randomly
        if (result.grounded && Math.random() < 0.01) {
            this.velocity.y = 6.0;
        }
        
        // Update Mesh
        this.mesh.position.copy(this.position);
        
        // Breathing animation
        this.mesh.scale.y = 1 + Math.sin(gameState.time * 5) * 0.1;
        this.mesh.scale.x = 1 - Math.sin(gameState.time * 5) * 0.05;
        this.mesh.scale.z = 1 - Math.sin(gameState.time * 5) * 0.05;
        
        // Despawn if fell out of world
        if (this.position.y < -50) this.kill();
    }
    
    kill() {
        this.dead = true;
        gameState.scene.remove(this.mesh);
    }
}

function spawnMobs() {
    // Clear old
    mobs.forEach(m => gameState.scene.remove(m.mesh));
    mobs = [];
    
    // Spawn a few
    for(let i=0; i<8; i++) {
        const x = Math.random() * 64;
        const z = Math.random() * 64;
        mobs.push(new Mob(x, 40, z)); // Drop from sky
    }
}

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
    
    spawnMobs();
    
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
    // Animate Hand
    if (gameState.player) gameState.player.triggerSwing();

    const world = gameState.voxelWorld;
    const toolIdx = gameState.selectedToolIndex;
    
    // Tool 7 is SWORD
    if (toolIdx === 7) {
        // Attack Mobs
        const playerPos = gameState.player.position;
        const lookDir = new THREE.Vector3();
        gameState.camera.getWorldDirection(lookDir);
        
        mobs.forEach(mob => {
            if (mob.dead) return;
            const toMob = mob.position.clone().sub(playerPos);
            if (toMob.length() < 4.0) { // Range
                toMob.normalize();
                if (lookDir.dot(toMob) > 0.5) { // Angle
                    mob.kill();
                    gameState.score += 50;
                }
            }
        });
        return;
    }

    if (!gameState.targetBlock) return;
    
    // Tool 6 is REMOVER
    if (toolIdx === 6) {
        // Break Block
        const blockType = world.getBlock(gameState.targetBlock.x, gameState.targetBlock.y, gameState.targetBlock.z);
        world.setBlock(gameState.targetBlock.x, gameState.targetBlock.y, gameState.targetBlock.z, BLOCKS.AIR);
        
        // Score logic
        if (blockType === BLOCKS.GOLD) gameState.score += 100;
        else gameState.score += 1;
        
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
            
            // Also check mobs
            let intersectsEntity = pBox.intersectsBox(bBox);
            mobs.forEach(m => {
                 if(!m.dead) {
                     const mBox = new THREE.Box3().setFromCenterAndSize(m.position, m.dimensions);
                     if(mBox.intersectsBox(bBox)) intersectsEntity = true;
                 }
            });
            
            if (!intersectsEntity) {
                // Map tool index to block ID (Tool 0 -> Block 1, etc.)
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
    gameState.time += deltaTime; // Update global time
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
        
        // Update Mobs
        mobs.forEach(m => m.update(deltaTime));
        
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