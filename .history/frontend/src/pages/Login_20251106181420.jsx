import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { authApi } from '../lib/api';

const Login = () => {
  const [formData, setFormData] = useState({
      email: ''
    });
   const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [isVerificationSent, setIsVerificationSent] = useState(false);
   const [verificationCode, setVerificationCode] = useState('');
   const { toast } = useToast();
   const navigate = useNavigate();
   const location = useLocation();

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendVerification = async () => {
     if (!formData.email) {
       toast({
         title: "Email required",
         description: "Please enter your email address first.",
         variant: "destructive",
       });
       return;
     }

     // Email validation
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(formData.email)) {
       toast({
         title: "Invalid email",
         description: "Please enter a valid email address.",
         variant: "destructive",
       });
       return;
     }

     setIsLoading(true);

     try {
       const response = await authApi.sendOTP({ email: formData.email });
       setIsVerificationSent(true);
       toast({
         title: "Verification Code Sent!",
         description: response.message || "Please check your email for the verification code.",
       });
     } catch (error) {
       toast({
         title: "Failed to send OTP",
         description: error.message || "Please try again.",
         variant: "destructive",
       });
     } finally {
       setIsLoading(false);
     }
   };

  const handleSubmit = async (e) => {
     e.preventDefault();
     setIsLoading(true);

     // Basic validation
     if (!formData.email) {
       toast({
         title: "Email required",
         description: "Email is required.",
         variant: "destructive",
       });
       setIsLoading(false);
       return;
     }

     if (!isVerificationSent) {
       toast({
         title: "Email verification required",
         description: "Please verify your email first.",
         variant: "destructive",
       });
       setIsLoading(false);
       return;
     }

     if (!verificationCode || verificationCode.length !== 6) {
       toast({
         title: "Invalid verification code",
         description: "Please enter a valid 6-digit verification code.",
         variant: "destructive",
       });
       setIsLoading(false);
       return;
     }

     try {
       const response = await authApi.verifyOTP({
         email: formData.email,
         otp: verificationCode
       });

       // Clear any existing tokens first, then store user data and token
       localStorage.removeItem('artstop_user');
       localStorage.removeItem('artstop_token');
       localStorage.removeItem('artstop_refresh_token');

       localStorage.setItem('artstop_user', JSON.stringify(response.data.user));
       localStorage.setItem('artstop_token', response.data.accessToken);
       if (response.data.refreshToken) {
         localStorage.setItem('artstop_refresh_token', response.data.refreshToken);
       }

       toast({
         title: response.message || "Login Successful!",
         description: "Welcome back to ArtStop.",
       });

       // Trigger auth update event
       window.dispatchEvent(new CustomEvent('authUpdated'));

       navigate(from, { replace: true });
     } catch (error) {
       toast({
         title: "Login Failed",
         description: error.message || "Please try again.",
         variant: "destructive",
       });
     } finally {
       setIsLoading(false);
     }
   };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-white px-3 py-1.5 rounded-full shadow-md text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-medium">Back</span>
          </motion.button>
        </Link>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <div className="flex justify-center lg:justify-start mb-4">
              <Link to="/">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src="/artstoplogo.png"
                  alt="ArtStop Logo"
                  className="h-16 w-auto object-contain"
                />
              </Link>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <Card className="">
            <CardContent className="">
              <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="pl-10 focus:ring-amber-500 focus:border-amber-500"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>


                  {/* Email Verification */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="verification">Email Verification</Label>
                      {!isVerificationSent ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendVerification}
                          disabled={isLoading}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          Send Code
                        </Button>
                      ) : (
                        <span className="text-sm text-green-600">Code Sent ✓</span>
                      )}
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="verification"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="text-center tracking-widest focus:ring-amber-500 focus:border-amber-500"
                        maxLength={6}
                        disabled={!isVerificationSent}
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                        Remember me
                      </Label>
                    </div>
                    <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg font-medium rounded-full transition-all duration-300"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>


                {/* Divider */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                </div>

                {/* Social Login */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">
                    <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Google
                  </Button>
                  <Button variant="outline" className="w-full">
                    <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/448224/facebook.svg" alt="Facebook" />
                    Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-amber-600 hover:text-amber-700 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Background Image with Overlay */}
        <div 
          className="hidden lg:flex flex-1 relative bg-cover bg-center"
          style={{ backgroundImage: "url('/loginimg.png')" }}
        >
          {/* Semi-transparent dark overlay */}
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Centered text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 flex flex-col items-center justify-center text-center text-white p-8 max-w-md mx-auto"
          >
            <h2 className="text-4xl font-bold mb-4">Discover Our Art</h2>
            <p className="text-lg mb-6 font-medium">
              Explore our curated collection of beautiful art pieces. Find the perfect piece that speaks to your soul.
            </p>
          </motion.div>
        </div>
      </div>
  );
};

export default Login;