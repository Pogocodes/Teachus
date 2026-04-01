import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertUser } from "@shared/schema";
import { useLocation } from "wouter";

import { useAuth } from "@/hooks/use-auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginMutation, registerMutation, user } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "student",
    confirmPassword: "",
    preferredBudget: "",
    interests: ""
  });

  useEffect(() => {
    if (user) {
      setLocation(user.role === "instructor" ? "/instructor-dashboard" : "/student-dashboard");
    }
  }, [user, setLocation]);

  // Redirect if already logged in
  if (user) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure both passwords are the same",
          variant: "destructive",
        });
        return;
      }

      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        ...(formData.role === "student" && {
          ...(formData.preferredBudget && { preferredBudget: parseInt(formData.preferredBudget) }),
          interests: formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(i => i.length > 0) : []
        })
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">
            {isLogin ? "Welcome Back" : "Join TeachUs"}
          </CardTitle>
          <p className="text-slate-600">
            {isLogin
              ? "Sign in to continue your learning journey"
              : "Create your account to start learning"
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferredBudget">Preferred Hourly Budget (₹)</Label>
                  <Input
                    id="preferredBudget"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.preferredBudget}
                    onChange={(e) => handleInputChange("preferredBudget", e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional: Help us recommend instructors within your budget</p>
                </div>
                <div>
                  <Label htmlFor="interests">Interests (comma separated)</Label>
                  <Input
                    id="interests"
                    type="text"
                    placeholder="e.g., Python, Guitar, Physics"
                    value={formData.interests}
                    onChange={(e) => handleInputChange("interests", e.target.value)}
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-blue-700"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {(loginMutation.isPending || registerMutation.isPending)
                ? "Please wait..."
                : (isLogin ? "Sign In" : "Create Account")
              }
            </Button>
          </form>

          <div className="mt-6 text-center space-y-6">
            <p className="text-slate-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-3 font-medium">Have skills to share with the world?</p>
              <Button 
                variant="outline" 
                className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 font-semibold"
                onClick={() => setLocation("/tutor-onboarding")}
                type="button"
              >
                Become a Tutor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}