export default function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ background: color }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}