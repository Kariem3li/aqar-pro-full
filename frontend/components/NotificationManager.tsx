"use client";
import { useEffect } from "react";
import { requestFcmToken, onMessageListener } from "../lib/firebase"; 
// ✅ التعديل: استيراد الرابط الموحد
import { API_URL } from "@/lib/config";

// أيقونة مبدئية للإشعارات (SVG Base64)
const LOGO_URL = `data:image/svg+xml;charset=utf-8,%3Csvg width='512' height='512' viewBox='0 0 512 512' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='512' height='512' rx='100' fill='%230f172a'/%3E%3Cpath d='M256 120L100 240V400H200V320H312V400H412V240L256 120Z' fill='%23d97706' stroke='%23fffbeb' stroke-width='20'/%3E%3Cpath d='M256 90L440 230V260L256 120L72 260V230L256 90Z' fill='%23fffbeb'/%3E%3C/svg%3E`;

export default function NotificationManager() {
  
  useEffect(() => {
    if (typeof window === "undefined") return;

    // فحص الأمان (HTTPS)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
        console.warn("⚠️ تنبيه: الإشعارات تتطلب HTTPS أو تفعيل Insecure origins على الموبايل.");
    }

    const initFirebase = async () => {
        try {
            // 1. محاولة جلب التوكن
            const token = await requestFcmToken();
            if (token) {
                // console.log("🔥 FCM Token Generated:", token);
                
                const authToken = localStorage.getItem("token");
                if (authToken) {
                    try {
                        // ✅ استخدام الرابط الديناميكي
                        const res = await fetch(`${API_URL}/auth/update-fcm/`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Token ${authToken}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ fcm_token: token })
                        });
                        if (res.ok) console.log("✅ Token synced with server");
                    } catch(e) {
                        console.error("❌ Error syncing token:", e);
                    }
                }
            }

            // 2. استقبال الرسائل والموقع مفتوح (Foreground)
            onMessageListener().then((payload: any) => {
                if(payload?.notification) {
                    // console.log("📩 New Message (Foreground):", payload);
                    
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            (registration.showNotification as any)(payload.notification.title, {
                                body: payload.notification.body,
                                icon: LOGO_URL, // استخدام اللوجو المدمج
                                data: { url: payload.data?.url || '/' },
                                tag: 'renotify-tag', 
                                renotify: true,
                                vibrate: [200, 100, 200]
                            });
                        });
                    }
                }
            });

        } catch (error) {
            console.log("Firebase init error:", error);
        }
    };

    initFirebase();
  }, []);

  return null;
}