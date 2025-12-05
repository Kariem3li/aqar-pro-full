"use client";
import { useState } from "react";
// ✅ التعديل: استخدام Alias @ للمسار الصحيح
import Navbar from "@/components/Navbar";
import { Loader2, Phone, Lock, Briefcase, ChevronDown, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
// ✅ التعديل: استيراد الرابط من ملف الإعدادات
import { API_URL } from "@/lib/config";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "",
    phone: "", 
    password: "", 
    confirmPassword: "",
    clientType: "Buyer"
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!formData.firstName || !formData.phone || !formData.password) {
        alert("يرجى ملء جميع الحقول المطلوبة"); return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("كلمات المرور غير متطابقة!"); return;
    }
    // تحقق بسيط من الرقم المصري
    if (formData.phone.length < 11) {
        alert("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)"); return;
    }

    setLoading(true);
    try {
      // ✅ استخدام المتغير المستورد
      const res = await fetch(`${API_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone,
            password: formData.password,
            client_type: formData.clientType
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.name);
        alert("✅ تم إنشاء الحساب بنجاح!");
        window.location.href = "/";
      } else {
        // عرض الخطأ المحدد القادم من السيرفر
        let errorMsg = "حدث خطأ ما";
        if(data.phone_number) errorMsg = "رقم الهاتف مسجل بالفعل";
        else if (data.password) errorMsg = "كلمة المرور ضعيفة";
        else if (data.non_field_errors) errorMsg = data.non_field_errors[0];
        
        alert(`❌ ${errorMsg}`);
      }
    } catch (error) { 
        alert("فشل الاتصال بالسيرفر"); 
    } 
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-brand-light flex items-center justify-center p-4 pt-24 pb-10 font-sans">
      <Navbar />
      
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary"></div>

        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-brand-primary mb-2">عضوية جديدة</h1>
            <p className="text-gray-400 text-sm font-medium">ابدأ رحلتك الاستثمارية مع رواسي</p>
        </div>
        
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <User className="absolute right-4 top-4 w-5 h-5 text-gray-400"/>
                    <input name="firstName" placeholder="الاسم الأول" className="input-field pr-11" onChange={handleChange}/>
                </div>
                <input name="lastName" placeholder="العائلة" className="input-field px-4" onChange={handleChange}/>
            </div>
            
            <div className="relative group">
                <Phone className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-accent transition-colors"/>
                <input name="phone" type="tel" placeholder="رقم الهاتف (01xxxxxxxxx)" className="input-field pr-12 text-left dir-ltr" style={{direction: "ltr"}} onChange={handleChange}/>
            </div>

            <div className="relative group">
                <Briefcase className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-accent transition-colors"/>
                <ChevronDown className="absolute left-4 top-5 w-4 h-4 text-gray-400 pointer-events-none"/>
                <select name="clientType" className="input-field pr-12 appearance-none cursor-pointer text-brand-primary font-bold bg-transparent" onChange={handleChange} value={formData.clientType}>
                    <option value="Buyer">👤 مشتري (أبحث عن عقار)</option>
                    <option value="Seller">🏠 مالك / بائع (لدي عقار)</option>
                    <option value="Investor">📈 مستثمر (فرص تجارية)</option>
                    <option value="Marketer">🤝 مسوق عقاري</option>
                </select>
            </div>
            
            <div className="space-y-3">
                <div className="relative group">
                    <Lock className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-accent transition-colors"/>
                    <input name="password" type="password" placeholder="كلمة المرور" className="input-field pr-12" onChange={handleChange}/>
                </div>
                <div className="relative group">
                    <ShieldCheck className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-accent transition-colors"/>
                    <input name="confirmPassword" type="password" placeholder="تأكيدها" className="input-field pr-12" onChange={handleChange}/>
                </div>
            </div>

            <button onClick={handleRegister} disabled={loading} className="w-full h-14 bg-brand-accent text-white rounded-2xl font-black text-lg hover:bg-amber-700 transition-all duration-300 shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 active:scale-[0.98] mt-6">
                {loading ? <Loader2 className="animate-spin text-white"/> : "تسجيل حساب جديد"}
            </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm font-bold">
                لديك حساب بالفعل؟ <Link href="/login" className="text-brand-primary hover:text-brand-accent transition underline decoration-2 underline-offset-4">سجل دخول</Link>
            </p>
        </div>
      </div>
    </main>
  );
}