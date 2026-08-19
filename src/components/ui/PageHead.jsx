export function PageHead({ eyebrow, title, desc, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {desc && <div className="desc">{desc}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, tone = 'red', value, label, delta, deltaUp = true }) {
  return (
    <div className="stat-card">
      <div className={`icon-wrap tone-${tone}`}><Icon /></div>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      {delta && (
        <div className={`delta ${deltaUp ? 'up' : 'down'}`}>
          {deltaUp ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}
