"use client"

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import { useEffect } from 'react';

// Create custom icons for different marker types
const createCustomIcon = (color: string = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

const icons = {
  user: createCustomIcon('blue'),
  mechanic: createCustomIcon('red'),
  towing: createCustomIcon('orange'),
  fuel: createCustomIcon('green'),
  default: createCustomIcon('grey')
};

interface CustomMarkerProps {
  position: [number, number];
  type?: 'user' | 'mechanic' | 'towing' | 'fuel';
  children?: React.ReactNode;
}

export function CustomMarker({ position, type = 'default', children }: CustomMarkerProps) {
  // Fix for SSR
  useEffect(() => {
    // This ensures the marker icons are properly set after component mount
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <Marker position={position} icon={icons[type]}>
      {children}
    </Marker>
  );
} 