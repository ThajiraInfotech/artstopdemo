import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { authApi } from "../lib/api";
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || "/";

  // Auth states
  const [step, setStep] = useState("email"); // "email" | "otp" | "signup"
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState(""); // "login" | "signup"
  const [countdown, setCountdown] = useState(0);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("artstop_token");
    const user = localStorage.getItem("artstop_user");

    console.log("Auth check:", { hasToken: !!token, hasUser: !!user, from });

    // If already authenticated, show a message or redirect to profile
    if (token && user) {
      setStep("authenticated");
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.sendOTP({ email });

      setPurpose(response.data.purpose);
      setStep("otp");

      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${email}`,
      });

      // Log OTP in development (console only, not shown to user)
      if (import.meta.env.DEV && response.data.otp) {
        console.log("Development OTP:", response.data.otp);
      }

      // Start countdown for resend (60 seconds)
      setCountdown(60);

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    // Validate name for signup
    if (purpose === "signup") {
      if (!name || name.trim().length < 2) {
        toast({
          title: "Name Required",
          description: "Please enter your full name (minimum 2 characters).",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const requestData = {
        email,
        otp,
        ...(name.trim() && { name: name.trim() })
      };

      console.log("OTP Verification Request:", { purpose, name, requestData });

      const response = await authApi.verifyOTP(requestData);

      // Clear ALL localStorage to ensure no old tokens remain, then store new token and user data
      localStorage.clear();

      if (response.data.token && response.data.user) {
        localStorage.setItem("artstop_token", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("artstop_refresh_token", response.data.refreshToken);
        }
        localStorage.setItem("artstop_user", JSON.stringify(response.data.user));
      } else {
        throw new Error('Invalid response from server');
      }

      toast({
        title: response.data.isNewUser ? "Welcome!" : "Welcome Back!",
        description: response.data.isNewUser ? "Account created successfully" : "Login successful",
      });

      // Trigger auth update event
      window.dispatchEvent(new CustomEvent('authUpdated'));

      // Redirect to intended page
      navigate(from, { replace: true });

    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const response = await authApi.resendOTP({ email });

      toast({
        title: "OTP Resent",
        description: `New verification code sent to ${email}`,
      });

      setCountdown(60);

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setName("");
    setPurpose("");
    setCountdown(0);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-10 w-auto"
            />
            <h1 className="text-2xl font-bold text-gray-900">ArtStop</h1>
          </div>
          <p className="text-gray-600">Your One-Stop Shop for Artistic Creations</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {step === "email" && "Welcome to ArtStop"}
              {step === "otp" && purpose === "login" && "Sign In"}
              {step === "otp" && purpose === "signup" && "Create Account"}
              {step === "authenticated" && "Already Logged In"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Continue with Email"
                  )}
                </Button>
              </form>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change email
                </button>

                {/* Email display */}
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">OTP sent to</p>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>

                {/* Name field - only for signup */}
                {purpose === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name (required)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                )}

                {/* OTP field */}
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : purpose === "signup" ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || resendLoading}
                    className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="inline mr-1 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend OTP in ${countdown}s`
                    ) : (
                      "Didn't receive code? Resend OTP"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Authenticated message */}
            {step === "authenticated" && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Already Logged In</h3>
                  <p className="text-gray-600">You are already authenticated.</p>
                </div>
                <Button onClick={() => navigate(from || "/")} className="bg-indigo-600 hover:bg-indigo-700">
                  Continue to Site
                </Button>
              </div>
            )}

            {/* Success message */}
            {step === "success" && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {purpose === "signup" ? "Account Created!" : "Welcome Back!"}
                  </h3>
                  <p className="text-gray-600">
                    {purpose === "signup"
                      ? "Your account has been created successfully."
                      : "You have been logged in successfully."
                    }
                  </p>
                </div>
                <p className="text-sm text-gray-500">Redirecting...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;