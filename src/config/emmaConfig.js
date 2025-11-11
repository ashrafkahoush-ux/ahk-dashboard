// Use environment variable for backend URL, fallback to default
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const EMMA_ENGINE_URL = import.meta.env.VITE_EMMA_ENGINE_URL || "http://localhost:7070";

export const EMMA_API = `${EMMA_ENGINE_URL}/api/chat`;
export const KB_ROOT = "C:\\Users\\ashra\\Google Drive\\Emma\\KnowledgeBase";
