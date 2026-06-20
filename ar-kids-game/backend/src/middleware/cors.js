import cors from "cors";
import appConfig from "../config/default.json" with { type: "json" };

export function corsMiddleware() {
  return cors({
    origin: appConfig.corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });
}
