import * as THREE from './three.module.js';

import Stats from './stats.module.js';

import {
	GLTFLoader
} from './GLTFLoader.js';

import {
	Octree
} from './math/Octree.js';
import {
	Capsule
} from './math/Capsule.js';


import * as SkeletonUtils from './SkeletonUtils.js';

import {
	GUI
} from './lil-gui.module.min.js';

import {
	PointerLockControls
} from './PointerLockControls.js';

import * as dev from "./dev.js"

const clock = new THREE.Clock();
let playerVelocity = new THREE.Vector3();

const mixers = [];
window.player_state = {
	move_forward: false,
	move_right: false,
	can_jump: false,
	move_backward: false,
	move_left: false,
	player_on_floor: false,
	id: "?",
	velocity: playerVelocity
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('red');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const ambientlight = new THREE.AmbientLight(0x6688cc);
scene.add(ambientlight);

const fillLight1 = new THREE.DirectionalLight(0xff9999, 0.5);
fillLight1.position.set(-1, 1, 2);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
fillLight2.position.set(0, -1, 0);
scene.add(fillLight2);

const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({
	antialias: true
});
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


let spheres = [];
window.options = {
	GRAVITY: 30,
	MAX_SPHERES: 2,
	SPHERE_RADIUS: 0.2,
	STEPS_PER_FRAME: 5,
	curr_num_spheres: 0,
	reset_spheres: function() {
		//spheres = [];
		options.sphereIdx = 0;
		if (0 < spheres.length) {
			for (var $i = 0; $i < spheres.length; $i++) {
				scene.remove(spheres[$i]);
			}
		}
		for (let i = 0; i < options.MAX_SPHERES; i++) {
			var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
			sphere.castShadow = true;
			sphere.receiveShadow = true;
			scene.add(sphere);
			spheres.push({
				mesh: sphere,
				collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), options.SPHERE_RADIUS),
				velocity: new THREE.Vector3()
			});
		}
		console.log("reset_spheres runned");
	}, //end reset spheres
	speed_delta_on_floor: 120,
	speed_delta_on_fly: 10,
	jump_value: 350,
	sphereIdx: 0
};


const sphereGeometry = new THREE.SphereGeometry(options.SPHERE_RADIUS, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
	color: 0x888855,
	roughness: 0.8,
	metalness: 0.5
});

const base_sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
const worldOctree = new Octree();
const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
const playerDirection = new THREE.Vector3();
let mouseTime = 0;
const keyStates = {};
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();


window.options.reset_spheres();


document.addEventListener('keydown', function(event) {

	keyStates[event.code] = true;

	switch (event.keyCode) {

		case 38: // up
		case 87: // w
			player_state.move_forward = true;
			break;

		case 37: // left
		case 65: // a
			player_state.move_left = true;
			break;

		case 40: // down
		case 83: // s
			player_state.move_backward = true;
			break;

		case 39: // right
		case 68: // d
			player_state.move_right = true;
			break;

		case 32: // space
			if (player_state.can_jump === true) {
				velocity.y += options.jump_value;
				player_state.can_jump = false;
			}
			break;

	}

});

document.addEventListener('keyup', function(event) {
	keyStates[event.code] = false;
	switch (event.keyCode) {
		case 38: // up
		case 87: // w
			player_state.move_forward = false;
			break;
		case 37: // left
		case 65: // a
			player_state.move_left = false;
			break;
		case 40: // down
		case 83: // s
			player_state.move_backward = false;
			break;
		case 39: // right
		case 68: // d
			player_state.move_right = false;
			break;
	}

});

document.addEventListener('mousedown', () => {

	//document.body.requestPointerLock();

	mouseTime = performance.now();

});

document.addEventListener('mouseup', function() {
	if (controls_2.isLocked) {
		//throwBall();
		//function throwBall() {
		if (0 < spheres.length) {

			const sphere = spheres[options.sphereIdx];
			camera.getWorldDirection(playerDirection);
			sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);
			// throw the ball with more force if we hold the button longer, and if we move forward
			const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));
			sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
			sphere.velocity.addScaledVector(playerVelocity, 2);
			options.sphereIdx = (options.sphereIdx + 1) % spheres.length;
		} else {
			console.log("No spheres");
		}
		//}

	}
});
/*
document.body.addEventListener('mousemove', (event) => {
	//if (document.pointerLockElement === document.body) {
	if (event.target.parentElement.id == "container") {
		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;
	}
});

*/
window.addEventListener('resize', function() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('DOMMouseScroll mousewheel', function(e) {
	if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0) {
		options.GRAVITY--;
	} else {
		options.GRAVITY++;
	}
});




function playerCollisions() {

	const result = worldOctree.capsuleIntersect(playerCollider);

	player_state.player_on_floor = false;

	if (result) {

		player_state.player_on_floor = result.normal.y > 0;

		if (!player_state.player_on_floor) {

			playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));

		}

		playerCollider.translate(result.normal.multiplyScalar(result.depth));

	}

}

function updatePlayer(deltaTime) {

	let damping = Math.exp(-4 * deltaTime) - 1;

	if (!player_state.player_on_floor) {

		playerVelocity.y -= options.GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.1;

	}

	playerVelocity.addScaledVector(playerVelocity, damping);

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);

	playerCollisions();

	camera.position.copy(playerCollider.end);

}

function playerSphereCollision(sphere) {

	const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

	const sphere_center = sphere.collider.center;

	const r = playerCollider.radius + sphere.collider.radius;
	const r2 = r * r;


	for (const point of [playerCollider.start, playerCollider.end, center]) {

		const d2 = point.distanceToSquared(sphere_center);

		if (d2 < r2) {

			const normal = vector1.subVectors(point, sphere_center).normalize();
			const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
			const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

			playerVelocity.add(v2).sub(v1);
			sphere.velocity.add(v1).sub(v2);

			const d = (r - Math.sqrt(d2)) / 2;
			sphere_center.addScaledVector(normal, -d);

		}

	}

}

function spheresCollisions() {
	for (let i = 0, length = spheres.length; i < length; i++) {
		const s1 = spheres[i];
		for (let j = i + 1; j < length; j++) {
			const s2 = spheres[j];
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
				s2.collider.center.addScaledVector(normal, -d);
			}
		}
	}
}

function updateSpheres(deltaTime) {
	spheres.forEach(sphere => {
		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
		const result = worldOctree.sphereIntersect(sphere.collider);
		if (result) {
			sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
		} else {
			sphere.velocity.y -= options.GRAVITY * deltaTime;
		}
		const damping = Math.exp(-1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);
		playerSphereCollision(sphere);
	});
	spheresCollisions();
	for (const sphere of spheres) {
		sphere.mesh.position.copy(sphere.collider.center);
	}
}

function getForwardVector() {

	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;

}

function getSideVector() {

	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(camera.up);

	return playerDirection;

}

//// CONTROLS
let controls_2 = new PointerLockControls(camera, document.body);

function controls(deltaTime) {

	if (!controls_2.isLocked) {
		return false;
	}

	// gives a bit of air control
	const speedDelta = deltaTime * (player_state.player_on_floor ? options.speed_delta_on_floor : options.speed_delta_on_fly);

	if (keyStates['KeyW']) {

		playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));

	}

	if (keyStates['KeyS']) {

		playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));

	}

	if (keyStates['KeyA']) {

		playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));

	}

	if (keyStates['KeyD']) {

		playerVelocity.add(getSideVector().multiplyScalar(speedDelta));

	}

	if (player_state.player_on_floor) {

		if (keyStates['Space']) {

			playerVelocity.y = 15;

		}

	}

}

const loader = new GLTFLoader().setPath('./');

loader.load('test.glb', (gltf) => {

	scene.add(gltf.scene);

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
	if (camera.position.y <= -25) {
		playerCollider.start.set(0, 0.35, 0);
		playerCollider.end.set(0, 1, 0);
		playerCollider.radius = 0.35;
		camera.position.copy(playerCollider.end);
		camera.rotation.set(0, 0, 0);
	}
}


function animate() {

	const deltaTime = Math.min(0.05, clock.getDelta()) / options.STEPS_PER_FRAME;
	options.curr_num_spheres = spheres.length;
	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.

	for (let i = 0; i < options.STEPS_PER_FRAME; i++) {

		controls(deltaTime);

		updatePlayer(deltaTime);

		updateSpheres(deltaTime);

		teleportPlayerIfOob();

	}

	renderer.render(scene, camera);

	stats.update();

	requestAnimationFrame(animate);
} //end animate



const main_container = document.getElementById('container');

main_container.addEventListener('click', function() {

	controls_2.lock();

}, false);

controls_2.addEventListener('lock', function() {
	console.log("cursor locked");
	//instructions.style.display = 'none';
	//blocker.style.display = 'none';

});

controls_2.addEventListener('unlock', function() {
	console.log("cursor unlocked");
	//blocker.style.display = 'block';
	//instructions.style.display = '';

});
//scene.add(controls.getObject());






//options
const gui = new GUI();

var $t = Object.keys(options);
for (var $i = 0; $i < $t.length; $i++) {
	gui.add(options, $t[$i]).listen(); // Checkbox
}

//end options

const fpPromise = import('./fingerprint.min.js')
	.then(FingerprintJS => FingerprintJS.load())

// Get the visitor identifier when you need it.
fpPromise
	.then(fp => fp.get())
	.then(result => {
		// This is the visitor identifier:
		player_state.id = result.visitorId

	})

window.setInterval(function() {
	dev.info(player_state);
}, 100)

dev.log("Started");