import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAStore } from '../store';

export default function InstallPWA() {
    const { deferredPrompt, setDeferredPrompt, clearPrompt } = usePWAStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [setDeferredPrompt]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User responded to the install prompt: ${outcome}`);
        clearPrompt();
        setIsVisible(false);
    };

    const closePrompt = () => {
        setIsVisible(false);
    };

    if (!isVisible || !deferredPrompt) return null;

    return (
        <div className="install-prompt-container" style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 1000,
            background: 'white',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '320px',
            animation: 'slide-up 0.3s ease-out'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <img src="/milk_icon_512.png" alt="App Icon" style={{ width: '24px', height: '24px' }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>Install Nandini App</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>For a faster, better experience.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={handleInstall}
                    style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}
                >
                    <Download size={14} /> Install
                </button>
                <button
                    onClick={closePrompt}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.25rem'
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
