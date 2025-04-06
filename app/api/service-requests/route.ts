import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceRequest from '@/models/ServiceRequest';

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all service requests and populate related fields
    const requests = await ServiceRequest.find()
      .populate('user', 'name profilePhoto')
      .populate('provider', 'name contactNumber')
      .sort({ createdAt: -1 });

    // Format the response
    const formattedRequests = requests.map(request => ({
      id: request._id.toString(),
      type: request.serviceType,
      status: request.status,
      message: request.description,
      timestamp: formatTimestamp(request.createdAt),
      location: request.location.address,
      provider: request.provider ? {
        name: request.provider.name,
        contact: request.provider.contactNumber
      } : undefined,
      details: {
        ...(request.fuelType && { fuelType: request.fuelType }),
        ...(request.quantity && { quantity: request.quantity }),
        ...(request.symptoms && { symptoms: request.symptoms }),
        ...(request.issue && { issue: request.issue })
      }
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
} 