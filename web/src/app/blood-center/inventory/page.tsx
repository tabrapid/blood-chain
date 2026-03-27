import { Package, ScanBarcode } from "lucide-react";

export default function CenterInventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold mb-2"><Package className="w-6 h-6" /> Inventory Management</h1>
      <div className="app-card">
        <h3 className="flex items-center gap-2"><Package className="w-5 h-5" /> Kirim/chiqim</h3>
        <p className="mt-2 text-sm text-zinc-600">Shtrix-kod scan va guruh bo'yicha filter bu bo'limda.</p>
        <button className="btn-primary mt-4 w-full flex items-center justify-center gap-2"><ScanBarcode className="w-4 h-4" /> Scan bilan qo'shish</button>
      </div>
    </div>
  );
}
