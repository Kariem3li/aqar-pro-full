"use client";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect } from "react";
import { Crosshair, Check, X, Loader2 } from "lucide-react";

// 1. إصلاح أيقونة Leaflet المختفية
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 2. مكون لتحريك الكاميرا عند تغيير الموقع (UX)
function ChangeView({ center }: { center: { lat: number, lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

// 3. مكون النقر (وضع الدبوس)
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={icon} /> : null;
}

interface MapPickerProps {
  onConfirm: (lat: string, lng: string) => void;
  onClose: () => void;
  initialLat?: string;
  initialLng?: string;
}

export default function MapPicker({ onConfirm, onClose, initialLat, initialLng }: MapPickerProps) {
  
  // 4. تحديد نقطة البداية (المنطق الذكي)
  const defaultLocation = { lat: 30.3060, lng: 31.7376 }; // 
  
  // لو فيه إحداثيات جاية (تعديل) خدها، لو مفيش خد العاشر
  const startPosition = (initialLat && initialLng)
    ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) }
    : defaultLocation;

  const [position, setPosition] = useState<any>(startPosition);
  const [loadingLoc, setLoadingLoc] = useState(false);

  // دالة GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLoc(false);
      },
      (err) => {
        alert("تعذر تحديد موقعك، تأكد من تفعيل GPS");
        setLoadingLoc(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <MapPinIcon /> تحديد الموقع
           </h3>
           <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Map Body */}
        <div className="flex-1 relative bg-gray-100">
           <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
             <ChangeView center={position} /> {/* يحرك الخريطة لما الموقع يتغير */}
             <LocationMarker position={position} setPosition={setPosition} />
           </MapContainer>

           {/* زرار GPS */}
           <button 
             onClick={handleLocateMe}
             disabled={loadingLoc}
             className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition border border-gray-100"
             title="موقعي الحالي"
           >
             {loadingLoc ? <Loader2 className="w-6 h-6 animate-spin text-blue-600"/> : <Crosshair className="w-6 h-6" />}
           </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white z-10 flex flex-col gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
           <p className="text-xs text-gray-400 text-center font-bold">
             {position.lat !== defaultLocation.lat 
                ? "تم تحديد نقطة ✅" 
                : "قم بتحريك الخريطة واضغط لتحديد مكان العقار"}
           </p>
           <button 
             onClick={() => onConfirm(position.lat.toString(), position.lng.toString())}
             className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg active:scale-95"
           >
             <Check className="w-5 h-5" /> تأكيد الموقع
           </button>
        </div>

      </div>
    </div>
  );
}

// أيقونة بسيطة للهيدر
function MapPinIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    )
}