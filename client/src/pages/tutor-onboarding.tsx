import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { SkillInput } from "@/components/ui/skill-input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const STEPS = [
  "Basic Info",
  "Skills & Expertise",
  "Experience",
  "Style & Availability",
  "Pricing",
  "Profile"
];

const SUGGESTED_SKILLS = [
"C Programming","C++","Java","Python","JavaScript","TypeScript",
"Data Structures & Algorithms","Competitive Programming","Web Development",
"Frontend Development","Backend Development","Full Stack Development",
"React.js","Node.js","Express.js","Next.js","HTML","CSS","Tailwind CSS",
"Bootstrap","MongoDB","MySQL","PostgreSQL","Firebase","REST API",
"GraphQL","Git","GitHub","DevOps","Docker","Kubernetes",
"AWS","Azure","Google Cloud","Machine Learning","Deep Learning",
"Artificial Intelligence","Data Science","Data Analysis","Power BI",
"Tableau","Cybersecurity","Ethical Hacking","Blockchain","Web3",
"Android Development","Flutter","React Native",
"Drawing","Sketching","Painting","Digital Art","Graphic Design",
"Logo Design","UI Design","UX Design","Figma","Photoshop",
"Illustrator","Canva","Video Editing","Premiere Pro","After Effects",
"Animation","2D Animation","3D Animation","Motion Graphics",
"Photography","Photo Editing","Content Creation",
"Public Speaking","Communication Skills","English Speaking",
"Business Communication","Presentation Skills","Interview Preparation",
"Resume Building","Group Discussion","Personality Development",
"Confidence Building","Leadership Skills","Time Management",
"Problem Solving","Critical Thinking","Negotiation Skills",
"Networking Skills",
"Singing","Vocal Training","Guitar","Piano","Keyboard","Drums",
"Violin","Music Theory","Music Production","DJing",
"Classical Music","Western Music","Dance","Hip-Hop Dance",
"Classical Dance","Contemporary Dance","Acting","Theatre",
"Yoga","Meditation","Fitness Training","Gym Training",
"Home Workout","Nutrition","Diet Planning","Weight Loss",
"Mental Wellness","Mindfulness","Stress Management",
"Self Discipline","Habit Building",
"Entrepreneurship","Startup Building","Freelancing",
"Digital Marketing","Social Media Marketing","SEO",
"Content Marketing","Email Marketing","Affiliate Marketing",
"E-commerce","Dropshipping","Personal Branding","Sales",
"Business Strategy","Financial Literacy","Stock Market",
"Crypto Basics",
"Cooking","Baking","Gardening","Chess","Memory Techniques",
"Speed Reading","Handwriting Improvement","Calligraphy",
"Language Learning","Storytelling","Creative Writing",
"Blogging","Vlogging","YouTube Growth","Podcasting",
"Event Management","Anchoring","MS Excel","MS Word",
"PowerPoint","Email Writing","Typing Skills",
"Basic Computer Skills","Life Skills","Decision Making",
"Goal Setting"
];

const SUGGESTED_INTERESTS = ["Tech", "Music", "Fitness", "Communication", "Business", "Art", "Language"];
const SUGGESTED_LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];

export default function TutorOnboarding() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    skills: [] as string[],
    interests: [] as string[],
    skillLevel: "Intermediate",
    experience: "",
    bio: "",
    mode: "Online",
    languages: ["English"] as string[],
    availability: "",
    hourlyRate: "",
    freeDemo: false,
    whyMe: ""
  });

  const registerTutorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/auth/register-tutor", {
        ...data,
        experience: `${formData.skillLevel} - ${formData.experience}` // Composing experience text for backward compatibility
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({ title: "Welcome!", description: "Your creative tutor profile is ready." });
      setLocation("/instructor-dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  });

  const handleNext = () => {
    if (step === 0 && (!formData.fullName || !formData.email || !formData.password)) {
      return toast({ title: "Missing fields", description: "Please provide your basic info.", variant: "destructive" });
    }
    if (step === 1 && formData.skills.length === 0) {
      return toast({ title: "Skills required", description: "Add at least one skill you'd like to teach.", variant: "destructive" });
    }
    if (step === 2 && !formData.experience) {
      return toast({ title: "Experience required", description: "Please detail your experience.", variant: "destructive" });
    }
    if (step === 4 && !formData.hourlyRate) {
      return toast({ title: "Hourly rate required", description: "Please set your base hourly rate.", variant: "destructive" });
    }

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      registerTutorMutation.mutate(formData);
    }
  };

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center font-sans">
      <Card className="w-full max-w-2xl shadow-xl border-slate-200/60 rounded-xl overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <div className="flex justify-between items-center mb-6 text-sm font-medium text-slate-500">
            {STEPS.map((label, idx) => (
              <div key={label} className={`flex flex-col items-center flex-1 ${step >= idx ? "text-primary" : "text-slate-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${step >= idx ? "bg-primary text-white" : "bg-slate-200"}`}>
                  {idx + 1}
                </div>
                <span className="hidden sm:inline text-xs text-center">{label}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <CardContent className="p-8">
          <CardHeader className="px-0 pt-0 pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
              {STEPS[step]}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {step === 0 && "Let's start with your contact details so students can reach you."}
              {step === 1 && "What magic do you want to share? Add anything from Coding to Guitar."}
              {step === 2 && "Tell us about your background and how long you've been practicing."}
              {step === 3 && "How and when do you prefer to run your classes?"}
              {step === 4 && "Set a fair value for your time."}
              {step === 5 && "Give students a peek into your personality and teaching vibes."}
            </CardDescription>
          </CardHeader>

          <div className="space-y-6 min-h-[300px]">
            {step === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={formData.fullName} onChange={e => updateForm("fullName", e.target.value)} placeholder="e.g. Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="+91 99999 99999" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={e => updateForm("email", e.target.value)} placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={formData.password} onChange={e => updateForm("password", e.target.value)} placeholder="Secure password" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-3">
                  <Label>What would you like to teach? *</Label>
                  <SkillInput
                    tags={formData.skills}
                    setTags={(tags) => updateForm("skills", tags)}
                    suggestions={SUGGESTED_SKILLS}
                    placeholder="Type a skill..."
                  />
                  <p className="text-xs text-slate-500 font-medium">Search matching skills or type your own and press Enter.</p>
                </div>
                <div className="space-y-3 mt-6">
                  <Label>Broad Domains/Fields (Optional)</Label>
                  <TagInput
                    tags={formData.interests}
                    setTags={(tags) => updateForm("interests", tags)}
                    suggestions={SUGGESTED_INTERESTS}
                    placeholder="e.g. Technology, Art, Wellness..."
                  />
                  <p className="text-xs text-slate-500 font-medium">This helps us cluster you in broad searches!</p>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <Label>Your Proficiency Level</Label>
                  <Select value={formData.skillLevel} onValueChange={(val) => updateForm("skillLevel", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advanced Student">Advanced Student</SelectItem>
                      <SelectItem value="Intermediate">Intermediate Practitioner</SelectItem>
                      <SelectItem value="Advanced">Advanced Professional</SelectItem>
                      <SelectItem value="Expert/Master">Expert / Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label>Years of Experience *</Label>
                  <Input 
                    value={formData.experience} 
                    onChange={e => updateForm("experience", e.target.value)} 
                    placeholder="e.g. 5 Years playing Guitar, 2 Years tutoring" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teaching / Practice Detail</Label>
                  <Textarea 
                    rows={5}
                    value={formData.bio} 
                    onChange={e => updateForm("bio", e.target.value)} 
                    placeholder="Tell us a bit about your journey. Where did you learn? Have you taught others before?" 
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Teaching Mode</Label>
                    <Select value={formData.mode} onValueChange={(val) => updateForm("mode", val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online Only (Zoom/Meet)</SelectItem>
                        <SelectItem value="Offline">In-Person Only</SelectItem>
                        <SelectItem value="Both">Hybrid / Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Languages you can teach in</Label>
                  <TagInput
                    tags={formData.languages}
                    setTags={(tags) => updateForm("languages", tags)}
                    suggestions={SUGGESTED_LANGUAGES}
                    placeholder="Hit enter after each language"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Standard Availability</Label>
                  <Input 
                    value={formData.availability} 
                    onChange={e => updateForm("availability", e.target.value)} 
                    placeholder="e.g. Weekends 10AM - 5PM, Mon-Wed Evenings" 
                  />
                  <p className="text-xs text-slate-500">You can adjust specific slots in your dashboard later.</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-3">
                  <Label className="text-lg">Set your Base Hourly Rate (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 font-medium">₹</span>
                    <Input 
                      type="number" 
                      className="pl-8 text-lg font-semibold"
                      value={formData.hourlyRate} 
                      onChange={e => updateForm("hourlyRate", e.target.value)} 
                      placeholder="e.g. 800"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-slate-500">This is what your public profile will show. Custom deals can be negotiated.</p>
                </div>
                
                <div className="p-4 border rounded-lg bg-white shadow-sm flex items-start space-x-3 mt-8">
                  <Checkbox 
                    id="freeDemo"
                    checked={formData.freeDemo}
                    onCheckedChange={(c) => updateForm("freeDemo", c === true)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="freeDemo" className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Offer a 15-minute Free Intro / Demo
                    </label>
                    <p className="text-sm text-slate-500">
                      Highly recommended! Tutors who offer a free vibe-check chat get 3x more bookings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 <div className="space-y-2">
                  <Label>"What makes you a great tutor?"</Label>
                  <Textarea 
                    rows={3}
                    value={formData.whyMe} 
                    onChange={e => updateForm("whyMe", e.target.value)} 
                    placeholder="e.g. I focus on practical projects rather than theory. I'm very patient with beginners!" 
                  />
                </div>
                
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-4 mt-6 items-center flex-col sm:flex-row text-center sm:text-left">
                  <div className="h-16 w-16 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-2xl font-bold">
                       {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : "👤"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-lg">Almost Done!</h4>
                    <p className="text-sm text-slate-600">You can upload a custom profile picture from your dashboard settings after completing registration.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 0 || registerTutorMutation.isPending}
            >
              Back
            </Button>
            <Button 
              type="button" 
              onClick={handleNext}
              className="px-8 shadow-md"
              disabled={registerTutorMutation.isPending}
            >
              {registerTutorMutation.isPending ? "Setting up..." : (step === STEPS.length - 1 ? "Launch Profile 🚀" : "Continue")}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Absolute positioning for Login redirect */}
      <div className="absolute top-6 right-6">
         <Button variant="ghost" onClick={() => setLocation("/auth")}>Back to Login</Button>
      </div>
    </div>
  );
}
