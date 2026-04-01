import { InstructorWithUser, User } from "@shared/schema";

// --- Vector Space Model Utilities ---

type Vector = number[];

function dotProduct(v1: Vector, v2: Vector): number {
    return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}

function magnitude(v: Vector): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(v1: Vector, v2: Vector): number {
    const mag1 = magnitude(v1);
    const mag2 = magnitude(v2);
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct(v1, v2) / (mag1 * mag2);
}

// --- Transformation Logic ---

const TEACHING_STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinaesthetic', 'Practical', 'Theory', 'Conversational', 'Coaching', 'Strategic'];

function encodeTeachingStyle(style: string | null): Vector {
    // One-hot encoding for teaching style
    // If style is null, return zero vector or uniform distribution? Zero for now.
    const vector = new Array(TEACHING_STYLES.length).fill(0);
    if (!style) return vector;

    const index = TEACHING_STYLES.findIndex(s => s.toLowerCase() === style.toLowerCase());
    if (index !== -1) {
        vector[index] = 1;
    }
    return vector;
}

// In a real NLP system, we would use word2vec or similar. 
// Here we build a "Bag of Words" vector based on the active vocabulary of the current context.
function getVocabulary(student: User, instructors: InstructorWithUser[]): string[] {
    const vocab = new Set<string>();

    // Add student interests
    (student.interests || []).forEach(i => vocab.add(i.toLowerCase().trim()));

    // Add instructor specialties
    instructors.forEach(inst => {
        inst.specialties.forEach(s => vocab.add(s.toLowerCase().trim()));
    });

    return Array.from(vocab).sort();
}

function encodeTextFeatures(tags: string[], vocabulary: string[]): Vector {
    // Multi-hot encoding
    const vector = new Array(vocabulary.length).fill(0);
    const tagSet = new Set(tags.map(t => t.toLowerCase().trim()));

    vocabulary.forEach((term, index) => {
        if (tagSet.has(term)) {
            vector[index] = 1;
        }
    });
    return vector;
}

// Normalize a scalar value to 0-1 range
function normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// --- Main Recommendation Function ---

export function getRecommendedInstructors(student: User, instructors: InstructorWithUser[]): InstructorWithUser[] {
    // 1. Build Vocabulary for Text Features (Interests/Specialties)
    const vocabulary = getVocabulary(student, instructors);

    // 2. Create Student Feature Vector parts
    const studentStyleVec = encodeTeachingStyle(student.learningStyle);
    const studentInterestsVec = encodeTextFeatures(student.interests || [], vocabulary);

    // Student "Ideal" vector for other dimensions:
    // Trust: We ideally want high trust.
    // Experience: We ideally want high experience.
    // Location: We ideally want a match.
    // We can treat these as weights or separate similarities.

    // For strict Vector Space Model, we treat the Student as a query vector.
    // But since "Experience" isn't a property of the student (student doesn't have "8 years experience"), 
    // we align dimensions by "Desirability".

    // Let's perform similarity on sub-vectors and weigh them, which is a common hybrid approach.

    const scores = instructors.map(instructor => {
        // A. Content Similarity (Style & Topics)
        const instructorStyleVec = encodeTeachingStyle(instructor.teachingStyle);
        const instructorTopicsVec = encodeTextFeatures(instructor.specialties, vocabulary);

        // Style Similarity (Cosine)
        // We map student 'Learning Style' to instructor 'Teaching Style'. 
        // Ideally we'd have a mapping matrix (Visual -> Visual = 1), but Cosine works if strings match.
        // Our seed data uses 'Visual' for both, so direct cosine is fine.
        // However, if Student is 'Visual' and Instructor is 'Theory', cosine is 0. 
        // We might want soft matching, but User asked for "Cosine Similarity", so hard vector orthogonality is actually the correct implementation of the math.
        const styleSim = cosineSimilarity(studentStyleVec, instructorStyleVec);

        // Topic Similarity (Cosine)
        const topicSim = cosineSimilarity(studentInterestsVec, instructorTopicsVec);

        // B. Numerical Features (Normalized)
        // Rating (0-5) -> 0-1
        const ratingVal = parseFloat(instructor.rating || "0");
        const ratingScore = normalize(ratingVal, 0, 5);

        // Experience (0-20 years) -> 0-1
        const expVal = parseInt(instructor.experience) || 0;
        const expScore = normalize(expVal, 0, 20);

        // Budget Fit
        // 1 - |(Rate - Budget)| / Max(Rate, Budget)
        // Use student's preferred budget, fallback to 1000 if not set
        const budget = student.preferredBudget || 1000;
        const rate = parseFloat(instructor.hourlyRate);
        const budgetDist = Math.abs(rate - budget) / Math.max(rate, budget, 1);
        const budgetScore = 1 - Math.min(budgetDist, 1);

        // Location (Binary/Categorical)
        const preferOnline = student.preferredMode === 'Online';
        const isOnline = instructor.mode === 'Online' || instructor.mode === 'Both';
        const locationMatch = (preferOnline && isOnline) || (student.bio && student.bio.includes(instructor.location || ""));
        const locationScore = locationMatch ? 1 : 0.2;

        // --- Weighted Combination ---
        // In pure ML, we'd learn these weights. Here we set heuristic weights.
        // We prioritize the Vector Similarities (Style & Topics) as the "ML" core.

        const finalScore =
            (styleSim * 0.30) +
            (topicSim * 0.30) +
            (ratingScore * 0.10) +
            (expScore * 0.10) +
            (budgetScore * 0.10) +
            (locationScore * 0.10);

        return { instructor, score: finalScore, details: { styleSim, topicSim, ratingScore } };
    });

    // Sort descending
    scores.sort((a, b) => b.score - a.score);

    return scores.map(s => s.instructor);
}

// --- Collaborative Filtering (Python Integration) ---
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getCollaborativeRecommendations(student: User, instructors: InstructorWithUser[]): Promise<InstructorWithUser[]> {
    try {
        // Path to python script
        const scriptPath = path.join(process.cwd(), 'server', 'ml', 'recommend.py');

        // Command to run python script
        // Ensure 'python' is in path, or use specific path if needed
        const { stdout } = await execAsync(`python "${scriptPath}" ${student.id}`);

        const recommendedIds: number[] = JSON.parse(stdout.trim());

        if (recommendedIds.length === 0) {
            // Cold Start: Fallback to Content-Based
            console.log("CF returned 0 results (Cold Start). using Content-Based.");
            return getRecommendedInstructors(student, instructors);
        }

        // Map IDs back to objects
        const recommendedInstructors = instructors.filter(i => recommendedIds.includes(i.id));

        // Sort them in the order Python returned them
        recommendedInstructors.sort((a, b) => {
            return recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id);
        });

        return recommendedInstructors;

    } catch (error) {
        console.error("Collaborative Filtering Failed:", error);
        // Fallback to Content-Based on error
        return getRecommendedInstructors(student, instructors);
    }
}
