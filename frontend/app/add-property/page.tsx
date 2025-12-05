"use client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Camera, MapPin, Home, ArrowLeft, Info, Loader2, CheckCircle2, Building2, LandPlot, Video, UploadCloud, ShieldCheck, FileText, User, ImagePlus, Banknote, Crosshair, Map as MapIcon } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import imageCompression from 'browser-image-compression'; // استيراد مكتبة الضغط
// ✅ التعديل: استيراد الرابط من ملف الإعدادات
import { API_URL } from "@/lib/config";

// استيراد الخريطة
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function AddProperty() {
  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [compressing, setCompressing] = useState(false); // حالة ضغط الصور
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [statusMsg, setStatusMsg] = useState(""); // عشان نكتب "جاري الرفع..."
  const [formData, setFormData] = useState({
    offerType: "بيع",
    category: "",
    gov: "",
    city: "",
    zone: "",
    subdivision: "", // اختياري
    plotNumber: "",
    buildingNumber: "",
    apartmentNumber: "",
    floorNumber: "",
    area: "",
    price: "",
    isFinanceEligible: false,
    latitude: "",
    longitude: "",
    features: {} as any, 
    description: "",
    images: [] as File[],
    video: null as File | null,
    idCard: null as File | null,
    contract: null as File | null
  });

  // حالة الأخطاء (عشان اللون الأحمر)
  const [errors, setErrors] = useState<any>({});

  // 1. تحميل البيانات
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "/login"; return; }

    const initData = async () => {
        try {
            // ✅ استخدام المتغير المستورد
            const [catRes, govRes] = await Promise.all([
                fetch(`${API_URL}/categories/`),
                fetch(`${API_URL}/governorates/`)
            ]);
            
            const catData = await catRes.json();
            const govData = await govRes.json();

            setCategories(Array.isArray(catData) ? catData : catData.results || []);
            setGovernorates(Array.isArray(govData) ? govData : govData.results || []);
            setLoadingData(false);
        } catch (e) { console.error(e); setLoadingData(false); }
    };
    initData();
  }, []);

  // --- Handlers ---
  const handleMapConfirm = (lat: string, lng: string) => {
      setFormData({ ...formData, latitude: lat, longitude: lng });
      setShowMap(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { alert("GPS غير مدعوم"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({ ...formData, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() });
        setLocating(false);
        alert("✅ تم تحديد الموقع!");
      },
      () => { setLocating(false); alert("فشل تحديد الموقع. تأكد من تفعيل GPS."); }
    );
  };

  const handleCategoryChange = (e: any) => {
      const catId = e.target.value;
      const selectedCat = categories.find(c => c.id == catId);
      setFormData({...formData, category: catId, features: {}});
      setSelectedCategoryName(selectedCat ? selectedCat.name : "");
      if (selectedCat && selectedCat.allowed_features) setDynamicFields(selectedCat.allowed_features);
      else setDynamicFields([]);
  };

  const handleGovChange = async (e: any) => {
      const govId = e.target.value;
      setFormData({...formData, gov: govId, city: "", zone: "", subdivision: ""});
      if(govId) {
          const res = await fetch(`${API_URL}/cities/?governorate=${govId}`);
          const data = await res.json();
          setCities(Array.isArray(data) ? data : data.results || []);
      }
  };
  const handleCityChange = async (e: any) => {
      const cityId = e.target.value;
      setFormData({...formData, city: cityId, zone: "", subdivision: ""});
      if(cityId) {
          const res = await fetch(`${API_URL}/zones/?city=${cityId}`);
          const data = await res.json();
          setZones(Array.isArray(data) ? data : data.results || []);
      }
  };
  const handleZoneChange = async (e: any) => {
      const zoneId = e.target.value;
      setFormData({...formData, zone: zoneId, subdivision: ""});
      if(zoneId) {
          const res = await fetch(`${API_URL}/subdivisions/?major_zone=${zoneId}`);
          const data = await res.json();
          setSubdivisions(Array.isArray(data) ? data : data.results || []);
      }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // أول ما يكتب، نشيل العلامة الحمراء
    if (errors[field]) setErrors({ ...errors, [field]: false });
  };
  
  const handleFeatureInput = (id: string, val: string) => setFormData(p => ({ ...p, features: { ...p.features, [id]: val } }));
  
  // --- 🚀 دالة رفع الصور الذكية (ضغط الصور) ---
  const handleImageUpload = async (e: any) => {
      if (e.target.files) {
          const files = Array.from(e.target.files) as File[];
          setCompressing(true); // تشغيل اللودينج
          setStatusMsg("جاري ضغط الصور لسرعة الرفع...");

          try {
              const compressedFiles = await Promise.all(files.map(async (file) => {
                  const options = {
                      maxSizeMB: 0.8,          // ضغط الصورة لأقل من 1 ميجا
                      maxWidthOrHeight: 1920,  // الحفاظ على أبعاد HD
                      useWebWorker: true,
                  };
                  try {
                      return await imageCompression(file, options);
                  } catch (error) {
                      return file; // لو الضغط فشل، ارفع الأصلية
                  }
              }));

              setFormData(prev => ({ ...prev, images: [...prev.images, ...compressedFiles] }));
          } catch (error) {
              console.error(error);
          } finally {
              setCompressing(false);
              setStatusMsg("");
          }
      }
  };

  const handleVideoUpload = (e: any) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // التحقق من الحجم (50 ميجا بايت كحد أقصى)
          if (file.size > 50 * 1024 * 1024) {
              alert("⚠️ حجم الفيديو كبير جداً! يرجى اختيار فيديو أقل من 50 ميجا لضمان سرعة الرفع.");
              return;
          }
          setFormData(prev => ({ ...prev, video: file }));
      }
  };
  const handleDocUpload = (e: any, type: 'idCard' | 'contract') => { if (e.target.files) setFormData({ ...formData, [type]: e.target.files[0] }); };

  // --- Validation Logic (التصحيح هنا) ---
  const validateStep1 = () => {
      let newErrors: any = {};
      if (!formData.category) newErrors.category = true;
      if (!formData.gov) newErrors.gov = true;
      if (!formData.city) newErrors.city = true;
      // if (!formData.zone) newErrors.zone = true; // ممكن نخلي المنطقة اختيارية لو مش موجودة
      if (!formData.area) newErrors.area = true;
      if (!formData.price) newErrors.price = true;
      
      if (!formData.description) newErrors.description = true;
      
      if(Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return false;
      }
      return true;
  };

  const validateStep2 = () => {
      if (selectedCategoryName.includes("أرض")) return true;
      if (formData.images.length === 0) { 
          alert("⚠️ من فضلك أضف صورة واحدة على الأقل"); 
          return false; 
      }
      return true;
  };

  const validateStep3 = () => {
      let newErrors: any = {};
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) return false;

      if (!formData.idCard && !formData.contract) { 
          alert("⚠️ يجب رفع وثيقة واحدة على الأقل (البطاقة أو العقد) للتحقق"); 
          return false; 
      }
      return true;
  };

  const nextStep = () => {
      if (step === 1) {
          if (validateStep1()) setStep(2);
          else alert("يرجى ملء البيانات المطلوبة (المحددة بالأحمر)");
      } else if (step === 2) {
          if (validateStep2()) setStep(3);
      }
  };

  // --- Submit (التصحيح الذكي) ---
  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
      if (!token) {
          alert("عفواً، يجب تسجيل الدخول أولاً لإضافة إعلان.");
          window.location.href = "/login";
          return;
      }
      if (!validateStep3()) return;
      
      setSubmitting(true);
      setStatusMsg("جاري رفع البيانات والصور للسيرفر، يرجى الانتظار..."); 
      
      const data = new FormData();
      
      // البيانات الأساسية
      data.append("title", `عرض ${formData.offerType} - ${selectedCategoryName}`);
      data.append("offer_type", formData.offerType === "بيع" ? "Sale" : "Rent");
      data.append("category", formData.category);
      data.append("governorate", formData.gov);
      data.append("city", formData.city);
      
      if (formData.zone && formData.zone !== "") data.append("major_zone", formData.zone);
      if (formData.subdivision && formData.subdivision !== "") data.append("subdivision", formData.subdivision);
      
      data.append("price", formData.price);
      data.append("area_sqm", formData.area);
      data.append("description", formData.description);
      
      // تصحيح Boolean
      data.append("is_finance_eligible", formData.isFinanceEligible ? "True" : "False");

      if (formData.latitude) data.append("latitude", formData.latitude);
      if (formData.longitude) data.append("longitude", formData.longitude);

      data.append("features_data", JSON.stringify(formData.features));
      
      if (formData.plotNumber) data.append("reference_code", formData.plotNumber);
      if (formData.floorNumber) data.append("floor_number", formData.floorNumber);

      // الصور
      if (formData.images.length > 0) {
          formData.images.forEach((file) => data.append("uploaded_images", file));
      }
      
      // الفيديو والوثائق
      if (formData.video) data.append("video", formData.video);
      if (formData.idCard) data.append("id_card_image", formData.idCard);
      if (formData.contract) data.append("contract_image", formData.contract);

      try {
          const res = await fetch(`${API_URL}/listings/`, {
              method: "POST", headers: { "Authorization": `Token ${token}` }, body: data
          });

          if (res.ok) {
              alert("✅ تم الإرسال بنجاح!");
              window.location.href = "/";
          } 
          else {
              const errData = await res.json();
              console.error(errData);
              alert(`عذراً، حدث خطأ:\n${JSON.stringify(errData, null, 2)}`);
           }
      } catch (error) { alert("فشل الاتصال بالسيرفر."); } 
      finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32 text-gray-900 font-sans">
      <Navbar />
      {showMap && <MapPicker onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />}

      <div className="bg-slate-900 text-white pt-8 pb-28 px-4 text-center rounded-b-[3rem] shadow-2xl relative">
        <h1 className="text-3xl font-black mb-2">أضف عقارك</h1>
        <div className="flex justify-center items-center gap-4 mt-6 relative z-10">
           {[1, 2, 3].map((num) => (
             <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${step >= num ? 'bg-amber-500 border-amber-500 text-slate-900' : 'bg-slate-800 text-gray-500'}`}>{step > num ? <CheckCircle2/> : num}</div>
                {num < 3 && <div className={`w-12 h-1 mx-2 rounded-full ${step > num ? 'bg-amber-500' : 'bg-slate-800'}`}></div>}
             </div>
           ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden p-6 md:p-10">
           {loadingData && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></div>}

           {/* --- المرحلة 1 --- */}
           {!loadingData && step === 1 && (
             <div className="animate-in fade-in space-y-8">
                <h3 className="text-xl font-bold text-slate-800 border-b pb-4">التفاصيل الأساسية</h3>
                
                <div className="flex gap-4">
                    {["بيع", "إيجار"].map(type => (
                        <button key={type} onClick={() => handleChange("offerType", type)}
                            className={`flex-1 py-4 rounded-xl font-bold border-2 ${formData.offerType === type ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-gray-200"}`}>{type}</button>
                    ))}
                </div>

                <select className={`w-full h-14 border-2 rounded-xl px-4 font-bold text-slate-900 outline-none focus:border-amber-500 ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} onChange={handleCategoryChange} value={formData.category}>
                    <option value="">اختر نوع العقار...</option>
                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>

                {/* الحقول الذكية */}
                {(selectedCategoryName.includes("أرض") || selectedCategoryName.includes("مصنع")) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold mb-2 text-slate-600">رقم القطعة</label>
                        <input type="text" className="w-full h-12 border rounded-lg px-4 font-bold focus:border-slate-900 outline-none" onChange={(e) => handleChange("plotNumber", e.target.value)} />
                    </div>
                )}
                {selectedCategoryName.includes("شقة") && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-3">
                        <input type="text" placeholder="عمارة" className="h-12 border rounded-lg px-2 text-center font-bold outline-none focus:border-slate-900" onChange={(e) => handleChange("buildingNumber", e.target.value)} />
                        <input type="number" placeholder="الدور" className="h-12 border rounded-lg px-2 text-center font-bold outline-none focus:border-slate-900" onChange={(e) => handleChange("floorNumber", e.target.value)} />
                        <input type="text" placeholder="شقة" className="h-12 border rounded-lg px-2 text-center font-bold outline-none focus:border-slate-900" onChange={(e) => handleChange("apartmentNumber", e.target.value)} />
                    </div>
                )}

                {/* المزايا الديناميكية */}
                {dynamicFields.length > 0 && (
                    <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-full text-sm font-bold text-amber-700">مواصفات خاصة</div>
                        {dynamicFields.map((feat: any) => (
                            <div key={feat.id} className={feat.input_type === 'text' ? 'col-span-full' : ''}>
                                <label className="block text-xs font-bold text-slate-600 mb-1">{feat.name}</label>
                                {feat.input_type === 'bool' ? (
                                    <select className="w-full h-12 border border-amber-200 rounded-lg px-3 text-sm bg-white outline-none" onChange={(e) => handleFeatureInput(feat.name, e.target.value)}><option value="">اختر...</option><option value="نعم">نعم</option><option value="لا">لا</option></select>
                                ) : (
                                    <input type="text" className="w-full h-12 border border-amber-200 rounded-lg px-3 text-sm outline-none" onChange={(e) => handleFeatureInput(feat.name, e.target.value)} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* الموقع */}
                <div className={`bg-white p-6 rounded-2xl border-2 space-y-5 shadow-sm ${errors.gov || errors.city ? 'border-red-200' : 'border-gray-100'}`}>
                   <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> الموقع <span className="text-red-500">*</span></label>
                      <button onClick={() => setShowMap(true)} type="button" className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${formData.latitude ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                         {locating ? <Loader2 className="w-3 h-3 animate-spin"/> : <MapIcon className="w-3 h-3" />}
                         {formData.latitude ? "تم التحديد" : "فتح الخريطة"}
                      </button>
                   </div>
                   {formData.latitude && <div className="h-32 bg-slate-100 rounded-xl border flex items-center justify-center text-xs text-slate-500">تم حفظ الإحداثيات: {formData.latitude}, {formData.longitude}</div>}
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <select className={`w-full h-12 border rounded-lg px-3 text-sm outline-none focus:border-slate-900 ${errors.gov ? 'border-red-500' : 'border-gray-300'}`} onChange={handleGovChange} value={formData.gov}><option value="">المحافظة</option>{governorates.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                      <select className={`w-full h-12 border rounded-lg px-3 text-sm outline-none focus:border-slate-900 ${errors.city ? 'border-red-500' : 'border-gray-300'}`} disabled={!formData.gov} onChange={handleCityChange} value={formData.city}><option value="">المدينة</option>{cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                      <select className="w-full h-12 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:border-slate-900" disabled={!formData.city} onChange={handleZoneChange} value={formData.zone}><option value="">المنطقة</option>{zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
                      <select className="w-full h-12 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:border-slate-900" disabled={!formData.zone} onChange={(e) => handleChange("subdivision", e.target.value)} value={formData.subdivision}><option value="">المجاورة</option>{subdivisions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                   </div>
                </div>

                {/* السعر والمساحة */}
                <div className="grid grid-cols-2 gap-5">
                   <input type="number" placeholder="المساحة (م²)" className={`w-full h-14 border-2 rounded-xl px-4 font-black text-slate-900 outline-none focus:border-amber-500 ${errors.area ? 'border-red-500' : 'border-gray-200'}`} onChange={(e) => handleChange("area", e.target.value)} />
                   <input type="number" placeholder="السعر" className={`w-full h-14 border-2 rounded-xl px-4 font-black text-slate-900 outline-none focus:border-amber-500 ${errors.price ? 'border-red-500' : 'border-gray-200'}`} onChange={(e) => handleChange("price", e.target.value)} />
                </div>

                {/* التمويل العقاري */}
                <div onClick={() => setFormData({...formData, isFinanceEligible: !formData.isFinanceEligible})} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.isFinanceEligible ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.isFinanceEligible ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Banknote className="w-5 h-5" /></div>
                        <div><p className="font-bold text-sm text-slate-800">تمويل عقاري</p><p className="text-xs text-gray-500">هل العقار يصلح؟</p></div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.isFinanceEligible ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>{formData.isFinanceEligible && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                </div>

               <textarea 
                  className={`w-full h-24 border-2 rounded-xl p-4 text-sm resize-none outline-none ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-amber-500'}`} 
                  placeholder="تفاصيل أخرى (بحري، ناصية...)" 
                  onChange={(e) => handleChange("description", e.target.value)}
               ></textarea>
                <button onClick={nextStep} className="w-full bg-slate-900 text-white py-5 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 mt-8">التالي: الصور <ArrowLeft className="w-5 h-5" /></button>
             </div>
           )}

           {/* المرحلة 2 (الوسائط + فيديو) */}
           {step === 2 && (
             <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg border-b pb-3 mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-amber-600"/> الوسائط</h3>
                <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                             <img src={URL.createObjectURL(img)} className="w-full h-full object-cover"/>
                        </div>
                    ))}
                    
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition">
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={compressing} />
                        
                        {compressing ? (
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin"/>
                        ) : (
                            <ImagePlus className="w-8 h-8 text-slate-400"/>
                        )}
                        
                        <span className="text-xs text-slate-500 mt-1">
                            {compressing ? "جاري المعالجة..." : "أضف صور"}
                        </span>
                    </label>
                </div>
                
                {/* فيديو */}
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative ${formData.video ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-slate-900'}`}>
                    <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setFormData({...formData, video: e.target.files[0]})} />
                    <Video className={`w-8 h-8 mx-auto mb-2 ${formData.video ? 'text-green-600' : 'text-slate-400'}`} />
                    <p className="font-bold text-sm text-slate-700">{formData.video ? "تم اختيار الفيديو ✅" : "رفع فيديو للعقار"}</p>
                </div>

                <div className="flex gap-4 mt-8"><button onClick={() => setStep(1)} className="flex-1 bg-gray-100 py-4 rounded-xl font-bold">رجوع</button><button onClick={nextStep} className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-bold">التالي</button></div>
             </div>
           )}

           {/* المرحلة 3: التحقق */}
           {step === 3 && (
             <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-lg border-b pb-3 mb-4">التحقق</h3>
                
                <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 border border-blue-200">
                    سيتم استخدام بيانات حسابك المسجلة (الاسم ورقم الهاتف) للتواصل معك بخصوص هذا الإعلان.
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label className={`bg-slate-50 p-4 rounded-xl border-2 border-dashed ${formData.idCard ? 'border-green-500 bg-green-50' : 'border-slate-300'} text-center cursor-pointer`}><input type="file" className="hidden" onChange={(e) => handleDocUpload(e, 'idCard')} /><User className="mx-auto mb-2 text-slate-400"/><span className="text-xs font-bold">البطاقة</span></label>
                    <label className={`bg-slate-50 p-4 rounded-xl border-2 border-dashed ${formData.contract ? 'border-green-500 bg-green-50' : 'border-slate-300'} text-center cursor-pointer`}><input type="file" className="hidden" onChange={(e) => handleDocUpload(e, 'contract')} /><FileText className="mx-auto mb-2 text-slate-400"/><span className="text-xs font-bold">العقد</span></label>
                </div>

                {/* زرار الإرسال النهائي */}
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 py-4 rounded-xl font-bold" disabled={submitting}>رجوع</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting} 
                        className="flex-[2] bg-green-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:bg-green-400"
                    >
                        {submitting ? <><Loader2 className="animate-spin"/> جاري الرفع...</> : "إرسال للمراجعة"}
                    </button>
                </div>
                {/* --- 👇 حالة الرفع 👇 --- */}
                {submitting && (
                    <div className="mt-5 text-center animate-pulse">
                        <p className="text-sm font-bold text-brand-primary mb-1">
                            جاري رفع الصور والفيديو والبيانات...
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            ⚠️ قد تستغرق العملية <strong>دقيقة أو أكثر</strong> حسب حجم الملفات وسرعة الإنترنت لديك.
                            <br />
                            من فضلك <strong>لا تغلق الصفحة</strong> حتى تظهر رسالة النجاح.
                        </p>
                    </div>
                )}
             </div>
           )}

        </div>
      </div>
      <BottomNav />
    </main>
  );
}