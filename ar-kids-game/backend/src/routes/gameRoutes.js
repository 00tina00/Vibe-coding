import { Router } from "express";
import {
  fetchGameConfig,
  saveScore,
} from "../controllers/gameController.js";

const router = Router();

router.get("/game-config", async (req, res, next) => {
  try {
    const config = await fetchGameConfig(req);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

router.post("/score", (req, res, next) => {
  try {
    const result = saveScore(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
