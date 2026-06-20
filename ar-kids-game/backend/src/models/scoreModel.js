/**
 * In-memory score entry model.
 * Future: replace with database persistence.
 */
export function createScoreEntry(score) {
  return {
    score: Number(score),
    timestamp: new Date().toISOString(),
  };
}
