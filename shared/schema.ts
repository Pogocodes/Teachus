import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // 'student' | 'instructor'
  avatar: text("avatar"),
  bio: text("bio"),
  phone: text("phone"),
  // New fields for matching
  learningStyle: text("learning_style"), // 'Visual', 'Auditory', 'Reading/Writing', 'Kinaesthetic'
  interests: jsonb("interests").$type<string[]>(), // Array of interests
  preferredMode: text("preferred_mode"), // 'Online', 'Offline'
  preferredBudget: integer("preferred_budget"), // Preferred hourly budget for instructor matching
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  courseCount: integer("course_count").default(0),
});

export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  experience: text("experience").notNull(), // e.g., "5 years"
  specialties: jsonb("specialties").$type<string[]>().notNull(),
  rating: text("rating").default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  hourlyRate: text("hourly_rate").notNull(),
  // New fields for matching
  teachingStyle: text("teaching_style"), // 'Visual', 'Practical', etc.
  location: text("location"),
  mode: text("mode"), // 'Online', 'Offline', 'Both'
  languages: jsonb("languages").$type<string[]>(),
  freeDemo: boolean("free_demo").default(false),
  availability: jsonb("availability").$type<{days: string[], times: string[]}>(),
  whyMe: text("why_me"),
  // Onboarding display field - not a separate column for teaching style, kept on instructor
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  // Preferences (mirrored from users for quick access)
  learningStyle: text("learning_style"), // 'Visual', 'Auditory', 'Reading/Writing', 'Kinaesthetic'
  interests: jsonb("interests").$type<string[]>(), // Array of subject interests
  preferredMode: text("preferred_mode"), // 'Online', 'Offline'
  preferredBudget: integer("preferred_budget"), // Max hourly rate ₹
  // Additional student-specific fields
  educationLevel: text("education_level"), // e.g., 'High School', 'Undergraduate', 'Graduate'
  city: text("city"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructorId: integer("instructor_id").references(() => instructors.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  price: text("price").notNull(), // Stored as text
  duration: integer("duration").notNull(), // in hours
  level: text("level").notNull(), // 'beginner' | 'intermediate' | 'advanced'
  thumbnail: text("thumbnail").notNull(),
  rating: text("rating").default("0.00"),
  totalStudents: integer("total_students").default(0),
  totalReviews: integer("total_reviews").default(0),
  isOnline: boolean("is_online").default(true),
  isOffline: boolean("is_offline").default(false),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0), // percentage
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  instructorId: integer("instructor_id").references(() => instructors.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  sessionType: text("session_type").notNull(), // 'online' | 'offline'
  sessionDate: timestamp("session_date").notNull(),
  duration: integer("duration").notNull(), // in hours
  totalPrice: text("total_price").notNull(),
  status: text("status").default("scheduled"), // 'scheduled' | 'completed' | 'cancelled'
  meetingLink: text("meeting_link"),
  notes: text("notes"),
  // New offline session fields
  location: text("location"),
  locationDetails: text("location_details"),
  otp: text("otp"),
  isVerified: boolean("is_verified").default(false),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  instructorId: integer("instructor_id").references(() => instructors.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  instructorId: integer("instructor_id").references(() => instructors.id).notNull(),
  type: text("type").notNull(), // 'view', 'booking', 'review'
  rating: integer("rating"), // optional explicit rating or inferred weight
  timestamp: timestamp("timestamp").defaultNow(),
});

// Live Sessions
export const liveSessions = pgTable("live_sessions", {
  id: text("id").primaryKey(), // Using UUID strings
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  tutorId: integer("tutor_id").references(() => instructors.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  status: text("status").default("scheduled"), // 'scheduled' | 'live' | 'ended'
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, courseCount: true });
export const insertInstructorSchema = createInsertSchema(instructors).omit({ id: true, rating: true, totalReviews: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, enrolledAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, rating: true, totalStudents: true, totalReviews: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, progress: true, enrolledAt: true });
export const insertBookingSchema = createInsertSchema(bookings, { sessionDate: z.coerce.date(), duration: z.coerce.number() }).omit({ id: true, status: true, isVerified: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, reviewedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true, isRead: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, timestamp: true });
export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ startTime: true, endTime: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type LiveSession = typeof liveSessions.$inferSelect;
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;

// Extended types for frontend use
export type CourseWithInstructor = Course & {
  instructor: Instructor & { user: User };
  category: Category;
};

export type InstructorWithUser = Instructor & {
  user: User;
};

export type StudentWithUser = Student & {
  user: User;
};

export type ReviewWithUser = Review & {
  user: User;
};

export type BookingWithDetails = Booking & {
  instructor: InstructorWithUser;
  course?: Course;
  student: User;
};

export type LiveSessionWithDetails = LiveSession & {
  instructor: InstructorWithUser;
  student: User;
  booking: Booking;
};
