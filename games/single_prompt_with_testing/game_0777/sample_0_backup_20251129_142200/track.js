import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { randomRange } from './utils.js';

export class Track {
    constructor() {
        this.curve = null;
        this.mesh = null;
        this.width = 15;
        this.points = [];
        this.length = 0;
        
        this.generate();
    }
    
    generate() {
        // Create a closed loop path
        const points = [];
        const segmentCount = 10;
        const radius = 100;
        
        for (let i = 0; i < segmentCount; i++) {
            const angle = (i / segmentCount) * Math.PI * 2;
            // Add some noise to radius for irregular shape
            const r = radius + randomRange(-30, 30);
            // Flat road - no height variation for smooth driving
            const y = 0; 
            
            points.push(new THREE.Vector3(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
            ));
        }
        
        this.curve = new THREE.CatmullRomCurve3(points);
        this.curve.closed = true;
        this.curve.tension = 0.5;
        
        // Create road geometry manually as a ribbon
        const segments = 100;
        const curvePoints = this.curve.getPoints(segments);
        
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        // Build vertices along the curve
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = curvePoints[i % curvePoints.length];
            const tangent = this.curve.getTangent(t);
            
            // Calculate perpendicular vector (right direction)
            const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            
            // Left edge vertex
            const leftPoint = point.clone().add(right.clone().multiplyScalar(-this.width / 2));
            vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
            normals.push(0, 1, 0); // Up normal
            uvs.push(0, t * 10); // Scale UVs along length
            
            // Right edge vertex
            const rightPoint = point.clone().add(right.clone().multiplyScalar(this.width / 2));
            vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);
            normals.push(0, 1, 0); // Up normal
            uvs.push(1, t * 10);
            
            // Create triangles (except for last iteration)
            if (i < segments) {
                const current = i * 2;
                const next = ((i + 1) % (segments + 1)) * 2;
                
                // First triangle
                indices.push(current, next, current + 1);
                // Second triangle
                indices.push(current + 1, next, next + 1);
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        // Material - Asphalt with simple striping pattern texture generated in code
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333333'; // Road color - darker asphalt
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#FFFFFF'; // White stripe
        ctx.fillRect(28, 0, 8, 64); // Center line
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);
        
        // Store evenly spaced points for AI and progress calculation
        this.points = this.curve.getSpacedPoints(200);
        this.length = this.curve.getLength();
        
        // Add decorative buildings/obstacles around track (moved after this.points is set)
        this.generateScenery();
    }
    
    generateScenery() {
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x667788,
            roughness: 0.7,
            metalness: 0.2
        }); // City buildings
        
        const count = 30;
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const pos = this.curve.getPoint(t);
            const tangent = this.curve.getTangent(t);
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            
            // Place left and right
            const offset = this.width + randomRange(5, 20);
            const scaleY = randomRange(10, 40);
            
            const mesh = new THREE.InstancedMesh(buildingGeo, material, 2);
            const matrix = new THREE.Matrix4();
            
            // Left
            matrix.makeTranslation(
                pos.x + normal.x * offset,
                pos.y + scaleY/2,
                pos.z + normal.z * offset
            );
            matrix.scale(new THREE.Vector3(10, scaleY, 10));
            mesh.setMatrixAt(0, matrix);
            
            // Right
            matrix.makeTranslation(
                pos.x - normal.x * offset,
                pos.y + scaleY/2,
                pos.z - normal.z * offset
            );
            matrix.scale(new THREE.Vector3(10, scaleY, 10));
            mesh.setMatrixAt(1, matrix);
            
            mesh.instanceMatrix.needsUpdate = true;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            gameState.scene.add(mesh);
        }

        // Start/Finish Line
        const startPos = this.points[0];
        const startTan = this.curve.getTangent(0);
        const startNorm = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
        
        const lineGeo = new THREE.BoxGeometry(this.width * 1.2, 0.1, 0.5);
        const lineMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.copy(startPos);
        line.position.y += 0.3;
        // Align to track
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), startTan);
        
        gameState.scene.add(line);
        
        // Arch
        const poleGeo = new THREE.BoxGeometry(1, 10, 1);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.copy(startPos).add(startNorm.clone().multiplyScalar(this.width/2 + 1));
        leftPole.position.y += 5;
        
        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.copy(startPos).add(startNorm.clone().multiplyScalar(-this.width/2 - 1));
        rightPole.position.y += 5;
        
        const topGeo = new THREE.BoxGeometry(1, 1, this.width + 4);
        const topBar = new THREE.Mesh(topGeo, poleMat);
        topBar.position.copy(startPos);
        topBar.position.y += 10;
        topBar.quaternion.copy(line.quaternion);
        
        gameState.scene.add(leftPole);
        gameState.scene.add(rightPole);
        gameState.scene.add(topBar);
    }
    
    // Get closest point on track center line
    getClosestPoint(pos) {
        // Simple search (could be optimized)
        let minDst = Infinity;
        let closestPt = this.points[0];
        let index = 0;
        
        // Scan roughly
        for (let i = 0; i < this.points.length; i+=5) {
            const d = pos.distanceToSquared(this.points[i]);
            if (d < minDst) {
                minDst = d;
                closestPt = this.points[i];
                index = i;
            }
        }
        
        // Refine
        let start = Math.max(0, index - 5);
        let end = Math.min(this.points.length, index + 6);
        for (let i = start; i < end; i++) {
            const d = pos.distanceToSquared(this.points[i]);
            if (d < minDst) {
                minDst = d;
                closestPt = this.points[i];
                index = i;
            }
        }
        
        return { point: closestPt, index: index, distanceSq: minDst };
    }
    
    // Check if position is on track
    isOnTrack(pos) {
        const { distanceSq } = this.getClosestPoint(pos);
        const halfWidth = this.width / 2;
        return distanceSq <= (halfWidth * halfWidth);
    }
}