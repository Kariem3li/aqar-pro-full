"use client";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
// ✅ استيراد الرابط الموحد
import { API_URL } from "@/lib/config";

// تكوين الرابط الخاص بالإشعارات بناءً على الرابط الرئيسي
const NOTIFICATIONS_ENDPOINT = `${API_URL}/auth/notifications/`;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // ✅ استخدام المتغير الديناميكي
      const res = await fetch(NOTIFICATIONS_ENDPOINT, {
        headers: { "Authorization": `Token ${token}` },
        cache: 'no-store' 
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        
        setNotifications(list);
        const count = list.filter((n: any) => !n.is_read).length;
        setUnreadCount(count);
      } else {
        // console.log(`Server Error: ${res.status}`);
      }
    } catch (err) {
      // عرض رسالة خطأ ذكية توضح الرابط الذي يحاول الاتصال به
      console.error(`Fell to fetch notifications from: ${NOTIFICATIONS_ENDPOINT}`, err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));

    try {
        // ✅ استخدام المتغير الديناميكي مع الأكشن
        await fetch(`${NOTIFICATIONS_ENDPOINT}mark_all_read/`, {
            method: "POST",
            headers: { "Authorization": `Token ${token}` }
        });
    } catch (e) {
        console.error("فشل تحديث القراءة", e);
    }
  };

  const toggleMenu = () => {
    if (!isOpen && unreadCount > 0) markAllRead();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleMenu} 
        className="relative p-2 rounded-xl hover:bg-brand-light transition text-brand-primary"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-brand-light/50">
            <h3 className="font-bold text-sm text-brand-primary">الإشعارات</h3>
            <span className="text-[10px] text-gray-500">{notifications.length} رسالة</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-brand-light/30 transition flex gap-3 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}>
                   <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-brand-accent' : 'bg-gray-300'}`}></div>
                   <div>
                      <h4 className="text-xs font-bold text-brand-primary mb-1">{notif.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-gray-300 mt-2 block">{new Date(notif.created_at).toLocaleDateString('ar-EG')}</span>
                   </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                لا توجد إشعارات حالياً 🔕
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}