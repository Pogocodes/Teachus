import type { Express } from "express";
import { createServer, type Server } from "http";
import { IStorage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertInstructorSchema, insertBookingSchema, insertReviewSchema, insertEnrollmentSchema } from "@shared/schema";
import { setupSocketServer, getIO } from "./socket";
import crypto from "crypto";
import { sendOTPEmail } from "./email";

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  // Auth routes are handled in auth.ts


  // Users routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...updatedUser, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Courses routes
  app.get("/api/courses", async (req, res) => {
    try {
      const { category, search } = req.query;
      let courses = await storage.getCourses();

      if (category && typeof category === "string") {
        const categoryId = parseInt(category);
        courses = await storage.getCoursesByCategory(categoryId);
      }

      if (search && typeof search === "string") {
        courses = await storage.searchCourses(search);

        // Implicit Interest Tracking
        if (req.isAuthenticated()) {
          const userId = (req.user as any).id;
          // Fire and forget to not slow down search response
          storage.addInterestToUser(userId, search).catch(err =>
            console.error("Failed to add implicit interest:", err)
          );
        }
      }

      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Instructors routes
  app.get("/api/instructors", async (req, res) => {
    try {
      const instructors = await storage.getInstructors();
      res.json(instructors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/recommendations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const sessionUser = req.user as any;
      const studentId = sessionUser.id;
      const student = await storage.getUser(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const instructors = await storage.getInstructors();

      // Calculate recommendations
      // Dynamic import to avoid circular dependencies if any, though likely fine here
      const { getCollaborativeRecommendations } = await import("./recommendations");
      const recommended = await getCollaborativeRecommendations(student, instructors);
      console.log("recommendation engine works here ", recommended)

      res.json(recommended); // Return all recommendations (limit handled in ML engine)
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/instructors/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let instructor = await storage.getInstructorByUserId(userId);
      
      // Auto-create for missing legacy accounts
      if (!instructor) {
        const user = await storage.getUser(userId);
        if (user && user.role === "instructor") {
          await storage.createInstructor({
            userId: user.id,
            title: "New Instructor",
            experience: "0 years",
            specialties: [],
            hourlyRate: "500",
            teachingStyle: null,
            location: null,
            mode: "Online",
            languages: ["English"]
          } as any);
          instructor = await storage.getInstructorByUserId(userId);
        }
      }

      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      res.json(instructor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/instructors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instructor = await storage.getInstructor(id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      // Implicit Interest Tracking: Add instructor specialties to user interests
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id;
        // Fire and forget
        if (instructor.specialties && Array.isArray(instructor.specialties)) {
          storage.addInterestToUser(userId, instructor.specialties).catch(err =>
            console.error("Failed to add implicit interest from instructor view:", err)
          );
        }
      }

      res.json(instructor);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/instructors/:id/availability", async (req, res) => {
    try {
      const instructorId = parseInt(req.params.id);
      const dateStr = req.query.date as string;
      if (!dateStr) {
        return res.status(400).json({ message: "date query parameter is required" });
      }

      const instructor = await storage.getInstructor(instructorId);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      // Check against instructor's availability
      let standardSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
      const dateObj = new Date(dateStr);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = daysOfWeek[dateObj.getDay()];

      if (instructor.availability && instructor.availability.days && instructor.availability.times) {
        if (!instructor.availability.days.includes(dayName)) {
          return res.json({ availableSlots: [] }); // Not available on this day
        }
        // Exclude generic slots and use the instructor's configured time slots
        standardSlots = instructor.availability.times;
      }

      const bookings = await storage.getBookingsByInstructor(instructorId);
      
      const dateBookings = bookings.filter(b => {
        const bDate = new Date(b.sessionDate);
        return bDate.toISOString().split('T')[0] === dateStr && b.status !== "cancelled" && b.status !== "rejected";
      });

      const bookedHours = dateBookings.flatMap(b => {
        const hr = new Date(b.sessionDate).getHours();
        
        // Handle durations stored as minutes (e.g. 30, 60, 90 from legacy usage)
        let hoursDuration = b.duration;
        if (hoursDuration > 12) {
            hoursDuration = hoursDuration / 60;
        }

        // Assume slots are blocked for the full duration
        return Array.from({length: Math.ceil(hoursDuration)}, (_, i) => hr + i);
      });

      const availableSlots = standardSlots.filter(slot => {
        const slotHour = parseInt(slot.split(":")[0]);
        return !bookedHours.includes(slotHour);
      }).sort((a, b) => parseInt(a.split(":")[0]) - parseInt(b.split(":")[0])); // Keep sorted

      res.json({ availableSlots });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/instructors", async (req, res) => {
    try {
      const instructorData = insertInstructorSchema.parse(req.body);
      const instructor = await storage.createInstructor(instructorData);
      res.json(instructor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Enrollments routes
  app.get("/api/enrollments/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bookings routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const bookings = await storage.getBookingsByStudent(studentId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/instructor/:instructorId", async (req, res) => {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const bookings = await storage.getBookingsByInstructor(instructorId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const sessionUser = req.user as any;
      const data = { ...req.body };
      
      // Auto-generate Jitsi Meet link if session is online and link is not explicitly provided
      if (data.sessionType === "online" && !data.meetingLink) {
        const randomId = Math.random().toString(36).substring(2, 12);
        data.meetingLink = `https://meet.jit.si/SkillSpark-Session-${randomId}`;
      }
      
      // Generation for Offline Booking OTP
      if (data.sessionType === "offline") {
        data.otp = crypto.randomInt(100000, 999999).toString();
      }

      const bookingData = insertBookingSchema.parse(data);
      const booking = await storage.createBooking(bookingData);
      
      // Send OTP email if offline
      if (data.sessionType === "offline" && data.otp) {
        const student = await storage.getUser(sessionUser.id);
        const instructor = await storage.getInstructor(data.instructorId);
        
        if (student && instructor) {
          // Fire and forget so we don't slow down the response
          sendOTPEmail(
            student.email,
            student.fullName,
            instructor.user.fullName,
            data.otp,
            data.location || null
          ).catch(err => console.error("Error sending OTP email:", err));
        }
      }

      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/verify-otp", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const { otp } = req.body;
      
      const sessionUser = req.user as any;
      const fullBooking = await storage.getBooking(id);
      
      if (!fullBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Make sure the person verifying is the instructor
      const instructor = await storage.getInstructorByUserId(sessionUser.id);
      if (!instructor || instructor.id !== fullBooking.instructorId) {
        return res.status(403).json({ message: "Only the assigned instructor can verify this session" });
      }
      
      if (fullBooking.sessionType !== "offline") {
        return res.status(400).json({ message: "Only offline sessions require OTP verification" });
      }
      
      if (fullBooking.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP provided" });
      }
      
      const updatedBooking = await storage.updateBooking(id, { isVerified: true, status: "completed" });
      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const updatedBooking = await storage.updateBooking(id, { status });
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Return the full booking details to satisfy the frontend query cache
      const fullBooking = await storage.getBooking(id);

      if (status === "accepted" && fullBooking) {
        try {
          const io = getIO();
          io.to(`user-${fullBooking.studentId}`).emit("booking-accepted", {
            bookingId: fullBooking.id,
            courseTitle: fullBooking.course?.title || "1-on-1 Session"
          });
        } catch (e) {
          console.error("Failed to emit booking accepted event:", e);
        }
      }

      res.json(fullBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reviews routes
  app.get("/api/reviews/course/:courseId", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const reviews = await storage.getReviewsByCourse(courseId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reviews/instructor/:instructorId", async (req, res) => {
    try {
      const instructorId = parseInt(req.params.instructorId);
      const reviews = await storage.getReviewsByInstructor(instructorId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Messages routes
  app.get("/api/messages/conversations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const conversations = await storage.getConversationsForUser(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/messages/:userId1/:userId2", async (req, res) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      const messages = await storage.getMessagesBetweenUsers(userId1, userId2);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Checkout route
  app.post("/api/checkout", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const sessionUser = req.user as any;

      const { courseId, paymentMethod, billingInfo, cardInfo, amount } = req.body;

      // Mock payment processing - in real app would integrate with Stripe/PayPal
      const paymentResult = {
        success: true,
        transactionId: `txn_${Date.now()}`,
        amount,
        courseId,
        paymentMethod
      };

      // Create enrollment after successful payment
      const enrollment = await storage.createEnrollment({
        studentId: sessionUser.id,
        courseId: parseInt(courseId),
      });

      res.json({
        success: true,
        enrollment,
        transaction: paymentResult
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Live Sessions route
  app.post("/api/sessions/start", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const sessionUser = req.user as any;
      
      // Allow either student or tutor to start/join
      const instructor = await storage.getInstructorByUserId(sessionUser.id);
      const isCustomTutor = instructor && instructor.id === booking.instructorId;
      const isCustomStudent = sessionUser.id === booking.studentId;

      if (!isCustomTutor && !isCustomStudent) {
        return res.status(403).json({ message: "You are not authorized to join this session" });
      }

      // Check if session already exists
      let liveSession = await storage.getLiveSessionByBookingId(booking.id);

      if (!liveSession) {
        // Generate a unique session ID
        const sessionId = crypto.randomUUID();
        await storage.createLiveSession({
          id: sessionId,
          bookingId: booking.id,
          tutorId: booking.instructorId,
          studentId: booking.studentId,
          status: "live",
        });
        
        liveSession = await storage.getLiveSession(sessionId) as any;

        // Update booking status
        await storage.updateBooking(booking.id, { status: "completed" });

        try {
          const io = getIO();
          // Notify the other user
          const notifyUserId = isCustomTutor ? booking.studentId : booking.instructor.userId;
          io.to(`user-${notifyUserId}`).emit("session-started", {
            sessionId: liveSession!.id,
            courseTitle: booking.course?.title || "1-on-1 Session",
          });
        } catch (e) {
          console.error("Failed to emit session started event:", e);
        }
      }

      res.json(liveSession);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sessions/student/active", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = (req.user as any).id;
      const sessions = await storage.getLiveSessionsByStudent(userId);
      // Return only 'live' sessions
      const activeSessions = sessions.filter(s => s.status === 'live');
      
      res.json(activeSessions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const sessionId = req.params.id;
      const session = await storage.getLiveSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const userId = (req.user as any).id;
      
      // Check authorization (must be the student or the tutor's user account)
      if (session.studentId !== userId && session.instructor.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this session" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Attach Socket.io to the HTTP Server
  setupSocketServer(httpServer, storage);

  return httpServer;
}
