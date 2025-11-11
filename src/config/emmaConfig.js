// Use environment variable for backend URL, fallback to default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:7070";

export const EMMA_API = `${BACKEND_URL}/api/chat`;
export const KB_ROOT = "C:\\Users\\ashra\\Google Drive\\Emma\\KnowledgeBase";
