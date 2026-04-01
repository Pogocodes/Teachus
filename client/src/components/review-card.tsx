import { Card, CardContent } from "@/components/ui/card";
import { Review } from "@shared/schema";
import { format } from "date-fns";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img 
            src={review.student?.avatar || "https://placehold.co/48x48"} 
            alt={review.student?.fullName || "Student"}
            className="w-12 h-12 rounded-full object-cover" 
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-800">{review.student?.fullName || "Anonymous"}</h4>
              <span className="text-sm text-slate-500">
                {review.reviewedAt ? format(new Date(review.reviewedAt), "MMM dd, yyyy") : ""}
              </span>
            </div>
            <div className="flex items-center mb-3">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <i 
                    key={i} 
                    className={`fas fa-star text-sm ${i < review.rating ? "" : "text-slate-300"}`}
                  ></i>
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600">{review.rating}/5</span>
            </div>
            <p className="text-slate-600">{review.comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}