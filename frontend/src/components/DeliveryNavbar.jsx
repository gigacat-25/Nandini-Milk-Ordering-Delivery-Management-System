import { UserButton } from '@clerk/clerk-react'

export default function DeliveryNavbar() {
    return (
        <nav style={{ background: '#0f172a', padding: '1rem 1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {/* Logo */}
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: '0.1rem' }}>
                        🥛
                    </div>
                    <span>Nandini<span style={{ color: '#60a5fa' }}>Delivery</span></span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8', background: '#1e293b', padding: '0.25rem 0.75rem', borderRadius: 20 }}>
                    Driver Online
                </span>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: 36, height: 36, border: '2px solid #334155' } } }} />
            </div>
        </nav>
    )
}
