import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";

export default function Checkout() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    country: "US"
  });

  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: ""
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/checkout", "POST", data),
    onSuccess: () => {
      toast({
        title: "Payment successful!",
        description: "You've been enrolled in the course. Welcome aboard!",
      });
      setLocation("/student-dashboard");
    },
    onError: () => {
      toast({
        title: "Payment failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === "billing") {
      setBillingInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === "card") {
      setCardInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const checkoutData = {
      courseId: parseInt(courseId || "0"),
      paymentMethod,
      billingInfo,
      cardInfo: paymentMethod === "card" ? cardInfo : null,
      amount: parseFloat(course?.price || "0"),
    };

    checkoutMutation.mutate(checkoutData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Course not found</p>
        </div>
      </div>
    );
  }

  const tax = parseFloat(course.price) * 0.08; // 8% tax
  const total = parseFloat(course.price) + tax;

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Complete Your Purchase</h1>
          <p className="text-xl text-slate-600">You're just one step away from starting your learning journey!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "card" ? "border-primary bg-primary/5" : "border-slate-200"
                      }`}
                    >
                      <div className="text-center">
                        <i className="fas fa-credit-card text-2xl mb-2"></i>
                        <p className="font-medium">Credit Card</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "paypal" ? "border-primary bg-primary/5" : "border-slate-200"
                      }`}
                    >
                      <div className="text-center">
                        <i className="fab fa-paypal text-2xl mb-2"></i>
                        <p className="font-medium">PayPal</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setPaymentMethod("apple")}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "apple" ? "border-primary bg-primary/5" : "border-slate-200"
                      }`}
                    >
                      <div className="text-center">
                        <i className="fab fa-apple text-2xl mb-2"></i>
                        <p className="font-medium">Apple Pay</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Details */}
              {paymentMethod === "card" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Card Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardInfo.cardNumber}
                        onChange={(e) => handleInputChange("card", "cardNumber", e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/YY"
                          value={cardInfo.expiryDate}
                          onChange={(e) => handleInputChange("card", "expiryDate", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          value={cardInfo.cvv}
                          onChange={(e) => handleInputChange("card", "cvv", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="John Doe"
                        value={cardInfo.cardName}
                        onChange={(e) => handleInputChange("card", "cardName", e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={billingInfo.fullName}
                        onChange={(e) => handleInputChange("billing", "fullName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={billingInfo.email}
                        onChange={(e) => handleInputChange("billing", "email", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      value={billingInfo.address}
                      onChange={(e) => handleInputChange("billing", "address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={billingInfo.city}
                        onChange={(e) => handleInputChange("billing", "city", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={billingInfo.zipCode}
                        onChange={(e) => handleInputChange("billing", "zipCode", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={billingInfo.country} onValueChange={(value) => handleInputChange("billing", "country", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-blue-700 text-lg py-6"
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Processing..." : `Complete Purchase - $${total.toFixed(2)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover" 
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{course.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{course.instructor?.user?.fullName}</p>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Course Price</span>
                    <span>${course.price}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <i className="fas fa-shield-alt mr-2"></i>
                    <span className="text-sm font-medium">30-Day Money Back Guarantee</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Not satisfied? Get a full refund within 30 days.
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-slate-600">
                    <i className="fas fa-check mr-2 text-green-500"></i>
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <i className="fas fa-check mr-2 text-green-500"></i>
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <i className="fas fa-check mr-2 text-green-500"></i>
                    <span>Direct instructor support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}