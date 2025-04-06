"use client"

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'

// Fix the marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface CustomMarkerProps {
  position: [number, number]
  type: 'user' | 'mechanic' | 'towing' | 'fuel'
  children?: React.ReactNode
}

const getMarkerIcon = (type: CustomMarkerProps['type']) => {
  const iconUrl = {
    user: '/icons/user-marker.png',
    mechanic: '/icons/mechanic-marker.png',
    towing: '/icons/towing-marker.png',
    fuel: '/icons/fuel-marker.png'
  }[type]

  return L.icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

export function CustomMarker({ position, type, children }: CustomMarkerProps) {
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(getMarkerIcon(type))
    }
  }, [type])

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={getMarkerIcon(type)}
    >
      {children}
    </Marker>
  )
} 