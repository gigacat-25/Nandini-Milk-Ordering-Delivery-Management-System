import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useUser } from '@clerk/clerk-react'
import { useUserProfile, useDeliverySession } from '../../lib/useData'
import { Navigation, Home, Truck, MapPin, RefreshCw, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'

// Custom Icons using Lucide + Leaflet DivIcon
const createDivIcon = (Icon, color) => L.divIcon({
    html: renderToStaticMarkup(
        <div style={{ 
            background: 'white', 
            borderRadius: '50%', 
            padding: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${color}`
        }}>
            <Icon size={24} color={color} />
        </div>
    ),
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44]
})

const truckIcon = createDivIcon(Truck, '#2563eb')
const homeIcon = createDivIcon(Home, '#059669')

// Map component to handle bounds
function MapBounds({ userPos, truckPos }) {
    const map = useMap()
    useEffect(() => {
        if (userPos && truckPos) {
            const bounds = L.latLngBounds([userPos, truckPos])
            map.fitBounds(bounds, { padding: [50, 50] })
        } else if (userPos) {
            map.setView(userPos, 15)
        }
    }, [userPos, truckPos, map])
    return null
}

export default function LiveTracking() {
    const { user } = useUser()
    const { data: profile } = useUserProfile(user?.id)
    
    // Determine slot based on time
    const [slot] = useState(() => {
        const hour = new Date().getHours()
        return hour < 14 ? 'morning' : 'evening'
    })
    const [date] = useState(() => new Date().toISOString().split('T')[0])
    
    const { data: session, refetch: refetchSession } = useDeliverySession(date, slot)

    // Poll for session updates every 10 seconds
    useEffect(() => {
        const interval = setInterval(refetchSession, 10000)
        return () => clearInterval(interval)
    }, [refetchSession])

    const userPos = profile?.latitude && profile?.longitude ? [profile.latitude, profile.longitude] : null
    const truckPos = session?.current_lat && session?.current_lng ? [session.current_lat, session.current_lng] : null

    const isActive = !!session?.active

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 z-10">
                <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Live Delivery Tracking</h1>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {slot} Slot • {isActive ? '🚚 Delivery in progress' : '⏱️ Waiting to start'}
                    </p>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {!userPos && (
                    <div className="absolute inset-0 z-[1000] bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                        <div className="max-w-xs">
                            <MapPin size={48} className="mx-auto text-blue-500 mb-4" />
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Location Not Set</h2>
                            <p className="text-slate-500 text-sm mb-6">Please pin your delivery location in your profile to track deliveries accurately.</p>
                            <Link to="/profile" className="btn-primary w-full inline-block">Update Profile</Link>
                        </div>
                    </div>
                )}

                <MapContainer 
                    center={userPos || [12.9716, 77.5946]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    
                    {userPos && (
                        <Marker position={userPos} icon={homeIcon}>
                            <Popup>Your Delivery Location</Popup>
                        </Marker>
                    )}

                    {truckPos && isActive && (
                        <Marker position={truckPos} icon={truckIcon}>
                            <Popup>Moove Delivery Truck</Popup>
                        </Marker>
                    )}

                    <MapBounds userPos={userPos} truckPos={truckPos && isActive ? truckPos : null} />
                </MapContainer>

                {/* Status Overlay */}
                {isActive && truckPos && (
                    <div className="absolute bottom-8 left-4 right-4 z-[1000]">
                        <div className="card bg-white p-4 shadow-xl border-none flex items-center gap-4 animate-slide-up">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                <Navigation size={24} className="animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-900">Truck is on the way!</div>
                                <div className="text-xs text-slate-500">Live location updating every 30s</div>
                            </div>
                            <button 
                                onClick={() => refetchSession()}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
