import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseWithInstructor } from "@shared/schema";
import { Link } from "wouter";

interface CourseCardProps {
  course: CourseWithInstructor;
}

export default function CourseCard({ course }: CourseCardProps) {
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
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-4 left-4">
          <Badge className={getCategoryColor(course.category.name)}>
            {course.category.name}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-2 py-1">
          <i className="fas fa-star text-yellow-400 text-sm mr-1"></i>
          <span className="text-sm font-medium text-slate-600">{course.rating || "0.0"}</span>
        </div>
      </div>
      
      <CardContent className="p-6">
        <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center mb-4">
          <img 
            src={course.instructor.user.avatar || "https://placehold.co/40x40"} 
            alt={course.instructor.user.fullName}
            className="w-10 h-10 rounded-full mr-3 object-cover" 
          />
          <div>
            <p className="font-medium text-slate-800 text-sm">{course.instructor.user.fullName}</p>
            <p className="text-slate-600 text-xs">{course.instructor.title}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-600 text-sm space-x-4">
            <div className="flex items-center">
              <i className="fas fa-clock mr-1"></i>
              <span>{course.duration} hours</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-users mr-1"></i>
              <span>{course.totalStudents || 0} students</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">${course.price}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/courses/${course.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          <Button className="flex-1">
            Enroll Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}