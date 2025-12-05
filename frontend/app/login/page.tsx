"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Loader2, Phone, Lock, LogIn, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
// ✅ التعديل: استيراد الرابط من ملف الإعدادات
import { API_URL } from "@/lib/config";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) { alert("يرجى إدخال البيانات"); return; }
    
    setLoading(true);

    try {
      // ✅ استخدام المتغير المستورد
      const res = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, password: password })
      });

      const data = await res.json();

      if (res.ok) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("username", data.name);
        
        // 👇 حفظ حالة الأدمن
        if (data.is_staff) {
            storage.setItem("is_staff", "true");
        } else {
            storage.removeItem("is_staff");
        }
        
        alert(`مرحباً بك مجدداً، ${data.name} 👋`);
        window.location.href = "/"; 
      } else {
        const errorMsg = data.non_field_errors ? data.non_field_errors[0] : "بيانات غير صحيحة";
        alert(`❌ ${errorMsg}`);
      }
    } catch (error) { 
        alert("فشل الاتصال بالسيرفر"); 
    } 
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-brand-light flex items-center justify-center p-4 font-sans">
      <Navbar />
      
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/10 rounded-bl-[4rem] -mr-4 -mt-4"></div>

        <div className="text-center mb-10 relative">
            <div className="w-20 h-20 bg-brand-primary rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-brand-primary/30">
                <LogIn className="w-10 h-10 text-brand-accent -rotate-3"/>
            </div>
            <h1 className="text-3xl font-black text-brand-primary mb-1">مرحباً بعودتك</h1>
            <p className="text-gray-400 text-sm font-medium">سجل الدخول للمتابعة إلى حسابك</p>
        </div>
        
        <div className="space-y-6">
            <div className="relative group">
                <Phone className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors"/>
                <input 
                    type="tel" 
                    placeholder="رقم الهاتف" 
                    className="input-field pr-12 text-left dir-ltr"
                    style={{direction: "ltr"}}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
            </div>
            
            <div className="relative group">
                <Lock className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors"/>
                <input 
                    type="password" 
                    placeholder="كلمة المرور" 
                    className="input-field pr-12"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <label className="flex items-center gap-2 cursor-pointer hover:text-brand-primary transition">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-brand-accent border-brand-accent' : 'border-gray-300 bg-white'}`}>
                        {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={4}/>}
                    </div>
                    <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                    تذكرني
                </label>
                
                <Link href="#" className="text-brand-primary hover:text-brand-accent transition hover:underline">
                    هل نسيت كلمة السر؟
                </Link>
            </div>

            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full mt-2 shadow-xl shadow-brand-primary/20">
                {loading ? <Loader2 className="animate-spin text-white"/> : <><span className="ml-2">تسجيل الدخول</span> <ArrowLeft className="w-5 h-5"/></>}
            </button>
        </div>

        <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm font-medium mb-3">ليس لديك حساب بعد؟</p>
            <Link href="/register" className="block w-full py-3 rounded-2xl border-2 border-brand-primary/10 text-brand-primary font-black hover:bg-brand-primary hover:text-white transition-all duration-300">
                إنشاء حساب جديد
            </Link>
        </div>
      </div>
    </main>
  );
}