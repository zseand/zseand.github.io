let $g = {};

import * as THREE from './three.module.js';

import Stats from './stats.module.js';

import {
	GLTFLoader
} from './GLTFLoader.js';

import { Octree } from './math/Octree.js';
import { Capsule } from './math/Capsule.js';

import * as SkeletonUtils from './SkeletonUtils.js';

import * as class_player from "./player.class.module.js";
import basic_run_data from './basic_run_data.class.module.js';
import Options from "./options.class.module.js";
import Spheres from "./spheres.class.module.js";
import * as dev from "./dev.module.js";

var _ = new basic_run_data;
var opt = new Options();
//var spheres = new Spheres(_, opt);

_.clock = new THREE.Clock();

_.scene = new THREE.Scene();
_.scene.background = new THREE.Color(0x88ccff);

_.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
_.camera.rotation.order = 'YXZ';

_.ambient_light = new THREE.AmbientLight(opt.color_ambient_light);
_.scene.add(_.ambient_light);
_.fill_light_1 = new THREE.DirectionalLight(opt.color_fill_light_1, 0.5);
_.fill_light_1.position.set(- 1, 1, 2);
_.scene.add(_.fill_light_1);

const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
fillLight2.position.set(0, - 1, 0);
_.scene.add(fillLight2);

const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
directionalLight.position.set(- 5, 25, - 1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
_.scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById('container');

container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild(stats.domElement);

const GRAVITY = 30;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x888855, roughness: 0.8, metalness: 0.5 });

for (let i = 0; i < NUM_SPHERES; i++) {

	const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	_.scene.add(sphere);

	_.spheres.push({ mesh: sphere, collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), SPHERE_RADIUS), velocity: new THREE.Vector3() });

}

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener('keydown', (event) => {

	keyStates[event.code] = true;

});

document.addEventListener('keyup', (event) => {

	keyStates[event.code] = false;

});

document.addEventListener('mousedown', () => {

	document.body.requestPointerLock();

	mouseTime = performance.now();

});

document.addEventListener('mouseup', throwBall);

document.body.addEventListener('mousemove', (event) => {
	if (document.pointerLockElement === document.body) {
		_.camera.rotation.y -= event.movementX / 500;
		_.camera.rotation.x -= event.movementY / 500;
	}
});

window.addEventListener('resize', function () {
	_.camera.aspect = window.innerWidth / window.innerHeight;
	_.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});



function throwBall() {
	const sphere = _.spheres[_.sphereIdx];
	_.camera.getWorldDirection(playerDirection);
	sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);
	// throw the ball with more force if we hold the button longer, and if we move forward
	const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));
	sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
	sphere.velocity.addScaledVector(playerVelocity, 2);
	_.sphereIdx = (_.sphereIdx + 1) % _.spheres.length;
}

function playerCollisions() {

	const result = worldOctree.capsuleIntersect(playerCollider);

	playerOnFloor = false;

	if (result) {

		playerOnFloor = result.normal.y > 0;

		if (!playerOnFloor) {

			playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));

		}

		playerCollider.translate(result.normal.multiplyScalar(result.depth));

	}

}

function updatePlayer(deltaTime) {

	let damping = Math.exp(- 4 * deltaTime) - 1;

	if (!playerOnFloor) {

		playerVelocity.y -= GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.1;

	}

	playerVelocity.addScaledVector(playerVelocity, damping);

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);

	playerCollisions();

	_.camera.position.copy(playerCollider.end);

}

function playerSphereCollision(sphere) {

	const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

	const sphere_center = sphere.collider.center;

	const r = playerCollider.radius + sphere.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for (const point of [playerCollider.start, playerCollider.end, center]) {

		const d2 = point.distanceToSquared(sphere_center);

		if (d2 < r2) {

			const normal = vector1.subVectors(point, sphere_center).normalize();
			const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
			const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

			playerVelocity.add(v2).sub(v1);
			sphere.velocity.add(v1).sub(v2);

			const d = (r - Math.sqrt(d2)) / 2;
			sphere_center.addScaledVector(normal, - d);

		}

	}

}

function spheresCollisions() {
	for (let i = 0, length = _.spheres.length; i < length; i++) {
		const s1 = _.spheres[i];
		for (let j = i + 1; j < length; j++) {
			const s2 = _.spheres[j];
			const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;
			if (d2 < r2) {
				const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
				const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
				const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);
				const d = (r - Math.sqrt(d2)) / 2;
				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, - d);
			}
		}
	}
}

function updateSpheres(deltaTime) {
	_.spheres.forEach(sphere => {
		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
		const result = worldOctree.sphereIntersect(sphere.collider);
		if (result) {
			sphere.velocity.addScaledVector(result.normal, - result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
		} else {
			sphere.velocity.y -= GRAVITY * deltaTime;
		}
		const damping = Math.exp(- 1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);
		playerSphereCollision(sphere);
	});
	spheresCollisions();
	for (const sphere of _.spheres) {
		sphere.mesh.position.copy(sphere.collider.center);
	}
}

function getForwardVector() {
	_.camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	return playerDirection;
}

function getSideVector() {
	_.camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(_.camera.up);
	return playerDirection;
}

function controls(deltaTime) {
	// gives a bit of air control
	const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);
	if (keyStates['KeyW']) {
		playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
	}
	if (keyStates['KeyS']) {
		playerVelocity.add(getForwardVector().multiplyScalar(- speedDelta));
	}
	if (keyStates['KeyA']) {
		playerVelocity.add(getSideVector().multiplyScalar(- speedDelta));
	}
	if (keyStates['KeyD']) {
		playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
	}
	if (playerOnFloor) {
		if (keyStates['Space']) {
			playerVelocity.y = 15;
		}
	}
}
const loader = new GLTFLoader().setPath('./');
loader.load('test.glb', (gltf) => {
	_.scene.add(gltf.scene);
	worldOctree.fromGraphNode(gltf.scene);
	gltf.scene.traverse(child => {
		if (child.isMesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			if (child.material.map) {
				child.material.map.anisotropy = 8;
			}
		}
	});
	animate();
});

function teleportPlayerIfOob() {
	if (_.camera.position.y <= -25) {
		playerCollider.start.set(0, 0.35, 0);
		playerCollider.end.set(0, 1, 0);
		playerCollider.radius = 0.35;
		_.camera.position.copy(playerCollider.end);
		_.camera.rotation.set(0, 0, 0);
	}
}


function animate() {
	const deltaTime = Math.min(0.05, _.clock.getDelta()) / STEPS_PER_FRAME;
	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.
	for (let i = 0; i < STEPS_PER_FRAME; i++) {
		controls(deltaTime);
		updatePlayer(deltaTime);
		updateSpheres(deltaTime);
		teleportPlayerIfOob();
	}
	renderer.render(_.scene, _.camera);
	stats.update();
	requestAnimationFrame(animate);
}