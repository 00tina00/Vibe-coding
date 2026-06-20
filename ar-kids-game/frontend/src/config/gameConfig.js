export const gameConfig = {
  apiBaseUrl: "/api",
  defaultLanguage: "fa",
  supportedLanguages: ["fa"],
  spawn: {
    minCount: 5,
    maxCount: 8,
    minDistance: 0.8,
    depthMin: -6,
    depthMax: -3,
    verticalSpread: 1.5,
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
