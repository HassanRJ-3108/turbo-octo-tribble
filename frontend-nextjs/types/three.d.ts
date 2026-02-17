/// <reference types="three" />

// WebXR type augmentations for Three.js
// These ensure TypeScript recognizes WebXR APIs used alongside Three.js

declare module "three/addons/loaders/GLTFLoader.js" {
    export { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
}

declare module "three/addons/controls/OrbitControls.js" {
    export { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
}

declare module "three/addons/webxr/ARButton.js" {
    export { ARButton } from "three/examples/jsm/webxr/ARButton.js";
}
