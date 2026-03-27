import { ClipboardList, AlertTriangle, CheckCircle, XCircle, Bell } from "lucide-react";

export default function CenterRequestsPage() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold mb-2"><ClipboardList className="w-6 h-6" /> Hospital Requests</h1>
      <div className="app-card">
        <h3 className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Shifoxona buyurtmalari</h3>
        <p className="mt-2 text-sm text-zinc-600">Approve / Reject va priority belgilash boshqaruvi.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="btn-success flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Approve</button>
          <button className="btn-secondary flex items-center gap-2"><XCircle className="w-4 h-4" /> Reject</button>
        </div>
      </div>
      <button className="btn-primary sos-pulse w-full flex items-center justify-center gap-2"><Bell className="w-4 h-4 animate-pulse" /> SEND ALERT</button>
    </div>
  );
}
