"use client";
import Link from "next/link";
import { User, LogIn, Menu, X, LogOut, Home, PlusSquare, ShieldAlert } from "lucide-react"; 
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

// ✅ التعديل: استيراد الرابط الأساسي من ملف الإعدادات الموحد
import { BASE_URL } from "@/lib/config";

// ✅ التعديل: استخدام المتغير بدلاً من الرقم الثابت
const ADMIN_URL = `${BASE_URL}/admin`; 

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = localStorage.getItem("username") || sessionStorage.getItem("username");
    const staffStatus = localStorage.getItem("is_staff") === "true" || sessionStorage.getItem("is_staff") === "true"; 
    
    setIsLoggedIn(!!token);
    if(storedUser) setUsername(storedUser);
    setIsAdmin(staffStatus);
  }, [pathname]);

  const handleLogout = () => {
      if(confirm("هل تريد تسجيل الخروج؟")) {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
      }
  };

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 h-20 z-[100] px-6 flex items-center justify-between shadow-2xl rounded-2xl">
        
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-accent font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">R</div>
          <div className="flex flex-col">
             <span className="text-xl font-black text-brand-primary tracking-tight leading-none">رواسي</span>
             <span className="text-[10px] text-brand-secondary font-bold tracking-widest">REAL ESTATE</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-4">
            {/* زر الأدمن */}
            {isAdmin && (
                <a href={ADMIN_URL} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg animate-pulse text-xs">
                    <ShieldAlert className="w-4 h-4"/> الإدارة
                </a>
            )}

            <Link href="/" className={`font-bold hover:text-brand-accent transition ${pathname === '/' ? 'text-brand-accent' : 'text-brand-primary'}`}>الرئيسية</Link>
            
            {isLoggedIn ? (
                <>
                    <Link href="/my-listings" className="font-bold text-brand-primary hover:text-brand-accent transition">إعلاناتي</Link>
                    <Link href="/add-property" className="bg-brand-accent text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg shadow-brand-accent/20 flex items-center gap-2 text-xs">
                        <PlusSquare className="w-4 h-4"/> إضافة عقار
                    </Link>
                    
                    {/* الجرس */}
                    <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
                    <NotificationBell />
                    <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

                    <Link href="/profile" className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-brand-primary font-bold border-2 border-brand-primary hover:bg-brand-primary hover:text-white transition">
                        {username ? username[0] : <User className="w-5 h-5"/>}
                    </Link>
                </>
            ) : (
                <Link href="/login" className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-secondary transition shadow-xl flex items-center gap-2">
                    <LogIn className="w-4 h-4"/> دخول
                </Link>
            )}
        </div>

        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-brand-primary hover:bg-brand-light rounded-xl transition">
            <Menu className="w-8 h-8" />
        </button>
      </nav>

      {/* الموبايل */}
      <div className={`fixed inset-0 bg-brand-primary/60 z-[150] transition-opacity duration-300 backdrop-blur-sm ${isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={() => setIsSidebarOpen(false)}></div>

      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-[320px] bg-white z-[160] shadow-2xl transform transition-transform duration-300 ease-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-brand-primary">القائمة</h2>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100"><X className="w-6 h-6" /></button>
              </div>

              {isAdmin && (
                <a href={ADMIN_URL} className="mb-6 bg-red-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg">
                    <ShieldAlert className="w-5 h-5"/> لوحة الإدارة
                </a>
              )}

              {isLoggedIn && (
                  <div className="flex justify-between items-center bg-brand-light p-4 rounded-2xl mb-4">
                      <span className="font-bold text-brand-primary">الإشعارات</span>
                      <NotificationBell />
                  </div>
              )}

              {isLoggedIn ? (
                  <div className="bg-brand-light p-5 rounded-2xl border border-gray-100 mb-6 flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {username ? username[0].toUpperCase() : <User/>}
                      </div>
                      <div>
                          <p className="text-xs text-gray-500 font-bold">مرحباً بك،</p>
                          <p className="font-black text-brand-primary text-lg">{username || "مستخدم"}</p>
                      </div>
                  </div>
              ) : (
                  <Link href="/login" className="bg-brand-primary text-white p-4 rounded-2xl flex items-center justify-center gap-2 mb-6 font-bold shadow-lg" onClick={() => setIsSidebarOpen(false)}>
                      <LogIn className="w-5 h-5" /> تسجيل دخول / حساب جديد
                  </Link>
              )}

              <div className="space-y-3 flex-1">
                  <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-brand-light text-brand-primary font-bold text-lg" onClick={() => setIsSidebarOpen(false)}>
                      <Home className="w-5 h-5"/> الرئيسية
                  </Link>
                  <Link href="/add-property" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-brand-light text-brand-primary font-bold text-lg" onClick={() => setIsSidebarOpen(false)}>
                      <PlusSquare className="w-5 h-5"/> أضف عقار
                  </Link>
                  {isLoggedIn && (
                    <Link href="/profile" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-brand-light text-brand-primary font-bold text-lg" onClick={() => setIsSidebarOpen(false)}>
                        <User className="w-5 h-5"/> حسابي وإعلاناتي
                    </Link>
                  )}
              </div>

              {isLoggedIn && (
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl font-bold mt-auto hover:bg-red-100 transition">
                      <LogOut className="w-5 h-5" /> تسجيل خروج
                  </button>
              )}
          </div>
      </div>
    </>
  );
}