import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ModelLoader {
  loader = new GLTFLoader();
  models = {
    pickaxe: undefined
  };

  loadModels(onLoad) {
    this.loader.load("public/model/pickaxe.glb", (model) => {
      const mesh = model.scene;
      this.models.pickaxe = mesh;
      onLoad(this.models);
    });
  }
}
