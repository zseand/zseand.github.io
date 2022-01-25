import {
    Octree
} from './math/Octree.js';

import * as THREE from "./three.module.js";

class basic_run_data {
    ambient_light = false;
    camera = false;
    clock = false;
    container = false;
    directional_light = false;
    fill_light_1 = false;
    fill_light_2 = false;
    key_states = {};
    loader = false;
    main_container = false;
    mouse_time = 0;
    renderer = false;
    scene = false;
    stats = false;
    vector_1 = new THREE.Vector3();
    vector_2 = new THREE.Vector3();
    vector_3 = new THREE.Vector3();
    world_octree = new Octree();
    stats = false;
    //TODO: move this to sphere
    sphereIdx = 0;
    spheres = [];
}

export default basic_run_data;