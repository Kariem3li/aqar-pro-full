"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, MapPin, CheckCircle2, Building2, 
  ImagePlus, Banknote, Map as MapIcon, Save, Edit3, BedDouble, Bath, Layout, FileText, User, X, Video, Trash2, Layers
} from "lucide-react";
import dynamic from "next/dynamic";
import imageCompression from 'browser-image-compression';
// ✅ التعديل: استيراد الرابط ودالة الصور من ملف الإعدادات
import { API_URL, getFullImageUrl } from "@/lib/config";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

// 🎛️ إعدادات التحكم في الحقول الثابتة
const CATEGORY_SETTINGS: any = {
    "شقة":      { showRooms: true,  showBaths: true,  showFloor: true },
    "دوبلكس":   { showRooms: true,  showBaths: true,  showFloor: true },
    "ستوديو":   { showRooms: true,  showBaths: true,  showFloor: true },
    "شاليه":    { showRooms: true,  showBaths: true,  showFloor: true },
    "فيلا":     { showRooms: true,  showBaths: true,  showFloor: false },
    "تاون هاوس":{ showRooms: true,  showBaths: true,  showFloor: false },
    "بيت":      { showRooms: false, showBaths: false, showFloor: false },
    "أرض":      { showRooms: false, showBaths: false, showFloor: false },
    "محل":      { showRooms: false, showBaths: true,  showFloor: false },
    "مكتب":     { showRooms: true,  showBaths: true,  showFloor: true },
};

export default function EditProperty() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Data
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [subdivisions, setSubdivisions] = useState<any[]>([]);
  
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const [formData, setFormData] = useState({
    offerType: "بيع", category: "", gov: "", city: "", zone: "", subdivision: "",
    floorNumber: "", bedrooms: "", bathrooms: "",
    area: "", price: "", isFinanceEligible: false,
    latitude: "", longitude: "", 
    features: {} as any, description: "",
    existingImages: [] as any[], newImages: [] as File[],     
    video: null as File | null, existingVideo: "" as string | null,
    idCard: null as File | null, contract: null as File | null,
    existingIdCard: "" as string | null, existingContract: "" as string | null
  });

  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [clearVideo, setClearVideo] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      
      try {
          // ✅ استخدام المتغير المستورد
          const [catRes, govRes] = await Promise.all([fetch(`${API_URL}/categories/`), fetch(`${API_URL}/governorates/`)]);
          const cats = await catRes.json();
          setCategories(cats);
          setGovernorates(await govRes.json());

          const listingRes = await fetch(`${API_URL}/listings/${id}/`, { headers: { "Authorization": `Token ${token}` } });
          if (!listingRes.ok) throw new Error("Error");
          const data = await listingRes.json();

          if (data.category) {
             const selectedCat = cats.find((c:any) => c.id == data.category);
             if (selectedCat) {
                 setSelectedCategoryName(selectedCat.name);
                 setDynamicFields(selectedCat.allowed_features || []);
             }
          }

          setFormData({
              offerType: data.offer_type === "Sale" ? "بيع" : "إيجار",
              category: data.category.toString(),
              gov: data.governorate?.toString() || "",
              city: data.city?.toString() || "",
              zone: data.major_zone?.toString() || "",
              subdivision: data.subdivision?.toString() || "",
              floorNumber: data.floor_number?.toString() || "",
              bedrooms: data.bedrooms?.toString() || "",
              bathrooms: data.bathrooms?.toString() || "",
              area: data.area_sqm?.toString() || "",
              price: data.price?.toString() || "",
              isFinanceEligible: data.is_finance_eligible || false,
              latitude: data.latitude || "",
              longitude: data.longitude || "",
              features: data.dynamic_features.reduce((acc:any, curr:any) => ({...acc, [curr.feature]: curr.value}), {}),
              description: data.description || "",
              existingImages: data.images || [], newImages: [],
              video: null, existingVideo: data.video,
              idCard: null, contract: null,
              existingIdCard: data.id_card_image, existingContract: data.contract_image
          });

          if (data.governorate) { const res = await fetch(`${API_URL}/cities/?governorate=${data.governorate}`); setCities(await res.json()); }
          if (data.city) { const res = await fetch(`${API_URL}/zones/?city=${data.city}`); setZones(await res.json()); }
          if (data.major_zone) { const res = await fetch(`${API_URL}/subdivisions/?major_zone=${data.major_zone}`); setSubdivisions(await res.json()); }

      } catch (error) { router.push('/my-listings'); } 
      finally { setLoadingInitial(false); }
    };
    init();
  }, [id]);

  const handleMapConfirm = (lat: string, lng: string) => { setFormData({ ...formData, latitude: lat, longitude: lng }); setShowMap(false); };
  
  const handleCategoryChange = (e: any) => { 
      const catId = e.target.value; const selectedCat = categories.find(c => c.id == catId);
      setFormData({...formData, category: catId, features: {}}); 
      if (selectedCat) {
          setSelectedCategoryName(selectedCat.name);
          setDynamicFields(selectedCat.allowed_features || []);
      } else {
          setSelectedCategoryName("");
          setDynamicFields([]);
      }
  };

  const handleGovChange = async (e: any) => { const govId = e.target.value; setFormData({...formData, gov: govId, city: "", zone: "", subdivision: ""}); if(govId) { const res = await fetch(`${API_URL}/cities/?governorate=${govId}`); setCities(await res.json()); } else setCities([]); };
  const handleCityChange = async (e: any) => { const cityId = e.target.value; setFormData({...formData, city: cityId, zone: "", subdivision: ""}); if(cityId) { const res = await fetch(`${API_URL}/zones/?city=${cityId}`); setZones(await res.json()); } else setZones([]); };
  const handleZoneChange = async (e: any) => { const zoneId = e.target.value; setFormData({...formData, zone: zoneId, subdivision: ""}); if(zoneId) { const res = await fetch(`${API_URL}/subdivisions/?major_zone=${zoneId}`); setSubdivisions(await res.json()); } else setSubdivisions([]);};
  const handleChange = (field: string, value: any) => { setFormData({ ...formData, [field]: value }); };
  const handleFeatureInput = (id: string, val: string) => setFormData(p => ({ ...p, features: { ...p.features, [id]: val } }));
  
  const handleImageUpload = async (e: any) => {
      if (e.target.files) {
          const files = Array.from(e.target.files) as File[];
          setCompressing(true); setStatusMsg("جاري معالجة الصور...");
          try {
              const compressedFiles = await Promise.all(files.map(async (file) => {
                  try { return await imageCompression(file, {maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true}); } catch { return file; }
              }));
              setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...compressedFiles] }));
          } finally { setCompressing(false); setStatusMsg(""); }
      }
  };
  const removeNewImage = (index: number) => setFormData(prev => ({...prev, newImages: prev.newImages.filter((_, i) => i !== index)}));
  
  const removeExistingImage = (imgId: number) => {
      setDeletedImageIds(prev => [...prev, imgId]);
      setFormData(prev => ({...prev, existingImages: prev.existingImages.filter(img => img.id !== imgId)}));
  };

  const handleClearVideo = () => { setClearVideo(true); setFormData(prev => ({...prev, existingVideo: null})); };
  const handleDocUpload = (e: any, type: 'idCard' | 'contract') => { if (e.target.files && e.target.files[0]) { setFormData({ ...formData, [type]: e.target.files[0] }); } };

  // --- 🌟 تحديد ما يجب إظهاره بناءً على الإعدادات ---
  const currentSettings = CATEGORY_SETTINGS[selectedCategoryName] || { showRooms: false, showBaths: false, showFloor: false };

  const handleSubmit = async () => {
      if (!formData.category || !formData.area || !formData.price || !formData.description) {alert("أكمل البيانات الأساسية"); return;}
      setSubmitting(true); setStatusMsg("جاري حفظ التعديلات...");
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      data.append("title", `عرض ${formData.offerType} - ${selectedCategoryName}`);
      data.append("offer_type", formData.offerType === "بيع" ? "Sale" : "Rent");
      data.append("category", formData.category);
      data.append("governorate", formData.gov);
      data.append("city", formData.city);
      if(formData.zone) data.append("major_zone", formData.zone);
      if(formData.subdivision) data.append("subdivision", formData.subdivision);
      data.append("price", formData.price);
      data.append("area_sqm", formData.area);
      data.append("description", formData.description);
      data.append("is_finance_eligible", formData.isFinanceEligible ? "True" : "False");
      if (formData.latitude) data.append("latitude", formData.latitude);
      if (formData.longitude) data.append("longitude", formData.longitude);
      
      data.append("features_data", JSON.stringify(formData.features));
      
      if (currentSettings.showRooms && formData.bedrooms) data.append("bedrooms", formData.bedrooms);
      if (currentSettings.showBaths && formData.bathrooms) data.append("bathrooms", formData.bathrooms);
      if (currentSettings.showFloor && formData.floorNumber) data.append("floor_number", formData.floorNumber);

      formData.newImages.forEach((file) => data.append("uploaded_images", file));
      if (formData.video) data.append("video", formData.video);
      if (formData.idCard) data.append("id_card_image", formData.idCard);
      if (formData.contract) data.append("contract_image", formData.contract);

      deletedImageIds.forEach((id) => data.append("deleted_image_ids", id.toString()));
      if (clearVideo) data.append("clear_video", "true");

      try {
          const res = await fetch(`${API_URL}/listings/${id}/`, {
              method: "PUT", headers: { "Authorization": `Token ${token}` }, body: data
          });
          if (res.ok) { alert("✅ تم التعديل! الإعلان قيد المراجعة."); router.push("/my-listings"); } 
          else { const err = await res.json(); alert(`خطأ: ${JSON.stringify(err)}`); }
      } catch (error) { alert("فشل الاتصال."); } 
      finally { setSubmitting(false); setStatusMsg(""); }
  };

  if (loadingInitial) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-slate-400"/></div>;

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />
      {showMap && <MapPicker onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} initialLat={formData.latitude} initialLng={formData.longitude} />}

      <div className="bg-slate-900 text-white pt-24 pb-20 px-6 rounded-b-[3rem] shadow-2xl text-center">
        <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">تعديل العقار <Edit3 className="w-6 h-6 text-amber-500"/></h1>
        <p className="text-slate-400 text-sm">تعديل أي بيانات يعيد الإعلان للمراجعة ⚠️</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-6 md:p-10 space-y-10">
           
           <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="section-title"><Building2 className="w-5 h-5 text-amber-500"/> تفاصيل العقار</h3>
                <div className="space-y-5">
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
                        {["بيع", "إيجار"].map(type => (
                            <button key={type} onClick={() => handleChange("offerType", type)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${formData.offerType === type ? "bg-slate-900 text-white shadow-lg" : "text-gray-500 hover:bg-white hover:shadow-sm"}`}>{type}</button>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <select className="input-field" onChange={handleCategoryChange} value={formData.category}><option value="">نوع العقار</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative"><input type="number" placeholder="المساحة" className="input-field pl-12" value={formData.area} onChange={(e) => handleChange("area", e.target.value)} /><span className="unit-label">م²</span></div>
                        <div className="relative"><input type="number" placeholder="السعر" className="input-field pl-12" value={formData.price} onChange={(e) => handleChange("price", e.target.value)} /><span className="unit-label">ج.م</span></div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">الوصف والتفاصيل:</label>
                        <textarea className="input-field h-32 py-3 resize-none bg-white" placeholder="اكتب وصف كامل للعقار..." value={formData.description} onChange={(e) => handleChange("description", e.target.value)}></textarea>
                    </div>

                    {/* --- قسم المزايا (الذكي جداً) --- */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-sm mb-4 text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4"/> مواصفات العقار:</h4>
                        
                        {/* 1. الحقول الثابتة */}
                        {(currentSettings.showRooms || currentSettings.showBaths || currentSettings.showFloor) && (
                            <div className="grid grid-cols-3 gap-3 mb-4 border-b border-gray-200 pb-4">
                                {currentSettings.showRooms && (
                                    <div className="relative">
                                        <BedDouble className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                        <input type="number" placeholder="غرف" className="input-field bg-white pr-9" value={formData.bedrooms} onChange={(e) => handleChange("bedrooms", e.target.value)} />
                                    </div>
                                )}
                                {currentSettings.showBaths && (
                                    <div className="relative">
                                        <Bath className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                        <input type="number" placeholder="حمامات" className="input-field bg-white pr-9" value={formData.bathrooms} onChange={(e) => handleChange("bathrooms", e.target.value)} />
                                    </div>
                                )}
                                {currentSettings.showFloor && (
                                    <div className="relative">
                                        <Layout className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                        <input type="number" placeholder="الدور" className="input-field bg-white pr-9" value={formData.floorNumber} onChange={(e) => handleChange("floorNumber", e.target.value)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. المزايا الديناميكية */}
                        {dynamicFields.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dynamicFields.map((field: any) => (
                                    <div key={field.id}>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">{field.name}</label>
                                        {field.input_type === 'bool' ? (
                                            <select className="input-field bg-white" value={formData.features[field.id] || ""} onChange={(e) => handleFeatureInput(field.id.toString(), e.target.value)}><option value="">اختر...</option><option value="نعم">نعم</option><option value="لا">لا</option></select>
                                        ) : (
                                            <input type={field.input_type === 'number' ? 'number' : 'text'} className="input-field bg-white" placeholder={field.name} value={formData.features[field.id] || ""} onChange={(e) => handleFeatureInput(field.id.toString(), e.target.value)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center">لا توجد مواصفات إضافية لهذا النوع</p>
                        )}
                    </div>

                    <div onClick={() => setFormData({...formData, isFinanceEligible: !formData.isFinanceEligible})} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.isFinanceEligible ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-300'}`}>
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"><Banknote className="w-5 h-5 text-green-600"/></div><p className="font-bold text-sm text-slate-700">قابل للتمويل العقاري</p></div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.isFinanceEligible ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>{formData.isFinanceEligible && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                    </div>
                </div>
           </section>

           <section>
                <h3 className="section-title"><MapPin className="w-5 h-5 text-amber-500"/> الموقع الجغرافي</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <select className="input-field" onChange={handleGovChange} value={formData.gov}><option value="">المحافظة</option>{governorates.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                        <select className="input-field" onChange={handleCityChange} value={formData.city} disabled={!formData.gov}><option value="">المدينة</option>{cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <select className="input-field" onChange={handleZoneChange} value={formData.zone} disabled={!formData.city}><option value="">المنطقة</option>{zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
                        <select className="input-field" onChange={(e) => handleChange("subdivision", e.target.value)} value={formData.subdivision} disabled={!formData.zone}><option value="">المجاورة</option>{subdivisions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                    <button onClick={() => setShowMap(true)} className={`w-full py-4 border-2 border-dashed rounded-2xl flex justify-center items-center gap-2 transition-all ${formData.latitude ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-300 hover:bg-slate-50 text-slate-500'}`}>
                        <MapIcon className={formData.latitude ? "text-green-600" : ""}/> 
                        <span className="font-bold text-sm">{formData.latitude ? "تم تحديد الموقع (اضغط للتعديل)" : "تحديد الموقع على الخريطة"}</span>
                    </button>
                </div>
           </section>

           <section>
                 <h3 className="section-title"><ImagePlus className="w-5 h-5 text-amber-500"/> الصور والوسائط</h3>
                 {formData.existingImages.length > 0 && (
                     <div className="mb-6">
                         <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> صور محفوظة (اضغط X للحذف):</p>
                         <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                             {formData.existingImages.map((img:any) => (
                                 <div key={img.id} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 relative group shadow-sm">
                                      <img src={getFullImageUrl(img.image)} className="w-full h-full object-cover" />
                                      <button onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"><X className="w-3 h-3"/></button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                 <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                     {formData.newImages.map((img, idx) => (
                         <div key={idx} className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative border border-amber-200 shadow-sm">
                             <img src={URL.createObjectURL(img)} className="w-full h-full object-cover"/>
                             <button onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"><X className="w-3 h-3"/></button>
                         </div>
                     ))}
                     <label className={`aspect-square bg-slate-50 border-2 border-dashed ${compressing ? 'border-amber-500 bg-amber-50' : 'border-slate-300 hover:border-slate-900'} rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group`}>
                         <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={compressing} />
                         {compressing ? <Loader2 className="w-6 h-6 text-amber-500 animate-spin"/> : <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-slate-900"/>}
                         <span className="text-[10px] text-slate-400 mt-2 font-bold group-hover:text-slate-900">{compressing ? "جاري..." : "أضف صور"}</span>
                     </label>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p className="text-xs font-bold text-gray-500 mb-2">فيديو العقار:</p>
                     {formData.existingVideo && !formData.video && (
                         <div className="flex items-center justify-between gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl mb-3 border border-blue-100">
                             <div className="flex items-center gap-2"><Video className="w-4 h-4"/> <span>يوجد فيديو محفوظ.</span></div>
                             <button onClick={handleClearVideo} className="text-red-500 font-bold text-xs hover:bg-red-100 p-1.5 rounded-lg transition flex items-center gap-1"><Trash2 className="w-3 h-3"/> إزالة</button>
                         </div>
                     )}
                     <input type="file" accept="video/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" onChange={(e:any) => setFormData({...formData, video: e.target.files[0]})}/>
                     {formData.video && <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> سيتم رفع الفيديو الجديد.</p>}
                 </div>
           </section>

           <section>
                <h3 className="section-title"><FileText className="w-5 h-5 text-amber-500"/> الوثائق والتحقق</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><User className="w-4 h-4"/> صورة البطاقة</label>
                            {formData.existingIdCard && !formData.idCard && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">محفوظة ✅</span>}
                        </div>
                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 file:border-slate-200 hover:file:bg-slate-100 cursor-pointer" onChange={(e) => handleDocUpload(e, 'idCard')} />
                        {formData.idCard && <p className="text-[10px] text-amber-600 mt-1 font-bold">سيتم استبدال الملف القديم.</p>}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4"/> صورة العقد</label>
                            {formData.existingContract && !formData.contract && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">محفوظة ✅</span>}
                        </div>
                        <input type="file" className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 file:border-slate-200 hover:file:bg-slate-100 cursor-pointer" onChange={(e) => handleDocUpload(e, 'contract')} />
                        {formData.contract && <p className="text-[10px] text-amber-600 mt-1 font-bold">سيتم استبدال الملف القديم.</p>}
                    </div>
                </div>
           </section>

           <div className="pt-4 border-t border-gray-100">
               <button onClick={handleSubmit} disabled={submitting || compressing} className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-sm hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                   {submitting ? <><Loader2 className="animate-spin w-5 h-5"/> جاري الحفظ...</> : <><Save className="w-5 h-5"/> حفظ التعديلات</>}
               </button>
               {statusMsg && <p className="text-center text-xs text-amber-600 mt-3 font-bold animate-pulse">{statusMsg}</p>}
           </div>

        </div>
      </div>
    </main>
  );
}