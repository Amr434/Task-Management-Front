// Kept separate from apiClient so modules in its import cycle (auth store,
// auth api) can read the base URL at module-init time without hitting a
// partially initialized module.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7249/api";
