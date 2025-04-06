"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Check, X, AlertTriangle, Droplet, Wrench, Stethoscope, Truck, Phone, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ServiceRequest {
  id: string;
  type: 'fuel' | 'mechanic' | 'medical' | 'towing';
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  message: string;
  timestamp: string;
  location: string;
  provider?: {
    name: string;
    contact: string;
  };
  details?: {
    fuelType?: string;
    quantity?: number;
    symptoms?: string;
    issue?: string;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/service-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch service requests');
        }
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching service requests:', error);
        setError('Failed to load service requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: ServiceRequest['status']) => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      // You might want to show an error toast here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <Droplet className="w-5 h-5" />;
      case 'mechanic':
        return <Wrench className="w-5 h-5" />;
      case 'medical':
        return <Stethoscope className="w-5 h-5" />;
      case 'towing':
        return <Truck className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-900 dark:text-white">{error}</p>
          <Button
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Requests</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No service requests found</p>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {requests.map((request) => (
                  <ServiceRequestCard
                    key={request.id}
                    request={request}
                    getStatusColor={getStatusColor}
                    getServiceIcon={getServiceIcon}
                    getStatusIcon={getStatusIcon}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {requests
                  .filter((request) => request.status === 'pending')
                  .map((request) => (
                    <ServiceRequestCard
                      key={request.id}
                      request={request}
                      getStatusColor={getStatusColor}
                      getServiceIcon={getServiceIcon}
                      getStatusIcon={getStatusIcon}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="accepted" className="mt-6">
              <div className="space-y-4">
                {requests
                  .filter((request) => request.status === 'accepted')
                  .map((request) => (
                    <ServiceRequestCard
                      key={request.id}
                      request={request}
                      getStatusColor={getStatusColor}
                      getServiceIcon={getServiceIcon}
                      getStatusIcon={getStatusIcon}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="mt-6">
              <div className="space-y-4">
                {requests
                  .filter((request) => request.status === 'in-progress')
                  .map((request) => (
                    <ServiceRequestCard
                      key={request.id}
                      request={request}
                      getStatusColor={getStatusColor}
                      getServiceIcon={getServiceIcon}
                      getStatusIcon={getStatusIcon}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {requests
                  .filter((request) => request.status === 'completed')
                  .map((request) => (
                    <ServiceRequestCard
                      key={request.id}
                      request={request}
                      getStatusColor={getStatusColor}
                      getServiceIcon={getServiceIcon}
                      getStatusIcon={getStatusIcon}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function ServiceRequestCard({
  request,
  getStatusColor,
  getServiceIcon,
  getStatusIcon,
  onStatusUpdate,
}: {
  request: ServiceRequest;
  getStatusColor: (status: string) => string;
  getServiceIcon: (type: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
  onStatusUpdate: (id: string, status: ServiceRequest['status']) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {getServiceIcon(request.type)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Service Request
              </h3>
              <Badge
                variant="secondary"
                className={`${getStatusColor(request.status)} text-white`}
              >
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {request.message}
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1" />
              {request.location}
            </div>
            {request.details && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {request.details.fuelType && (
                  <p>Fuel Type: {request.details.fuelType}</p>
                )}
                {request.details.quantity && (
                  <p>Quantity: {request.details.quantity}L</p>
                )}
                {request.details.symptoms && (
                  <p>Symptoms: {request.details.symptoms}</p>
                )}
                {request.details.issue && (
                  <p>Issue: {request.details.issue}</p>
                )}
              </div>
            )}
            {request.provider && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Provider: {request.provider.name}</p>
                <p>Contact: {request.provider.contact}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {getStatusIcon(request.status)}
            <span className="ml-1">{request.timestamp}</span>
          </div>
          {request.provider && (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="h-8">
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
              <Button size="sm" variant="outline" className="h-8">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
            </div>
          )}
          {request.status === 'pending' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                className="h-8"
                onClick={() => onStatusUpdate(request.id, 'accepted')}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => onStatusUpdate(request.id, 'cancelled')}
              >
                Reject
              </Button>
            </div>
          )}
          {request.status === 'accepted' && (
            <Button
              size="sm"
              className="h-8"
              onClick={() => onStatusUpdate(request.id, 'in-progress')}
            >
              Start Service
            </Button>
          )}
          {request.status === 'in-progress' && (
            <Button
              size="sm"
              className="h-8"
              onClick={() => onStatusUpdate(request.id, 'completed')}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

