import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC-bmb89-aNAWw44xoqoJe8BeGlu0UiFT8",
  authDomain: "aqarpro-35c90.firebaseapp.com",
  projectId: "aqarpro-35c90",
  storageBucket: "aqarpro-35c90.firebasestorage.app",
  messagingSenderId: "395466215046",
  appId: "1:395466215046:web:635c1d49c7ea03ed18cb07",
  measurementId: "G-MQG2K1QGHZ"
};

// تهيئة التطبيق (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// دالة لجلب التوكن (تعمل فقط في المتصفح)
export const requestFcmToken = async () => {
  try {
    if (typeof window !== "undefined" && await isSupported()) {
      const messaging = getMessaging(app);
      
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BNJZTHgqEJYgYPgVEqjgsI1Q-svykXmR2fEnPDwyv011BwCrzlAYXi-oLqSIc8UEcx9PaEHuKelGKmSHl6wLNCs" 
        });
        return token;
      } else {
        console.log("تم رفض الإذن بالإشعارات");
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("خطأ في FCM Token:", error);
    return null;
  }
};

// دالة للاستماع للرسائل (تعمل فقط في المتصفح)
export const onMessageListener = () =>
  new Promise(async (resolve) => {
    if (typeof window !== "undefined" && await isSupported()) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });