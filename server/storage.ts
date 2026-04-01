import {
  users, instructors, students, courses, categories, enrollments, bookings, reviews, messages,
  type User, type InsertUser, type Instructor, type InsertInstructor, type Student, type InsertStudent,
  type Course, type InsertCourse, type Category, type InsertCategory,
  type Enrollment, type InsertEnrollment, type Booking, type InsertBooking,
  type Review, type InsertReview, type Message, type InsertMessage,
  type LiveSession, type InsertLiveSession,
  type CourseWithInstructor, type InstructorWithUser, type ReviewWithUser,
  type BookingWithDetails, type LiveSessionWithDetails
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  addInterestToUser(userId: number, interest: string | string[]): Promise<User | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Instructors
  getInstructors(): Promise<InstructorWithUser[]>;
  getInstructor(id: number): Promise<InstructorWithUser | undefined>;
  getInstructorByUserId(userId: number): Promise<InstructorWithUser | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  updateInstructor(id: number, updates: Partial<Instructor>): Promise<Instructor | undefined>;

  // Courses
  getCourses(): Promise<CourseWithInstructor[]>;
  getCourse(id: number): Promise<CourseWithInstructor | undefined>;
  getCoursesByCategory(categoryId: number): Promise<CourseWithInstructor[]>;
  getCoursesByInstructor(instructorId: number): Promise<CourseWithInstructor[]>;
  searchCourses(query: string): Promise<CourseWithInstructor[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined>;

  // Enrollments
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined>;

  // Bookings
  getBookings(): Promise<BookingWithDetails[]>;
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  getBookingsByStudent(studentId: number): Promise<BookingWithDetails[]>;
  getBookingsByInstructor(instructorId: number): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;

  // Reviews
  getReviewsByCourse(courseId: number): Promise<ReviewWithUser[]>;
  getReviewsByInstructor(instructorId: number): Promise<ReviewWithUser[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Messages
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getConversationsForUser(userId: number): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Live Sessions
  getLiveSession(id: string): Promise<LiveSessionWithDetails | undefined>;
  getLiveSessionByBookingId(bookingId: number): Promise<LiveSessionWithDetails | undefined>;
  getLiveSessionsByStudent(studentId: number): Promise<LiveSessionWithDetails[]>;
  getLiveSessionsByTutor(tutorId: number): Promise<LiveSessionWithDetails[]>;
  createLiveSession(session: InsertLiveSession): Promise<LiveSession>;
  updateLiveSession(id: string, updates: Partial<LiveSession>): Promise<LiveSession | undefined>;

  // Students
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  updateStudent(id: number, updates: Partial<Student>): Promise<Student | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private instructors: Map<number, Instructor> = new Map();
  private courses: Map<number, Course> = new Map();
  private categories: Map<number, Category> = new Map();
  private enrollments: Map<number, Enrollment> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private reviews: Map<number, Review> = new Map();
  private messages: Map<number, Message> = new Map();
  private liveSessions: Map<string, LiveSession> = new Map();

  private currentUserId = 1;
  private currentInstructorId = 1;
  private currentCourseId = 1;
  private currentCategoryId = 1;
  private currentEnrollmentId = 1;
  private currentBookingId = 1;
  private currentReviewId = 1;
  private currentMessageId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create categories
    const categories = [
      { name: "Programming", icon: "fas fa-code" },
      { name: "Design", icon: "fas fa-palette" },
      { name: "Music", icon: "fas fa-music" },
      { name: "Mathematics", icon: "fas fa-calculator" },
      { name: "Languages", icon: "fas fa-language" },
      { name: "Business", icon: "fas fa-briefcase" },
    ];

    categories.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        icon: cat.icon,
        courseCount: 0,
      };
      this.categories.set(category.id, category);
    });

    // Create users
    const users = [
      { username: "john_smith", email: "john@example.com", password: "password", fullName: "John Smith", role: "instructor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", bio: "Senior Full-Stack Developer with 8+ years experience at Google & Meta" },
      { username: "sarah_johnson", email: "sarah@example.com", password: "password", fullName: "Sarah Johnson", role: "instructor", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e2", bio: "Lead UX Designer with 6+ years at Apple & Airbnb" },
      { username: "mike_davis", email: "mike@example.com", password: "password", fullName: "Mike Davis", role: "instructor", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e", bio: "Professional musician with 15+ years teaching experience" },
      { username: "lisa_chen", email: "lisa@example.com", password: "password", fullName: "Lisa Chen", role: "instructor", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956", bio: "MBA from Harvard, ex-McKinsey business consultant" },
      { username: "emily_rodriguez", email: "emily@example.com", password: "password", fullName: "Emily Rodriguez", role: "student", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80", bio: "Aspiring web developer" },
    ];

    users.forEach(user => {
      const newUser: User = {
        id: this.currentUserId++,
        username: user.username,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      };
      this.users.set(newUser.id, newUser);
    });

    // Create instructors
    const instructors = [
      { userId: 1, title: "Senior Full-Stack Developer", experience: "8+ years experience at Google & Meta", specialties: ["JavaScript", "React", "Node.js"], rating: "4.9", totalReviews: 156, hourlyRate: "50" },
      { userId: 2, title: "Lead UX Designer", experience: "6+ years at Apple & Airbnb", specialties: ["UI/UX", "Figma", "Research"], rating: "4.8", totalReviews: 89, hourlyRate: "40" },
      { userId: 3, title: "Professional Musician", experience: "15+ years teaching experience", specialties: ["Guitar", "Piano", "Theory"], rating: "4.7", totalReviews: 203, hourlyRate: "30" },
      { userId: 4, title: "Business Consultant", experience: "MBA from Harvard, ex-McKinsey", specialties: ["Strategy", "Finance", "Marketing"], rating: "4.9", totalReviews: 112, hourlyRate: "80" },
    ];

    instructors.forEach(instructor => {
      const newInstructor: Instructor = {
        id: this.currentInstructorId++,
        userId: instructor.userId,
        title: instructor.title,
        experience: instructor.experience,
        specialties: instructor.specialties,
        rating: instructor.rating,
        totalReviews: instructor.totalReviews,
        hourlyRate: instructor.hourlyRate,
      };
      this.instructors.set(newInstructor.id, newInstructor);
    });

    // Create courses
    const courses = [
      {
        title: "Complete Web Development Bootcamp",
        description: "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.",
        instructorId: 1,
        categoryId: 1,
        price: "99",
        duration: 40,
        level: "beginner",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        rating: "4.8",
        totalStudents: 156,
        totalReviews: 89,
        isOnline: true,
        isOffline: false,
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Master the fundamentals of user interface and user experience design with hands-on projects.",
        instructorId: 2,
        categoryId: 2,
        price: "79",
        duration: 35,
        level: "intermediate",
        thumbnail: "https://images.unsplash.com/photo-1559028006-448665bd7c7f",
        rating: "4.9",
        totalStudents: 89,
        totalReviews: 67,
        isOnline: true,
        isOffline: true,
      },
      {
        title: "Guitar for Beginners",
        description: "Learn to play guitar from scratch with step-by-step lessons and practice exercises.",
        instructorId: 3,
        categoryId: 3,
        price: "59",
        duration: 25,
        level: "beginner",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
        rating: "4.7",
        totalStudents: 203,
        totalReviews: 156,
        isOnline: true,
        isOffline: true,
      },
    ];

    courses.forEach(course => {
      const newCourse: Course = {
        id: this.currentCourseId++,
        title: course.title,
        description: course.description,
        instructorId: course.instructorId,
        categoryId: course.categoryId,
        price: course.price,
        duration: course.duration,
        level: course.level,
        thumbnail: course.thumbnail,
        rating: course.rating,
        totalStudents: course.totalStudents,
        totalReviews: course.totalReviews,
        isOnline: course.isOnline,
        isOffline: course.isOffline,
      };
      this.courses.set(newCourse.id, newCourse);
    });

    // Update category course counts
    this.categories.set(1, { ...this.categories.get(1)!, courseCount: 1 });
    this.categories.set(2, { ...this.categories.get(2)!, courseCount: 1 });
    this.categories.set(3, { ...this.categories.get(3)!, courseCount: 1 });

    // Create sample enrollment
    const enrollment: Enrollment = {
      id: this.currentEnrollmentId++,
      studentId: 5,
      courseId: 1,
      progress: 65,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment.id, enrollment);

    // Create sample reviews
    const reviews = [
      {
        studentId: 5,
        courseId: 1,
        instructorId: 1,
        rating: 5,
        comment: "John's web development course was exactly what I needed. His teaching style is clear and he provides great real-world examples. I landed my first developer job within 3 months!",
      },
    ];

    reviews.forEach(review => {
      const newReview: Review = {
        id: this.currentReviewId++,
        studentId: review.studentId,
        courseId: review.courseId,
        instructorId: review.instructorId,
        rating: review.rating,
        comment: review.comment,
        reviewedAt: new Date(),
      };
      this.reviews.set(newReview.id, newReview);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addInterestToUser(userId: number, interest: string | string[]): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const currentInterests = user.interests || [];
    const newInterests = Array.isArray(interest) ? interest : [interest];

    const uniqueNewInterests = newInterests
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .filter(newI => !currentInterests.some(currI => currI.toLowerCase() === newI.toLowerCase()));

    if (uniqueNewInterests.length > 0) {
      const updatedInterests = [...currentInterests, ...uniqueNewInterests];
      return await this.updateUser(userId, { interests: updatedInterests });
    }
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = { ...insertCategory, id: this.currentCategoryId++, courseCount: 0 };
    this.categories.set(category.id, category);
    return category;
  }

  // Instructors
  async getInstructors(): Promise<InstructorWithUser[]> {
    const instructorsList = Array.from(this.instructors.values());
    return instructorsList.map(instructor => ({
      ...instructor,
      user: this.users.get(instructor.userId)!,
    }));
  }

  async getInstructor(id: number): Promise<InstructorWithUser | undefined> {
    const instructor = this.instructors.get(id);
    if (!instructor) return undefined;
    const user = this.users.get(instructor.userId);
    if (!user) return undefined;
    return { ...instructor, user };
  }

  async getInstructorByUserId(userId: number): Promise<InstructorWithUser | undefined> {
    const instructor = Array.from(this.instructors.values()).find(i => i.userId === userId);
    if (!instructor) return undefined;
    const user = this.users.get(instructor.userId);
    if (!user) return undefined;
    return { ...instructor, user };
  }

  async createInstructor(insertInstructor: InsertInstructor): Promise<Instructor> {
    const instructor: Instructor = {
      ...insertInstructor,
      id: this.currentInstructorId++,
      rating: "0.00",
      totalReviews: 0,
    };
    this.instructors.set(instructor.id, instructor);
    return instructor;
  }

  async updateInstructor(id: number, updates: Partial<Instructor>): Promise<Instructor | undefined> {
    const instructor = this.instructors.get(id);
    if (!instructor) return undefined;
    const updatedInstructor = { ...instructor, ...updates };
    this.instructors.set(id, updatedInstructor);
    return updatedInstructor;
  }

  // Courses
  async getCourses(): Promise<CourseWithInstructor[]> {
    const coursesList = Array.from(this.courses.values());
    return coursesList.map(course => ({
      ...course,
      instructor: {
        ...this.instructors.get(course.instructorId)!,
        user: this.users.get(this.instructors.get(course.instructorId)!.userId)!,
      },
      category: this.categories.get(course.categoryId)!,
    }));
  }

  async getCourse(id: number): Promise<CourseWithInstructor | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    const instructor = this.instructors.get(course.instructorId);
    if (!instructor) return undefined;
    const user = this.users.get(instructor.userId);
    if (!user) return undefined;
    const category = this.categories.get(course.categoryId);
    if (!category) return undefined;

    return {
      ...course,
      instructor: { ...instructor, user },
      category,
    };
  }

  async getCoursesByCategory(categoryId: number): Promise<CourseWithInstructor[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.categoryId === categoryId);
  }

  async getCoursesByInstructor(instructorId: number): Promise<CourseWithInstructor[]> {
    const courses = await this.getCourses();
    return courses.filter(course => course.instructorId === instructorId);
  }

  async searchCourses(query: string): Promise<CourseWithInstructor[]> {
    const courses = await this.getCourses();
    const lowercaseQuery = query.toLowerCase();
    return courses.filter(course =>
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery) ||
      course.instructor.user.fullName.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const course: Course = {
      ...insertCourse,
      id: this.currentCourseId++,
      rating: insertCourse.rating || null,
      totalStudents: insertCourse.totalStudents || null,
      totalReviews: insertCourse.totalReviews || null,
      isOnline: insertCourse.isOnline || null,
      isOffline: insertCourse.isOffline || null,
    };
    this.courses.set(course.id, course);

    // Update category course count
    const category = this.categories.get(course.categoryId);
    if (category) {
      this.categories.set(category.id, { ...category, courseCount: (category.courseCount || 0) + 1 });
    }

    return course;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    const updatedCourse = { ...course, ...updates };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  // Enrollments
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.courseId === courseId);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const enrollment: Enrollment = {
      ...insertEnrollment,
      id: this.currentEnrollmentId++,
      progress: 0,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    const updatedEnrollment = { ...enrollment, ...updates };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Bookings
  async getBookings(): Promise<BookingWithDetails[]> {
    const bookingsList = Array.from(this.bookings.values());
    return bookingsList.map(booking => ({
      ...booking,
      instructor: {
        ...this.instructors.get(booking.instructorId)!,
        user: this.users.get(this.instructors.get(booking.instructorId)!.userId)!,
      },
      course: booking.courseId ? this.courses.get(booking.courseId) : undefined,
      student: this.users.get(booking.studentId)!,
    }));
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const instructor = this.instructors.get(booking.instructorId);
    if (!instructor) return undefined;
    const instructorUser = this.users.get(instructor.userId);
    if (!instructorUser) return undefined;
    const student = this.users.get(booking.studentId);
    if (!student) return undefined;

    return {
      ...booking,
      instructor: { ...instructor, user: instructorUser },
      course: booking.courseId ? this.courses.get(booking.courseId) : undefined,
      student,
    };
  }

  async getBookingsByStudent(studentId: number): Promise<BookingWithDetails[]> {
    const bookings = await this.getBookings();
    return bookings.filter(booking => booking.studentId === studentId);
  }

  async getBookingsByInstructor(instructorId: number): Promise<BookingWithDetails[]> {
    const bookings = await this.getBookings();
    return bookings.filter(booking => booking.instructorId === instructorId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      status: insertBooking.status || null,
      notes: insertBooking.notes || null,
      courseId: insertBooking.courseId || null,
      meetingLink: insertBooking.meetingLink || null,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Reviews
  async getReviewsByCourse(courseId: number): Promise<ReviewWithUser[]> {
    const reviewsList = Array.from(this.reviews.values()).filter(r => r.courseId === courseId);
    return reviewsList.map(review => ({
      ...review,
      user: this.users.get(review.studentId)!,
    }));
  }

  async getReviewsByInstructor(instructorId: number): Promise<ReviewWithUser[]> {
    const reviewsList = Array.from(this.reviews.values()).filter(r => r.instructorId === instructorId);
    return reviewsList.map(review => ({
      ...review,
      user: this.users.get(review.studentId)!,
    }));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentReviewId++,
      reviewedAt: insertReview.reviewedAt || null,
      instructorId: insertReview.instructorId || null,
      courseId: insertReview.courseId || null,
    };
    this.reviews.set(review.id, review);
    return review;
  }

  // Messages
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m =>
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => (a.sentAt?.getTime() || 0) - (b.sentAt?.getTime() || 0));
  }

  async getConversationsForUser(userId: number): Promise<any[]> {
    const userMessages = Array.from(this.messages.values()).filter(
      m => m.senderId === userId || m.receiverId === userId
    );
    const conversationsMap = new Map<number, any>();
    
    for (const msg of userMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const existing = conversationsMap.get(otherId);
      
      if (!existing || existing.lastMessage.sentAt!.getTime() < msg.sentAt!.getTime()) {
        const otherUser = this.users.get(otherId);
        if (otherUser) {
           conversationsMap.set(otherId, {
             user: { id: otherUser.id, fullName: otherUser.fullName, avatar: otherUser.avatar, role: otherUser.role },
             lastMessage: msg,
             unreadCount: msg.receiverId === userId && !msg.isRead ? 
               (existing ? existing.unreadCount + 1 : 1) : 
               (existing ? existing.unreadCount : 0)
           });
        }
      } else if (msg.receiverId === userId && !msg.isRead) {
        existing.unreadCount++;
      }
    }
    
    return Array.from(conversationsMap.values());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      sentAt: new Date(),
      isRead: false,
    };
    this.messages.set(message.id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Live Sessions
  async getLiveSessionByBookingId(bookingId: number): Promise<LiveSessionWithDetails | undefined> {
    const session = Array.from(this.liveSessions.values()).find(s => s.bookingId === bookingId);
    if (!session) return undefined;
    return this.getLiveSession(session.id);
  }

  async getLiveSession(id: string): Promise<LiveSessionWithDetails | undefined> {
    const session = this.liveSessions.get(id);
    if (!session) return undefined;

    const booking = this.bookings.get(session.bookingId);
    if (!booking) return undefined;

    const instructor = this.instructors.get(session.tutorId);
    if (!instructor) return undefined;
    const instructorUser = this.users.get(instructor.userId);
    if (!instructorUser) return undefined;
    
    const student = this.users.get(session.studentId);
    if (!student) return undefined;

    return {
      ...session,
      instructor: { ...instructor, user: instructorUser },
      student,
      booking,
    };
  }

  async getLiveSessionsByStudent(studentId: number): Promise<LiveSessionWithDetails[]> {
    const sessions = Array.from(this.liveSessions.values()).filter(s => s.studentId === studentId);
    return Promise.all(sessions.map(s => this.getLiveSession(s.id))) as Promise<LiveSessionWithDetails[]>;
  }

  async getLiveSessionsByTutor(tutorId: number): Promise<LiveSessionWithDetails[]> {
    const sessions = Array.from(this.liveSessions.values()).filter(s => s.tutorId === tutorId);
    return Promise.all(sessions.map(s => this.getLiveSession(s.id))) as Promise<LiveSessionWithDetails[]>;
  }

  async createLiveSession(insertSession: InsertLiveSession): Promise<LiveSession> {
    const session: LiveSession = {
      ...insertSession,
      status: insertSession.status || "scheduled",
      startTime: new Date(),
      endTime: null,
    };
    this.liveSessions.set(session.id, session);
    return session;
  }

  async updateLiveSession(id: string, updates: Partial<LiveSession>): Promise<LiveSession | undefined> {
    const session = this.liveSessions.get(id);
    if (!session) return undefined;
    const updatedSession = { ...session, ...updates };
    this.liveSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Students - stub implementations (app uses DbStorage in production)
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const student: Student = {
      id: Date.now(),
      userId: insertStudent.userId,
      learningStyle: insertStudent.learningStyle ?? null,
      interests: (insertStudent.interests as string[]) ?? null,
      preferredMode: insertStudent.preferredMode ?? null,
      preferredBudget: insertStudent.preferredBudget ?? null,
      educationLevel: insertStudent.educationLevel ?? null,
      city: insertStudent.city ?? null,
      enrolledAt: new Date(),
    };
    return student;
  }

  async getStudentByUserId(_userId: number): Promise<Student | undefined> {
    return undefined;
  }

  async updateStudent(_id: number, _updates: Partial<Student>): Promise<Student | undefined> {
    return undefined;
  }
}

export const storage = new MemStorage();
