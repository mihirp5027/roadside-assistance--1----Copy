"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Wrench, Clock, CheckCircle, MapPin, Phone, User } from "lucide-react";

interface ServiceRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    mobileNumber: string;
  };
  vehicleId: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
  workerId?: {
    _id: string;
    name: string;
    mobileNumber: string;
    specialization: string;
  };
  mechanicId: {
    _id: string;
    name: string;
    mobileNumber: string;
  };
  serviceType: string;
  description: string;
  location: {
    type: string;
    coordinates: number[];
    address: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Worker {
  _id: string;
  name: string;
  mobileNumber: string;
  specialization: string;
  status: string;
}

export default function WorkerDashboard() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [workerProfile, setWorkerProfile] = useState<Worker | null>(null);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to view your requests",
          variant: "destructive",
        });
        return;
      }

      // Get worker info from localStorage
      const workerInfo = localStorage.getItem("workerInfo");
      if (!workerInfo) {
        toast({
          title: "Error",
          description: "Worker information not found",
          variant: "destructive",
        });
        return;
      }

      const { _id: workerId, mobileNumber } = JSON.parse(workerInfo);
      console.log('Fetching worker requests with:', { workerId, mobileNumber });

      const response = await fetch(
        `http://localhost:5000/api/mechanicRequests/worker?workerId=${workerId}&mobileNumber=${mobileNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      console.log('Received requests:', data);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkerProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to view your profile",
          variant: "destructive",
        });
        return;
      }

      // Get worker info from session storage
      const userSession = localStorage.getItem("userSession");
      if (!userSession) {
        toast({
          title: "Error",
          description: "Session information not found",
          variant: "destructive",
        });
        return;
      }

      const parsedSession = JSON.parse(userSession);
      const mobileNumber = parsedSession.user?.mobileNumber;

      if (!mobileNumber) {
        toast({
          title: "Error",
          description: "Mobile number not found in session",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetching worker profile with mobile:', mobileNumber);

      // Fetch worker profile using mobile number
      const response = await fetch(`http://localhost:5000/api/workers?mobileNumber=${mobileNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error("Failed to fetch worker profile");
      }

      const data = await response.json();
      console.log('Worker profile response:', data);
      
      // Since the API returns an array, find the worker with matching mobile number
      const workerData = Array.isArray(data) ? data.find(w => w.mobileNumber === mobileNumber) : null;
      
      if (!workerData) {
        throw new Error("Worker profile not found");
      }

      console.log('Found worker profile:', workerData);

      // Store the worker info in localStorage
      localStorage.setItem("workerInfo", JSON.stringify(workerData));
      setWorkerProfile(workerData);

      // After getting worker profile, fetch their requests
      await fetchRequests();
    } catch (error) {
      console.error("Error fetching worker profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch worker profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to only call fetchWorkerProfile
  useEffect(() => {
    fetchWorkerProfile();
  }, []);

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to update request status",
          variant: "destructive",
        });
        return;
      }

      // Get worker info for verification
      const workerInfo = localStorage.getItem("workerInfo");
      if (!workerInfo) {
        toast({
          title: "Error",
          description: "Worker information not found",
          variant: "destructive",
        });
        return;
      }

      const { _id: workerId, mobileNumber } = JSON.parse(workerInfo);

      console.log('Updating request status:', { requestId, newStatus, workerId });
      const response = await fetch(
        `http://localhost:5000/api/workers/requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: newStatus,
            workerId,
            mobileNumber
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error("Failed to update request status");
      }

      const data = await response.json();
      console.log('Status update response:', data);

      await fetchRequests(); // Refresh the requests list
      toast({
        title: "Success",
        description: `Request status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      {/* Worker Profile Section */}
      <div className="mb-6">
        <Card className="w-full md:w-auto md:absolute md:top-4 md:right-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Worker Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {workerProfile ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{workerProfile.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{workerProfile.mobileNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{workerProfile.specialization}</p>
                </div>
                <Badge 
                  variant={
                    workerProfile.status === "active" 
                      ? "default" 
                      : workerProfile.status === "in_working" 
                      ? "secondary" 
                      : "destructive"
                  }
                >
                  {workerProfile.status}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Service Requests</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === "Assigned").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "InProgress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request._id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{request.serviceType}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{request.location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>Customer: {request.userId.name} ({request.userId.mobileNumber})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4" />
                  <span>Vehicle: {request.vehicleId.make} {request.vehicleId.model} ({request.vehicleId.licensePlate})</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                {request.status === "Assigned" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus(request._id, "InProgress")
                    }
                  >
                    Start Service
                  </Button>
                )}
                {request.status === "InProgress" && (
                  <Button
                    onClick={() => handleUpdateStatus(request._id, "Completed")}
                  >
                    Complete Service
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>No service requests assigned</p>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
} 