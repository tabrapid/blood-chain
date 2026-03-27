import { History, Droplet, CheckCircle, Clock, XCircle } from "lucide-react";

export default function HospitalHistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold mb-2 text-blue-700"><History className="w-6 h-6" /> Buyurtmalar tarixi</h1>
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white shadow-lg dark:border-blue-900">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Droplet className="w-5 h-5" /> Oldingi buyurtmalar</h3>
        <div className="mt-3 overflow-auto rounded-xl border border-blue-200 bg-white/90 text-blue-900">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-3">Sana</th>
                <th className="p-3">Qon turi</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-blue-100">
                <td className="p-3">2026-03-24</td>
                <td className="p-3 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> O- plasma</td>
                <td className="p-3"><span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"><CheckCircle className="w-4 h-4" /> Yetkazildi</span></td>
              </tr>
              <tr className="border-t border-blue-100">
                <td className="p-3">2026-03-20</td>
                <td className="p-3 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> A+ red_cells</td>
                <td className="p-3"><span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700"><Clock className="w-4 h-4" /> Jarayonda</span></td>
              </tr>
              <tr className="border-t border-blue-100">
                <td className="p-3">2026-03-18</td>
                <td className="p-3 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> B- plasma</td>
                <td className="p-3"><span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"><XCircle className="w-4 h-4" /> Bekor qilingan</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
