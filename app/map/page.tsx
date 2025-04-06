"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FooterNav } from "@/components/shared/footer-nav"
import Link from "next/link"
import { Search, Car, Filter } from "lucide-react"
import { MapView } from "@/app/components/map/MapContainer"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'

// Dynamically import MapView to avoid SSR issues
const DynamicMapView = dynamic(
  () => import('@/app/components/map/MapContainer').then((mod) => mod.MapView),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
)

export default function MapPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800/95 shadow-md border-b dark:border-gray-700/50">
        <div className="container flex items-center h-16 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <Car className="w-6 h-6" />
            </Button>
          </Link>
          <div className="relative flex-1 mx-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input 
              placeholder="Search for services..." 
              className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/50 focus:border-primary dark:focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Map View */}
        <div className="absolute inset-0">
          <DynamicMapView />
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  )
}

