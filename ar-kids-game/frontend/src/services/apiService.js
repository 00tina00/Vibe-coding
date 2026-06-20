const API_BASE = "/api";

export async function fetchGameConfig(language) {
  const params = language ? `?language=${language}` : "";
  const response = await fetch(`${API_BASE}/game-config${params}`);

  if (!response.ok) {
    throw new Error(`Failed to load game config: ${response.status}`);
  }

  return response.json();
}

export async function postScore(score) {
  const response = await fetch(`${API_BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save score: ${response.status}`);
  }

  return response.json();
}
