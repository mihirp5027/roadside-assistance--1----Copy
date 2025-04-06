"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FooterNav } from "@/components/shared/footer-nav"
import Link from "next/link"
import { Search, Car, Navigation, Droplet, Phone, Filter, ChevronUp, Star } from "lucide-react"
import { toast } from "sonner"
import { MapView, Service } from "@/components/map/MapContainer"
import { useRouter } from "next/navigation"

export default function MapPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Initialize with sample services
    const fetchServices = async () => {
      try {
        // Replace with actual API call when ready
        const sampleServices: Service[] = [
          {
            id: '1',
            name: "John's Auto Repair",
            type: "mechanic",
            distance: "0.8 miles",
            rating: 4.8,
            eta: "10 min",
            location: [51.507, -0.088]
          },
          {
            id: '2',
            name: "Quick Towing Service",
            type: "towing",
            distance: "1.2 miles",
            rating: 4.6,
            eta: "15 min",
            location: [51.505, -0.092]
          },
          {
            id: '3',
            name: "24/7 Fuel Delivery",
            type: "fuel",
            distance: "0.5 miles",
            rating: 4.7,
            eta: "8 min",
            location: [51.503, -0.087]
          }
        ];
        setServices(sampleServices);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to fetch services');
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesType = selectedType === 'all' || service.type === selectedType;
    const matchesSearch = searchQuery === "" || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleServiceClick = (service: Service) => {
    router.push(`/services/${service.type}/${service.id}`);
  };

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
          <MapView 
            services={filteredServices}
            onServiceClick={handleServiceClick}
          />
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bottom-16 left-0 right-0 z-[400] bg-white dark:bg-gray-800/95 rounded-t-xl shadow-lg border-t dark:border-gray-700/50">
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>

          <div className="container px-4 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nearby Services</h2>
              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                <ChevronUp className="w-5 h-5 mr-1" />
                Expand
              </Button>
            </div>

            {/* Service Tabs */}
            <Tabs defaultValue="all" className="mb-4" onValueChange={setSelectedType}>
              <TabsList className="w-full dark:bg-gray-800/90 border dark:border-gray-700/50">
                <TabsTrigger value="all" className="flex-1 dark:data-[state=active]:bg-gray-700/90 dark:text-gray-300 dark:data-[state=active]:text-white">
                  All
                </TabsTrigger>
                <TabsTrigger value="mechanic" className="flex-1 dark:data-[state=active]:bg-gray-700/90 dark:text-gray-300 dark:data-[state=active]:text-white">
                  Mechanics
                </TabsTrigger>
                <TabsTrigger value="towing" className="flex-1 dark:data-[state=active]:bg-gray-700/90 dark:text-gray-300 dark:data-[state=active]:text-white">
                  Towing
                </TabsTrigger>
                <TabsTrigger value="fuel" className="flex-1 dark:data-[state=active]:bg-gray-700/90 dark:text-gray-300 dark:data-[state=active]:text-white">
                  Fuel
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onClick={() => handleServiceClick(service)}
                      />
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No services found</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {['mechanic', 'towing', 'fuel'].map((type) => (
                <TabsContent key={type} value={type} className="mt-4">
                  <div className="space-y-3">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onClick={() => handleServiceClick(service)}
                        />
                      ))
                    ) : (
                      <Card className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No {type} services found nearby</p>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <QuickAction icon={<Car />} label="Mechanic" href="/services/mechanic" />
              <QuickAction icon={<Navigation />} label="Towing" href="/services/towing" />
              <QuickAction icon={<Droplet />} label="Fuel" href="/services/fuel" />
              <QuickAction icon={<Phone />} label="Emergency" href="/emergency" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  )
}

// Service Card Component
function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
            <div className="flex items-center mb-1">
              <span className="text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 rounded-full mr-2 capitalize">
                {service.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{service.distance}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-current" />
                <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                  {service.rating}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                ETA: {service.eta}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Quick Action Component
function QuickAction({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div className="p-2 mb-1 rounded-full bg-primary/10 dark:bg-primary/20">
          <div className="text-primary dark:text-primary/90 w-5 h-5">{icon}</div>
        </div>
        <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    </Link>
  )
} 