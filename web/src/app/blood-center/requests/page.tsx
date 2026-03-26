export default function CenterRequestsPage() {
  return (
    <div className="space-y-4">
      <h1>Hospital Requests</h1>
      <div className="app-card">
        <h3>Shifoxona buyurtmalari</h3>
        <p className="mt-2 text-sm text-zinc-600">Approve / Reject va priority belgilash boshqaruvi.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="btn-success">Approve</button>
          <button className="btn-secondary">Reject</button>
        </div>
      </div>
      <button className="btn-primary sos-pulse w-full">SEND ALERT</button>
    </div>
  );
}
