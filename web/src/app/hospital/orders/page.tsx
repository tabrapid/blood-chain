export default function HospitalOrdersPage() {
  return (
    <div className="space-y-4">
      <h1>Digital Order</h1>
      <div className="app-card">
        <h3>Qon buyurtmalari</h3>
        <p className="mt-2 text-sm text-zinc-600">Donor va blood center uchun alohida yuborish paneli.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="btn-primary">Donorga yuborish</button>
          <button className="btn-secondary">Blood centerga yuborish</button>
        </div>
      </div>
    </div>
  );
}
