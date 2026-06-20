import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import appConfig from "./config/default.json" with { type: "json" };
import { corsMiddleware } from "./middleware/cors.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import gameRoutes from "./routes/gameRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(corsMiddleware());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ar-kids-game-backend" });
});

app.use("/api", gameRoutes);

const sharedPath = path.resolve(__dirname, "../../shared");
app.use("/shared", express.static(sharedPath));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || appConfig.port;

app.listen(PORT, () => {
  console.log(`AR Kids Game API running at http://localhost:${PORT}`);
});

export default app;
