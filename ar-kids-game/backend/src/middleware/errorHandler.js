export function errorHandler(err, _req, res, _next) {
  console.error("[API Error]", err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
}
