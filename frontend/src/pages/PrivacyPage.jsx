import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: '3rem 2rem', borderRadius: 16, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600, marginBottom: '2rem' }}>
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Privacy Policy</h1>
                
                <div style={{ color: '#475569', fontSize: '1.125rem', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p>
                        Your privacy is critically important to us at <strong>Nandini Milk Store - Vaderhalli</strong>. This policy explains what information we gather when you use our app and how we handle it.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>1. Data We Collect</h2>
                    <p>
                        We collect basic information required to set up your account and deliver milk to your house. This includes your:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Name</li>
                        <li>Phone Number</li>
                        <li>Email Address</li>
                        <li>Home Delivery Address</li>
                        <li>Delivery Instructions</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>2. How We Use Your Data</h2>
                    <p>
                        The primary purpose of collecting your information is to ensure accurate and timely daily delivery of Nandini Milk products to your door. 
                        Delivery personnel only have access to your delivery address, phone number, and delivery instructions to complete the job.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>3. Data Sharing</h2>
                    <p>
                        We do not sell, trade, or rent your personal information to third parties. We share your address and phone number exclusively with our partnered delivery personnel for the sole purpose of delivery fulfillment.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>4. Security</h2>
                    <p>
                        Your account information is securely protected by Clerk authentication. Our databases follow best-practice security measures to prevent unauthorized access.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '1rem 0 0' }}>5. Account Deletion requests</h2>
                    <p>
                        If you wish to stop your subscriptions and delete your personal information permanently, you can request an account wipe directly through our application or by contacting store management.
                    </p>
                </div>
            </div>
        </div>
    )
}
