"use client"

import { useEffect, useRef, useState } from "react"
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Circle, Stroke, Fill } from 'ol/style'
import Overlay from 'ol/Overlay'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import 'ol/ol.css'

export interface Service {
  id: string;
  name: string;
  type: 'mechanic' | 'towing' | 'fuel';
  distance: string;
  rating: number;
  eta: string;
  location: [number, number];
}

interface MapProps {
  services?: Service[];
  onServiceClick?: (service: Service) => void;
}

export function MapView({ services = [], onServiceClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<Map | null>(null)
  const vectorSource = useRef<VectorSource | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const popupOverlay = useRef<Overlay | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([51.505, -0.09])
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([userLocation[1], userLocation[0]]),
        zoom: 13
      })
    })

    // Create vector source for markers
    const source = new VectorSource()
    const vectorLayer = new VectorLayer({
      source: source
    })

    map.addLayer(vectorLayer)

    // Create popup overlay
    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: true
    })

    map.addOverlay(popup)

    // Store references
    mapInstance.current = map
    vectorSource.current = source
    popupOverlay.current = popup

    // Add user location marker
    const userFeature = new Feature({
      geometry: new Point(fromLonLat([userLocation[1], userLocation[0]]))
    })

    userFeature.setStyle(
      new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#2563eb' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      })
    )

    source.addFeature(userFeature)

    // Add service markers if available
    if (services.length > 0) {
      services.forEach(service => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([service.location[1], service.location[0]]))
        })

        feature.set('service', service)

        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 6,
              fill: new Fill({ 
                color: service.type === 'mechanic' ? '#dc2626' : 
                       service.type === 'towing' ? '#f97316' : '#22c55e'
              }),
              stroke: new Stroke({ color: '#fff', width: 2 })
            })
          })
        )

        source.addFeature(feature)
      })
    }

    // Add click handler
    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, feature => feature)
      
      if (feature && feature.get('service')) {
        const service = feature.get('service')
        onServiceClick?.(service)
        
        if (popupRef.current && popupOverlay.current) {
          popupRef.current.innerHTML = `
            <div class="p-2 bg-white rounded-lg shadow-lg">
              <h3 class="font-semibold">${service.name}</h3>
              <p class="text-sm text-gray-600">${service.type}</p>
              <p class="text-sm text-gray-600">Rating: ${service.rating}⭐</p>
              <p class="text-sm text-gray-600">ETA: ${service.eta}</p>
              <button class="w-full mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                View Details
              </button>
            </div>
          `
          popupOverlay.current.setPosition(event.coordinate)
        }
      } else {
        if (popupRef.current) {
          popupRef.current.innerHTML = ''
        }
      }
    })

    // Cleanup
    return () => {
      map.setTarget(undefined)
      mapInstance.current = null
      vectorSource.current = null
      popupOverlay.current = null
    }
  }, [services])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setIsMapReady(true)
          
          if (mapInstance.current) {
            mapInstance.current.getView().setCenter(fromLonLat([longitude, latitude]))
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Unable to get your location. Using default location.')
          setIsMapReady(true)
        }
      )
    }
  }, [])

  const handleLocationRefresh = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          
          if (mapInstance.current) {
            mapInstance.current.getView().setCenter(fromLonLat([longitude, latitude]))
          }
          
          toast.success('Location updated')
        },
        (error) => {
          console.error('Error getting location:', error)
          toast.error('Unable to get your location.')
        }
      )
    }
  }

  if (!isMapReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div ref={popupRef} className="absolute" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
        <Button 
          size="icon" 
          variant="secondary" 
          className="bg-white dark:bg-gray-800/90 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/90"
          onClick={handleLocationRefresh}
        >
          <div className="w-5 h-5 text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
              <path d="M12 2v10h10"/>
            </svg>
          </div>
        </Button>
      </div>
    </div>
  )
} 