import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "../Utilities/rng";
import { block as blocks, resources } from "../Utilities/Block";


const geometry = new THREE.BoxGeometry(1, 1);

export class WorldChunk extends THREE.Group {
  dataX = [];

  constructor(size, params, dataStore) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }

  addBlock(x, y, z, blockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.y, x, y, z, blockId);
    }
  }

  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // Verify the block exists, it isn't an empty block type, and it doesn't already have an instance
    if (block && block.id !== blocks.empty.id && block.instanceId === null) {
      const mesh = this.children.find(
        (instanceMesh) => instanceMesh.name === block.id
      );
      const instanceId = mesh.count++;
      this.setBlockIntanceId(x, y, z, instanceId);

      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  deleteBLockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block.id === blocks.empty.id || block.instanceId === null) return;

    const mash = this.children.find(
      (instanceMash) => instanceMash.name === block.id
    );
    const instanceId = block.instanceId;

    const lastMatrix = new THREE.Matrix4();
    mash.getMatrixAt(mash.count - 1, lastMatrix);

    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockIntanceId(v.x, v.y, v.z, instanceId);

    mash.setMatrixAt(instanceId, lastMatrix);
    mash.count--;

    mash.instanceMatrix.needsUpdate = true;
    mash.computeBoundingSphere();

    this.setBlockIntanceId(x, y, z, null);
  }

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.InitialiseTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateTrees(rng);
    this.generateClouds(rng);
    this.loadPlayerChanges();
    this.generateMeshes();

    this.loaded = true;
    // console.log(`performance: ${Math.floor(performance.now() - start)}ms`);
  }

  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          (simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale
          ) +
            1) *
          0.5;

        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
  }

  generateWater() {
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshLambertMaterial({
        color: "#0E87CC",
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    waterMesh.rotateX(-Math.PI / 2.0);
    waterMesh.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset + 0.4,
      this.size.width / 2
    );
    waterMesh.scale.set(this.size.width, this.size.width, 1);
    waterMesh.layers.set(1)
    this.add(waterMesh);
  }

  generateMeshes() {
    this.clear();
    this.generateWater();
    const maxCount = this.size.width * this.size.width * this.size.height;
    const meshes = {};
    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(
         geometry,
          blockType.material,
          maxCount
        );
        mesh.name = blockType.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        meshes[blockType.id] = mesh;
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if (blockId === blocks.empty.id) continue;
          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockIntanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }
    this.add(...Object.values(meshes));
  }

  generateResources(rng) {
    const simplex = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;
        let height = Math.floor(scaledNoise);

        height = Math.max(0, Math.min(height, this.size.height - 1));

        for (let y = 0; y <= this.size.height; y++) {
          if (y <= (this.params.terrain.waterOffset) && y <= height) {
            this.setBlockId(x, y, z, blocks.sand.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if ( y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  generateTrees() {
    let rng = new RNG(this.params.seed)
    const generateTreeTrunk = (x, z, rng) => {
      const minH = this.params.trees.trunk.minHeight;
      const maxH = this.params.trees.trunk.maxHeight;
      const h = Math.round(minH + (maxH - minH) * rng.random());

      for (let y = 0; y < this.size.height; y++) {
        const block = this.getBlock(x, y, z);
        if (block && block.id === blocks.grass.id) {
          for (let treeY = y + 1; treeY <= y + h; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }
          generateTreeCanopy(x, y + h, z, rng);
          break;
        }
      }
    };

    const generateTreeCanopy = (centerX, centerY, centerZ, rng) => {
      const minR = this.params.trees.canopy.minRadius;
      const maxR = this.params.trees.canopy.maxRadius;
      const r = Math.round(minR + (maxR - minR) * rng.random());

      for (let x = -r; x <= r; x++) {
        for (let y = -r; y <= r; y++) {
          for (let z = -r; z <= r; z++) {
            const n = rng.random();
            if (x * x + y * y + z * z >= r * r) continue;

            const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
            if (block && block.id !== blocks.empty.id) continue;
            if (n < this.params.trees.canopy.density) {
              this.setBlockId(
                centerX + x,
                centerY + y,
                centerZ + z,
                blocks.leaves.id
              );
            }
          }
        }
      }
    };
    
    let offset = this.params.trees.canopy.maxRadius;
    for (let x = offset; x < this.size.width - offset; x++) {
      for (let z = offset; z < this.size.width - offset; z++) {
        if (rng.random() < this.params.trees.frequency) {
          generateTreeTrunk(x, z, rng);
        }
      }
    }
  }

  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.dataX[x][y][z];
    } else {
      return null;
    }
  }

  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  InitialiseTerrain() {
    this.dataX = [];
    for (let x = 0; x < this.size.width; x++) {
      const sliceY = [];
      for (let y = 0; y < this.size.height; y++) {
        const rowZ = [];
        for (let z = 0; z < this.size.width; z++) {
          rowZ.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        sliceY.push(rowZ);
      }
      this.dataX.push(sliceY);
    }
  }

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    // If any of the block's sides is exposed, it is not obscured
    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      forward === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false;
    } else {
      return true;
    }
  }

  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const blockId = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z
            );
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      this.deleteBLockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(
        this.position.x,
        this.position.y,
        x,
        y,
        z,
        blocks.empty.id
      );
    }
  }

  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.dataX[x][y][z].id = id;
    }
  }

  setBlockIntanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.dataX[x][y][z].instanceId = instanceId;
    }
  }
}
