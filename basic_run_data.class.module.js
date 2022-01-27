import {
    Octree
} from './math/Octree.js';

import * as THREE from "./three.module.js";

import { class_options } from "./options.class.module.js";

import Stats from './stats.module.js';

class basic_run_data {
    ambient_light = false;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();
    container = false;
    delta_time = 0;
    directional_light = false;
    fill_light_1 = false;
    fill_light_2 = false;
    key_states = {};
    loader = false;
    main_container = false;
    mouse_time = 0;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    scene = new THREE.Scene();
    stats = false;
    vector_1 = new THREE.Vector3();
    vector_2 = new THREE.Vector3();
    vector_3 = new THREE.Vector3();
    world_octree = new Octree();
    stats = false;
    options = new class_options();
    player = false;
    modules = {
        spheres: false,

    };
}

basic_run_data.prototype.init = function (_opt) {
    if (!_opt) {
        return false;
    }
    this.options = _opt;
    this.scene.background = new THREE.Color(this.options.color_background);
    this.camera.rotation.order = 'YXZ';
    this.ambient_light = new THREE.AmbientLight(this.options.color_ambient_light);
    this.scene.add(this.ambient_light);
    this.fill_light_1 = new THREE.DirectionalLight(this.options.color_fill_light_1, 0.5);
    this.fill_light_1.position.set(- 1, 1, 2);
    this.scene.add(this.fill_light_1);
    this.fill_light_2 = new THREE.DirectionalLight(this.options.color_fill_light_2, 0.5);
    this.fill_light_2.position.set(0, -1, 0);
    this.scene.add(this.fill_light_2);
    this.directional_light = new THREE.DirectionalLight(this.options.color_directional_light, 1.2);
    this.directional_light.position.set(- 5, 25, - 1);
    this.directional_light.castShadow = true;
    this.directional_light.shadow.camera.near = 0.01;
    this.directional_light.shadow.camera.far = 500;
    this.directional_light.shadow.camera.right = 30;
    this.directional_light.shadow.camera.left = - 30;
    this.directional_light.shadow.camera.top = 30;
    this.directional_light.shadow.camera.bottom = - 30;
    this.directional_light.shadow.mapSize.width = 1024;
    this.directional_light.shadow.mapSize.height = 1024;
    this.directional_light.shadow.radius = 4;
    this.directional_light.shadow.bias = - 0.00006;
    this.scene.add(this.directional_light);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.container = document.getElementById(this.options.html_container);
    this.container.appendChild(this.renderer.domElement);

    if (this.options.stat_enabled) {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.container.appendChild(this.stats.domElement);
    }
}

export { basic_run_data };