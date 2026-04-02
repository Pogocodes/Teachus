import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { InstructorWithUser, insertBookingSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function Booking() {
  const [match, params] = useRoute("/booking/:instructorId");
  const instructorId = params?.instructorId ? parseInt(params.instructorId) : null;
  const { toast } = useToast();
  const { user } = useAuth();

  const [sessionType, setSessionType] = useState<"online" | "offline">("online");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState("");

  const { data: instructor, isLoading } = useQuery<InstructorWithUser>({
    queryKey: ["/api/instructors", instructorId],
    enabled: !!instructorId,
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed!",
        description: "Your session has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: availabilityData } = useQuery<{ availableSlots: string[] }>({
    queryKey: ["/api/instructors", instructorId, "availability", selectedDate],
    enabled: !!instructorId && !!selectedDate,
    queryFn: async () => {
      const res = await fetch(`/api/instructors/${instructorId}/availability?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    }
  });
  
  const availableSlots = availabilityData?.availableSlots || [];

  const handleBooking = () => {
    if (!instructor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (sessionType === "offline" && !location) {
      toast({
        title: "Missing information",
        description: "Please provide a location for your in-person session.",
        variant: "destructive",
      });
      return;
    }

    const sessionDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const hourlyRate = parseFloat(instructor.hourlyRate);
    const totalPrice = hourlyRate * duration;

    const bookingData = {
      studentId: user?.id || 5, // Fallback to mock ID if not authenticated (should be prevented by protected route)
      instructorId: instructor.id,
      sessionType,
      sessionDate: sessionDateTime.getTime(), // Convert to timestamp (number)
      duration,
      totalPrice: totalPrice.toString(),
      notes,
      ...(sessionType === "offline" ? {
        location,
        locationDetails
      } : {})
    };

    try {
      const validatedData = insertBookingSchema.parse(bookingData);
      bookingMutation.mutate(validatedData);
    } catch (error: any) {
      toast({
        title: "Validation error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-600">Loading booking information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Instructor Not Found</h1>
            <p className="text-slate-600">Unable to load booking information.</p>
          </div>
        </div>
      </div>
    );
  }

  const hourlyRate = parseFloat(instructor.hourlyRate);
  const totalPrice = hourlyRate * duration;

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Book Your Learning Session</h1>
          <p className="text-xl text-slate-600">Choose your preferred time and learning format</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Booking Form */}
            <div className="p-8">
              <div className="flex items-center mb-6">
                <img
                  src={instructor.user.avatar || "https://placehold.co/60x60"}
                  alt={instructor.user.fullName}
                  className="w-15 h-15 rounded-full mr-4 object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{instructor.title} Session</h3>
                  <p className="text-slate-600">with {instructor.user.fullName}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-sm"></i>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">
                      {instructor.rating} ({instructor.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Session Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Session Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${sessionType === "online"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                      }`}>
                      <input
                        type="radio"
                        name="sessionType"
                        value="online"
                        checked={sessionType === "online"}
                        onChange={(e) => setSessionType(e.target.value as "online")}
                        className="mr-3"
                      />
                      <div>
                        <div className={`font-medium ${sessionType === "online" ? "text-primary" : "text-slate-800"}`}>
                          Online
                        </div>
                        <div className="text-sm text-slate-600">Video call</div>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${sessionType === "offline"
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                      }`}>
                      <input
                        type="radio"
                        name="sessionType"
                        value="offline"
                        checked={sessionType === "offline"}
                        onChange={(e) => setSessionType(e.target.value as "offline")}
                        className="mr-3"
                      />
                      <div>
                        <div className={`font-medium ${sessionType === "offline" ? "text-primary" : "text-slate-800"}`}>
                          In-Person
                        </div>
                        <div className="text-sm text-slate-600">Local meetup</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Offline Custom Fields */}
                {sessionType === "offline" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Session Location <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="e.g., Downtown Library, 1st Floor Cafe, or full address..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">Location Details (Optional)</label>
                      <Textarea
                        placeholder="Any additional details to help the instructor find you..."
                        value={locationDetails}
                        onChange={(e) => setLocationDetails(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Select Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    className="w-full"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Available Time Slots</label>
                  {!selectedDate ? (
                    <p className="text-sm text-slate-500">Please select a date first</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-slate-500">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 border-2 rounded-lg font-medium transition-colors ${selectedTime === slot
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Session Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value))}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value={0.5}>30 minutes - ₹{(hourlyRate * 0.5).toFixed(0)}</option>
                    <option value={1}>1 hour - ₹{hourlyRate}</option>
                    <option value={1.5}>1.5 hours - ₹{(hourlyRate * 1.5).toFixed(0)}</option>
                    <option value={2}>2 hours - ₹{(hourlyRate * 2).toFixed(0)}</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Tell the instructor what you'd like to focus on..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-slate-50 p-8">
              <h4 className="text-lg font-bold text-slate-800 mb-6">Booking Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Instructor:</span>
                  <span className="font-medium text-slate-800">{instructor.user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Session Type:</span>
                  <span className="font-medium text-slate-800 capitalize">{sessionType}</span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-medium text-slate-800">{selectedTime}</span>
                  </div>
                )}
                {sessionType === "offline" && location && (
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <span className="text-slate-600">Location:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%] truncate" title={location}>{location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Duration:</span>
                  <span className="font-medium text-slate-800">
                    {duration === 0.5 ? "30 minutes" : `${duration} hour${duration > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-800">Total:</span>
                    <span className="text-slate-800">₹{totalPrice.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h5 className="font-semibold text-slate-800 mb-4">What's Included:</h5>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <i className="fas fa-check text-secondary mr-2"></i>
                    1-on-1 personalized session
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-secondary mr-2"></i>
                    Learning materials provided
                  </li>
                  {sessionType === "online" && (
                    <li className="flex items-center">
                      <i className="fas fa-check text-secondary mr-2"></i>
                      Session recording
                    </li>
                  )}
                  <li className="flex items-center">
                    <i className="fas fa-check text-secondary mr-2"></i>
                    Follow-up notes and feedback
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime || bookingMutation.isPending}
                className="w-full mt-8 py-4 text-lg font-semibold"
                size="lg"
              >
                {bookingMutation.isPending ? "Booking..." : "Book Session"}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-4">
                Free cancellation up to 24 hours before the session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
