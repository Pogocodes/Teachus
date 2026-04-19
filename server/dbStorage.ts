import { eq, and, or, desc, asc, like, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, instructors, students, courses, categories, enrollments, bookings, reviews, messages, interactions, liveSessions, sessionRecordings, sessionIssues,
  type User, type InsertUser, type Instructor, type InsertInstructor, type Student, type InsertStudent,
  type Course, type InsertCourse, type Category, type InsertCategory,
  type Enrollment, type InsertEnrollment, type Booking, type InsertBooking,
  type Review, type InsertReview, type Message, type InsertMessage,
  type CourseWithInstructor, type InstructorWithUser, type ReviewWithUser,
  type BookingWithDetails, type Interaction, type InsertInteraction,
  type LiveSession, type InsertLiveSession, type LiveSessionWithDetails,
  type SessionRecording, type InsertSessionRecording,
  type SessionIssue, type InsertSessionIssue
} from "./db";
import { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async addInterestToUser(userId: number, interest: string | string[]): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const currentInterests = user.interests || [];
    const newInterests = Array.isArray(interest) ? interest : [interest];

    // Filter out existing interests (case-insensitive)
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
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  // Instructors
  async getInstructors(): Promise<InstructorWithUser[]> {
    const result = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        title: instructors.title,
        experience: instructors.experience,
        specialties: instructors.specialties,
        rating: instructors.rating,
        totalReviews: instructors.totalReviews,
        hourlyRate: instructors.hourlyRate,
        location: instructors.location,
        teachingStyle: instructors.teachingStyle,
        mode: instructors.mode,
        languages: instructors.languages,
        freeDemo: instructors.freeDemo,
        availability: instructors.availability,
        whyMe: instructors.whyMe,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          fullName: users.fullName,
          role: users.role,
          avatar: users.avatar,
          bio: users.bio,
          phone: users.phone,
          learningStyle: users.learningStyle,
          interests: users.interests,
          preferredMode: users.preferredMode,
          preferredBudget: users.preferredBudget
        }
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .orderBy(desc(instructors.rating));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      experience: row.experience,
      specialties: row.specialties,
      rating: row.rating,
      totalReviews: row.totalReviews,
      hourlyRate: row.hourlyRate,
      location: row.location,
      teachingStyle: row.teachingStyle,
      mode: row.mode,
      languages: row.languages,
      freeDemo: row.freeDemo,
      availability: row.availability,
      whyMe: row.whyMe,
      user: row.user
    }));
  }

  async getInstructor(id: number): Promise<InstructorWithUser | undefined> {
    const result = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        title: instructors.title,
        experience: instructors.experience,
        specialties: instructors.specialties,
        rating: instructors.rating,
        totalReviews: instructors.totalReviews,
        hourlyRate: instructors.hourlyRate,
        location: instructors.location,
        teachingStyle: instructors.teachingStyle,
        mode: instructors.mode,
        languages: instructors.languages,
        freeDemo: instructors.freeDemo,
        availability: instructors.availability,
        whyMe: instructors.whyMe,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          fullName: users.fullName,
          role: users.role,
          avatar: users.avatar,
          bio: users.bio,
          phone: users.phone,
          learningStyle: users.learningStyle,
          interests: users.interests,
          preferredMode: users.preferredMode,
          preferredBudget: users.preferredBudget
        }
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      experience: row.experience,
      specialties: row.specialties,
      rating: row.rating,
      totalReviews: row.totalReviews,
      hourlyRate: row.hourlyRate,
      user: row.user,
      location: row.location,
      teachingStyle: row.teachingStyle,
      mode: row.mode,
      languages: row.languages,
      freeDemo: row.freeDemo,
      availability: row.availability,
      whyMe: row.whyMe,
    };
  }

  async getInstructorByUserId(userId: number): Promise<InstructorWithUser | undefined> {
    const result = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        title: instructors.title,
        experience: instructors.experience,
        specialties: instructors.specialties,
        rating: instructors.rating,
        totalReviews: instructors.totalReviews,
        hourlyRate: instructors.hourlyRate,
        location: instructors.location,
        teachingStyle: instructors.teachingStyle,
        mode: instructors.mode,
        languages: instructors.languages,
        freeDemo: instructors.freeDemo,
        availability: instructors.availability,
        whyMe: instructors.whyMe,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          fullName: users.fullName,
          role: users.role,
          avatar: users.avatar,
          bio: users.bio,
          phone: users.phone,
          learningStyle: users.learningStyle,
          interests: users.interests,
          preferredMode: users.preferredMode,
          preferredBudget: users.preferredBudget
        }
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.userId, userId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      experience: row.experience,
      specialties: row.specialties,
      rating: row.rating,
      totalReviews: row.totalReviews,
      hourlyRate: row.hourlyRate,
      location: row.location,
      teachingStyle: row.teachingStyle,
      mode: row.mode,
      languages: row.languages,
      freeDemo: row.freeDemo,
      availability: row.availability,
      whyMe: row.whyMe,
      user: row.user
    };
  }

  async createInstructor(insertInstructor: InsertInstructor): Promise<Instructor> {
    const result = await db.insert(instructors).values(insertInstructor as any).returning();
    return result[0];
  }

  async updateInstructor(id: number, updates: Partial<Instructor>): Promise<Instructor | undefined> {
    const result = await db.update(instructors).set(updates).where(eq(instructors.id, id)).returning();
    return result[0];
  }

  // Courses
  async getCourses(): Promise<CourseWithInstructor[]> {
    const result = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructorId: courses.instructorId,
        courseCategoryId: courses.categoryId,
        coursePrice: courses.price,
        courseDuration: courses.duration,
        courseLevel: courses.level,
        courseThumbnail: courses.thumbnail,
        courseRating: courses.rating,
        courseTotalStudents: courses.totalStudents,
        courseTotalReviews: courses.totalReviews,
        courseIsOnline: courses.isOnline,
        courseIsOffline: courses.isOffline,
        instrId: instructors.id,
        instrUserId: instructors.userId,
        instrTitle: instructors.title,
        instrExperience: instructors.experience,
        instrSpecialties: instructors.specialties,
        instrRating: instructors.rating,
        instrTotalReviews: instructors.totalReviews,
        instrHourlyRate: instructors.hourlyRate,
        instrLocation: instructors.location,
        instrTeachingStyle: instructors.teachingStyle,
        instrMode: instructors.mode,
        instrLanguages: instructors.languages,
        instrFreeDemo: instructors.freeDemo,
        instrAvailability: instructors.availability,
        instrWhyMe: instructors.whyMe,
        userId: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        fullName: users.fullName,
        role: users.role,
        avatar: users.avatar,
        bio: users.bio,
        phone: users.phone,
        learningStyle: users.learningStyle,
        interests: users.interests,
        preferredMode: users.preferredMode,
        preferredBudget: users.preferredBudget,
        catId: categories.id,
        catName: categories.name,
        catIcon: categories.icon,
        catCourseCount: categories.courseCount,
      })
      .from(courses)
      .innerJoin(instructors, eq(courses.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .innerJoin(categories, eq(courses.categoryId, categories.id))
      .orderBy(desc(courses.rating));

    return result.map(row => ({
      id: row.courseId,
      title: row.courseTitle,
      description: row.courseDescription,
      instructorId: row.courseInstructorId,
      categoryId: row.courseCategoryId,
      price: row.coursePrice,
      duration: row.courseDuration,
      level: row.courseLevel,
      thumbnail: row.courseThumbnail,
      rating: row.courseRating,
      totalStudents: row.courseTotalStudents,
      totalReviews: row.courseTotalReviews,
      isOnline: row.courseIsOnline,
      isOffline: row.courseIsOffline,
      instructor: {
        id: row.instrId,
        userId: row.instrUserId,
        title: row.instrTitle,
        experience: row.instrExperience,
        specialties: row.instrSpecialties,
        rating: row.instrRating,
        totalReviews: row.instrTotalReviews,
        hourlyRate: row.instrHourlyRate,
        location: row.instrLocation,
        teachingStyle: row.instrTeachingStyle,
        mode: row.instrMode,
        languages: row.instrLanguages,
        freeDemo: row.instrFreeDemo,
        availability: row.instrAvailability,
        whyMe: row.instrWhyMe,
        user: {
          id: row.userId,
          username: row.username,
          email: row.email,
          password: row.password,
          fullName: row.fullName,
          role: row.role,
          avatar: row.avatar,
          bio: row.bio,
          phone: row.phone,
          learningStyle: row.learningStyle,
          interests: row.interests,
          preferredMode: row.preferredMode,
          preferredBudget: row.preferredBudget,
        }
      },
      category: {
        id: row.catId,
        name: row.catName,
        icon: row.catIcon,
        courseCount: row.catCourseCount,
      }
    }));
  }

  async getCourse(id: number): Promise<CourseWithInstructor | undefined> {
    const result = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructorId: courses.instructorId,
        courseCategoryId: courses.categoryId,
        coursePrice: courses.price,
        courseDuration: courses.duration,
        courseLevel: courses.level,
        courseThumbnail: courses.thumbnail,
        courseRating: courses.rating,
        courseTotalStudents: courses.totalStudents,
        courseTotalReviews: courses.totalReviews,
        courseIsOnline: courses.isOnline,
        courseIsOffline: courses.isOffline,
        instrId: instructors.id,
        instrUserId: instructors.userId,
        instrTitle: instructors.title,
        instrExperience: instructors.experience,
        instrSpecialties: instructors.specialties,
        instrRating: instructors.rating,
        instrTotalReviews: instructors.totalReviews,
        instrHourlyRate: instructors.hourlyRate,
        instrLocation: instructors.location,
        instrTeachingStyle: instructors.teachingStyle,
        instrMode: instructors.mode,
        instrLanguages: instructors.languages,
        instrFreeDemo: instructors.freeDemo,
        instrAvailability: instructors.availability,
        instrWhyMe: instructors.whyMe,
        userId: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        fullName: users.fullName,
        role: users.role,
        avatar: users.avatar,
        bio: users.bio,
        phone: users.phone,
        learningStyle: users.learningStyle,
        interests: users.interests,
        preferredMode: users.preferredMode,
        preferredBudget: users.preferredBudget,
        catId: categories.id,
        catName: categories.name,
        catIcon: categories.icon,
        catCourseCount: categories.courseCount,
      })
      .from(courses)
      .innerJoin(instructors, eq(courses.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .innerJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.courseId,
      title: row.courseTitle,
      description: row.courseDescription,
      instructorId: row.courseInstructorId,
      categoryId: row.courseCategoryId,
      price: row.coursePrice,
      duration: row.courseDuration,
      level: row.courseLevel,
      thumbnail: row.courseThumbnail,
      rating: row.courseRating,
      totalStudents: row.courseTotalStudents,
      totalReviews: row.courseTotalReviews,
      isOnline: row.courseIsOnline,
      isOffline: row.courseIsOffline,
      instructor: {
        id: row.instrId,
        userId: row.instrUserId,
        title: row.instrTitle,
        experience: row.instrExperience,
        specialties: row.instrSpecialties,
        rating: row.instrRating,
        totalReviews: row.instrTotalReviews,
        hourlyRate: row.instrHourlyRate,
        location: row.instrLocation,
        teachingStyle: row.instrTeachingStyle,
        mode: row.instrMode,
        languages: row.instrLanguages,
        freeDemo: row.instrFreeDemo,
        availability: row.instrAvailability,
        whyMe: row.instrWhyMe,
        user: {
          id: row.userId,
          username: row.username,
          email: row.email,
          password: row.password,
          fullName: row.fullName,
          role: row.role,
          avatar: row.avatar,
          bio: row.bio,
          phone: row.phone,
          learningStyle: row.learningStyle,
          interests: row.interests,
          preferredMode: row.preferredMode,
          preferredBudget: row.preferredBudget,
        }
      },
      category: {
        id: row.catId,
        name: row.catName,
        icon: row.catIcon,
        courseCount: row.catCourseCount,
      }
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
    const result = await db.insert(courses).values(insertCourse).returning();

    // Update category course count
    await db.update(categories)
      .set({ courseCount: sql`${categories.courseCount} + 1` })
      .where(eq(categories.id, insertCourse.categoryId));

    return result[0];
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const result = await db.update(courses).set(updates).where(eq(courses.id, id)).returning();
    return result[0];
  }

  // Enrollments
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(enrollments).values(insertEnrollment).returning();
    return result[0];
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const result = await db.update(enrollments).set(updates).where(eq(enrollments.id, id)).returning();
    return result[0];
  }

  // Bookings
  async getBookings(): Promise<BookingWithDetails[]> {
    const bookingsList = await db.select().from(bookings).orderBy(desc(bookings.sessionDate));

    const result: BookingWithDetails[] = [];

    for (const booking of bookingsList) {
      const instructorResult = await db
        .select({
          id: instructors.id,
          userId: instructors.userId,
          title: instructors.title,
          experience: instructors.experience,
          specialties: instructors.specialties,
          rating: instructors.rating,
          totalReviews: instructors.totalReviews,
          hourlyRate: instructors.hourlyRate,
          location: instructors.location,
          teachingStyle: instructors.teachingStyle,
          mode: instructors.mode,
          languages: instructors.languages,
          freeDemo: instructors.freeDemo,
          availability: instructors.availability,
          whyMe: instructors.whyMe,
          uId: users.id,
          uUsername: users.username,
          uEmail: users.email,
          uPassword: users.password,
          uFullName: users.fullName,
          uRole: users.role,
          uAvatar: users.avatar,
          uBio: users.bio,
          uPhone: users.phone,
          uLearningStyle: users.learningStyle,
          uInterests: users.interests,
          uPreferredMode: users.preferredMode,
          uPreferredBudget: users.preferredBudget,
        })
        .from(instructors)
        .innerJoin(users, eq(instructors.userId, users.id))
        .where(eq(instructors.id, booking.instructorId))
        .limit(1);

      const studentResult = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.studentId))
        .limit(1);

      let course = undefined;
      if (booking.courseId) {
        const courseResult = await db
          .select()
          .from(courses)
          .where(eq(courses.id, booking.courseId))
          .limit(1);
        course = courseResult[0];
      }

      if (instructorResult.length > 0 && studentResult.length > 0) {
        const ir = instructorResult[0];
        result.push({
          ...booking,
          instructor: {
            id: ir.id,
            userId: ir.userId,
            title: ir.title,
            experience: ir.experience,
            specialties: ir.specialties,
            rating: ir.rating,
            totalReviews: ir.totalReviews,
            hourlyRate: ir.hourlyRate,
            location: ir.location,
            teachingStyle: ir.teachingStyle,
            mode: ir.mode,
            languages: ir.languages,
            freeDemo: ir.freeDemo,
            availability: ir.availability,
            whyMe: ir.whyMe,
            user: {
              id: ir.uId,
              username: ir.uUsername,
              email: ir.uEmail,
              password: ir.uPassword,
              fullName: ir.uFullName,
              role: ir.uRole,
              avatar: ir.uAvatar,
              bio: ir.uBio,
              phone: ir.uPhone,
              learningStyle: ir.uLearningStyle,
              interests: ir.uInterests,
              preferredMode: ir.uPreferredMode,
              preferredBudget: ir.uPreferredBudget,
            }
          },
          course: course || undefined,
          student: studentResult[0]
        });
      }
    }

    return result;
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const bookingResult = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (bookingResult.length === 0) return undefined;

    const booking = bookingResult[0];

    const instructorResult = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        title: instructors.title,
        experience: instructors.experience,
        specialties: instructors.specialties,
        rating: instructors.rating,
        totalReviews: instructors.totalReviews,
        hourlyRate: instructors.hourlyRate,
        location: instructors.location,
        teachingStyle: instructors.teachingStyle,
        mode: instructors.mode,
        languages: instructors.languages,
        freeDemo: instructors.freeDemo,
        availability: instructors.availability,
        whyMe: instructors.whyMe,
        uId: users.id,
        uUsername: users.username,
        uEmail: users.email,
        uPassword: users.password,
        uFullName: users.fullName,
        uRole: users.role,
        uAvatar: users.avatar,
        uBio: users.bio,
        uPhone: users.phone,
        uLearningStyle: users.learningStyle,
        uInterests: users.interests,
        uPreferredMode: users.preferredMode,
        uPreferredBudget: users.preferredBudget,
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.id, booking.instructorId))
      .limit(1);

    const studentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, booking.studentId))
      .limit(1);

    let course = undefined;
    if (booking.courseId) {
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, booking.courseId))
        .limit(1);
      course = courseResult[0];
    }

    if (instructorResult.length === 0 || studentResult.length === 0) return undefined;

    const ir = instructorResult[0];
    return {
      ...booking,
      instructor: {
        id: ir.id,
        userId: ir.userId,
        title: ir.title,
        experience: ir.experience,
        specialties: ir.specialties,
        rating: ir.rating,
        totalReviews: ir.totalReviews,
        hourlyRate: ir.hourlyRate,
        location: ir.location,
        teachingStyle: ir.teachingStyle,
        mode: ir.mode,
        languages: ir.languages,
        freeDemo: ir.freeDemo,
        availability: ir.availability,
        whyMe: ir.whyMe,
        user: {
          id: ir.uId,
          username: ir.uUsername,
          email: ir.uEmail,
          password: ir.uPassword,
          fullName: ir.uFullName,
          role: ir.uRole,
          avatar: ir.uAvatar,
          bio: ir.uBio,
          phone: ir.uPhone,
          learningStyle: ir.uLearningStyle,
          interests: ir.uInterests,
          preferredMode: ir.uPreferredMode,
          preferredBudget: ir.uPreferredBudget,
        }
      },
      course: course || undefined,
      student: studentResult[0]
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
    const result = await db.insert(bookings).values(insertBooking).returning();
    return result[0];
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Reviews
  async getReviewsByCourse(courseId: number): Promise<ReviewWithUser[]> {
    const result = await db
      .select({
        id: reviews.id,
        studentId: reviews.studentId,
        courseId: reviews.courseId,
        instructorId: reviews.instructorId,
        rating: reviews.rating,
        comment: reviews.comment,
        reviewedAt: reviews.reviewedAt,
        uId: users.id,
        uUsername: users.username,
        uEmail: users.email,
        uPassword: users.password,
        uFullName: users.fullName,
        uRole: users.role,
        uAvatar: users.avatar,
        uBio: users.bio,
        uPhone: users.phone,
        uLearningStyle: users.learningStyle,
        uInterests: users.interests,
        uPreferredMode: users.preferredMode,
        uPreferredBudget: users.preferredBudget,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.studentId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.reviewedAt));

    return result.map(row => ({
      id: row.id,
      studentId: row.studentId,
      courseId: row.courseId,
      instructorId: row.instructorId,
      rating: row.rating,
      comment: row.comment,
      reviewedAt: row.reviewedAt,
      user: {
        id: row.uId,
        username: row.uUsername,
        email: row.uEmail,
        password: row.uPassword,
        fullName: row.uFullName,
        role: row.uRole,
        avatar: row.uAvatar,
        bio: row.uBio,
        phone: row.uPhone,
        learningStyle: row.uLearningStyle,
        interests: row.uInterests,
        preferredMode: row.uPreferredMode,
        preferredBudget: row.uPreferredBudget,
      }
    }));
  }

  async getReviewsByInstructor(instructorId: number): Promise<ReviewWithUser[]> {
    const result = await db
      .select({
        id: reviews.id,
        studentId: reviews.studentId,
        courseId: reviews.courseId,
        instructorId: reviews.instructorId,
        rating: reviews.rating,
        comment: reviews.comment,
        reviewedAt: reviews.reviewedAt,
        uId: users.id,
        uUsername: users.username,
        uEmail: users.email,
        uPassword: users.password,
        uFullName: users.fullName,
        uRole: users.role,
        uAvatar: users.avatar,
        uBio: users.bio,
        uPhone: users.phone,
        uLearningStyle: users.learningStyle,
        uInterests: users.interests,
        uPreferredMode: users.preferredMode,
        uPreferredBudget: users.preferredBudget,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.studentId, users.id))
      .where(eq(reviews.instructorId, instructorId))
      .orderBy(desc(reviews.reviewedAt));

    return result.map(row => ({
      id: row.id,
      studentId: row.studentId,
      courseId: row.courseId,
      instructorId: row.instructorId,
      rating: row.rating,
      comment: row.comment,
      reviewedAt: row.reviewedAt,
      user: {
        id: row.uId,
        username: row.uUsername,
        email: row.uEmail,
        password: row.uPassword,
        fullName: row.uFullName,
        role: row.uRole,
        avatar: row.uAvatar,
        bio: row.uBio,
        phone: row.uPhone,
        learningStyle: row.uLearningStyle,
        interests: row.uInterests,
        preferredMode: row.uPreferredMode,
        preferredBudget: row.uPreferredBudget,
      }
    }));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(insertReview).returning();
    return result[0];
  }

  // Messages
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.sentAt));
  }

  async getConversationsForUser(userId: number): Promise<any[]> {
    const allMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.sentAt));

    const conversationsMap = new Map<number, any>();

    for (const msg of allMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      const existing = conversationsMap.get(otherId);
      if (!existing) {
        const otherUserRes = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
        const otherUser = otherUserRes[0];
        if (otherUser) {
          conversationsMap.set(otherId, {
            user: { id: otherUser.id, fullName: otherUser.fullName, avatar: otherUser.avatar, role: otherUser.role },
            lastMessage: msg,
            unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0
          });
        }
      } else if (msg.receiverId === userId && !msg.isRead) {
         existing.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const result = await db.insert(interactions).values(insertInteraction).returning();
    return result[0];
  }

  async getInteractions(): Promise<Interaction[]> {
    return await db.select().from(interactions);
  }

  // Students
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(insertStudent as any).returning();
    return result[0];
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const result = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateStudent(id: number, updates: Partial<Student>): Promise<Student | undefined> {
    const result = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  // Live Sessions
  async getLiveSessionByBookingId(bookingId: number): Promise<LiveSessionWithDetails | undefined> {
    const sessionResult = await db.select().from(liveSessions).where(eq(liveSessions.bookingId, bookingId)).limit(1);
    if (sessionResult.length === 0) return undefined;
    return this.getLiveSession(sessionResult[0].id);
  }

  async getLiveSession(id: string): Promise<LiveSessionWithDetails | undefined> {
    const sessionResult = await db.select().from(liveSessions).where(eq(liveSessions.id, id)).limit(1);
    if (sessionResult.length === 0) return undefined;
    const session = sessionResult[0];

    // Fetch booking
    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, session.bookingId)).limit(1);
    const booking = bookingResult[0];

    // Fetch student
    const studentResult = await db.select().from(users).where(eq(users.id, session.studentId)).limit(1);
    const student = studentResult[0];

    // Fetch instructor
    const instructorResult = await this.getInstructor(session.tutorId);

    if (!booking || !student || !instructorResult) return undefined;

    return {
      ...session,
      booking,
      student,
      instructor: instructorResult
    };
  }

  async getLiveSessionsByStudent(studentId: number): Promise<LiveSessionWithDetails[]> {
    const sessionList = await db.select().from(liveSessions).where(eq(liveSessions.studentId, studentId)).orderBy(desc(liveSessions.startTime));
    const result: LiveSessionWithDetails[] = [];
    for (const s of sessionList) {
      const details = await this.getLiveSession(s.id);
      if (details) result.push(details);
    }
    return result;
  }

  async getLiveSessionsByTutor(tutorId: number): Promise<LiveSessionWithDetails[]> {
    const sessionList = await db.select().from(liveSessions).where(eq(liveSessions.tutorId, tutorId)).orderBy(desc(liveSessions.startTime));
    const result: LiveSessionWithDetails[] = [];
    for (const s of sessionList) {
      const details = await this.getLiveSession(s.id);
      if (details) result.push(details);
    }
    return result;
  }

  async createLiveSession(insertSession: InsertLiveSession): Promise<LiveSession> {
    const result = await db.insert(liveSessions).values(insertSession as any).returning();
    return result[0];
  }

  async updateLiveSession(id: string, updates: Partial<LiveSession>): Promise<LiveSession | undefined> {
    const result = await db.update(liveSessions).set(updates).where(eq(liveSessions.id, id)).returning();
    return result[0];
  }

  // Recordings
  async createRecording(data: InsertSessionRecording): Promise<SessionRecording> {
    const result = await db.insert(sessionRecordings).values(data as any).returning();
    return result[0];
  }

  async getRecording(id: number): Promise<SessionRecording | undefined> {
    const result = await db.select().from(sessionRecordings).where(eq(sessionRecordings.id, id)).limit(1);
    return result[0];
  }

  async getRecordingsBySession(sessionId: string): Promise<SessionRecording[]> {
    return await db.select().from(sessionRecordings)
      .where(eq(sessionRecordings.sessionId, sessionId))
      .orderBy(desc(sessionRecordings.startedAt));
  }

  async getRecordingsByUser(userId: number): Promise<SessionRecording[]> {
    const asStudent = await db.select().from(sessionRecordings)
      .where(eq(sessionRecordings.studentId, userId))
      .orderBy(desc(sessionRecordings.startedAt));

    const instructorResult = await db.select().from(instructors)
      .where(eq(instructors.userId, userId)).limit(1);

    let asTutor: SessionRecording[] = [];
    if (instructorResult.length > 0) {
      asTutor = await db.select().from(sessionRecordings)
        .where(eq(sessionRecordings.tutorId, instructorResult[0].id))
        .orderBy(desc(sessionRecordings.startedAt));
    }

    const seen = new Set<number>();
    return [...asStudent, ...asTutor]
      .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  async updateRecording(id: number, updates: Partial<SessionRecording>): Promise<SessionRecording | undefined> {
    const result = await db.update(sessionRecordings).set(updates).where(eq(sessionRecordings.id, id)).returning();
    return result[0];
  }

  // Issues
  async createIssue(data: InsertSessionIssue): Promise<SessionIssue> {
    const result = await db.insert(sessionIssues).values(data as any).returning();
    return result[0];
  }

  async getIssuesByUser(userId: number): Promise<SessionIssue[]> {
    return await db.select().from(sessionIssues)
      .where(eq(sessionIssues.reportedBy, userId))
      .orderBy(desc(sessionIssues.createdAt));
  }

  async getIssuesBySession(sessionId: string): Promise<SessionIssue[]> {
    return await db.select().from(sessionIssues)
      .where(eq(sessionIssues.sessionId, sessionId))
      .orderBy(desc(sessionIssues.createdAt));
  }

  async updateIssue(id: number, updates: Partial<SessionIssue>): Promise<SessionIssue | undefined> {
    const result = await db.update(sessionIssues).set(updates).where(eq(sessionIssues.id, id)).returning();
    return result[0];
  }
}
