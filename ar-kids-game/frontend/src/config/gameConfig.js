export const gameConfig = {
  apiBaseUrl: "/api",
  defaultLanguage: "fa",
  supportedLanguages: ["fa"],
  spawn: {
    minCount: 5,
    maxCount: 8,
    worldRadius: 6,
    minAngularDistance: 0.35,
    pitchMin: -0.35,
    pitchMax: 0.35,
  },
  animation: {
    floatAmplitude: 0.15,
    glowPulseSpeed: 2,
  },
  ar: {
    futureProviders: ["webxr", "arcore", "arkit"],
    currentMode: "camera-overlay",
  },
  performance: {
    targetFps: 60,
    maxParticles: 40,
  },
};
