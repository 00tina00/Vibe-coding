export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isActive = false;
  }

  async start() {
    if (this.isActive) return this.stream;

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
    }

    this.video.srcObject = this.stream;
    await this.video.play();
    this.isActive = true;
    return this.stream;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.isActive = false;
  }

  getAspectRatio() {
    if (this.video.videoWidth && this.video.videoHeight) {
      return this.video.videoWidth / this.video.videoHeight;
    }
    return 16 / 9;
  }
}
