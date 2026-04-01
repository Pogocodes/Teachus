import { useQuery } from "@tanstack/react-query";
import { InstructorWithUser } from "@shared/schema";
import InstructorCard from "@/components/instructor-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Instructors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const { data: instructors = [], isLoading } = useQuery<InstructorWithUser[]>({
    queryKey: ["/api/instructors"],
  });

  const filteredInstructors = instructors.filter((instructor) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !instructor.user.fullName.toLowerCase().includes(query) &&
        !instructor.title.toLowerCase().includes(query) &&
        !instructor.specialties.some(s => s.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Specialty filter
    if (specialty && specialty !== "all" && !instructor.specialties.includes(specialty)) {
      return false;
    }

    // Rating filter
    if (ratingFilter && ratingFilter !== "all") {
      const rating = parseFloat(instructor.rating || "0");
      const minRating = parseFloat(ratingFilter);
      if (rating < minRating) return false;
    }

    return true;
  });

  // Get all unique specialties for filter
  const allSpecialties = Array.from(
    new Set(instructors.flatMap(instructor => instructor.specialties))
  ).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-600">Loading instructors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Find Expert Instructors</h1>
          <p className="text-xl text-slate-600">Connect with verified professionals and start learning today</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Specialty</label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {allSpecialties.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.0">4.0+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setSpecialty("all");
                  setRatingFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-slate-600">
            {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredInstructors.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-user-tie text-4xl text-slate-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No instructors found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInstructors.map((instructor) => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
