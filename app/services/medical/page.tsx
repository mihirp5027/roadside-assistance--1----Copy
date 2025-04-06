"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { ArrowLeft, Phone, Ambulance, Heart, AlertTriangle, MapPin, Clock, Info, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface FormData {
  assistanceType: string;
  description: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
}

interface Solution {
  advice: string;
  recommendations: string[];
  urgencyLevel: string;
  nextSteps: string[];
}

// Mock solutions for different assistance types
const mockSolutions: Record<string, Solution> = {
  "medical-advice": {
    advice: "Based on your situation, here's my general medical advice.",
    recommendations: [
      "Schedule a consultation with a general physician",
      "Keep track of your symptoms",
      "Take prescribed medications as directed",
      "Rest and maintain good hydration"
    ],
    urgencyLevel: "Low",
    nextSteps: [
      "Book an appointment with your regular doctor",
      "Monitor symptoms for any changes",
      "Follow up if symptoms persist or worsen"
    ]
  },
  "minor-injury": {
    advice: "For minor injuries, immediate first aid and proper care can prevent complications.",
    recommendations: [
      "Clean and disinfect any wounds",
      "Apply appropriate first aid treatment",
      "Use ice or cold compress to reduce swelling",
      "Keep the injured area elevated if possible"
    ],
    urgencyLevel: "Low",
    nextSteps: [
      "Monitor the injury for next 24-48 hours",
      "Watch for signs of infection (increased pain, redness, swelling)",
      "Visit a clinic if healing doesn't progress"
    ]
  },
  "urgent-care": {
    advice: "Your condition requires prompt medical attention but may not be life-threatening.",
    recommendations: [
      "Visit the nearest urgent care center",
      "Bring a list of current medications",
      "Document your symptoms and their timeline",
      "Have someone accompany you if possible"
    ],
    urgencyLevel: "Medium",
    nextSteps: [
      "Proceed to urgent care within next 2-3 hours",
      "Follow prescribed treatment plan strictly",
      "Schedule follow-up with primary care physician"
    ]
  },
  "emergency": {
    advice: "This is a serious medical situation requiring immediate emergency care.",
    recommendations: [
      "Call emergency services (108) immediately",
      "Stay calm and follow emergency dispatcher instructions",
      "Gather essential medical documents if possible",
      "Have someone accompany you to the hospital"
    ],
    urgencyLevel: "High",
    nextSteps: [
      "Go to nearest emergency room immediately",
      "Do not drive yourself if condition is severe",
      "Inform close family members or emergency contacts"
    ]
  }
}

export default function MedicalAssistancePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [solution, setSolution] = useState<Solution | null>(null)
  const [formData, setFormData] = useState<FormData>({
    assistanceType: "medical-advice",
    description: "",
    location: {
      address: "",
      coordinates: { lat: 0, lng: 0 }
    }
  })
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")

  const handleEmergencyCall = () => {
    window.location.href = "tel:108"
  }

  const handleUpdateLocation = async () => {
    setIsLoadingLocation(true)
    setLocationError("")

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords
      
      setFormData(prev => ({
        ...prev,
        location: {
          address: "Current Location",
          coordinates: { lat: latitude, lng: longitude }
        }
      }))

    } catch (error: any) {
      console.error("Error getting location:", error)
      setLocationError(
        error.code === 1 ? "Please enable location access in your browser settings" :
        error.code === 2 ? "Unable to determine your location" :
        error.code === 3 ? "Location request timed out" :
        "Failed to get your location"
      )
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error("Please describe your medical situation")
      return
    }

    setIsSubmitting(true)
    setSolution(null)

    try {
      // Get the appropriate mock solution based on assistance type
      const medicalSolution = mockSolutions[formData.assistanceType]
      
      // Customize the solution based on the description
      const customizedSolution = {
        ...medicalSolution,
        advice: `${medicalSolution.advice}\nBased on your description: "${formData.description}"`
      }

      setSolution(customizedSolution)
      toast.success("Analysis complete")
      
      // If emergency type is selected, suggest calling emergency services
      if (formData.assistanceType === "emergency") {
        toast.error("This appears to be an emergency situation. Please consider calling 108 immediately.", {
          duration: 10000 // Show for 10 seconds
        })
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error("Failed to analyze your situation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssistanceRequest = (type: string) => {
    // In a real app, this would trigger the appropriate assistance request
    console.log(`Requesting ${type} assistance`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800/95 border-b dark:border-gray-700/50 shadow-sm">
        <div className="container flex items-center h-16 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white">Medical Assistance</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container px-4 py-6">
          {/* Emergency Notice */}
          <Card className="mb-6 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/30">
            <div className="p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">Emergency Warning</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    If you are experiencing a life-threatening emergency, please call 108 immediately or use the
                    emergency button below.
                  </p>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    onClick={handleEmergencyCall}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call 108 Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="mb-6 dark:bg-gray-800/95 dark:border-gray-700/50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Your Location</h3>
              <div className="flex items-start mb-4">
                <MapPin className="w-5 h-5 mt-1 mr-3 text-primary dark:text-primary/90" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">Current Location</h4>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    {formData.location.address || "Location not set"}
                  </p>
                  {formData.location.coordinates.lat !== 0 && (
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      GPS Coordinates: {formData.location.coordinates.lat.toFixed(6)}° N, {formData.location.coordinates.lng.toFixed(6)}° W
                    </p>
                  )}
                  {locationError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {locationError}
                    </p>
                  )}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary dark:text-primary/90 text-sm mt-2"
                    onClick={handleUpdateLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      'Update Location'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Assistance Type */}
          <Card className="mb-6 dark:bg-gray-800/95 dark:border-gray-700/50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Type of Assistance Needed</h3>
              <RadioGroup 
                value={formData.assistanceType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assistanceType: value }))}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 border dark:border-gray-700/50 rounded-lg p-3">
                    <RadioGroupItem value="medical-advice" id="medical-advice" />
                    <Label htmlFor="medical-advice" className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Medical Advice</div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">Speak with a medical professional for advice</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border dark:border-gray-700/50 rounded-lg p-3">
                    <RadioGroupItem value="minor-injury" id="minor-injury" />
                    <Label htmlFor="minor-injury" className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Minor Injury</div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">First aid or minor medical attention needed</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border dark:border-amber-800/50 rounded-lg p-3 border-amber-200 dark:bg-amber-900/30 bg-amber-50">
                    <RadioGroupItem value="urgent-care" id="urgent-care" />
                    <Label htmlFor="urgent-care" className="flex-1">
                      <div className="font-medium text-amber-800 dark:text-amber-200">Urgent Care Needed</div>
                      <div className="text-sm text-amber-700 dark:text-amber-300">Non-life threatening but requires prompt attention</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 border-red-200 bg-red-50">
                    <RadioGroupItem value="emergency" id="emergency" />
                    <Label htmlFor="emergency" className="flex-1">
                      <div className="font-medium text-red-800">Emergency</div>
                      <div className="text-sm text-red-700">Serious medical situation requiring immediate care</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </Card>

          {/* Description */}
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="font-medium mb-3">Describe the Situation</h3>
              <Textarea
                placeholder="Please describe the medical situation or symptoms in detail..."
                className="mb-3"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mb-3">
                This information will be shared with medical professionals to provide appropriate assistance.
              </p>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-4 h-4 mt-0.5 mr-2 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Be specific about symptoms, their duration, and any relevant medical history or allergies.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button 
            className="w-full mb-6" 
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing your situation...
              </>
            ) : (
              'Get Medical Assistance'
            )}
          </Button>

          {/* Solution Display */}
          {solution && (
            <Card className="mb-6 border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10">
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Medical Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Initial Advice</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{solution.advice}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {solution.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Urgency Level</h4>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                      solution.urgencyLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                      solution.urgencyLevel === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    }`}>
                      {solution.urgencyLevel}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Next Steps</h4>
                    <ul className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {solution.nextSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Assistance Options */}
          <h3 className="font-medium mb-3">Available Assistance Options</h3>
          <div className="grid gap-4 mb-6">
            <AssistanceCard
              icon={<Phone className="w-5 h-5 text-primary dark:text-primary/90" />}
              title="Telemedicine Consultation"
              description="Speak with a medical professional via video call"
              time="Available now • 5 min wait"
              buttonText="Start Consultation"
              onClick={() => handleAssistanceRequest("telemedicine")}
            />

            <AssistanceCard
              icon={<Ambulance className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              title="Mobile Medical Unit"
              description="Medical professional will come to your location"
              time="ETA: 30 minutes"
              buttonText="Request Unit"
              onClick={() => handleAssistanceRequest("mobile-unit")}
            />

            <AssistanceCard
              icon={<Heart className="w-5 h-5 text-red-600 dark:text-red-400" />}
              title="Emergency Transport"
              description="Transport to nearest hospital or urgent care"
              time="ETA: 15 minutes"
              buttonText="Request Transport"
              emergency
              onClick={() => handleAssistanceRequest("emergency-transport")}
            />
          </div>

          {/* Nearby Facilities */}
          <Card className="mb-6 dark:bg-gray-800/95 dark:border-gray-700/50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Nearby Medical Facilities</h3>

              <div className="space-y-3">
                <FacilityCard
                  name="City General Hospital"
                  type="Hospital"
                  distance="2.3 miles"
                  time="8 min drive"
                  open24h
                />

                <FacilityCard
                  name="Urgent Care Center"
                  type="Urgent Care"
                  distance="1.1 miles"
                  time="5 min drive"
                  hours="8:00 AM - 8:00 PM"
                />

                <FacilityCard
                  name="Community Medical Clinic"
                  type="Clinic"
                  distance="0.8 miles"
                  time="3 min drive"
                  hours="9:00 AM - 5:00 PM"
                />
              </div>

              <Button variant="outline" className="w-full mt-3 dark:border-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700/50">
                <MapPin className="w-4 h-4 mr-2" />
                View All Nearby Facilities
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

function AssistanceCard({
  icon,
  title,
  description,
  time,
  buttonText,
  emergency = false,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  buttonText: string
  emergency?: boolean
  onClick?: () => void
}) {
  return (
    <Card className={`overflow-hidden ${emergency ? "border-red-200 dark:border-red-800/50" : ""}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`p-2 mr-3 rounded-full ${emergency ? "bg-red-100 dark:bg-red-900/30" : "bg-primary/10 dark:bg-primary/20"}`}>{icon}</div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">{description}</p>
            <div className="flex items-center mb-3">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground dark:text-gray-400" />
              <span className="text-xs text-muted-foreground dark:text-gray-400">{time}</span>
            </div>
            <Button 
              className={emergency ? "w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800" : "w-full"}
              onClick={onClick}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function FacilityCard({
  name,
  type,
  distance,
  time,
  hours,
  open24h = false,
}: {
  name: string
  type: string
  distance: string
  time: string
  hours?: string
  open24h?: boolean
}) {
  return (
    <div className="p-3 rounded-lg border dark:border-gray-700/50">
      <div className="flex items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
          <div className="flex items-center mb-1">
            <span className="text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 rounded-full mr-2">{type}</span>
            <span className="text-xs text-muted-foreground dark:text-gray-400">{distance}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-muted-foreground dark:text-gray-400" />
            <span className="text-xs text-muted-foreground dark:text-gray-400 mr-2">{time}</span>
            {open24h ? (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Open 24/7</span>
            ) : (
              <span className="text-xs text-muted-foreground dark:text-gray-400">{hours}</span>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" className="dark:border-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700/50">
          Directions
        </Button>
      </div>
    </div>
  )
}

