import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: 'mechanic' | 'fuel' | 'medical' | 'towing';
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  message: string;
  timestamp: string;
  user: {
    name: string;
    location: string;
  };
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'mechanic',
      status: 'pending',
      message: 'Request for roadside mechanic assistance',
      timestamp: '2 minutes ago',
      user: {
        name: 'John Doe',
        location: '123 Main St, City'
      }
    },
    {
      id: '2',
      type: 'fuel',
      status: 'pending',
      message: 'Request for fuel delivery',
      timestamp: '5 minutes ago',
      user: {
        name: 'Jane Smith',
        location: '456 Oak Ave, Town'
      }
    },
    {
      id: '3',
      type: 'medical',
      status: 'accepted',
      message: 'Medical assistance request',
      timestamp: '10 minutes ago',
      user: {
        name: 'Mike Johnson',
        location: '789 Pine Rd, Village'
      }
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mechanic':
        return '🔧';
      case 'fuel':
        return '⛽';
      case 'medical':
        return '🏥';
      case 'towing':
        return '🚛';
      default:
        return '📢';
    }
  };

  const handleAccept = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, status: 'accepted' }
          : notification
      )
    );
  };

  const handleReject = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, status: 'rejected' }
          : notification
      )
    );
  };

  const handleComplete = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, status: 'completed' }
          : notification
      )
    );
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Service Requests
        </h2>
        <Badge variant="secondary" className="px-2 py-1">
          {notifications.filter(n => n.status === 'pending').length} New
        </Badge>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{notification.message}</p>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(notification.status)} text-white`}
                    >
                      {notification.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.user.name} • {notification.user.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            </div>

            {notification.status === 'pending' && (
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAccept(notification.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(notification.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {notification.status === 'accepted' && (
              <div className="flex space-x-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleComplete(notification.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark as Completed
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 