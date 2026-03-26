export default function DonorBookingPage() {
  return (
    <div className="space-y-4">
      <h1>Booking</h1>
      <div className="app-card">
        <h3>Slot bron qilish</h3>
        <p className="mt-2 text-sm text-zinc-600">Markaz tanlang, vaqtni belgilang va 1-2 klikda navbatga qo&apos;shiling.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input className="app-input" placeholder="Markaz" />
          <input className="app-input" type="datetime-local" />
          <button className="btn-primary">Band qilish</button>
        </div>
      </div>
    </div>
  );
}
