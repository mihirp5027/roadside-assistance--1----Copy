"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCcw, Search, MapPin, Phone, Star, Wrench, Clock, CheckCircle, Filter, Download, MessageSquare, Navigation } from "lucide-react";
import { saveAs } from 'file-saver';

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
    contactNumber: string;
    specialization: string;
    rating: number;
  };
  serviceType: string;
  description: string;
  location: {
    type: string;
    coordinates: number[];
    address: string;
  };
  status: "Pending" | "Accepted" | "OnTheWay" | "InProgress" | "Completed" | "Cancelled" | "Rejected" | "Assigned";
  createdAt: string;
  updatedAt: string;
  estimatedPrice: number;
  actualPrice?: number;
}

type RequestStatus = ServiceRequest['status'];

interface Worker {
  _id: string;
  name: string;
  mobileNumber: string;
  specialization: string;
  status: "active" | "inactive" | "in_working";
}

interface Mechanic {
  _id: string;
  name: string;
  contactNumber: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  specialization: string;
  isActive: boolean;
  rating: number;
  totalRequests: number;
  activeRequests: number;
  completedServices: number;
}

export default function MechanicDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [showWorkerAssignment, setShowWorkerAssignment] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchWorkers();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch mechanic requests
      console.log('Fetching mechanic requests...');
      const requestsResponse = await fetch('http://localhost:5000/api/mechanic/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!requestsResponse.ok) {
        const errorText = await requestsResponse.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch requests');
      }

      const data = await requestsResponse.json();
      console.log('Received mechanic requests:', data);
      
      // Set the requests data
      const requestsData = Array.isArray(data) ? data : data.requests || [];
      setRequests(requestsData);
      
      // Calculate stats from the requests data
      const totalRequests = requestsData.length;
      const activeRequests = requestsData.filter((r: ServiceRequest) => 
        ["Pending", "Accepted", "OnTheWay", "InProgress"].includes(r.status)
      ).length;
      const completedServices = requestsData.filter((r: ServiceRequest) => r.status === "Completed").length;
      
      // Update stats
      const stats = {
        totalRequests,
        activeRequests,
        completedServices
      };
      
      setMechanic(prev => {
        if (!prev) {
          return {
            _id: '',
            name: '',
            contactNumber: '',
            address: '',
            location: {
              type: 'Point',
              coordinates: [0, 0]
            },
            specialization: '',
            isActive: true,
            rating: 0,
            ...stats
          };
        }
        return {
          ...prev,
          ...stats
        };
      });

    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching workers...');
      const response = await fetch('http://localhost:5000/api/workers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching workers:', errorText);
        throw new Error('Failed to fetch workers');
      }

      const data = await response.json();
      console.log('Received workers:', data);
      
      // Handle both array and object responses
      const workersData = Array.isArray(data) ? data : data.workers || [];
      setWorkers(workersData);
      
      console.log('Workers set to state:', workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return;
      }

      // Get mechanic info from localStorage
      const mechanicInfo = localStorage.getItem('mechanicInfo');
      if (!mechanicInfo) {
        toast({
          title: "Error",
          description: "Mechanic information not found. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      console.log('Updating request status:', { requestId, newStatus });

      // Use the correct endpoint for updating request status
      const response = await fetch(`http://localhost:5000/api/mechanicRequests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          mechanicId: JSON.parse(mechanicInfo)._id 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage;
        try {
          const jsonError = JSON.parse(errorText);
          errorMessage = jsonError.error || jsonError.message || 'Failed to update request status';
        } catch (e) {
          errorMessage = 'Failed to update request status';
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Status update response:', responseData);

      // Refresh the requests list
      await fetchRequests();
      
      // Close the details dialog if open
      setShowRequestDetails(false);
      
      toast({
        title: "Success",
        description: `Request ${newStatus === 'Cancelled' ? 'cancelled' : `status updated to ${newStatus}`}`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update request status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCompletedServices = () => {
    try {
      // Filter for completed services
      const completedServices = requests.filter(r => r.status === "Completed");
      
      if (completedServices.length === 0) {
        toast({
          title: "No Data",
          description: "There are no completed services to export.",
          variant: "destructive",
        });
        return;
      }
      
      // Format the data for CSV
      const headers = [
        "Customer Name", 
        "Contact", 
        "Vehicle", 
        "Service Type", 
        "Location", 
        "Requested Date", 
        "Completed Date"
      ].join(",");
      
      const csvRows = completedServices.map(service => {
        const row = [
          service.userId?.name || 'Unknown',
          service.userId?.mobileNumber || 'No contact',
          `${service.vehicleId?.make || ''} ${service.vehicleId?.model || ''} (${service.vehicleId?.licensePlate || ''})`,
          service.serviceType || 'General Service',
          service.location?.address || 'No location data',
          new Date(service.createdAt).toLocaleString(),
          new Date(service.updatedAt).toLocaleString()
        ];
        
        // Escape any commas in the data
        return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...csvRows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const fileName = `mechanic-completed-services-${new Date().toISOString().slice(0,10)}.csv`;
      saveAs(blob, fileName);
      
      toast({
        title: "Export Successful",
        description: `${completedServices.length} completed services exported to CSV.`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignWorker = async (requestId: string, workerId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get mechanic info from localStorage
      const mechanicInfo = localStorage.getItem('mechanicInfo');
      if (!mechanicInfo) {
        throw new Error('Mechanic information not found');
      }
      const { _id: mechanicId, contactNumber } = JSON.parse(mechanicInfo);

      console.log('Assigning worker:', { requestId, workerId, mechanicId, contactNumber });

      // First update the request status to Accepted
      const statusResponse = await fetch(
        `http://localhost:5000/api/mechanic/requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: 'Accepted'
          }),
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Status update error:', errorText);
        throw new Error('Failed to update request status');
      }

      // Then assign the worker with mechanic details
      const assignResponse = await fetch(
        `http://localhost:5000/api/mechanic/requests/${requestId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            workerId: workerId,
            mechanicId: mechanicId,
            mechanicContact: contactNumber
          }),
        }
      );

      if (!assignResponse.ok) {
        const errorText = await assignResponse.text();
        console.error('Assignment error:', errorText);
        let errorMessage = 'Failed to assign worker';
        
        try {
          if (errorText.startsWith('{')) {
            const jsonError = JSON.parse(errorText);
            errorMessage = jsonError.message || jsonError.error || errorMessage;
          } else if (errorText.includes('<!DOCTYPE html>')) {
            errorMessage = 'Server error while assigning worker. Please try again.';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(errorMessage);
      }

      const data = await assignResponse.json();
      console.log('Worker assigned successfully:', data);
      
      // Update the worker's status to in_working
      const workerStatusResponse = await fetch(
        `http://localhost:5000/api/workers/${workerId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'in_working',
            currentRequestId: requestId,
            mechanicId: mechanicId
          }),
        }
      );

      if (!workerStatusResponse.ok) {
        console.warn('Failed to update worker status, but worker was assigned');
      }
      
      await fetchRequests(); // Refresh the requests list
      await fetchWorkers(); // Refresh the workers list to update statuses
      setShowWorkerAssignment(false);
      setShowRequestDetails(false); // Close both dialogs
      
      toast({
        title: "Success",
        description: "Worker assigned successfully to the request",
      });
    } catch (error) {
      console.error('Error assigning worker:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign worker",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect to get mechanic info when component mounts
  useEffect(() => {
    const getMechanicInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Error",
            description: "Authentication token not found",
            variant: "destructive",
          });
          return;
        }

        console.log('Fetching mechanic profile...');
        const response = await fetch('http://localhost:5000/api/mechanic/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error fetching mechanic profile:', errorText);
          throw new Error('Failed to fetch mechanic profile');
        }

        const data = await response.json();
        console.log('Received mechanic profile:', data);

        // Store mechanic info in localStorage
        localStorage.setItem('mechanicInfo', JSON.stringify({
          _id: data._id,
          name: data.name,
          contactNumber: data.contactNumber,
          specialization: data.specialization
        }));

        // Set mechanic state
        setMechanic(data);
      } catch (error) {
        console.error('Error in getMechanicInfo:', error);
        toast({
          title: "Error",
          description: "Failed to fetch mechanic profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    getMechanicInfo();
    fetchRequests();
    fetchWorkers();
  }, []);

  // Update the canAssignWorker function to check for Accepted status
  const canAssignWorker = (request: ServiceRequest) => {
    return request.status === "Accepted" && !request.workerId;
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      (request.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.vehicleId?.licensePlate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    
    if (activeTab === "active") {
      matchesStatus = ["Pending", "Accepted", "OnTheWay", "InProgress"].includes(request.status);
    } else if (activeTab === "completed") {
      matchesStatus = request.status === "Completed";
    }

    if (statusFilter !== "all") {
      matchesStatus = matchesStatus && request.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "completed":
        return "outline";
      case "rejected":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const RequestCard = ({ request }: { request: ServiceRequest }) => (
    <Card key={request._id} className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{request.mechanicId.name}</h3>
          <p className="text-sm text-muted-foreground">
            {request.serviceType} - {request.vehicleId.make} {request.vehicleId.model}
          </p>
        </div>
        <Badge variant={
          request.status === "Completed" ? "outline" :
          request.status === "Pending" ? "secondary" :
          request.status === "Accepted" ? "default" :
          request.status === "OnTheWay" ? "default" :
          request.status === "InProgress" ? "default" :
          "destructive"
        }>
          {request.status === "OnTheWay" ? "On The Way" : request.status}
        </Badge>
      </div>
      <div className="mt-2">
        <p className="text-sm">
          <MapPin className="inline-block h-4 w-4 mr-1" />
          {request.location.address}
        </p>
        <p className="text-sm">
          <Clock className="inline-block h-4 w-4 mr-1" />
          {new Date(request.createdAt).toLocaleString()}
        </p>
        {request.actualPrice && (
          <p className="text-sm font-medium mt-1">
            Final Price: ${request.actualPrice}
          </p>
        )}
      </div>
      {(request.status === "Pending" || request.status === "Accepted" || request.status === "OnTheWay" || request.status === "InProgress") && (
        <div className="mt-4 flex gap-2 justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to cancel this request?")) {
                handleUpdateRequestStatus(request._id, "Cancelled");
              }
            }}
          >
            Cancel Request
          </Button>
        </div>
      )}
      {request.status === "Accepted" && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <MessageSquare className="inline-block h-4 w-4 mr-1" />
            Mechanic has accepted your request and will be on their way soon.
          </p>
        </div>
      )}
      {request.status === "OnTheWay" && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            <Navigation className="inline-block h-4 w-4 mr-1" />
            Mechanic is on the way to your location.
          </p>
        </div>
      )}
    </Card>
  );

  if (isLoading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Error loading requests</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
            </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Service Requests</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCompletedServices}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Completed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-start space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
            <div className="text-3xl font-bold mt-1">
              {mechanic?.totalRequests || requests.length || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">All time service requests</p>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="flex justify-end">
              <div className="bg-gray-100 p-2 rounded-full">
                <Wrench className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-start space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-gray-600">Active Requests</CardTitle>
            <div className="text-3xl font-bold mt-1">
              {mechanic?.activeRequests || 
                requests.filter(r => ["Pending", "Accepted", "OnTheWay", "InProgress"].includes(r.status)).length || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Currently active services</p>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="flex justify-end">
              <div className="bg-gray-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-start space-y-0 pb-0">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Services</CardTitle>
            <div className="text-3xl font-bold mt-1">
              {mechanic?.completedServices || 
                requests.filter(r => r.status === "Completed").length || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Successfully completed services</p>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="flex justify-end">
              <div className="bg-gray-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-between border-b pb-2 mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-2 font-medium rounded-md mr-2 ${
              activeTab === "active"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Active Services
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-2 font-medium rounded-md ${
              activeTab === "completed"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed Services
          </button>
        </div>
      </div>

      {/* Section Title and Filters */}
      <div className="flex justify-between items-center mt-6 mb-4">
        <div>
          <h3 className="text-xl font-bold">
            {activeTab === "active" ? "Active Services" : "Completed Services"}
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === "active" 
              ? "Currently ongoing service requests" 
              : "Successfully completed service requests"}
          </p>
        </div>
        {activeTab === "completed" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCompletedServices}
            className="mr-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="ontheway">On The Way</SelectItem>
              <SelectItem value="inprogress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Service Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard key={request._id} request={request} />
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>No service requests found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              View and manage service request details
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Customer Information</h4>
                <p className="text-sm">Name: {selectedRequest.userId?.name || ''}</p>
                <p className="text-sm">Contact: {selectedRequest.userId?.mobileNumber || ''}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Vehicle Information</h4>
                <p className="text-sm">Make: {selectedRequest.vehicleId?.make || ''}</p>
                <p className="text-sm">Model: {selectedRequest.vehicleId?.model || ''}</p>
                <p className="text-sm">Year: {selectedRequest.vehicleId?.year || ''}</p>
                <p className="text-sm">License Plate: {selectedRequest.vehicleId?.licensePlate || ''}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Service Details</h4>
                <p className="text-sm">Type: {selectedRequest.serviceType || ''}</p>
                <p className="text-sm">Description: {selectedRequest.description || ''}</p>
                <p className="text-sm">Status: {selectedRequest.status}</p>
                <p className="text-sm">Created: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Location</h4>
                <p className="text-sm">{selectedRequest.location.address}</p>
              </div>
              {selectedRequest.workerId && (
                <div>
                  <h4 className="font-medium mb-1">Assigned Worker</h4>
                  <p className="text-sm">Name: {selectedRequest.workerId.name}</p>
                  <p className="text-sm">Contact: {selectedRequest.workerId.mobileNumber}</p>
                  <p className="text-sm">Specialization: {selectedRequest.workerId.specialization}</p>
                </div>
              )}
              {canAssignWorker(selectedRequest) && (
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={() => setShowWorkerAssignment(true)}
                  >
                    Assign Worker
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Worker Assignment Dialog */}
      <Dialog open={showWorkerAssignment} onOpenChange={setShowWorkerAssignment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
            <DialogDescription>
              Select an available worker to assign to this service request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {workers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No workers available</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchWorkers} 
                  className="mt-2"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh Workers
                </Button>
              </div>
            ) : (
              workers
                .filter(worker => worker.status === "active") // Only show active workers
                .map(worker => (
                  <Card key={worker._id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{worker.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Wrench className="w-4 h-4 mr-1" />
                          {worker.specialization}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {worker.mobileNumber}
                        </p>
                        <Badge variant={worker.status === "active" ? "default" : "secondary"}>
                          {worker.status === "active" ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleAssignWorker(selectedRequest?._id || '', worker._id)}
                        disabled={isLoading || worker.status !== "active"}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2" />
                            Assigning...
                          </>
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 