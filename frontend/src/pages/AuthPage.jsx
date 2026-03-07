import { SignIn } from '@clerk/clerk-react'

export default function AuthPage() {
    return (
        <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#f8fafc' }}>
            <SignIn routing="hash" />
        </div>
    )
}
