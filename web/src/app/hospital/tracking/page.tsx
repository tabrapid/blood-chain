import { Truck, Map, Clock, User } from "lucide-react";

export default function HospitalTrackingPage() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold mb-2 text-blue-700"><Truck className="w-6 h-6" /> Logistika Tracking</h1>
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white shadow-lg dark:border-blue-900">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Map className="w-5 h-5" /> Transport xaritasi</h3>
        <div className="mt-3 rounded-2xl bg-white/90 p-6 text-sm text-blue-900 shadow flex flex-col items-center">
          <div className="mb-2"><Map className="w-10 h-10 text-blue-400" /></div>
          <div className="font-semibold">Transport harakati (demo xarita integratsiyasi uchun joy)</div>
          <div className="mt-2 text-xs text-blue-700">Google Maps yoki OpenStreetMap integratsiyasi uchun tayyor</div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-xl bg-blue-50/90 p-3 text-blue-900 flex items-center gap-2"><Clock className="w-4 h-4" /> ETA: 18 min</div>
          <div className="flex-1 rounded-xl bg-blue-50/90 p-3 text-blue-900 flex items-center gap-2"><User className="w-4 h-4" /> Haydovchi: Azizbek S.</div>
        </div>
      </div>
    </div>
  );
}
