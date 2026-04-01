import { useEffect } from "react";
import HeroSection from "@/components/hero-section";
import SearchSection from "@/components/search-section";
import CategoryGrid from "@/components/category-grid";
import { useQuery } from "@tanstack/react-query";
import { CourseWithInstructor, InstructorWithUser, ReviewWithUser, BookingWithDetails } from "@shared/schema";
import CourseCard from "@/components/course-card";
import InstructorCard from "@/components/instructor-card";
import ReviewCard from "@/components/review-card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

import { useAuth } from "@/hooks/use-auth";
import { Enrollment } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "instructor") {
      setLocation("/instructor-dashboard");
    }
  }, [user, setLocation]);

  const { data: courses = [] } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student", user?.id],
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/student", user?.id],
    enabled: !!user,
  });

  const { data: instructors = [] } = useQuery<InstructorWithUser[]>({
    queryKey: ["/api/instructors"],
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/reviews/course/1"],
  });

  const { data: recommendations = [] } = useQuery<InstructorWithUser[]>({
    queryKey: ["/api/recommendations"],
  });

  const featuredCourses = courses.slice(0, 3);
  const topInstructors = instructors.slice(0, 4);

  // Get upcoming sessions from real bookings (accepted or scheduled, future dates)
  const upcomingSessions = bookings
    .filter(b => (b.status === "accepted" || b.status === "scheduled") && new Date(b.sessionDate) >= new Date())
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroSection />
      <SearchSection />
      <CategoryGrid />

      {/* Featured Courses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">Featured Courses</h2>
            <Link href="/courses">
              <Button variant="link" className="text-primary font-semibold">
                View All Courses →
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Student Dashboard Preview */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Your Learning Journey</h2>
            <p className="text-xl text-slate-600">Track your progress and manage your courses with our intuitive dashboard</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-800 px-8 py-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <img
                    src={user?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                    alt="Student Profile"
                    className="w-15 h-15 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">Welcome back, {user?.fullName.split(' ')[0]}!</h3>
                    <p className="text-blue-200">Continue your learning journey</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-blue-200 text-sm">Active Courses</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h4 className="text-lg font-semibold text-slate-800 mb-6">Continue Learning</h4>
                  <div className="space-y-4">
                    {enrollments.length > 0 ? (
                      enrollments.slice(0, 2).map((enrollment) => {
                        const course = courses.find(c => c.id === enrollment.courseId);
                        if (!course) return null;

                        return (
                          <div key={course.id} className="flex items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-20 h-15 rounded-lg mr-4 object-cover"
                            />
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-800">{course.title}</h5>
                              <p className="text-sm text-slate-600 mb-2">by {course.instructor.user.fullName}</p>
                              <div className="flex items-center">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 mr-4">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${enrollment.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-600">
                                  {enrollment.progress}%
                                </span>
                              </div>
                            </div>
                            <Button className="ml-4">Continue</Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>You haven't enrolled in any courses yet.</p>
                        <Link href="/courses">
                          <Button variant="link" className="text-primary">Browse Courses</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-6">Upcoming Sessions</h4>
                  <div className="space-y-4">
                    {upcomingSessions.length > 0 ? (
                      upcomingSessions.map((booking) => (
                        <div key={booking.id} className="p-4 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-slate-800">{booking.course?.title || "1-on-1 Session"}</h5>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${booking.sessionType === "online" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                              {booking.sessionType === "online" ? "Online" : "In-Person"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">with {booking.instructor.user.fullName}</p>
                          <div className="flex items-center text-sm text-slate-600 mb-3">
                            <i className="fas fa-calendar mr-2"></i>
                            <span>
                              {new Date(booking.sessionDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                              {new Date(booking.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <Button variant="secondary" className="w-full">
                            {booking.sessionType === "online" ? "Join Session" : "View Details"}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        <i className="fas fa-calendar-check text-2xl text-slate-400 mb-2"></i>
                        <p className="text-sm">No upcoming sessions</p>
                        <Link href="/instructors">
                          <Button variant="link" className="text-primary text-sm mt-1">Book a Tutor</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Recommended for You</h2>
            <p className="text-xl text-slate-600">Instructors matched to your learning style and interests</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.length > 0 ? (
              recommendations.map((instructor) => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500">
                <p>Complete your profile to get personalized recommendations</p>
              </div>
            )}
          </div>
        </div>
      </section>



      {/* Reviews Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">What Our Students Say</h2>
            <p className="text-xl text-slate-600">Real feedback from real learners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-600">No reviews available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
