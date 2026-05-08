import { useState, useEffect, useRef } from 'react'
import { OlaMaps } from 'olamaps-web-sdk'
import { Navigation, Loader2, MapPin } from 'lucide-react'
import { getOlaMapsToken } from '../lib/useData'

// Import Ola Maps CSS or fallback to MapLibre CSS which it's based on
import 'maplibre-gl/dist/maplibre-gl.css'

export default function MapPicker({ initialPosition, onLocationChange, onAddressChange }) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)
    
    const [position, setPosition] = useState(initialPosition || { lat: 12.9716, lng: 77.5946 })
    const [detecting, setDetecting] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [olaToken, setOlaToken] = useState(null)

    // Fetch Ola Token on mount
    useEffect(() => {
        let isMounted = true
        getOlaMapsToken()
            .then(token => {
                if (isMounted) setOlaToken(token)
            })
            .catch(err => console.error("Failed to fetch Ola Token:", err))
        return () => { isMounted = false }
    }, [])

    // Initialize Ola Maps
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !olaToken) return

        const initMap = async () => {
            try {
                const olaMapsInstance = new OlaMaps({
                    accessToken: olaToken,
                })

                console.log('MapPicker: Initializing map...')
                let map = olaMapsInstance.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                    container: mapContainerRef.current,
                    center: [position.lng, position.lat],
                    zoom: 15,
                })

                // Handle potential Promise return (some SDK versions)
                if (map instanceof Promise) {
                    map = await map
                }

                // Reliability check for the map instance
                if (!map || typeof map.on !== 'function') {
                    console.warn('MapPicker: map.on is missing, checking for nested instance', map)
                    // Some SDK versions might return { map: ... } or the instance might be on the SDK object
                    const fallbackMap = map?.map || olaMapsInstance.map || olaMapsInstance.getMap?.()
                    if (fallbackMap && typeof fallbackMap.on === 'function') {
                        map = fallbackMap
                    } else {
                        throw new Error('Could not find valid map instance with .on() method')
                    }
                }

                mapRef.current = map

                const handleLoad = () => {
                    console.log('MapPicker: Map loaded successfully')
                    setIsLoaded(true)

                    // Create custom marker element
                    const el = document.createElement('div');
                    el.innerHTML = `
                        <div style="background: white; border-radius: 50%; padding: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 2px solid #2563eb; display: flex; align-items: center; justify-content: center; transform: translateY(-50%); cursor: grab;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                    `;

                    // Add initial marker using the SDK instance
                    try {
                        const marker = olaMapsInstance.addMarker({
                            element: el,
                            anchor: 'center',
                            draggable: true,
                        })
                        .setLngLat([position.lng, position.lat])
                        .addTo(map)

                        marker.on('dragend', () => {
                            const lngLat = marker.getLngLat()
                            const newPos = { lat: lngLat.lat, lng: lngLat.lng }
                            setPosition(newPos)
                        })

                        markerRef.current = marker
                    } catch (markerErr) {
                        console.error('MapPicker: Failed to add marker', markerErr)
                    }
                }

                if (map.loaded()) {
                    handleLoad()
                } else {
                    map.on('load', handleLoad)
                }

                // Click to move marker
                map.on('click', (e) => {
                    const { lng, lat } = e.lngLat
                    const newPos = { lat, lng }
                    setPosition(newPos)
                    if (markerRef.current) {
                        markerRef.current.setLngLat([lng, lat])
                    }
                })

            } catch (err) {
                console.error('MapPicker: Initialization error:', err)
            }
        }

        initMap()

        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove()
                } catch (e) {
                    console.warn('MapPicker: Error during map removal', e)
                }
                mapRef.current = null
            }
            markerRef.current = null
            setIsLoaded(false)
        }
    }, [olaToken]) // Re-run when token is acquired

    // Update parent and reverse geocode when position changes
    useEffect(() => {
        if (!position || !olaToken) return
        onLocationChange(position)

        // Reverse Geocoding using Ola Maps API with JWT/Token
        fetch(`https://api.olamaps.io/places/v1/reverse-geocode?latlng=${position.lat},${position.lng}`, {
            headers: {
                'Authorization': `Bearer ${olaToken}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.results && data.results[0]) {
                    onAddressChange(data.results[0].formatted_address, position._isAuto)
                }
            })
            .catch(err => console.error("Ola Geocoding error:", err))
    }, [position, olaToken])

    // Update marker when position changes externally or via map click
    useEffect(() => {
        if (isLoaded && mapRef.current && markerRef.current) {
            const lngLat = markerRef.current.getLngLat()
            if (lngLat.lat !== position.lat || lngLat.lng !== position.lng) {
                markerRef.current.setLngLat([position.lng, position.lat])
                mapRef.current.flyTo({ center: [position.lng, position.lat], zoom: 17 })
            }
        }
    }, [position, isLoaded])

    function handleLocate() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }

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
                
                if (pos.coords.accuracy < 30 || attempts >= 5) {
                    navigator.geolocation.clearWatch(watchId)
                    setDetecting(false)
                }
            },
            (err) => {
                navigator.geolocation.clearWatch(watchId)
                setDetecting(false)
                alert("Failed to get location. Please check permissions.")
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )

        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId)
            setDetecting(false)
        }, 15000)
    }

    return (
        <div className="h-[350px] w-full rounded-3xl overflow-hidden border-2 border-white shadow-2xl relative group">
            {/* Map Container */}
            <div ref={mapContainerRef} className="h-full w-full" />

            {/* Premium Overlay Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleLocate}
                    disabled={detecting}
                    className="bg-white/90 backdrop-blur-md text-blue-600 p-3 rounded-2xl shadow-xl border border-white/50 hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-tight"
                >
                    {detecting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Navigation size={18} />
                    )}
                    <span>{detecting ? 'Locking GPS...' : 'Use My Location'}</span>
                </button>
            </div>

            {/* Accuracy Indicator */}
            {position.accuracy && detecting && (
                <div className="absolute bottom-4 left-4 z-10 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-lg flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    Accuracy: ±{Math.round(position.accuracy)}m
                </div>
            )}

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 right-4 z-10 bg-black/40 backdrop-blur-md text-white/90 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                Drag marker to refine address
            </div>

            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                    <p className="text-slate-400 font-bold text-sm animate-pulse">Initializing Ola Maps...</p>
                </div>
            )}
        </div>
    )
}
