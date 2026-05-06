import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Loader2 } from 'lucide-react'

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

function LocationMarker({ position, setPosition, onAddressChange }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    useEffect(() => {
        if (position) {
            // Reverse geocoding using free Nominatim API
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.lat}&lon=${position.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.display_name) {
                        onAddressChange(data.display_name, position._isAuto)
                    }
                })
                .catch(err => console.error("Geocoding error:", err))
        }
    }, [position])

    return position === null ? null : (
        <>
            <Marker 
                position={position} 
                draggable={true}
                eventHandlers={{
                    dragend: (e) => {
                        const marker = e.target
                        setPosition(marker.getLatLng())
                    },
                }}
            />
            {position.accuracy && (
                <Circle 
                    center={position} 
                    radius={position.accuracy} 
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} 
                />
            )}
        </>
    )
}

export default function MapPicker({ initialPosition, onLocationChange, onAddressChange }) {
    const [position, setPosition] = useState(initialPosition || { lat: 12.9716, lng: 77.5946 })
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        if (initialPosition && !isInitialized) {
            setPosition(initialPosition)
            setIsInitialized(true)
        }
    }, [initialPosition, isInitialized])

    useEffect(() => {
        onLocationChange(position)
    }, [position])

    const [detecting, setDetecting] = useState(false)

    function handleLocate(map) {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }

        // Security check: Geolocation requires HTTPS or localhost
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            alert("🔒 Secure Connection Required: Chrome will not allow location access on insecure connections (HTTP). Please test on localhost or use HTTPS.")
            return
        }

        setDetecting(true)
        
        let attempts = 0
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                attempts++
                const newPos = { 
                    lat: pos.coords.latitude, 
                    lng: pos.coords.longitude, 
                    accuracy: pos.coords.accuracy,
                    _isAuto: true 
                }
                
                setPosition(newPos)
                map.flyTo(newPos, Math.max(17, map.getZoom()))
                
                // If we get high accuracy (under 30 meters) or we've tried several times, stop watching
                if (pos.coords.accuracy < 30 || attempts >= 5) {
                    navigator.geolocation.clearWatch(watchId)
                    setDetecting(false)
                }
            },
            (err) => {
                navigator.geolocation.clearWatch(watchId)
                console.error("Locate error:", err)
                setDetecting(false)
                let msg = "Failed to get location."
                if (err.code === 1) msg = "Location permission denied. Please enable it in browser settings."
                else if (err.code === 2) msg = "Position unavailable. Are you outdoors?"
                else if (err.code === 3) msg = "Request timed out. Please try again."
                alert(msg)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )

        // Safety timeout to ensure we don't watch forever
        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId)
            setDetecting(false)
        }, 15000)
    }

    // Helper component to get access to map instance for detect location button
    function MapButtons() {
        const map = useMap()
        return (
            <button
                type="button"
                onClick={() => handleLocate(map)}
                disabled={detecting}
                className="absolute top-3 right-3 z-[1000] bg-white text-blue-600 p-2.5 rounded-xl shadow-lg border border-slate-100 hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-wider"
            >
                {detecting ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Navigation size={16} />
                )}
                <span>{detecting ? 'Locating...' : 'Use My Location'}</span>
            </button>
        )
    }

    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
            <MapContainer 
                center={position} 
                zoom={13} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                    position={position} 
                    setPosition={setPosition} 
                    onAddressChange={onAddressChange}
                />
                <MapButtons />
            </MapContainer>
            <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 shadow-sm">
                Tap to move pin
            </div>
        </div>
    )
}
