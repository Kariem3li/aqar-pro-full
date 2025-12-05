"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, User, Plus, Building2 } from "lucide-react"; 

export default function BottomNav() {
  const pathname = usePathname();

  // قائمة الروابط (ضفنا فيها "إعلاناتي")
  const navItems = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "إعلاناتي", href: "/my-listings", icon: Building2 }, // <-- الزرار الجديد
    { name: "إضافة", href: "/add-property", icon: Plus, isMain: true }, // زرار الإضافة
    { name: "المفضلة", href: "/saved", icon: Heart },
    { name: "حسابي", href: "/profile", icon: User }, // (ممكن تخليها login لو مش مسجل)
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      
      {/* جسم الناف بار (الأبيض) */}
      <div className="bg-white h-[80px] rounded-t-[30px] shadow-[0_-5px_30px_rgba(0,0,0,0.1)] px-6 flex justify-between items-center relative">
        
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={index} 
              href={item.href}
              className="relative w-12 h-full flex flex-col items-center justify-center group cursor-pointer"
            >
              {/* 1. الدائرة العائمة (تظهر فقط للعنصر النشط) */}
              <div 
                className={`absolute transition-all duration-500 ease-in-out rounded-full flex items-center justify-center shadow-lg border-4 border-gray-50
                  ${isActive 
                    ? "-top-8 w-14 h-14 bg-amber-500 text-slate-900 opacity-100 translate-y-0" 
                    : "top-0 w-0 h-0 bg-transparent text-transparent opacity-0 translate-y-10"
                  }
                  ${item.isMain && !isActive ? "bg-slate-900 text-white w-12 h-12 top-1/2 -translate-y-1/2 border-none shadow-md opacity-100" : ""}
                `}
              >
                {/* أيقونة العنصر النشط */}
                <item.icon className={`w-6 h-6 ${isActive ? "animate-in zoom-in duration-300" : ""}`} />
              </div>

              {/* 2. الأيقونة العادية (تظهر لما العنصر يكون غير نشط) */}
              <div className={`flex flex-col items-center transition-all duration-300 ${isActive ? "opacity-0 translate-y-10" : "opacity-100"}`}>
                 {/* لو الزرار هو "إضافة" ومش نشط، بنخفيه من هنا لأننا أظهرناه فوق كدايرة ثابتة */}
                 {!item.isMain && (
                    <>
                      <item.icon className={`w-6 h-6 mb-1 text-gray-400 group-hover:text-slate-600`} />
                      <span className="text-[10px] font-bold text-gray-400">{item.name}</span>
                    </>
                 )}
              </div>

              {/* 3. النص تحت الدائرة النشطة (اختياري، يظهر لما يكون نشط) */}
              {isActive && (
                  <span className="absolute bottom-3 text-[10px] font-bold text-amber-600 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {item.name}
                  </span>
              )}
            </Link>
          );
        })}

      </div>
    </div>
  );
}