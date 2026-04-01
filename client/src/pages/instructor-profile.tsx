import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { InstructorWithUser, CourseWithInstructor, ReviewWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseCard from "@/components/course-card";
import ReviewCard from "@/components/review-card";

export default function InstructorProfile() {
  const [match, params] = useRoute("/instructors/:id");
  const instructorId = params?.id ? parseInt(params.id) : null;

  const { data: instructor, isLoading } = useQuery<InstructorWithUser>({
    queryKey: ["/api/instructors", instructorId],
    enabled: !!instructorId,
  });

  const { data: courses = [] } = useQuery<CourseWithInstructor[]>({
    queryKey: ["/api/courses"],
    select: (data) => data.filter(course => course.instructor.id === instructorId),
    enabled: !!instructorId,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/reviews/instructor", instructorId],
    enabled: !!instructorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-600">Loading instructor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Instructor Not Found</h1>
            <p className="text-slate-600 mb-8">The instructor you're looking for doesn't exist.</p>
            <Link href="/instructors">
              <Button>Browse All Instructors</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <img
                  src={instructor.user.avatar || "https://placehold.co/120x120"}
                  alt={instructor.user.fullName}
                  className="w-32 h-32 rounded-full mr-6 object-cover border-4 border-white/20"
                />
                <div>
                  <h1 className="text-4xl font-bold mb-2">{instructor.user.fullName}</h1>
                  <p className="text-xl text-blue-200 mb-4">{instructor.title}</p>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-3">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star"></i>
                      ))}
                    </div>
                    <span className="text-white font-medium">
                      {instructor.rating} ({instructor.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {instructor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-blue-100 text-lg leading-relaxed">
                {instructor.user.bio || instructor.experience}
              </p>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-slate-800 mb-2">
                      ${instructor.hourlyRate}/hour
                    </p>
                    <p className="text-slate-600">Starting rate</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Response time:</span>
                      <span className="font-medium">Within 2 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total students:</span>
                      <span className="font-medium">{courses.reduce((sum, course) => sum + course.totalStudents, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Courses:</span>
                      <span className="font-medium">{courses.length}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link href={`/booking/${instructor.id}`}>
                      <Button className="w-full" size="lg">
                        Book 1-on-1 Session
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full">
                      Send Message
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-4">Availability Options:</h4>
                    <div className="space-y-4">
                      {/* Premium Camera Placeholder UI */}
                      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-slate-900 shadow-xl group cursor-pointer transition-all hover:border-primary/50">
                        {/* Glassmorphism gradient effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-slate-900 to-slate-900 pointer-events-none"></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

                        <div className="relative p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 top-0">
                              <i className="fas fa-video text-primary text-sm relative z-10 animate-pulse"></i>
                              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white tracking-wide">Live Online Class</p>
                              <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1">🎥 In-Platform Video</p>
                            </div>
                          </div>
                          <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            Supported
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <i className="fas fa-map-marker-alt text-secondary text-sm"></i>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">In-Person Sessions</span>
                        </div>
                        <i className="fas fa-chevron-right text-slate-400 text-xs"></i>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">About {instructor.user.fullName}</h3>
                  <div className="prose max-w-none">
                    <p className="text-slate-600 leading-relaxed mb-4">
                      {instructor.user.bio || instructor.experience}
                    </p>

                    <h4 className="text-lg font-semibold text-slate-800 mb-3">Experience</h4>
                    <p className="text-slate-600 mb-4">{instructor.experience}</p>

                    <h4 className="text-lg font-semibold text-slate-800 mb-3">Teaching Approach</h4>
                    <p className="text-slate-600">
                      I believe in hands-on learning with real-world applications. My teaching style focuses on
                      breaking down complex concepts into digestible parts and providing practical examples that
                      students can immediately apply.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Specialties & Skills</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Core Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {instructor.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Achievements</h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center">
                          <i className="fas fa-award text-accent mr-2"></i>
                          Top-rated instructor on TeachUs
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-medal text-accent mr-2"></i>
                          Industry expert with proven track record
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-certificate text-accent mr-2"></i>
                          Professional certifications and credentials
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Teaching Stats</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{instructor.totalReviews}</p>
                          <p className="text-sm text-slate-600">Total Reviews</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-2xl font-bold text-secondary">{instructor.rating}</p>
                          <p className="text-sm text-slate-600">Average Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <i className="fas fa-book text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No courses yet</h3>
                  <p className="text-slate-600">This instructor hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <i className="fas fa-star text-4xl text-slate-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No reviews yet</h3>
                  <p className="text-slate-600">Be the first to leave a review for this instructor!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Typical Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Monday - Friday:</span>
                        <span className="font-medium">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Saturday:</span>
                        <span className="font-medium">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sunday:</span>
                        <span className="font-medium">By appointment</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Time Zone</h4>
                    <p className="text-slate-600 text-sm mb-4">UTC-5 (Eastern Time)</p>

                    <h4 className="font-semibold text-slate-800 mb-3">Session Duration Options</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">30 minutes:</span>
                        <span className="font-medium">${Math.round(parseFloat(instructor.hourlyRate) * 0.5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">1 hour:</span>
                        <span className="font-medium">${instructor.hourlyRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">1.5 hours:</span>
                        <span className="font-medium">${Math.round(parseFloat(instructor.hourlyRate) * 1.5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">2 hours:</span>
                        <span className="font-medium">${Math.round(parseFloat(instructor.hourlyRate) * 2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <Link href={`/booking/${instructor.id}`}>
                    <Button size="lg">
                      Book a Session Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
