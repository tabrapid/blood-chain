export default function HospitalHistoryPage() {
  return (
    <div className="space-y-4">
      <h1>Order History</h1>
      <div className="app-card">
        <h3>Oldingi buyurtmalar</h3>
        <div className="mt-3 overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left">
              <tr>
                <th className="p-3">Sana</th>
                <th className="p-3">Qon turi</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">2026-03-24</td>
                <td className="p-3">O- plasma</td>
                <td className="p-3 text-[#2E7D32]">Delivered</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
