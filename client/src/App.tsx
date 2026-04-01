import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Home from "@/pages/home";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Instructors from "@/pages/instructors";
import InstructorProfile from "@/pages/instructor-profile";
import StudentDashboard from "@/pages/student-dashboard";
import InstructorDashboard from "@/pages/instructor-dashboard";
import Booking from "@/pages/booking";
import Auth from "@/pages/auth";
import TutorOnboarding from "@/pages/tutor-onboarding";
import Profile from "@/pages/profile";
import Messages from "@/pages/messages";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Algorithm from "./components/Algorithm";
import Meeting from "@/pages/meeting";

function Router() {
  const [location] = useLocation();
  const isMeetingRoute = location.startsWith("/meeting/");

  return (
    <>
      {!isMeetingRoute && <Navbar />}
      <main className={isMeetingRoute ? "h-screen overflow-hidden" : "min-h-screen"}>
        <Switch>
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/meeting/:sessionId" component={Meeting} />
          <Route path="/algorithm" component={Algorithm} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/instructors" component={Instructors} />
          <Route path="/instructors/:id" component={InstructorProfile} />
          <ProtectedRoute path="/student-dashboard" component={StudentDashboard} />
          <ProtectedRoute path="/instructor-dashboard" component={InstructorDashboard} />
          <ProtectedRoute path="/booking/:instructorId" component={Booking} />
          <Route path="/auth" component={Auth} />
          <Route path="/tutor-onboarding" component={TutorOnboarding} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/checkout/:courseId" component={Checkout} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isMeetingRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
