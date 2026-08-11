export class CameraManager {
  constructor(videoElement, containerElement) {
    this.video = videoElement;
    this.container = containerElement;
    this.stream = null;
    this.isActive = false;
  }

  async startCamera() {
    try {
      console.log("[CameraManager] Requesting camera access...");
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } 
      });
      
      this.video.srcObject = this.stream;
      this.container.style.display = "block";
      
      return new Promise((resolve) => {
        this.video.addEventListener("loadeddata", () => {
          this.isActive = true;
          console.log("[CameraManager] Camera active.");
          
          // Match canvas size to video aspect ratio
          const canvas = document.getElementById('landmark-canvas');
          if (canvas) {
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
          }
          
          resolve(true);
        }, { once: true });
      });
    } catch (err) {
      console.error("[CameraManager] Camera access denied or failed", err);
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.isActive = false;
      this.container.style.display = "none";
      console.log("[CameraManager] Camera stopped.");
    }
  }
}
