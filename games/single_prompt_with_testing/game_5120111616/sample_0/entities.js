import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, MATERIALS } from './globals.js';

export class Node {
    constructor(x, y, z, isStatic = false) {
        this.position = new THREE.Vector3(x, y, z);
        this.oldPosition = new THREE.Vector3(x, y, z); // For Verlet
        this.isStatic = isStatic;
        
        // Visuals
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: isStatic ? 0xFF0000 : 0xFFFFFF 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        gameState.scene.add(this.mesh);
    }
    
    updateVisuals() {
        this.mesh.position.copy(this.position);
    }
}

export class Link {
    constructor(nodeA, nodeB, materialType) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.material = materialType;
        this.length = nodeA.position.distanceTo(nodeB.position);
        this.stress = 0;
        this.broken = false;
        
        // Visuals
        // We'll scale a cylinder to fit between points
        const geometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        geometry.translate(0, 0.5, 0); // Pivot at bottom
        geometry.rotateX(Math.PI / 2); // Lay flat along Z initially? No, we need align function
        
        const matColor = materialType.color;
        const mat = new THREE.MeshStandardMaterial({ color: matColor });
        
        this.mesh = new THREE.Mesh(geometry, mat);
        this.mesh.castShadow = true;
        gameState.scene.add(this.mesh);
        
        this.updateVisuals();
    }
    
    updateVisuals() {
        if (this.broken) return;
        
        const start = this.nodeA.position;
        const end = this.nodeB.position;
        
        this.mesh.position.copy(start);
        this.mesh.lookAt(end);
        
        const dist = start.distanceTo(end);
        this.mesh.scale.set(1, 1, dist); // Since we rotated geometry? No, cylinder default is Y up.
        
        // Custom lookAt logic for Z-aligned cylinder is simpler
        // Let's stick to standard lookAt with correct geometry orientation
        // Geometry was rotated X 90, so local Z is now cylinder axis.
        // lookAt aligns local Z to target.
        
        // Color based on stress
        if (gameState.gamePhase === "SIMULATING") {
            const stressColor = new THREE.Color(this.material.color);
            stressColor.lerp(new THREE.Color(0xFF0000), Math.min(1, this.stress));
            this.mesh.material.color.copy(stressColor);
        } else {
            this.mesh.material.color.setHex(this.material.color);
        }
    }
}

export class Vehicle {
    constructor(x, y, z) {
        this.startPos = new THREE.Vector3(x, y, z);
        this.wheelRadius = 0.4;
        this.width = 2.0;
        this.height = 1.0;
        this.enginePower = 5.0; // Force applied
        
        // Create Physics Nodes for the car body
        // Simply 2 wheels and a body constraint
        this.wheels = [
            new Node(x - 1, y, z), // Rear
            new Node(x + 1, y, z)  // Front
        ];
        
        // Make wheels heavier? In this simple engine, mass is uniform, inertia handled by geometry
        
        // Visuals
        const bodyGeo = new THREE.BoxGeometry(2.5, 0.8, 1);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0088FF });
        this.chassisMesh = new THREE.Mesh(bodyGeo, bodyMat);
        
        const wheelGeo = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.4, 16);
        wheelGeo.rotateX(Math.PI/2);
        const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        this.wheelMeshes = [
            new THREE.Mesh(wheelGeo, wheelMat),
            new THREE.Mesh(wheelGeo, wheelMat)
        ];
        
        gameState.scene.add(this.chassisMesh);
        gameState.scene.add(this.wheelMeshes[0]);
        gameState.scene.add(this.wheelMeshes[1]);
    }
    
    updateConstraints() {
        // Keep wheels at fixed distance (Chassis rigid body)
        const w1 = this.wheels[0];
        const w2 = this.wheels[1];
        
        const diff = new THREE.Vector3().subVectors(w2.position, w1.position);
        const len = diff.length();
        const targetLen = 2.0;
        
        const correction = (len - targetLen) / len * 0.5;
        const offset = diff.multiplyScalar(correction);
        
        w1.position.add(offset);
        w2.position.sub(offset);
        
        // Prevent rotation flipping? (Keep Up vector up-ish)
        // Simple trick: constrain Y difference not to be too high compared to X
    }
    
    updateVisuals() {
        const w1Pos = this.wheels[0].position;
        const w2Pos = this.wheels[1].position;
        
        // Update wheel meshes
        this.wheelMeshes[0].position.copy(w1Pos);
        this.wheelMeshes[1].position.copy(w2Pos);
        
        // Update Chassis
        const center = new THREE.Vector3().addVectors(w1Pos, w2Pos).multiplyScalar(0.5);
        center.y += 0.5; // Offset body above wheels
        this.chassisMesh.position.copy(center);
        
        const angle = Math.atan2(w2Pos.y - w1Pos.y, w2Pos.x - w1Pos.x);
        this.chassisMesh.rotation.z = angle;
        this.chassisMesh.rotation.y = 0; // Keep straight
    }
    
    reset() {
        // Remove old nodes from scene is not needed as we clear scene on reset
    }
}

export class Cursor {
    constructor() {
        const geometry = new THREE.RingGeometry(0.2, 0.25, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0.1); // Slightly in front
        gameState.scene.add(this.mesh);
        
        // Line helper for dragging
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.5 });
        this.dragLine = new THREE.Line(lineGeo, lineMat);
        this.dragLine.visible = false;
        gameState.scene.add(this.dragLine);
    }
    
    update() {
        // Snap logic handled in game loop inputs, this updates visuals
        this.mesh.position.copy(gameState.cursor.worldPos);
        this.mesh.position.z = 0.1; // Ensure visible
        
        if (gameState.cursor.startNode) {
            this.dragLine.visible = true;
            const points = [gameState.cursor.startNode.position, gameState.cursor.worldPos];
            this.dragLine.geometry.setFromPoints(points);
            
            // Color based on validity
            const dist = gameState.cursor.startNode.position.distanceTo(gameState.cursor.worldPos);
            const maxLen = gameState.selectedMaterial.maxLength;
            
            if (dist > maxLen) {
                this.dragLine.material.color.setHex(0xFF0000);
            } else {
                this.dragLine.material.color.setHex(0xFFFF00);
            }
        } else {
            this.dragLine.visible = false;
        }
    }
}