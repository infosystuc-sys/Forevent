"use client"

import type { Libraries } from "@react-google-maps/api"
import { GoogleMap, Marker, StandaloneSearchBox, useLoadScript } from "@react-google-maps/api"
import type { ReactNode } from "react"
import { Icons } from "~/app/_components/ui/icons"

const libraries: Libraries = ["places"]

const mapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
]

interface Props {
    apiKey: string
    coords: { lat: number; lng: number }
    markerPosition?: { lat: number; lng: number } | null
    onMapClick: (lat: number, lng: number) => void
    onPlacesChanged: () => void
    onSearchBoxLoad: (ref: google.maps.places.SearchBox) => void
    searchInput: ReactNode
    onLoadError?: (hasError: boolean) => void
}

export default function LocationMap({
    apiKey,
    coords,
    markerPosition,
    onMapClick,
    onPlacesChanged,
    onSearchBoxLoad,
    searchInput,
    onLoadError,
}: Props) {
    const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries })

    if (loadError) {
        onLoadError?.(true)
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 px-6">
                <p className="text-destructive font-medium">El mapa no pudo cargar</p>
                <p className="text-muted-foreground text-sm text-center max-w-md">
                    Verifica la API key y que Maps JavaScript API y Places API estén habilitados.
                </p>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-1 items-center justify-center py-8">
                <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando mapa...</span>
            </div>
        )
    }

    return (
        <>
            <StandaloneSearchBox onPlacesChanged={onPlacesChanged} onLoad={onSearchBoxLoad}>
                {searchInput as any}
            </StandaloneSearchBox>
            <div className="w-full h-[30vh]">
                <GoogleMap
                    options={{
                        backgroundColor: "#222",
                        fullscreenControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        styles: mapStyle,
                        center: coords,
                    }}
                    onClick={(e: google.maps.MapMouseEvent) => {
                        const latLng = e.latLng
                        if (!latLng) return
                        const lat = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat
                        const lng = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng
                        onMapClick(lat, lng)
                    }}
                    zoom={15}
                    center={coords}
                    mapContainerClassName="w-full h-full"
                >
                    {markerPosition && <Marker position={markerPosition} />}
                </GoogleMap>
            </div>
        </>
    )
}
