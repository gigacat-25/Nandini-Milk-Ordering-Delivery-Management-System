import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: '3rem 2rem', borderRadius: 16, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600, marginBottom: '2rem' }}>
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Terms & Conditions</h1>
                
                <div style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p>
                        Welcome to the <strong>Nandini Milk Store - Vaderhalli</strong> Delivery Application. By using our app, you agree to these terms. Please read them carefully.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>1. Subscriptions and Daily Deliveries</h2>
                    <p>
                        When you set up "Daily Milk", you authorize us to deduct the specified amount from your wallet balance daily upon successful delivery. 
                        Deliveries are typically completed between 5:30 AM and 7:00 AM.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>2. Payments and Wallet</h2>
                    <p>
                        All payments are processed securely. You must maintain a positive wallet balance for your subscription to continue. 
                        If your balance is insufficient, your daily delivery may be automatically paused until funds are added.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>3. Cancellations, Pauses, and Refunds</h2>
                    <p>
                        You can pause or cancel your daily deliveries at any time directly through the app without any hidden fees. 
                        If an item is marked as delivered but was missing or damaged, please contact our support team immediately, and your wallet will be refunded upon verification.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>4. Delivery Information</h2>
                    <p>
                        It is your responsibility to provide accurate delivery instructions and an exact location map link. If our delivery personnel cannot locate your premise, the delivery may be skipped, and your wallet will not be charged.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>5. Support Contact</h2>
                    <p>
                        For any issues or further clarification regarding these terms, you can contact the Vaderhalli store directly at <strong>+91 99999 00000</strong>.
                    </p>
                </div>
            </div>
        </div>
    )
}
