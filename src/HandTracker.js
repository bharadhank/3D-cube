import { HandLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export class HandTracker {
  constructor(videoElement, canvasElement, onHandData) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onHandData = onHandData;
    this.handLandmarker = null;
    this.isActive = false;
    this.drawingUtils = new DrawingUtils(this.ctx);
  }

  async init() {
    try {
      console.log("[HandTracker] Loading MediaPipe models...");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      console.log("[HandTracker] MediaPipe models loaded successfully.");
      this.isActive = true;
      this.detectFrame();
    } catch (err) {
      console.error("[HandTracker] Failed to load MediaPipe", err);
    }
  }

  detectFrame() {
    if (!this.isActive || !this.handLandmarker || !this.video.videoWidth) {
      requestAnimationFrame(() => this.detectFrame());
      return;
    }

    const startTimeMs = performance.now();
    const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const parsedData = {
      left: null,
      right: null,
      handsDetected: false,
      numHands: 0
    };

    if (results.landmarks && results.landmarks.length > 0) {
      parsedData.handsDetected = true;
      parsedData.numHands = results.landmarks.length;

      for (let i = 0; i < results.landmarks.length; i++) {
        // Draw landmarks for debugging
        this.drawingUtils.drawConnectors(results.landmarks[i], HandLandmarker.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2
        });
        this.drawingUtils.drawLandmarks(results.landmarks[i], { color: "#FF0000", lineWidth: 1, radius: 3 });

        // Map handedness (swap because video is mirrored via CSS)
        const handedness = results.handednesses[i][0].categoryName === 'Left' ? 'right' : 'left';
        const landmarks = results.landmarks[i];
        
        parsedData[handedness] = {
          indexTip: landmarks[8],
          thumbTip: landmarks[4],
          wrist: landmarks[0],
          landmarks: landmarks
        };
      }
    }

    if (this.onHandData) {
      this.onHandData(parsedData);
    }

    requestAnimationFrame(() => this.detectFrame());
  }
}
