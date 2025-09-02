import * as THREE from "three";
import { WorldChunk } from "./Components/WorldChunk";
import { DataStore } from "./Utilities/dataStore";

export class World extends THREE.Group {
  asyncLoading = true;
  drawDistance = 1;

  chunkSize = { width: 42, height: 32 };

  params = {
    seed: 0,
    terrain: {
      scale: 100,
      magnitude: 3,
      offset: 4,
      waterOffset: 2,
    },
    trees: {
      trunk: {
        minHeight: 5,
        maxHeight: 7
      },
      canopy: {
        minRadius: 2,
        maxRadius: 3,
        density: 0.65
      },
      frequency: 0.01
    },
    clouds:{
      scale: 30,
      density: 0.351
    }

  };

  dataStore = new DataStore();

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  addBlock(x, y, z, blockid) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (coords.block.y === 0) return;

    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockid);
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
    }
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) chunk.disposeInstances();
    });
    this.clear();
  }

  generate() {
    this.dataStore.clear();
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(
          this.chunkSize,
          this.params,
          this.dataStore
        );
        chunk.position.set(
          x * this.chunkSize.width,
          0,
          z * this.chunkSize.width
        );
        chunk.userData = { x, z };
        chunk.generate();
        this.add(chunk);
      }
    }
  }

  generateChunk(x, z) {
    const chunk = new WorldChunk(
      this.chunkSize,
      this.params,
      (this.s = this.dataStore)
    );
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };
    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    chunk.generate();
    this.add(chunk);
    // console.log(`Adding chunk at X: ${x} Z: ${z}`);
  }

  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  getChunk(chunkX, chunkZ) {
    return this.children.find(
      (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ
    );
  }

  getChunksToAdd(visibleChunks) {
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z);
      return !chunkExists;
    });
  }

  getVisibleChunks(player) {
    const visibleChunks = [];
    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  hideBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (
      chunk &&
      chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)
    ) {
      chunk.deleteBLockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (coords.block.y === 0) return;

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);

      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
    }
  }

  removeUnusedChunks(visibleChunks) {
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find(
        (visibleChunks) => visibleChunks.x === x && visibleChunks.z === z
      );
      return !chunkExists;
    });
    for (const chunk of chunksToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
      // console.log(`remove x: ${chunk.userData.x} // z: ${chunk.userData.z}`);
    }
  }

  revealBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  update(player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };
    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

}
