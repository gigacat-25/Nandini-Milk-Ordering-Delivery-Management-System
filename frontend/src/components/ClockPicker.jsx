import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ClockPicker({ isOpen, onClose, initialValue, onSave }) {
    const [tempDecimal, setTempDecimal] = useState(initialValue || 15.5)
    const [mode, setMode] = useState('hours') // 'hours' or 'minutes'
    const [ampm, setAmPm] = useState(() => (initialValue >= 12 ? 'PM' : 'AM'))
    const clockRef = useRef(null)

    // Derived states
    const displayHour = Math.floor(tempDecimal) % 12 || 12
    const displayMinute = Math.round((tempDecimal % 1) * 60)

    useEffect(() => {
        if (isOpen) {
            setAmPm(initialValue >= 12 ? 'PM' : 'AM')
            setTempDecimal(initialValue)
            setMode('hours')
        }
    }, [isOpen, initialValue])

    if (!isOpen) return null

    const handleClockClick = (e) => {
        const rect = clockRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const x = e.clientX - rect.left - centerX
        const y = e.clientY - rect.top - centerY

        // Calculate angle in degrees
        let angle = (Math.atan2(y, x) * 180) / Math.PI + 90
        if (angle < 0) angle += 360

        if (mode === 'hours') {
            // Hours: 360 / 12 = 30 deg per hour
            let hour = Math.round(angle / 30)
            if (hour === 0) hour = 12

            let finalHour = hour
            if (ampm === 'PM' && hour !== 12) finalHour += 12
            if (ampm === 'AM' && hour === 12) finalHour = 0

            setTempDecimal(finalHour + displayMinute / 60)
            // Auto switch to minutes after selecting hour
            setTimeout(() => setMode('minutes'), 300)
        } else {
            // Minutes: 360 / 60 = 6 deg per minute
            const minute = Math.round(angle / 6) % 60
            const currentHour = Math.floor(tempDecimal)
            setTempDecimal(currentHour + minute / 60)
        }
    }

    const toggleAmPm = (val) => {
        if (val === ampm) return
        setAmPm(val)
        let h = Math.floor(tempDecimal)
        if (val === 'PM' && h < 12) h += 12
        else if (val === 'AM' && h >= 12) h -= 12
        setTempDecimal(h + (tempDecimal % 1))
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                background: 'white', borderRadius: 24, width: '100%', maxWidth: 320,
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
                animation: 'scaleIn 0.2s ease-out'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: '#2563eb', padding: '1.5rem', color: 'white' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Time</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                            <span
                                onClick={() => setMode('hours')}
                                style={{ fontSize: '3.5rem', fontWeight: 700, cursor: 'pointer', opacity: mode === 'hours' ? 1 : 0.6 }}
                            >
                                {String(displayHour).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '3rem', fontWeight: 300, opacity: 0.5 }}>:</span>
                            <span
                                onClick={() => setMode('minutes')}
                                style={{ fontSize: '3.5rem', fontWeight: 700, cursor: 'pointer', opacity: mode === 'minutes' ? 1 : 0.6 }}
                            >
                                {String(displayMinute).padStart(2, '0')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '0.5rem' }}>
                            <span
                                onClick={() => toggleAmPm('AM')}
                                style={{ fontSize: '1rem', fontWeight: 700, cursor: 'pointer', opacity: ampm === 'AM' ? 1 : 0.4 }}
                            >AM</span>
                            <span
                                onClick={() => toggleAmPm('PM')}
                                style={{ fontSize: '1rem', fontWeight: 700, cursor: 'pointer', opacity: ampm === 'PM' ? 1 : 0.4 }}
                            >PM</span>
                        </div>
                    </div>
                </div>

                {/* Clock Face */}
                <div style={{ padding: '2rem', position: 'relative', background: '#f8fafc' }}>
                    <div
                        ref={clockRef}
                        onClick={handleClockClick}
                        style={{
                            width: 240, height: 240, background: '#e2e8f0', borderRadius: '50%',
                            margin: '0 auto', position: 'relative', cursor: 'pointer'
                        }}
                    >
                        {/* Numbers */}
                        {mode === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
                            const angle = (i * 30) * Math.PI / 180
                            const r = 95
                            return (
                                <div key={n} style={{
                                    position: 'absolute',
                                    left: 120 + r * Math.sin(angle) - 15,
                                    top: 120 - r * Math.cos(angle) - 15,
                                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem', fontWeight: displayHour === n ? 700 : 500,
                                    color: displayHour === n ? 'white' : '#475569',
                                    zIndex: displayHour === n ? 2 : 1
                                }}>{n}</div>
                            )
                        }) : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((n, i) => {
                            const angle = (i * 30) * Math.PI / 180
                            const r = 95
                            return (
                                <div key={n} style={{
                                    position: 'absolute',
                                    left: 120 + r * Math.sin(angle) - 15,
                                    top: 120 - r * Math.cos(angle) - 15,
                                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem', fontWeight: displayMinute === n ? 700 : 500,
                                    color: displayMinute === n ? 'white' : '#475569',
                                    zIndex: displayMinute === n ? 2 : 1
                                }}>{n}</div>
                            )
                        })}

                        {/* Hand */}
                        <div style={{
                            position: 'absolute', left: '50%', top: '50%',
                            width: 2, height: 95, background: '#2563eb',
                            transformOrigin: 'bottom',
                            transform: `translate(-50%, -100%) rotate(${mode === 'hours' ? displayHour * 30 : displayMinute * 6}deg)`
                        }}>
                            <div style={{
                                position: 'absolute', top: -15, left: -15,
                                width: 32, height: 32, borderRadius: '50%', background: '#2563eb'
                            }} />
                        </div>
                        <div style={{
                            position: 'absolute', left: '50%', top: '50%',
                            width: 8, height: 8, borderRadius: '50%', background: '#2563eb',
                            transform: 'translate(-50%, -50%)'
                        }} />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 1.5rem', background: 'white' }}>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
                    >CANCEL</button>
                    <button
                        onClick={() => { onSave(tempDecimal); onClose() }}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                    >OK</button>
                </div>
            </div>
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
