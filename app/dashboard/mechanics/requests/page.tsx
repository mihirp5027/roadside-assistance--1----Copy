"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Wrench } from "lucide-react";

interface ServiceRequest {
  _id: string;
  userId: {
    name: string;
    mobileNumber: string;
  };
  vehicleId: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
  serviceType: string;
  description: string;
  location: {
    address: string;
  };
  status: string;
  createdAt: string;
}

export default function MechanicRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to view requests",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetching mechanic service requests...');
      const response = await fetch(
        "http://localhost:5000/api/mechanic/service-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to fetch requests: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Received service requests:', data);
      
      // If data is an array, use it directly; if it's an object with requests property, use that
      const requestsData = Array.isArray(data) ? data : data.requests || [];
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      console.log('Updating request status:', { requestId, newStatus });
      const response = await fetch(
        `http://localhost:5000/api/mechanic/service-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(
          `Failed to update status: ${response.status} ${response.statusText}`
        );
      }

      await fetchRequests(); // Refresh the list
      toast({
        title: "Success",
        description: `Request status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <Button onClick={fetchRequests}>Refresh</Button>
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
                <Badge>{request.status}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{request.location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>
                    {request.userId.name} ({request.userId.mobileNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4" />
                  <span>
                    {request.vehicleId.make} {request.vehicleId.model} (
                    {request.vehicleId.licensePlate})
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {request.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(request._id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(request._id, "rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No service requests found</p>
          </div>
        )}
      </div>
    </div>
  );
} 