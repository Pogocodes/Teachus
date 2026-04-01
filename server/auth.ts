import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { IStorage } from "./storage";
import { User } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(supplied: string, stored: string): Promise<boolean> {
  // Support plain-text passwords from old seed data gracefully during transition
  if (!stored.startsWith("$2b$") && !stored.startsWith("$2a$")) {
    return supplied === stored;
  }
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express, storage: IStorage) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "skillspark_secret_key_2024",
    resave: false,
    saveUninitialized: false,
    store: new session.MemoryStore(),
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.getUserByUsername(email);
        }
        if (!user) {
          return done(null, false, { message: "No account found with that email." });
        }
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { fullName, email, password, role } = req.body;

      if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "fullName, email, password and role are required." });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }

      // Generate username from email
      const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") + "_" + Date.now().toString().slice(-4);
      const hashedPassword = await hashPassword(password);

      const newUser = await storage.createUser({
        fullName,
        email,
        username,
        password: hashedPassword,
        role,
        avatar: null,
        bio: null,
      });

      // Auto-create instructor profile if role is instructor/tutor
      if (role === "instructor") {
        await storage.createInstructor({
          userId: newUser.id,
          title: "New Instructor",
          experience: "0 years",
          specialties: [],
          hourlyRate: "500",
          teachingStyle: null,
          location: null,
          mode: "Online",
          languages: ["English"],
        });
      }

      // Auto-create student profile if role is student
      if (role === "student") {
        const { preferredBudget, interests } = req.body;
        await storage.createStudent({
          userId: newUser.id,
          learningStyle: null,
          interests: Array.isArray(interests) ? interests : (interests ? [interests] : []),
          preferredMode: null,
          preferredBudget: preferredBudget ? parseInt(preferredBudget) : null,
          educationLevel: null,
          city: null,
        });
      }

      req.login(newUser, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = newUser as any;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/auth/register-tutor
  app.post("/api/auth/register-tutor", async (req, res, next) => {
    try {
      const {
        fullName, email, password, phone,
        skills, interests, 
        experience, bio,
        mode, languages, availability,
        hourlyRate, freeDemo, whyMe
      } = req.body;

      if (!fullName || !email || !password || !skills || !experience || !hourlyRate) {
        return res.status(400).json({ message: "Required fields missing." });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }

      const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") + "_" + Date.now().toString().slice(-4);
      const hashedPassword = await hashPassword(password);

      const newUser = await storage.createUser({
        fullName,
        email,
        username,
        password: hashedPassword,
        role: "instructor",
        avatar: null,
        bio: bio || null,
        phone: phone || null,
        learningStyle: null,
        interests: interests || [],
        preferredMode: null,
        preferredBudget: null
      });

      await storage.createInstructor({
        userId: newUser.id,
        title: "Tutor",
        experience,
        specialties: skills,
        hourlyRate: hourlyRate.toString(),
        teachingStyle: null,
        location: null,
        mode: mode || "Online",
        languages: languages || ["English"],
        freeDemo: freeDemo || false,
        availability: availability || { days: [], times: [] },
        whyMe: whyMe || null
      });

      req.login(newUser, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = newUser as any;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password: _, ...safeUser } = user as any;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // GET /api/user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...safeUser } = req.user as any;
    res.json(safeUser);
  });
}
