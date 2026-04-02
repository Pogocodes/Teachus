import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CourseWithInstructor, BookingWithDetails, InstructorWithUser } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseCard from "@/components/course-card";

import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: instructor } = useQuery<InstructorWithUser>({
    queryKey: ["/api/instructors/user", user?.id],
    enabled: !!user?.id,
  });

  const instructorId = instructor?.id;

  const { data: courses = [] } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
    select: (data) => data.filter(course => course.instructor.id === instructorId),
    enabled: !!instructorId,
  });

  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/instructor", instructorId],
    enabled: !!instructorId,
    refetchInterval: 10000,
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(["/api/bookings/instructor", instructorId], (old: BookingWithDetails[]) => {
        return old.map(b => b.id === updatedBooking.id ? updatedBooking : b);
      });
      toast({ title: "Booking status updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    }
  });

  const pendingBookings = bookings.filter(booking => booking.status === "pending" || booking.status === "scheduled");
  const upcomingBookings = bookings.filter(booking => 
    booking.status === "accepted"
  );
  
  // Use all accepted bookings instead of just today's
  const activeBookings = upcomingBookings;

  const startSession = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await apiRequest("POST", "/api/sessions/start", { bookingId });
      return await res.json();
    },
    onSuccess: (session) => {
      toast({ title: "Live Session started! Connecting..." });
      setLocation(`/meeting/${session.id}`);
    },
    onError: (error) => {
      toast({ title: "Failed to start session", description: error.message, variant: "destructive" });
    }
  });

  const verifyOfflineSession = useMutation({
    mutationFn: async ({ id, otp }: { id: number; otp: string }) => {
      const res = await apiRequest("POST", `/api/bookings/${id}/verify-otp`, { otp });
      return await res.json();
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(["/api/bookings/instructor", instructorId], (old: BookingWithDetails[]) => {
        return (old || []).map(b => b.id === updatedBooking.id ? updatedBooking : b);
      });
      toast({ title: "Session Verified ✅", description: "You have verified the user's OTP. The offline session has officially started." });
    },
    onError: (error) => {
      toast({ title: "Verification Failed", description: error.message || "Invalid OTP", variant: "destructive" });
    }
  });

  const prevPendingRef = useRef(pendingBookings.length);
  useEffect(() => {
    if (pendingBookings.length > prevPendingRef.current) {
      toast({
        title: "New Booking Request! 🔔",
        description: `You have ${pendingBookings.length - prevPendingRef.current} new student request(s) waiting for approval.`,
      });
    }
    prevPendingRef.current = pendingBookings.length;
  }, [pendingBookings.length, toast]);

  const totalStudents = courses.reduce((sum, course) => sum + (course.totalStudents || 0), 0);
  const totalEarnings = bookings
    .filter(booking => booking.status === "completed" && booking.totalPrice)
    .reduce((sum, booking) => sum + parseFloat(booking.totalPrice || "0"), 0);

  const avgRating = courses.length > 0 
    ? courses.reduce((sum, course) => sum + parseFloat(course.rating || "0"), 0) / courses.length 
    : 0;

  if (!user) return null;
  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-primary/20 max-w-sm">
          <i className="fas fa-circle-notch fa-spin text-5xl text-indigo-600 mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Dashboard...</h2>
          <p className="text-slate-600">Please wait while we prepare your tutor space.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-800 rounded-2xl p-8 mb-8 border-4 border-indigo-400/30 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3"} 
                alt="Instructor Profile" 
                className="w-20 h-20 rounded-full mr-6 object-cover border-4 border-white/20" 
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome, {user.fullName.split(' ')[0]}!</h1>
                <p className="text-blue-200 text-lg">Ready to teach and inspire students today?</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold mb-1">{activeBookings.length}</p>
              <p className="text-blue-200">Active Sessions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-users text-primary text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{totalStudents}</p>
              <p className="text-sm text-slate-600">Total Students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-book text-secondary text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{courses.length}</p>
              <p className="text-sm text-slate-600">Active Courses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-star text-accent text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">{avgRating.toFixed(1)}</p>
              <p className="text-sm text-slate-600">Avg. Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-indian-rupee-sign text-green-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-1">₹{totalEarnings.toFixed(0)}</p>
              <p className="text-sm text-slate-600">Total Earnings</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            
        {pendingBookings.length > 0 && (
          <div className="mb-8 border-2 border-orange-200 rounded-xl overflow-hidden shadow-sm bg-white animate-in slide-in-from-top-4 duration-500">
            <div className="bg-orange-50 border-b border-orange-100 p-4 shrink-0 flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <i className="fas fa-bell text-orange-500 animate-pulse"></i>
                Incoming Booking Requests ({pendingBookings.length})
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-lg">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <img 
                      src={booking.student?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      alt={booking.student?.fullName || "Student"}
                      className="w-12 h-12 rounded-full mr-4 object-cover border" 
                    />
                    <div>
                      <h4 className="font-semibold text-slate-800">{booking.student?.fullName || "Student"}</h4>
                      <p className="text-sm text-slate-600">
                        {booking.course?.title || "1-on-1 Session"} • {booking.duration} hr(s)
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested for: {new Date(booking.sessionDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                      onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'accepted' })}
                      disabled={updateBookingStatus.isPending}
                    >
                      <i className="fas fa-check mr-2"></i> Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 flex-1 sm:flex-none"
                      onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'rejected' })}
                      disabled={updateBookingStatus.isPending}
                    >
                      <i className="fas fa-times mr-2"></i> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

            <Tabs defaultValue="schedule" className="w-full">

              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
              
              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Active Sessions</h3>
                    
                    {activeBookings.length > 0 ? (
                      <div className="space-y-4">
                        {activeBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="mr-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <i className={`fas ${booking.sessionType === "online" ? "fa-video" : "fa-map-marker-alt"} text-primary`}></i>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800 mb-1">
                                {booking.course?.title || "1-on-1 Session"}
                              </h4>
                              <p className="text-sm text-slate-600 mb-1">with {booking.student?.fullName || "Student"}</p>
                              <div className="flex items-center text-sm text-slate-600 mb-2">
                                <i className="fas fa-clock mr-1"></i>
                                <span>{new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="mx-2">•</span>
                                <span>{booking.duration} hour{booking.duration > 1 ? 's' : ''}</span>
                              </div>
                              {booking.sessionType === "offline" && (
                                <div className="text-sm bg-slate-100 p-2 rounded-md max-w-sm">
                                  <strong className="block text-slate-700 text-[10px] uppercase">Meetup Location:</strong>
                                  <span className="text-slate-600">{booking.location}</span>
                                  {booking.locationDetails && <span className="block text-xs text-slate-500">{booking.locationDetails}</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge className={booking.sessionType === "online" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}>
                                {booking.sessionType}
                              </Badge>

                              {booking.sessionType === "offline" ? (
                                !booking.isVerified ? (
                                  <Button 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 shadow shadow-green-200"
                                    disabled={verifyOfflineSession.isPending}
                                    onClick={() => {
                                      const otp = window.prompt("Enter the 6-digit OTP provided by the student:");
                                      if (otp) {
                                        verifyOfflineSession.mutate({ id: booking.id, otp });
                                      }
                                    }}
                                  >
                                    {verifyOfflineSession.isPending ? "Verifying..." : "Verify OTP"}
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1">
                                    <i className="fas fa-check-circle mr-1"></i> Verified
                                  </Badge>
                                )
                              ) : (
                                <Button 
                                  size="sm"
                                  disabled={startSession.isPending}
                                  onClick={() => {
                                    if (booking.sessionType === "online") {
                                      startSession.mutate(booking.id);
                                    }
                                  }}
                                >
                                  {startSession.isPending && booking.sessionType === "online" 
                                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Starting...</> 
                                    : "Start/Join Session"
                                  }
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <i className="fas fa-calendar-check text-4xl text-slate-400 mb-4"></i>
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">No sessions today</h4>
                        <p className="text-slate-600">Enjoy your free day or create some availability!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="courses" className="mt-6">
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <i className="fas fa-plus-circle text-4xl text-slate-400 mb-4"></i>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">Create your first course</h3>
                      <p className="text-slate-600 mb-6">Start sharing your knowledge with students worldwide</p>
                      <Button onClick={() => toast({ title: "Coming Soon! 🚧", description: "Course creation will be available in an upcoming update." })}>Create Course</Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="students" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-slate-600 mb-6">Manage your existing students below. (Pending requests appear at the top of your dashboard).</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Sessions</h3>
                
                {upcomingBookings.slice(0, 3).length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-800 text-sm">
                            {booking.course?.title || "1-on-1 Session"}
                          </h4>
                          <Badge className={booking.sessionType === "online" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}>
                            {booking.sessionType}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">with {booking.student?.fullName || "Student"}</p>
                        <div className="flex items-center text-sm text-slate-600 mb-3">
                          <i className="fas fa-calendar mr-2"></i>
                          <span>{new Date(booking.sessionDate).toLocaleDateString()} at {new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        {booking.sessionType === "online" ? (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full font-bold bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-95 duration-200"
                            disabled={startSession.isPending}
                            onClick={() => startSession.mutate(booking.id)}
                          >
                            {startSession.isPending ? <><i className="fas fa-spinner fa-spin mr-2"></i>Connecting...</> : "Start / Join Session"}
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" className="w-full" onClick={() => toast({
                            title: `📋 ${booking.course?.title || "1-on-1 Session"}`,
                            description: `${booking.sessionType === "offline" ? `📍 ${booking.location || "Location TBD"}` : "Online session"} • ${new Date(booking.sessionDate).toLocaleDateString()} at ${new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${booking.duration}hr with ${booking.student?.fullName || "Student"}`
                          })}>
                            View Details
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <i className="fas fa-calendar text-2xl text-slate-400 mb-2"></i>
                    <p className="text-slate-600 text-sm">No upcoming sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Coming Soon! 🚧", description: "Course creation will be available in an upcoming update." })}>
                    <i className="fas fa-plus mr-2"></i>
                    Create Course
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/profile")}>
                    <i className="fas fa-calendar-plus mr-2"></i>
                    Set Availability
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Coming Soon! 🚧", description: "Detailed analytics will be available in an upcoming update." })}>
                    <i className="fas fa-chart-line mr-2"></i>
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "Coming Soon! 🚧", description: "Earnings reports will be available in an upcoming update." })}>
                    <i className="fas fa-indian-rupee-sign mr-2"></i>
                    Earnings Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">This Month</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Sessions:</span>
                    <span className="font-semibold text-slate-800">{bookings.filter(b => b.status === "completed").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">New Students:</span>
                    <span className="font-semibold text-slate-800">{Array.from(new Set(bookings.map(b => b.student?.id).filter(Boolean))).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Earnings:</span>
                    <span className="font-semibold text-slate-800">₹{totalEarnings.toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
