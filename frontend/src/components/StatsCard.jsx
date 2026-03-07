export default function StatsCard({ icon: Icon, label, value, sub, color = '#2563eb', bg = '#dbeafe' }) {
    return (
        <div className="stat-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
                width: 48, height: 48, background: bg, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, flexShrink: 0,
            }}>
                <Icon size={22} />
            </div>
            <div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</div>}
            </div>
        </div>
    )
}
