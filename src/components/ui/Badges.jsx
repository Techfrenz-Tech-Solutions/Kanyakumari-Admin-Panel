export function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

export function BreakingTag() {
  return (
    <span className="breaking-tag">
      <span className="pulse" /> Breaking
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="empty-state">
      {Icon && <Icon />}
      <div className="t">{title}</div>
      <div>{message}</div>
    </div>
  );
}
