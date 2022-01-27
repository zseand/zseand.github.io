let $g = {};

import * as THREE from './three.module.js';

import Stats from './stats.module.js';

import {
	GLTFLoader
} from './GLTFLoader.js';

import { Octree } from './math/Octree.js';
import { Capsule } from './math/Capsule.js';

import * as SkeletonUtils from './SkeletonUtils.js';

import { class_player } from "./player.class.module.js";
import { basic_run_data } from './basic_run_data.class.module.js';
import { class_options } from "./options.class.module.js";
import { class_spheres } from "./spheres.class.module.js";
import * as dev from "./dev.module.js";
const STEPS_PER_FRAME = 5;
var opt = new class_options();
//opt.init(opt);
var _ = new basic_run_data();
_.init(opt);
_.modules.spheres = new class_spheres(opt.modules.sphere);
_ = _.modules.spheres.init(_);
_.player = new class_player(opt);
_ = _.player.init(_);


document.addEventListener('keydown', (_event) => {
	_.key_states[_event.code] = true;
});

document.addEventListener('keyup', (_event) => {
	_.key_states[_event.code] = false;
});

document.addEventListener('mousedown', (_event) => {
	document.body.requestPointerLock();
	_.mouse_time = performance.now();
	_.player.do_mousedown_action(_event);
});

document.addEventListener('mouseup', function (_event) {
	_.player.do_mouseup_action(_event);
}
);

document.body.addEventListener('mousemove', (event) => {
	if (document.pointerLockElement === document.body) {
		_.camera.rotation.y -= event.movementX / 500;
		_.camera.rotation.x -= event.movementY / 500;
	}
});

window.addEventListener('resize', function () {
	_.camera.aspect = window.innerWidth / window.innerHeight;
	_.camera.updateProjectionMatrix();
	_.renderer.setSize(window.innerWidth, window.innerHeight);
});


function playerSphereCollision(_sphere, _player) {
	if (!_player) {
		_player = _.player;
	}
	const center = _.vector_1.addVectors(_player.collider.start, _player.collider.end).multiplyScalar(0.5);
	const sphere_center = _sphere.collider.center;
	const r = _player.collider.radius + _sphere.collider.radius;
	const r2 = r * r;
	// approximation: player = 3 spheres
	for (const point of [_player.collider.start, _player.collider.end, center]) {
		const d2 = point.distanceToSquared(sphere_center);
		if (d2 < r2) {
			const normal = _.vector_1.subVectors(point, sphere_center).normalize();
			const v1 = _.vector_2.copy(normal).multiplyScalar(normal.dot(_player.velocity));
			const v2 = _.vector_3.copy(normal).multiplyScalar(normal.dot(_player.velocity));
			_player.velocity.add(v2).sub(v1);
			_sphere.velocity.add(v1).sub(v2);
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
				const normal = _.vector_1.subVectors(s1.collider.center, s2.collider.center).normalize();
				const v1 = _.vector_2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
				const v2 = _.vector_3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);
				const d = (r - Math.sqrt(d2)) / 2;
				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, - d);
			}
		}
	}
}


const loader = new GLTFLoader().setPath('./');
loader.load('test.glb', function (gltf) {
	_.scene.add(gltf.scene);
	_.world_octree.fromGraphNode(gltf.scene);
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
		_.player.collider.start.set(0, 0.35, 0);
		_.player.collider.end.set(0, 1, 0);
		_.player.collider.radius = 0.35;
		_.camera.position.copy(_.player.collider.end);
		_.camera.rotation.set(0, 0, 0);
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

	camera.position.copy(playerCollider.end);

}

function animate() {
	_.delta_time = Math.min(0.05, _.clock.getDelta()) / STEPS_PER_FRAME;
	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.
	for (let i = 0; i < STEPS_PER_FRAME; i++) {
		_ = _.player.controls(_);
		_ = _.player.update(_);
		//updatePlayer(deltaTime);
		//updateSpheres(deltaTime);
		_ = _.modules.spheres.update(_);
		//teleportPlayerIfOob();
	}
	_.renderer.render(_.scene, _.camera);
	_.stats.update();
	requestAnimationFrame(animate);
}