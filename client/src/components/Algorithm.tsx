import React, { useState } from 'react';

// --- DUMMY DATA ---
// Data is updated with more nuanced teaching styles.
const tutors = [
    { name: "Aarav Sharma", subjects: ["Mathematics", "Physics"], teaching_style: "Theory", location: "Mumbai", mode: "Offline", trust_score: 90, experience_years: 3, interests: ["chess", "music"], hourly_rate: 750 },
     { name: "Sarthak Avhad", subjects: ["Mathematics"], teaching_style: "Theory", location: "Pune", mode: "Online", trust_score: 90, experience_years: 6, interests: ["chess", "music"], hourly_rate: 800 },
    { name: "Riya Gupta", subjects: ["Mathematics", "English"], teaching_style: "Storytelling", location: "Pune", mode: "Online", trust_score: 85, experience_years: 5, interests: ["painting", "reading"], hourly_rate: 600 },
    { name: "Krutika Bhere", subjects: ["Chess"], teaching_style: "Strategic", location: "Mumbai", mode: "Offline", trust_score: 95, experience_years: 6, interests: ["logic puzzles", "coding"], hourly_rate: 900 },
    { name: "Priya Singh", subjects: ["Chemistry", "Biology"], teaching_style: "Visual", location: "Delhi", mode: "Online", trust_score: 88, experience_years: 4, interests: ["gardening", "yoga"], hourly_rate: 700 },
    { name: "Rohan Joshi", subjects: ["History", "Geography"], teaching_style: "Storytelling", location: "Mumbai", mode: "Offline", trust_score: 92, experience_years: 7, interests: ["hiking", "photography"], hourly_rate: 850 },
    { name: "Sneha Reddy", subjects: ["Computer Science", "Coding"], teaching_style: "Practical", location: "Bangalore", mode: "Online", trust_score: 98, experience_years: 8, interests: ["coding", "gaming"], hourly_rate: 1000 },
    { name: "Vikram Kumar", subjects: ["Guitar", "Music"], teaching_style: "Kinaesthetic", location: "Chennai", mode: "Online", trust_score: 80, experience_years: 2, interests: ["astronomy", "reading", "music"], hourly_rate: 550 },
    { name: "Rudrakshi Bhandare", subjects: ["English", "Acting"], teaching_style: "Conversational", location: "Mumbai", mode: "Offline", trust_score: 93, experience_years: 5, interests: ["travel", "languages", "theatre"], hourly_rate: 800 },
    { name: "Sameer Khan", subjects: ["Sports", "Fitness"], teaching_style: "Coaching", location: "Pune", mode: "Offline", trust_score: 87, experience_years: 4, interests: ["sports", "fitness", "nutrition"], hourly_rate: 650 },
    { name: "Nisha Patel", subjects: ["Mathematics", "Chess"], teaching_style: "Theory", location: "Delhi", mode: "Online", trust_score: 91, experience_years: 6, interests: ["logic puzzles", "sudoku"], hourly_rate: 950 },
    { name: "Arjun Desai", subjects: ["Dancing", "Choreography"], teaching_style: "Kinaesthetic", location: "Bangalore", mode: "Online", trust_score: 89, experience_years: 3, interests: ["writing", "music", "dancing"], hourly_rate: 720 },
    { name: "Aditi Rao", subjects: ["Chemistry"], teaching_style: "Visual", location: "Mumbai", mode: "Offline", trust_score: 96, experience_years: 9, interests: ["cooking", "chess", "theatre"], hourly_rate: 1100 }
];

//---

// 1. Style Compatibility Matrix: Defines how well student learning styles
//    match with tutor teaching styles. (1 = perfect match, 0.2 = poor match)
const styleCompatibilityMatrix = {
    'Visual': { 'Visual': 1, 'Practical': 0.8, 'Storytelling': 0.7, 'Theory': 0.4, 'Kinaesthetic': 0.3, 'Conversational': 0.2, 'Strategic': 0.4, 'Coaching': 0.5 },
    'Auditory': { 'Conversational': 1, 'Storytelling': 0.9, 'Theory': 0.7, 'Music': 0.8, 'Auditory': 1, 'Practical': 0.4, 'Visual': 0.2, 'Kinaesthetic': 0.3 },
    'Reading/Writing': { 'Theory': 1, 'Strategic': 0.8, 'Conversational': 0.7, 'Storytelling': 0.5, 'Practical': 0.3, 'Visual': 0.2 },
    'Kinaesthetic': { 'Kinaesthetic': 1, 'Practical': 0.9, 'Coaching': 0.8, 'Visual': 0.5, 'Storytelling': 0.3, 'Theory': 0.2, 'Conversational': 0.4 }
};

// --- Gooroo Algorithm Implementation ---
function goorooMatchScore(student, tutor) {
    // Hard Filters
    if (!tutor.subjects.some(subj => student.subject_interest.toLowerCase().includes(subj.toLowerCase()) || subj.toLowerCase().includes(student.subject_interest.toLowerCase()))) return 0;
    if (tutor.mode !== student.mode) return 0;
    if (tutor.hourly_rate > student.budget * 1.2) return 0;

    // Style Compatibility
    const compatibility = styleCompatibilityMatrix[student.learning_style] || {};
    const style_match = compatibility[tutor.teaching_style] || 0.3;

    // Interest Overlap
    const studentInterests = new Set(student.interests.map(i => i.trim().toLowerCase()));
    const tutorInterests = new Set(tutor.interests.map(i => i.trim().toLowerCase()));
    const commonInterests = [...studentInterests].filter(interest => tutorInterests.has(interest));
    const interest_overlap = commonInterests.length / Math.max(1, studentInterests.size);

    // Location
    const location_match = student.mode === "Online" ? 1 : (student.location === tutor.location ? 1 : 0.1);

    // Trust & Experience
    const trust = tutor.trust_score / 100;
    const experience = Math.min(1, tutor.experience_years / 10);

    // Budget fit (closer is better)
    const budget_fit = Math.max(0, 1 - Math.abs(tutor.hourly_rate - student.budget) / student.budget);

    // Weighted score (Gooroo style)
    const score =
        style_match * 0.35 +
        interest_overlap * 0.15 +
        trust * 0.15 +
        experience * 0.10 +
        location_match * 0.10 +
        budget_fit * 0.15;

    return score;
}

// --- Softmax Normalization ---
function softmax(scores) {
    const max = Math.max(...scores);
    const expScores = scores.map(s => Math.exp(s - max));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    return expScores.map(e => e / sumExp);
}

export default function TutorMatcher() {
    // State to hold student's preferences from the form
    const [student, setStudent] = useState({
        subject_interest: 'Chess',
        learning_style: 'Reading/Writing',
        location: 'Mumbai',
        mode: 'Offline',
        interests: 'logic puzzles, coding',
        budget: 1000,
    });
    
    // State to hold the ranked list of tutors after calculation
    const [rankedTutors, setRankedTutors] = useState([]);
    // State to track if a search has been performed
    const [searchPerformed, setSearchPerformed] = useState(false);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStudent(prev => ({ ...prev, [name]: value }));
    };

    const findBestTutors = (e) => {
        e.preventDefault(); // Prevent form from reloading the page
        
        const studentDataForCalc = {
           ...student,
           interests: student.interests.split(',').map(i => i.trim())
        };

        // Calculate raw scores
        const scoredTutors = tutors.map(tutor => ({
            ...tutor,
            raw_score: goorooMatchScore(studentDataForCalc, tutor)
        }));

        // Normalize scores
        const rawScores = scoredTutors.map(t => t.raw_score);
        const normScores = softmax(rawScores);

        // Attach normalized score
        const tutorsWithNorm = scoredTutors.map((tutor, i) => ({
            ...tutor,
            match_score: tutor.raw_score > 0 ? normScores[i] : 0
        }));

        const sortedTutors = tutorsWithNorm
            .filter(tutor => tutor.match_score > 0) // Only show tutors who are a potential match
            .sort((a, b) => b.match_score - a.match_score);

        setRankedTutors(sortedTutors);
        setSearchPerformed(true); // Mark that a search has happened
    };

    // --- Score Breakdown Helper ---
    const getBreakdown = (student, tutor) => {
        const compatibility = styleCompatibilityMatrix[student.learning_style] || {};
        const style_match = compatibility[tutor.teaching_style] || 0.3;
        const studentInterests = new Set(student.interests.map(i => i.trim().toLowerCase()));
        const tutorInterests = new Set(tutor.interests.map(i => i.trim().toLowerCase()));
        const commonInterests = [...studentInterests].filter(interest => tutorInterests.has(interest));
        const interest_overlap = commonInterests.length / Math.max(1, studentInterests.size);
        const location_match = student.mode === "Online" ? 1 : (student.location === tutor.location ? 1 : 0.1);
        const trust = tutor.trust_score / 100;
        const experience = Math.min(1, tutor.experience_years / 10);
        const budget_fit = Math.max(0, 1 - Math.abs(tutor.hourly_rate - student.budget) / student.budget);

        return [
            { label: "Style Compatibility", value: style_match, weight: 0.35 },
            { label: "Interest Overlap", value: interest_overlap, weight: 0.15 },
            { label: "Trust Score", value: trust, weight: 0.15 },
            { label: "Experience", value: experience, weight: 0.10 },
            { label: "Location Match", value: location_match, weight: 0.10 },
            { label: "Budget Fit", value: budget_fit, weight: 0.15 }
        ];
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-800">Tutor Match</h1>
                    <p className="text-slate-600 mt-2">Find your ideal instructor using our advanced matching algorithm.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- Input Form --- */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-semibold text-slate-700 mb-6">Your Preferences</h2>
                        <form onSubmit={findBestTutors} className="space-y-4">
                            <div>
                                <label htmlFor="subject_interest" className="block text-sm font-medium text-slate-600">Subject</label>
                                <input type="text" name="subject_interest" id="subject_interest" value={student.subject_interest} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="learning_style" className="block text-sm font-medium text-slate-600">Primary Learning Style</label>
                                <select name="learning_style" id="learning_style" value={student.learning_style} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option>Visual</option>
                                    <option>Auditory</option>
                                    <option>Reading/Writing</option>
                                    <option>Kinaesthetic</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-slate-600">Location</label>
                                <input type="text" name="location" id="location" value={student.location} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="mode" className="block text-sm font-medium text-slate-600">Mode</label>
                                <select name="mode" id="mode" value={student.mode} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option>Offline</option>
                                    <option>Online</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="interests" className="block text-sm font-medium text-slate-600">Interests (comma separated)</label>
                                <input type="text" name="interests" id="interests" value={student.interests} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="budget" className="block text-sm font-medium text-slate-600">Max Hourly Budget (₹)</label>
                                <input type="number" name="budget" id="budget" value={student.budget} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                                Find Instructors
                            </button>
                        </form>
                    </div>

                    {/* --- Results Display --- */}
                    <div className="lg:col-span-2">
                         {!searchPerformed ? (
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 text-center h-full flex flex-col justify-center">
                               <h3 className="text-xl font-semibold text-slate-700">Your results will appear here</h3>
                               <p className="text-slate-500 mt-2">Fill out the form and click "Find Instructors" to see your matches!</p>
                            </div>
                         ) : rankedTutors.length > 0 ? (
                            <div className="space-y-6">
                                {/* Top Match Summary */}
                                <div className="bg-indigo-50 p-5 rounded-xl shadow border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-indigo-800">{rankedTutors[0].name} <span className="text-base text-indigo-600 font-normal">is your top match!</span></h3>
                                        <p className="text-slate-600">{rankedTutors[0].subjects.join(', ')} • {rankedTutors[0].experience_years} years exp.</p>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <div className="text-4xl font-extrabold text-indigo-600">
                                            {Math.round(rankedTutors[0].match_score * 100)}%
                                        </div>
                                        <p className="text-sm text-slate-500">Match Score</p>
                                        <p className="font-semibold text-slate-700 mt-1">₹{rankedTutors[0].hourly_rate}/hr</p>
                                    </div>
                                </div>
                                {/* All Matches */}
                                {rankedTutors.map(tutor => (
                                    <div key={tutor.name} className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-transform hover:scale-[1.02]">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{tutor.name}</h3>
                                            <p className="text-slate-500 text-sm">{tutor.subjects.join(', ')} • {tutor.experience_years} years exp.</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{tutor.teaching_style}</span>
                                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">{tutor.mode}</span>
                                                 <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">{tutor.location}</span>
                                            </div>
                                            {/* Score Breakdown */}
                                            <details className="mt-2">
                                                <summary className="text-xs text-indigo-600 cursor-pointer">Score Breakdown</summary>
                                                <ul className="text-xs text-slate-600 mt-1">
                                                    {getBreakdown({
                                                        ...student,
                                                        interests: student.interests.split(',').map(i => i.trim())
                                                    }, tutor).map(b => (
                                                        <li key={b.label}>
                                                            <span className="font-semibold">{b.label}:</span> {(b.value * 100).toFixed(0)}% <span className="text-slate-400">(weight {Math.round(b.weight * 100)}%)</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <div className="text-3xl font-extrabold text-indigo-600">
                                                {Math.round(tutor.match_score * 100)}%
                                            </div>
                                            <p className="text-sm text-slate-500">Match Score</p>
                                            <p className="font-semibold text-slate-700 mt-1">₹{tutor.hourly_rate}/hr</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : (
                             <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 text-center h-full flex flex-col justify-center">
                                <h3 className="text-xl font-semibold text-red-600">No Tutors Found</h3>
                                <p className="text-slate-500 mt-2">We couldn't find any instructors matching your criteria. Please try broadening your search.</p>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}

