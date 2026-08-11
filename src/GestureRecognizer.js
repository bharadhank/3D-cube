export class GestureRecognizer {
  constructor(onGesture) {
    this.onGesture = onGesture;
    this.wasPinching = false;
    this.pinchThreshold = 0.05;
  }

  process(handData) {
    if (!handData) return;
    
    // Left hand: Orbit
    if (handData.left) {
      this.onGesture({ type: 'ORBIT', data: handData.left });
    } else {
      this.onGesture({ type: 'ORBIT_END' });
    }

    // Right hand: Pinch & Drag
    if (handData.right) {
      const mirrorX = 1.0 - handData.right.indexTip.x;
      const ndcX = (mirrorX * 2) - 1;
      const ndcY = -(handData.right.indexTip.y * 2) + 1;
      
      const dx = handData.right.indexTip.x - handData.right.thumbTip.x;
      const dy = handData.right.indexTip.y - handData.right.thumbTip.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isPinching = dist < this.pinchThreshold;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const clientX = (ndcX + 1) / 2 * screenW;
      const clientY = (-ndcY + 1) / 2 * screenH;
      
      // Calculate Palm Angle for Wrist Twist
      const indexMcp = handData.right.landmarks[5];
      const pinkyMcp = handData.right.landmarks[17];
      let palmAngle = Math.atan2(pinkyMcp.y - indexMcp.y, pinkyMcp.x - indexMcp.x);
      
      // Normalize angle to avoid wrapping issues (simple approach for now)
      
      const pointerData = { ndcX, ndcY, clientX, clientY, palmAngle };

      if (!isPinching) {
        this.onGesture({ type: 'HOVER', data: pointerData });
      }

      if (isPinching && !this.wasPinching) {
        this.initialPalmAngle = palmAngle;
        this.onGesture({ type: 'PINCH_START', data: pointerData });
      } else if (isPinching && this.wasPinching) {
        // Calculate delta angle
        let deltaAngle = palmAngle - this.initialPalmAngle;
        
        // Handle angle wrapping across PI / -PI
        if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
        if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
        
        pointerData.deltaAngle = deltaAngle;
        this.onGesture({ type: 'PINCH_TWIST', data: pointerData });
      } else if (!isPinching && this.wasPinching) {
        this.onGesture({ type: 'PINCH_END', data: pointerData });
        this.initialPalmAngle = 0;
      }

      this.wasPinching = isPinching;
      this.onGesture({ type: 'DEBUG_PINCH', state: isPinching });
    } else {
      if (this.wasPinching) {
        this.onGesture({ type: 'PINCH_END', data: null });
        this.wasPinching = false;
      }
      this.onGesture({ type: 'HOVER_END' });
      this.onGesture({ type: 'DEBUG_PINCH', state: false });
    }
  }
}
