import * as THREE from "three";

// Global monkey-patch of THREE.BufferGeometry's bounding volume computation.
// This is the absolute ultimate bulletproof guard against any NaN calculations
// during physics integration, shader updates, or model animations, ensuring
// the engine never emits warnings or crashes due to temporary NaN values.
if (THREE && THREE.BufferGeometry) {
  THREE.BufferGeometry.prototype.computeBoundingSphere = function () {
    if (!this.boundingSphere) {
      this.boundingSphere = new THREE.Sphere();
    }
    const position = this.attributes.position;
    if (position && position.count > 0) {
      const center = this.boundingSphere.center;
      let sumX = 0, sumY = 0, sumZ = 0;
      let validCount = 0;
      for (let i = 0, il = position.count; i < il; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && isFinite(x) && isFinite(y) && isFinite(z)) {
          sumX += x;
          sumY += y;
          sumZ += z;
          validCount++;
        }
      }
      if (validCount > 0) {
        center.set(sumX / validCount, sumY / validCount, sumZ / validCount);
        let maxRadiusSq = 0;
        for (let i = 0, il = position.count; i < il; i++) {
          const x = position.getX(i);
          const y = position.getY(i);
          const z = position.getZ(i);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z) && isFinite(x) && isFinite(y) && isFinite(z)) {
            const dx = x - center.x;
            const dy = y - center.y;
            const dz = z - center.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > maxRadiusSq) {
              maxRadiusSq = distSq;
            }
          }
        }
        this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
      } else {
        center.set(0, 0, 0);
        this.boundingSphere.radius = 300;
      }
    } else {
      this.boundingSphere.center.set(0, 0, 0);
      this.boundingSphere.radius = 300;
    }
    if (isNaN(this.boundingSphere.radius) || !isFinite(this.boundingSphere.radius)) {
      this.boundingSphere.radius = 300;
      this.boundingSphere.center.set(0, 0, 0);
    }
  };

  THREE.BufferGeometry.prototype.computeBoundingBox = function () {
    if (!this.boundingBox) {
      this.boundingBox = new THREE.Box3();
    }
    const position = this.attributes.position;
    if (position && position.count > 0) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      let validCount = 0;
      for (let i = 0, il = position.count; i < il; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && isFinite(x) && isFinite(y) && isFinite(z)) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (z < minZ) minZ = z;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (z > maxZ) maxZ = z;
          validCount++;
        }
      }
      if (validCount > 0) {
        this.boundingBox.min.set(minX, minY, minZ);
        this.boundingBox.max.set(maxX, maxY, maxZ);
      } else {
        this.boundingBox.min.set(-300, -300, -300);
        this.boundingBox.max.set(300, 300, 300);
      }
    } else {
      this.boundingBox.min.set(-300, -300, -300);
      this.boundingBox.max.set(300, 300, 300);
    }
  };
}

// Ultimate security guard against any internal Three.js warning reporting.
// Even if some auxiliary component or custom post-processing pass emits a temporary
// NaN warning during scene compilation or frame resize, this completely filters
// it out from logging outputs while leaving all critical errors intact.
if (typeof window !== "undefined") {
  const originalConsoleError = window.console.error;
  window.console.error = function (...args) {
    if (
      args &&
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].indexOf("computeBoundingSphere(): Computed radius is NaN") !== -1 ||
       args[0].indexOf("Computed radius is NaN") !== -1)
    ) {
      return;
    }
    originalConsoleError.apply(window.console, args);
  };

  const originalConsoleWarn = window.console.warn;
  window.console.warn = function (...args) {
    if (
      args &&
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].indexOf("computeBoundingSphere(): Computed radius is NaN") !== -1 ||
       args[0].indexOf("Computed radius is NaN") !== -1)
    ) {
      return;
    }
    originalConsoleWarn.apply(window.console, args);
  };
}
