"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FooterNav } from "@/components/shared/footer-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Car,
  Phone,
  Shield,
  MessageSquare,
  Award,
  AlertTriangle,
  Navigation,
  Video,
  Droplet,
  Stethoscope,
  Bell,
  User,
  Star,
  Loader2,
} from "lucide-react";
import { mockServices, mockHistory, mockNotifications } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

interface Mechanic {
  _id: string;
  name: string;
  specialization: string;
  contactNumber: string;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  distance?: number;
  location: {
    coordinates: [number, number];
    address: string;
  };
}

interface PetrolPump {
  _id: string;
  name: string;
  address: string;
  isOpen: boolean;
  distance?: number;
  location: {
    coordinates: [number, number];
  };
  fuelTypes: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [petrolPumps, setPetrolPumps] = useState<PetrolPump[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [history, setHistory] = useState<{
    date: string;
    service: string;
    provider: string;
    status: string;
    id: string;
  }[]>([]);

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          setLocation({
            latitude,
            longitude,
            address: data.display_name
          });

          // Fetch nearby services with the new coordinates
          fetchNearbyServices(latitude, longitude);
        } catch (error) {
          console.error("Error getting location details:", error);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  // Function to fetch nearby mechanics and petrol pumps
  const fetchNearbyServices = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    try {
      // Fetch nearby mechanics
      const mechanicsResponse = await fetch(
        `http://localhost:5000/api/mechanic/nearby?latitude=${latitude}&longitude=${longitude}`
      );
      const mechanicsData = await mechanicsResponse.json();
      setMechanics(mechanicsData.mechanics || []);

      // Fetch nearby petrol pumps
      const pumpsResponse = await fetch(
        `http://localhost:5000/api/petrol-pumps/nearby?latitude=${latitude}&longitude=${longitude}`
      );
      const pumpsData = await pumpsResponse.json();
      setPetrolPumps(pumpsData.petrolPumps || []);
    } catch (error) {
      console.error("Error fetching nearby services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch service history
  const fetchServiceHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/requests/history');
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Format the history data
        const formattedHistory = data.map((item: any) => ({
          id: item._id,
          date: new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          service: item.serviceType,
          provider: item.mechanicName || item.providerName || 'Not assigned',
          status: item.status.toLowerCase()
        }));
        
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching service history:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth/signin");
      return;
    }
    setUser(JSON.parse(userData));

    // Get current location and fetch nearby services
    getCurrentLocation();
    
    // Fetch service history
    fetchServiceHistory();
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary dark:text-primary/90" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">RoadGuard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50">
                <Bell className="w-5 h-5" />
                {mockNotifications.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0">
                    {mockNotifications.length}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Link href="/profile">
              <div className="w-8 h-8 overflow-hidden rounded-full bg-primary/10 dark:bg-gray-700/50">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto.startsWith('http') 
                      ? user.profilePhoto 
                      : `http://localhost:5000${user.profilePhoto}`}
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary dark:text-gray-300" />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container px-4 py-6">
          {/* Location Bar */}
          <div className="flex items-center p-3 mb-6 bg-white dark:bg-gray-800/90 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700/50">
            <MapPin className="w-5 h-5 mr-2 text-primary dark:text-primary/90" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">Current Location</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {location ? location.address : "Fetching location..."}
              </p>
              {location && (
                <p className="text-xs text-gray-400 mt-1">
                  GPS: {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°E
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={getCurrentLocation}
              className="text-gray-600 dark:text-gray-300"
            >
              Refresh
            </Button>
          </div>

          {/* SOS Button */}
          <div className="mb-6">
            <Link href="/emergency">
              <Button className="w-full py-6 text-lg font-bold bg-red-600 hover:bg-red-700 dark:bg-red-700/90">
                <AlertTriangle className="w-6 h-6 mr-2" />
                SOS EMERGENCY
              </Button>
            </Link>
          </div>

          {/* Services Tabs */}
          <Tabs defaultValue="services" className="mb-6">
            <TabsList className="w-full bg-gray-100 dark:bg-gray-800/90">
              <TabsTrigger value="services" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700/90">
                Services
              </TabsTrigger>
              <TabsTrigger value="nearby" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700/90">
                Nearby
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700/90">
                History
              </TabsTrigger>
            </TabsList>

            {/* Services Tab Content */}
            <TabsContent value="services" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <ServiceCard
                  icon={<Car />}
                  title="Mechanic"
                  description="Find nearby mechanics"
                  href="/services/mechanic"
                />
                {/* <ServiceCard
                  icon={<Navigation />}
                  title="Towing"
                  description="Request towing service"
                  href="/services/towing"
                /> */}
                <ServiceCard
                  icon={<Droplet />}
                  title="Fuel Delivery"
                  description="Get fuel delivered"
                  href="/services/fuel"
                />
                {/* <ServiceCard
                  icon={<Video />}
                  title="Video Consult"
                  description="Live mechanic consultation"
                  href="/services/video-consult" */}
                {/* /> */}
                <ServiceCard
                  icon={<Stethoscope />}
                  title="AR Diagnosis"
                  description="Self-diagnose with AR"
                  href="/services/ar-diagnosis"
                />
                <ServiceCard
                  icon={<Phone />}
                  title="Medical Help"
                  description="Emergency medical assistance"
                  href="/services/medical"
                />
              </div>
            </TabsContent>

            {/* Nearby Tab Content */}
            <TabsContent value="nearby" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mechanics Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                      Nearby Mechanics
                    </h3>
                    <div className="space-y-3">
                      {mechanics.length > 0 ? (
                        mechanics.map((mechanic) => (
                          <Link key={mechanic._id} href={`/services/mechanic/${mechanic._id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {mechanic.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {mechanic.specialization}
                                    </p>
                                    <div className="flex items-center mt-1">
                                      <Star className="w-4 h-4 text-yellow-400" />
                                      <span className="ml-1 text-sm">
                                        {mechanic.rating.toFixed(1)} ({mechanic.totalReviews} reviews)
                                      </span>
                                    </div>
                                    {mechanic.distance && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        <MapPin className="w-4 h-4 inline mr-1" />
                                        {mechanic.distance < 1
                                          ? `${(mechanic.distance * 1000).toFixed(0)}m away`
                                          : `${mechanic.distance.toFixed(1)}km away`}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant={mechanic.isActive ? "default" : "secondary"}>
                                    {mechanic.isActive ? "Available" : "Busy"}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        ))
                      ) : (
                        <Card className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">
                            No mechanics found nearby
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Petrol Pumps Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                      Nearby Petrol Pumps
                    </h3>
                    <div className="space-y-3">
                      {petrolPumps.length > 0 ? (
                        petrolPumps.map((pump) => (
                          <Card key={pump._id} className="hover:shadow-md transition-shadow">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {pump.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {pump.address}
                                  </p>
                                  {pump.distance && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      <MapPin className="w-4 h-4 inline mr-1" />
                                      {pump.distance < 1
                                        ? `${(pump.distance * 1000).toFixed(0)}m away`
                                        : `${pump.distance.toFixed(1)}km away`}
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    {pump.fuelTypes.map((type) => (
                                      <Badge key={type} variant="outline">
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Badge variant={pump.isOpen ? "default" : "secondary"}>
                                  {pump.isOpen ? "Open" : "Closed"}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <Card className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">
                            No petrol pumps found nearby
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* History Tab Content */}
            <TabsContent value="history">
              <div className="space-y-4">
                {history.length > 0 ? (
                  history.map((item) => (
                    <HistoryItem
                      key={item.id}
                      date={item.date}
                      service={item.service}
                      provider={item.provider}
                      status={item.status}
                      href={`/history/${item.id}`}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No service history found
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <FooterNav />
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary dark:bg-gray-800/90 dark:border-gray-700/50 dark:hover:border-primary">
        <div className="p-4">
          <div className="p-2 w-fit rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90">
            {icon}
          </div>
          <h3 className="mt-2 font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

function NearbyServiceCard({
  name,
  type,
  distance,
  rating,
  eta,
  href,
}: {
  name: string;
  type: string;
  distance: string;
  rating: number;
  eta: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden transition-all hover:shadow-md dark:bg-gray-800/90 dark:border-gray-700/50">
        <div className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 mr-4 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <div className="text-primary dark:text-primary/90">
                {type === "mechanic" && <Car className="w-6 h-6" />}
                {type === "towing" && <Navigation className="w-6 h-6" />}
                {type === "fuel" && <Droplet className="w-6 h-6" />}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 mr-2">
                  {type}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{distance}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                  <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">{rating}</span>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ETA: {eta}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function HistoryItem({
  date,
  service,
  provider,
  status,
  href,
}: {
  date: string;
  service: string;
  provider: string;
  status: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden transition-all hover:shadow-md dark:bg-gray-800/90 dark:border-gray-700/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              status === "completed"
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : status === "cancelled"
                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            }`}>
              {status}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">{service}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{provider}</p>
        </div>
      </Card>
    </Link>
  );
} 