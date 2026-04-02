import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { CourseWithInstructor, ReviewWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewCard from "@/components/review-card";
import { Link } from "wouter";

export default function CourseDetail() {
  const [match, params] = useRoute("/courses/:id");
  const courseId = params?.id ? parseInt(params.id) : null;

  const { data: course, isLoading } = useQuery<CourseWithInstructor>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/reviews/course", courseId],
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-600">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Course Not Found</h1>
            <p className="text-slate-600 mb-8">The course you're looking for doesn't exist.</p>
            <Link href="/courses">
              <Button>Browse All Courses</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryColor = (categoryName: string) => {
    const colors: Record<string, string> = {
      "Programming": "bg-primary/10 text-primary",
      "Design": "bg-secondary/10 text-secondary",
      "Music": "bg-accent/10 text-accent",
      "Mathematics": "bg-purple-100 text-purple-700",
      "Languages": "bg-pink-100 text-pink-700",
      "Business": "bg-indigo-100 text-indigo-700",
    };
    return colors[categoryName] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Badge className={getCategoryColor(course.category.name)}>
                  {course.category.name}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-slate-800 mb-4">{course.title}</h1>
              <p className="text-xl text-slate-600 mb-6">{course.description}</p>
              
              <div className="flex items-center mb-6">
                <img 
                  src={course.instructor.user.avatar || "https://placehold.co/60x60"} 
                  alt={course.instructor.user.fullName}
                  className="w-15 h-15 rounded-full mr-4 object-cover" 
                />
                <div>
                  <p className="font-semibold text-slate-800">{course.instructor.user.fullName}</p>
                  <p className="text-slate-600">{course.instructor.title}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-slate-600">
                <div className="flex items-center">
                  <i className="fas fa-star text-yellow-400 mr-2"></i>
                  <span className="font-medium">{course.rating}</span>
                  <span className="ml-1">({course.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-users mr-2"></i>
                  <span>{course.totalStudents} students</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-clock mr-2"></i>
                  <span>{course.duration} hours</span>
                </div>
              </div>
            </div>
            
            <div>
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-64 object-cover rounded-xl mb-6" 
              />
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-slate-800 mb-2">₹{course.price}</p>
                    <p className="text-slate-600">One-time payment</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Level:</span>
                      <span className="font-medium capitalize">{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-medium">{course.duration} hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Format:</span>
                      <div className="flex space-x-2">
                        {course.isOnline && (
                          <Badge variant="secondary">Online</Badge>
                        )}
                        {course.isOffline && (
                          <Badge variant="secondary">In-Person</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      Enroll Now
                    </Button>
                    <Link href={`/booking/${course.instructor.id}`}>
                      <Button variant="outline" className="w-full">
                        Book 1-on-1 Session
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3">What's included:</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center">
                        <i className="fas fa-check text-secondary mr-2"></i>
                        Lifetime access to course materials
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-secondary mr-2"></i>
                        Certificate of completion
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-secondary mr-2"></i>
                        Direct instructor support
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-check text-secondary mr-2"></i>
                        30-day money-back guarantee
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Course Overview</h3>
                <div className="prose max-w-none">
                  <p className="text-slate-600 leading-relaxed">
                    {course.description}
                  </p>
                  
                  <h4 className="text-lg font-semibold text-slate-800 mt-6 mb-3">What you'll learn:</h4>
                  <ul className="space-y-2">
                    <li>Master the fundamentals and advanced concepts</li>
                    <li>Build real-world projects from scratch</li>
                    <li>Get hands-on experience with industry tools</li>
                    <li>Receive personalized feedback and guidance</li>
                  </ul>
                  
                  <h4 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Prerequisites:</h4>
                  <p className="text-slate-600">
                    {course.level === 'beginner' 
                      ? 'No prior experience required. This course is perfect for complete beginners.'
                      : course.level === 'intermediate'
                      ? 'Basic knowledge of the subject matter is recommended.'
                      : 'Advanced understanding and prior experience in the field is required.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="curriculum" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Course Curriculum</h3>
                <div className="space-y-4">
                  {/* Sample curriculum - in a real app this would come from the database */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Module 1: Introduction</h4>
                    <p className="text-slate-600 text-sm mb-2">2 hours</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Course overview and objectives</li>
                      <li>• Setting up your development environment</li>
                      <li>• Basic concepts and terminology</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Module 2: Fundamentals</h4>
                    <p className="text-slate-600 text-sm mb-2">8 hours</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Core principles and best practices</li>
                      <li>• Hands-on exercises and examples</li>
                      <li>• Common pitfalls and how to avoid them</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Module 3: Advanced Topics</h4>
                    <p className="text-slate-600 text-sm mb-2">15 hours</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Advanced techniques and patterns</li>
                      <li>• Real-world project development</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Module 4: Final Project</h4>
                    <p className="text-slate-600 text-sm mb-2">15 hours</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Capstone project planning</li>
                      <li>• Implementation and testing</li>
                      <li>• Code review and optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-slate-600">Be the first to leave a review for this course!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
