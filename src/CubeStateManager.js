export class CubeStateManager {
  constructor(cube) {
    this.cube = cube;
  }

  updateGridAfterRotation(layerCubies) {
    // Re-calculate internal grid coords for 3x3x3 after a 90 degree snap
    layerCubies.forEach(c => {
      const p = c.position;
      c.userData.gridX = Math.round(p.x / 1.05);
      c.userData.gridY = Math.round(p.y / 1.05);
      c.userData.gridZ = Math.round(p.z / 1.05);
    });
  }

  getLayer(axis, gridValue) {
    return this.cube.cubies.filter(c => c.userData['grid' + axis.toUpperCase()] === gridValue);
  }
}
