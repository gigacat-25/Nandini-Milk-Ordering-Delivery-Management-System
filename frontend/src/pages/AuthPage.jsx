import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Milk, Mail, Phone, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function AuthPage() {
    const [params] = useSearchParams()
    const [isSignup, setIsSignup] = useState(params.get('signup') === '1')
    const [step, setStep] = useState(1) // 1=credentials, 2=OTP
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [asAdmin, setAsAdmin] = useState(false)

    const { setUser } = useAuthStore()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        // Simulate OTP send
        if (step === 1) {
            await new Promise((r) => setTimeout(r, 1200))
            toast.success('OTP sent! Use 1234 for demo.')
            setStep(2)
            setLoading(false)
            return
        }

        // Simulate OTP verify
        if (otp !== '1234') {
            toast.error('Invalid OTP. Use 1234 for demo.')
            setLoading(false)
            return
        }

        await new Promise((r) => setTimeout(r, 800))

        // Demo: admin login
        const role = asAdmin ? 'admin' : 'customer'
        const user = {
            id: 'usr-' + Math.random().toString(36).slice(2, 8),
            name: name || (asAdmin ? 'Admin Owner' : 'Demo Customer'),
            email,
            phone,
            role,
        }
        setUser(user)
        toast.success(`Welcome${user.name ? ', ' + user.name : ''}!`)
        navigate(role === 'admin' ? '/admin' : '/dashboard')
        setLoading(false)
    }

    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
            <div style={{ width: '100%', maxWidth: 440 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 60, height: 60, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                    }}>
                        <Milk size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                        {isSignup ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                        {isSignup ? 'Join Nandini Milk, Vaderhalli' : 'Sign in to manage your orders'}
                    </p>
                </div>

                {/* Card */}
                <div className="card">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {step === 1 && (
                            <>
                                {isSignup && (
                                    <div>
                                        <label className="label">Full Name</label>
                                        <input
                                            className="input"
                                            type="text"
                                            placeholder="Enter your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            className="input"
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            style={{ paddingLeft: '2.25rem' }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Email (optional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            className="input"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{ paddingLeft: '2.25rem' }}
                                        />
                                    </div>
                                </div>
                                {/* Demo admin toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef9c3', borderRadius: 8 }}>
                                    <input type="checkbox" id="admin-toggle" checked={asAdmin} onChange={(e) => setAsAdmin(e.target.checked)} style={{ cursor: 'pointer' }} />
                                    <label htmlFor="admin-toggle" style={{ fontSize: '0.8125rem', color: '#854d0e', fontWeight: 500, cursor: 'pointer' }}>
                                        🔑 Log in as Admin (Demo)
                                    </label>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Enter OTP</div>
                                    <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        Sent to {phone || email}. <strong>Use 1234 for demo.</strong>
                                    </div>
                                </div>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Enter 4-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 700 }}
                                    maxLength={4}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setOtp('') }}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem', padding: 0 }}
                                >
                                    ← Change number
                                </button>
                            </div>
                        )}

                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                            {loading ? <Loader size={16} className="animate-spin" /> : null}
                            {loading ? 'Please wait...' : step === 1 ? 'Send OTP →' : 'Verify & Login'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', margin: '1.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                        <button
                            onClick={() => { setIsSignup(!isSignup); setStep(1); setOtp('') }}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                            {isSignup ? 'Login' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
