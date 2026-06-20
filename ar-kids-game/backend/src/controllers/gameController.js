import { getGameConfig } from "../services/configService.js";

import { createScoreEntry } from "../models/scoreModel.js";

const scores = [];

export async function fetchGameConfig(req) {
  const language = req.query.language || undefined;
  return getGameConfig(language);
}

export function saveScore(body) {
  const score = Number(body?.score);

  if (!Number.isFinite(score) || score < 0) {
    const error = new Error("Invalid score value");
    error.status = 400;
    throw error;
  }

  const entry = createScoreEntry(score);
  scores.push(entry);

  return { success: true, entry };
}

export function getScoreHistory() {
  return scores.slice(-50);
}
