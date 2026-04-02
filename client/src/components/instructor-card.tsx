import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstructorWithUser } from "@shared/schema";
import { Link } from "wouter";

interface InstructorCardProps {
  instructor: InstructorWithUser;
}

export default function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <img 
          src={instructor.user.avatar || "https://placehold.co/120x120"} 
          alt={instructor.user.fullName}
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" 
        />
        <h3 className="font-bold text-lg text-slate-800 mb-1">{instructor.user.fullName}</h3>
        <p className="text-slate-600 text-sm mb-3">{instructor.title}</p>
        
        <div className="flex items-center justify-center mb-3">
          <div className="flex text-yellow-400 mr-2">
            {[...Array(5)].map((_, i) => (
              <i key={i} className="fas fa-star text-sm"></i>
            ))}
          </div>
          <span className="text-sm font-medium text-slate-600">
            {instructor.rating || "0.0"} ({instructor.totalReviews || 0})
          </span>
        </div>
        
        <p className="text-slate-600 text-sm mb-4">{instructor.experience}</p>
        
        <div className="flex justify-center space-x-1 mb-4 flex-wrap gap-1">
          {instructor.specialties.slice(0, 3).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-slate-600">Starting from</p>
          <p className="text-lg font-bold text-slate-800">₹{instructor.hourlyRate}/hour</p>
        </div>
        
        <Link href={`/instructors/${instructor.id}`}>
          <Button className="w-full">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}