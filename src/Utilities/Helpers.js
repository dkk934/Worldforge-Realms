import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


export const Helper = new Help();

function Help() {
    const grid = new THREE.GridHelper();
    const axishlper = new THREE.AxesHelper(5);
    const DLightHelper = (DirectionalLight) =>{
        const HELPERES = new THREE.DirectionalLightHelper(DirectionalLight);
        return HELPERES;
    }

    const createOrbitControls = (camera, renderer) => {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 0, 0);
        controls.update();
        return controls;
    }

    return { grid, createOrbitControls, axishlper, DLightHelper };
}
