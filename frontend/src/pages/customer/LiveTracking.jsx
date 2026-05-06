import { useState, useEffect, useRef } from 'react'
import { OlaMaps } from 'olamaps-web-sdk'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useUser } from '@clerk/clerk-react'
import { useUserProfile, useDeliverySession } from '../../lib/useData'
import { Navigation, Home, Truck, MapPin, RefreshCw, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LiveTracking() {
    const { user } = useUser()
    const { data: profile } = useUserProfile(user?.id)
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const markersRef = useRef({})
    
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

    const userPos = profile?.latitude && profile?.longitude ? { lat: profile.latitude, lng: profile.longitude } : null
    const truckPos = session?.current_lat && session?.current_lng ? { lat: session.current_lat, lng: session.current_lng } : null
    const isActive = !!session?.active

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return

        const olaMaps = new OlaMaps({
            apiKey: import.meta.env.VITE_OLA_MAPS_API_KEY
        })

        const myMap = olaMaps.init({
            style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
            container: mapContainerRef.current,
            center: userPos ? [userPos.lng, userPos.lat] : [77.5946, 12.9716],
            zoom: 15
        })

        mapRef.current = myMap
        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Manage Markers and Bounds
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        // 1. Home Marker
        if (userPos) {
            if (!markersRef.current.home) {
                const el = document.createElement('div')
                el.innerHTML = `
                    <div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; border: 3px solid #059669;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                `
                markersRef.current.home = new maplibregl.Marker({ element: el })
                    .setLngLat([userPos.lng, userPos.lat])
                    .addTo(map)
            } else {
                markersRef.current.home.setLngLat([userPos.lng, userPos.lat])
            }
        }

        // 2. Truck Marker
        if (truckPos && isActive) {
            if (!markersRef.current.truck) {
                const el = document.createElement('div')
                el.innerHTML = `
                    <div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; border: 3px solid #2563eb;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10h3Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                    </div>
                `
                markersRef.current.truck = new maplibregl.Marker({ element: el })
                    .setLngLat([truckPos.lng, truckPos.lat])
                    .addTo(map)
            } else {
                markersRef.current.truck.setLngLat([truckPos.lng, truckPos.lat])
            }
        } else if (markersRef.current.truck) {
            markersRef.current.truck.remove()
            markersRef.current.truck = null
        }

        // 3. Fit Bounds
        if (userPos && truckPos && isActive) {
            const bounds = new maplibregl.LngLatBounds()
            bounds.extend([userPos.lng, userPos.lat])
            bounds.extend([truckPos.lng, truckPos.lat])
            map.fitBounds(bounds, { padding: 100, duration: 2000 })
        } else if (userPos) {
            map.easeTo({ center: [userPos.lng, userPos.lat], zoom: 15, duration: 1000 })
        }
    }, [userPos, truckPos, isActive])

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

                <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

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

