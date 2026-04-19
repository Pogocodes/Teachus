import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CourseWithInstructor, BookingWithDetails, Enrollment } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";

import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiRequest } from "@/lib/queryClient";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!socket || !user) return;

    const onBookingAccepted = (data: any) => {
      toast({
        title: "Booking Confirmed! ✅",
        description: `Your booking for ${data.courseTitle} has been accepted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/student", user.id] });
    };

    const onSessionStarted = (data: any) => {
      toast({
        title: "Live Session Started! 🎥",
        description: `Your tutor has started the session for ${data.courseTitle}.`,
        action: (
          <ToastAction altText="Join Now" onClick={() => setLocation(`/meeting/${data.sessionId}`)}>
            Join Now
          </ToastAction>
        ),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/student/active"] });
    };

    socket.on("booking-accepted", onBookingAccepted);
    socket.on("session-started", onSessionStarted);

    return () => {
      socket.off("booking-accepted", onBookingAccepted);
      socket.off("session-started", onSessionStarted);
    };
  }, [socket, user, toast, queryClient, setLocation]);

  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student", user?.id],
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/student", user?.id],
    enabled: !!user,
  });

  const { data: allCourses = [] } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
  });

  const { data: activeSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/sessions/student/active"],
    enabled: !!user,
    refetchInterval: 5000, 
  });

  const startSession = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await apiRequest("POST", "/api/sessions/start", { bookingId });
      return await res.json();
    },
    onSuccess: (session) => {
      toast({ title: "Connecting to Session..." });
      setLocation(`/meeting/${session.id}`);
    },
    onError: (error) => {
      toast({ title: "Failed to join session", description: error.message, variant: "destructive" });
    }
  });

  if (!user) return null;

  // Get enrolled courses
  const enrolledCourses = allCourses.filter(course =>
    enrollments.some(enrollment => enrollment.courseId === course.id)
  );

  const upcomingBookings = bookings.filter(booking =>
    booking.status === "accepted" || booking.status === "pending" || booking.status === "scheduled"
  ).slice(0, 3);

  const recentBookings = bookings.filter(booking =>
    booking.status === "completed"
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={user.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                alt="Student Profile"
                className="w-20 h-20 rounded-full mr-6 object-cover border-4 border-white/20"
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user.fullName.split(' ')[0]} !</h1>
                <p className="text-blue-200 text-lg">Continue your learning journey</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold mb-1">{enrolledCourses.length}</p>
              <p className="text-blue-200">Active Courses</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Continue Learning</h2>
                  <Link href="/courses">
                    <Button variant="outline">Browse More Courses</Button>
                  </Link>
                </div>

                {enrolledCourses.length > 0 ? (
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => {
                      const enrollment = enrollments.find(e => e.courseId === course.id);
                      const progress = enrollment?.progress || 0;

                      return (
                        <div key={course.id} className="flex items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-20 h-15 rounded-lg mr-4 object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-1">{course.title}</h3>
                            <p className="text-sm text-slate-600 mb-3">by {course.instructor.user.fullName}</p>
                            <div className="flex items-center">
                              <Progress value={progress} className="flex-1 mr-4" />
                              <span className="text-sm font-medium text-slate-600 min-w-0">{progress}%</span>
                            </div>
                          </div>
                          <Link href={`/courses/${course.id}`}>
                            <Button className="ml-4">Continue</Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-book-open text-4xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No enrolled courses</h3>
                    <p className="text-slate-600 mb-6">Start your learning journey by enrolling in a course</p>
                    <Link href="/courses">
                      <Button>Browse Courses</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h2>

                {recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center p-4 border border-slate-200 rounded-xl">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-check text-secondary"></i>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">Session Completed</h3>
                          <p className="text-sm text-slate-600">
                            {booking.duration}-hour session with {booking.instructor.user.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(booking.sessionDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-history text-3xl text-slate-400 mb-3"></i>
                    <p className="text-slate-600">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Sessions</h3>

                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.filter(b => b.status === "pending" || b.status === "scheduled" || b.status === "accepted").map((booking) => {
                      const isAccepted = booking.status === "accepted";
                      const activeSession = activeSessions.find(s => s.bookingId === booking.id);
                      
                      return (
                      <div key={booking.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-800">
                            {booking.course?.title || "1-on-1 Session"}
                          </h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={
                              isAccepted ? "border-green-200 text-green-600 bg-green-50" : 
                              "border-orange-200 text-orange-600 bg-orange-50"
                            }>
                              {isAccepted ? "Accepted" : "Pending"}
                            </Badge>
                            <Badge className={booking.sessionType === "online" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}>
                              {booking.sessionType}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">with {booking.instructor.user.fullName}</p>
                        <div className="flex items-center text-sm text-slate-600 mb-3">
                          <i className="fas fa-calendar mr-2"></i>
                          <span>{new Date(booking.sessionDate).toLocaleDateString()} at {new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        {booking.sessionType === "offline" && isAccepted && (
                          <div className="mb-4 space-y-2">
                            <div className="text-sm bg-slate-100 p-2 rounded-md">
                              <strong className="block text-slate-700 text-xs uppercase mb-1">Meetup Location:</strong>
                              <span className="text-slate-600 break-words">{booking.location}</span>
                              {booking.locationDetails && <span className="block text-xs text-slate-500 mt-1">{booking.locationDetails}</span>}
                            </div>
                            {!booking.isVerified ? (
                              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-primary font-bold mb-1 uppercase tracking-wider">Your Verification Code</p>
                                <p className="text-2xl font-mono font-bold tracking-[0.2em] text-slate-800">{booking.otp}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Share this OTP with {booking.instructor.user.fullName} to securely start</p>
                              </div>
                            ) : (
                              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                                <p className="text-sm text-green-700 font-bold"><i className="fas fa-check-circle mr-1"></i> Session Verified</p>
                                <p className="text-xs text-green-600 mt-1">In progress</p>
                              </div>
                            )}
                          </div>
                        )}

                        {booking.sessionType === "online" && (
                          <div className="mb-4">
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 p-4 shrink-0 shadow-inner group">
                              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-black pointer-events-none"></div>
                              <div className="flex flex-col items-center justify-center text-center space-y-3 z-10 relative">
                                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 shadow-md">
                                  {isAccepted ? (
                                    <i className="fas fa-video text-slate-400 text-lg"></i>
                                  ) : (
                                    <i className="fas fa-video-slash text-slate-600 text-lg"></i>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-200">
                                    {isAccepted ? "Live Video Classroom" : "Camera Initializing"}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                                    {isAccepted ? "Camera will activate at session time" : "Pending tutor approval"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {isAccepted && booking.sessionType === "online" ? (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className={`w-full font-bold bg-primary hover:bg-primary/90 transition-all shadow-md active:scale-95 duration-200`}
                            disabled={startSession.isPending}
                            onClick={() => startSession.mutate(booking.id)}
                          >
                            {startSession.isPending ? <><i className="fas fa-spinner fa-spin mr-2"></i>Connecting...</> : "Start / Join Session"}
                          </Button>
                        ) : booking.sessionType !== "offline" ? (
                          <Button variant="secondary" size="sm" className="w-full" disabled={!isAccepted}
                            onClick={() => toast({
                              title: `📋 ${booking.course?.title || "1-on-1 Session"}`,
                              description: `Waiting for tutor approval • ${new Date(booking.sessionDate).toLocaleDateString()} at ${new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${booking.duration}hr with ${booking.instructor.user.fullName}`
                            })}
                          >
                            View Details
                          </Button>
                        ) : null}
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-alt text-3xl text-slate-400 mb-3"></i>
                    <p className="text-slate-600 text-sm mb-4">No upcoming sessions</p>
                    <Link href="/instructors">
                      <Button size="sm" variant="outline">Book a Session</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Learning Stats</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Courses Enrolled:</span>
                    <span className="font-semibold text-slate-800">{enrolledCourses.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sessions Completed:</span>
                    <span className="font-semibold text-slate-800">{recentBookings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Hours:</span>
                    <span className="font-semibold text-slate-800">
                      {recentBookings.reduce((sum, booking) => sum + booking.duration, 0)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Avg. Progress:</span>
                    <span className="font-semibold text-slate-800">
                      {enrollments.length > 0
                        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>

                <div className="space-y-3">
                  <Link href="/courses">
                    <Button variant="outline" className="w-full justify-start">
                      <i className="fas fa-search mr-2"></i>
                      Browse Courses
                    </Button>
                  </Link>
                  <Link href="/instructors">
                    <Button variant="outline" className="w-full justify-start">
                      <i className="fas fa-user-tie mr-2"></i>
                      Find Instructors
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button variant="outline" className="w-full justify-start">
                      <i className="fas fa-message mr-2"></i>
                      Messages
                    </Button>
                  </Link>
                  <Link href="/recordings">
                    <Button variant="outline" className="w-full justify-start">
                      <i className="fas fa-video mr-2"></i>
                      Session Recordings
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <i className="fas fa-cog mr-2"></i>
                      Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
