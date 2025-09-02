import { GUI } from "lil-gui";
import { block, resources } from "./Block";

export function createUi(world, obj) {
  const gui = new GUI();

  gui.add(obj, "shadow");
  const terrainfolder = gui.addFolder("Terrain");
  // terrainfolder.add(helper).name("Shadow helper")
  terrainfolder.add(world, "asyncLoading").name("Async Loading");
  terrainfolder.add(world, "drawDistance", 0, 5, 1).name("Draw Distance");
  // terrainfolder.add(world.chunkSize, "height", 8, 128, 1).name("Height");
  terrainfolder.add(world.params, "seed", 0, 10000).name("Seed");
  terrainfolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainfolder.add(world.params.terrain, "magnitude", 0,32, 1).name("Magnitude");
  terrainfolder.add(world.params.terrain, "offset", 0,32, 1).name("Offset");
  terrainfolder.add(world.params.terrain, 'waterOffset', 0,32,1).name('water offset')

  const resourcesFolder = gui.addFolder("Resources");

  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
  });

  const treesFolder = terrainfolder.addFolder("Trees").close();
  treesFolder.add(world.params.trees, "frequency", 0, 0.1).name("Frequency");
  treesFolder
    .add(world.params.trees.trunk, "minHeight", 0, 10, 1)
    .name("Min Trunk Height");
  treesFolder
    .add(world.params.trees.trunk, "maxHeight", 0, 10, 1)
    .name("Max Trunk Height");
  treesFolder
    .add(world.params.trees.canopy, "minRadius", 0, 10, 1)
    .name("Min Canopy Size");
  treesFolder
    .add(world.params.trees.canopy, "maxRadius", 0, 10, 1)
    .name("Max Canopy Size");
  treesFolder
    .add(world.params.trees.canopy, "density", 0, 1)
    .name("Canopy Density");

  const cloudsFolder = terrainfolder.addFolder("Clouds").close();
  cloudsFolder.add(world.params.clouds, "density", 0, 1).name("Density");
  cloudsFolder.add(world.params.clouds, "scale", 1, 100, 1).name("Scale");

  gui.onChange(() => {
    world.generate();
  });
}
