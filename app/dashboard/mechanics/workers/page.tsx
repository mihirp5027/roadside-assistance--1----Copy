"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, UserPlus } from "lucide-react";

interface Worker {
  _id: string;
  name: string;
  mobileNumber: string;
  specialization: string;
  status: "active" | "inactive" | "in_working";
}

export default function WorkersPage() {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    mobileNumber: "",
    specialization: "",
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/workers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workers");
      }

      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch workers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorker = async () => {
    try {
      setIsAddingWorker(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newWorker),
      });

      if (!response.ok) {
        throw new Error("Failed to add worker");
      }

      await fetchWorkers();
      setNewWorker({ name: "", mobileNumber: "", specialization: "" });
      toast({
        title: "Success",
        description: "Worker added successfully",
      });
    } catch (error) {
      console.error("Error adding worker:", error);
      toast({
        title: "Error",
        description: "Failed to add worker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingWorker(false);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/workers/${workerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete worker");
      }

      await fetchWorkers();
      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast({
        title: "Error",
        description: "Failed to delete worker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (workerId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/workers/${workerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update worker status");
      }

      await fetchWorkers();
      toast({
        title: "Success",
        description: "Worker status updated successfully",
      });
    } catch (error) {
      console.error("Error updating worker status:", error);
      toast({
        title: "Error",
        description: "Failed to update worker status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workers Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newWorker.name}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  value={newWorker.mobileNumber}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, mobileNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={newWorker.specialization}
                  onChange={(e) =>
                    setNewWorker({
                      ...newWorker,
                      specialization: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddWorker}
                disabled={isAddingWorker}
              >
                {isAddingWorker ? "Adding..." : "Add Worker"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => (
          <Card key={worker._id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{worker.name}</span>
                <Badge
                  variant={
                    worker.status === "active"
                      ? "default"
                      : worker.status === "in_working"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {worker.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Mobile:</span>{" "}
                  {worker.mobileNumber}
                </p>
                <p>
                  <span className="font-medium">Specialization:</span>{" "}
                  {worker.specialization}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Select
                    value={worker.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(worker._id, value)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="in_working">In Working</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteWorker(worker._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 