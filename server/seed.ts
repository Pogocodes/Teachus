import { DbStorage } from "./dbStorage";
import { insertUserSchema, insertInstructorSchema, insertCourseSchema, insertCategorySchema } from "@shared/schema";

const storage = new DbStorage();

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

  try {
    // Create categories
    console.log("Creating categories...");
    const categories = [
      { name: "Programming", icon: "fas fa-code" },
      { name: "Design", icon: "fas fa-palette" },
      { name: "Music", icon: "fas fa-music" },
      { name: "Mathematics", icon: "fas fa-calculator" },
      { name: "Languages", icon: "fas fa-language" },
      { name: "Business", icon: "fas fa-briefcase" },
    ];

    // Check if categories exist
    const existingCategories = await storage.getCategories();
    if (existingCategories.length === 0) {
      for (const cat of categories) {
        await storage.createCategory(cat);
      }
      console.log("Categories created.");
    } else {
      console.log("Categories already exist, skipping...");
    }

    // Create users (Indian Context)
    console.log("Creating users...");
    const { hashPassword } = await import("./auth");
    const defaultPassword = await hashPassword("password");

    const users = [
      { username: "aarav_sharma", email: "aarav@example.com", password: defaultPassword, fullName: "Aarav Sharma", role: "instructor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d", bio: "Senior Full-Stack Developer with 8+ years experience. Ex-Flipkart & Swiggy." },
      { username: "priya_singh", email: "priya@example.com", password: defaultPassword, fullName: "Priya Singh", role: "instructor", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e2", bio: "Lead UX Designer with 6+ years. NID Alumnus." },
      { username: "rohan_joshi", email: "rohan@example.com", password: defaultPassword, fullName: "Rohan Joshi", role: "instructor", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e", bio: "Classical Musician & Guitarist. 15+ years performing in Mumbai." },
      { username: "sana_mir", email: "sana@example.com", password: defaultPassword, fullName: "Sana Mir", role: "instructor", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956", bio: "IIM Ahmedabad MBA, Strategy Consultant." },
      { username: "vikram_patel", email: "vikram@example.com", password: defaultPassword, fullName: "Vikram Patel", role: "instructor", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e", bio: "Mathematics Expert & competitive coding coach." },
      // Student
      {
        username: "viraj_student",
        email: "viraj@example.com",
        password: defaultPassword,
        fullName: "Viraj Bhabad",
        role: "student",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocLpqtPcXfluur0AZyYEZ1Bd2q8OmrkBVaMVv2Itwb2e2Quir15tdA=s360-c-no",
        bio: "Aspiring Tech Lead",
        learningStyle: "Visual",
        interests: ["coding", "design", "startup"],
        preferredMode: "Online",
        preferredBudget: 1200
      },
    ];

    const createdUsers = [];
    for (const user of users) {
      const createdUser = await storage.createUser(user);
      createdUsers.push(createdUser);
    }

    // Create instructors (Indian Context)
    console.log("Creating instructors...");
    const instructors = [
      {
        userId: createdUsers[0].id,
        title: "Senior Full-Stack Developer",
        experience: "8 years",
        specialties: ["Python", "JavaScript", "React", "Node.js", "System Design"],
        hourlyRate: "1200",
        teachingStyle: "Practical",
        location: "Bangalore",
        mode: "Online",
        languages: ["English", "Hindi"]
      },
      {
        userId: createdUsers[1].id,
        title: "Lead UX Designer",
        experience: "6 years",
        specialties: ["UI/UX", "Figma", "User Research"],
        hourlyRate: "1000",
        teachingStyle: "Visual",
        location: "Mumbai",
        mode: "Online",
        languages: ["English", "Hindi", "Marathi"]
      },
      {
        userId: createdUsers[2].id,
        title: "Professional Musician",
        experience: "15 years",
        specialties: ["Guitar", "Flute", "Music Theory"],
        hourlyRate: "800",
        teachingStyle: "Kinaesthetic",
        location: "Pune",
        mode: "Offline",
        languages: ["English", "Hindi", "Marathi"]
      },
      {
        userId: createdUsers[3].id,
        title: "Business Strategy Consultant",
        experience: "10 years",
        specialties: ["Strategy", "Finance", "Marketing"],
        hourlyRate: "2000",
        teachingStyle: "Theory",
        location: "Delhi",
        mode: "Online",
        languages: ["English", "Urdu"]
      },
      {
        userId: createdUsers[4].id,
        title: "Competitive Coding Coach",
        experience: "5 years",
        specialties: ["C++", "Algorithms", "Data Structures"],
        hourlyRate: "1500",
        teachingStyle: "Practical",
        location: "Hyderabad",
        mode: "Online",
        languages: ["English", "Telugu"]
      },
    ];

    const createdInstructors = [];
    for (const instructor of instructors) {
      const createdInstructor = await storage.createInstructor(instructor);
      createdInstructors.push(createdInstructor);
    }

    // Create courses
    console.log("Creating courses...");
    const courses = [
      {
        title: "Complete Web Development Bootcamp",
        description: "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.",
        instructorId: createdInstructors[0].id,
        categoryId: 1,
        price: "99",
        duration: 40,
        level: "beginner",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        isOnline: true,
        isOffline: false,
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Master the fundamentals of user interface and user experience design with hands-on projects.",
        instructorId: createdInstructors[1].id,
        categoryId: 2,
        price: "79",
        duration: 35,
        level: "intermediate",
        thumbnail: "https://images.unsplash.com/photo-1559028006-448665bd7c7f",
        isOnline: true,
        isOffline: true,
      },
      {
        title: "Guitar for Beginners",
        description: "Learn to play guitar from scratch with step-by-step lessons and practice exercises.",
        instructorId: createdInstructors[2].id,
        categoryId: 3,
        price: "59",
        duration: 25,
        level: "beginner",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
        isOnline: true,
        isOffline: true,
      },
    ];

    const createdCourses = [];
    for (const course of courses) {
      const createdCourse = await storage.createCourse(course);
      createdCourses.push(createdCourse);
    }

    // Create Enrollments
    console.log("Creating enrollments...");
    const enrollmentsArr = [
      { studentId: createdUsers[5].id, courseId: createdCourses[0].id, enrolledAt: new Date('2023-01-15') }, // Student enrolled in Course 1
      { studentId: createdUsers[5].id, courseId: createdCourses[2].id, enrolledAt: new Date('2023-02-20') }, // Student enrolled in Course 3
    ];

    for (const enrollment of enrollmentsArr) {
      await storage.createEnrollment(enrollment);
    }

    // Create Interactions for Collaborative Filtering
    // Pattern:
    // Viraj (ID: 6) likes Instructor 1 & 2.
    // User 7 (Simulated) likes Instructor 1, 2, & 3. -> Should recommend 3 to Viraj.

    console.log("Creating simulated users and interactions...");

    // Create extra dummy users for CF
    const cfUsers = [
      { username: "sim_user_1", email: "sim1@example.com", password: defaultPassword, fullName: "Sim User 1", role: "student" },
      { username: "sim_user_2", email: "sim2@example.com", password: defaultPassword, fullName: "Sim User 2", role: "student" },
    ];

    const createdCfUsers = [];
    for (const u of cfUsers) {
      createdCfUsers.push(await storage.createUser(u));
    }

    const interactionsArr = [
      // Viraj (ID: 6)
      { userId: createdUsers[5].id, instructorId: instructors[0].userId, type: 'view' },
      { userId: createdUsers[5].id, instructorId: instructors[1].userId, type: 'booking' },

      // Sim User 1 (Similar to Viraj, also likes Instructor 2 (Priya Singh ID:2) and Instructor 3 (Rohan Joshi ID:3))
      { userId: createdCfUsers[0].id, instructorId: instructors[0].userId, type: 'view' },
      { userId: createdCfUsers[0].id, instructorId: instructors[1].userId, type: 'booking' },
      { userId: createdCfUsers[0].id, instructorId: instructors[2].userId, type: 'booking' }, // Recommend checking Rohan

      // Sim User 2 (Also likes Priya and Rohan)
      { userId: createdCfUsers[1].id, instructorId: instructors[1].userId, type: 'view' },
      { userId: createdCfUsers[1].id, instructorId: instructors[2].userId, type: 'booking' },
    ];

    for (const interaction of interactionsArr) {
      // We need to map instructor userId to actual instructor ID
      // instructors array above has 'userId' but we need the 'id' from database
      // We can fetch it or just use the storage.getInstructorByUserId
      const instructor = await storage.getInstructorByUserId(interaction.instructorId);
      if (instructor) {
        await storage.createInteraction({
          userId: interaction.userId,
          instructorId: instructor.id,
          type: interaction.type,
          rating: interaction.type === 'booking' ? 5 : 1
        });
      }
    }

    // Create sample enrollment (old one, adjusted to use createdCourses)
    console.log("Creating sample enrollment...");
    await storage.createEnrollment({
      studentId: createdUsers[4].id, // Vikram Patel
      courseId: createdCourses[0].id, // Complete Web Development Bootcamp
    });

    // Create sample review
    console.log("Creating sample review...");
    await storage.createReview({
      studentId: createdUsers[4].id,
      courseId: createdCourses[0].id,
      instructorId: createdInstructors[0].id,
      rating: 5,
      comment: "John's web development course was exactly what I needed. His teaching style is clear and he provides great real-world examples. I landed my first developer job within 3 months!",
    });

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
// Run seeding
seedDatabase()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:");
    console.error(error);
    process.exit(1);
  });

export { seedDatabase };
