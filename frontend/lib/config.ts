// frontend/lib/config.ts

// 👇👇 هذا هو المكان الوحيد الذي ستغير فيه الـ IP مستقبلاً 👇👇
export const SERVER_IP = "192.168.1.8"; 
export const API_PORT = "8000";

export const BASE_URL = `http://${SERVER_IP}:${API_PORT}`;
export const API_URL = `${BASE_URL}/api`;

// دالة مساعدة لإصلاح روابط الصور
export const getFullImageUrl = (path: string | null | undefined) => {
    if (!path) return "/placeholder.png"; 
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
};