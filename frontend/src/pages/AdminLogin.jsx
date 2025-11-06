import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const AdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    showPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Clear any existing admin session to force fresh login
    try {
      localStorage.removeItem("artstop_admin");
      localStorage.removeItem("artstop_admin_token");
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Enter both email and password.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${backendUrl}/api/auth/admin/login`, {
        email,
        password
      });

      if (response.data.success) {
        // Store admin session
        localStorage.setItem(
          "artstop_admin",
          JSON.stringify({
            user: response.data.data.user,
            token: response.data.data.accessToken,
            loggedInAt: Date.now()
          })
        );

        // Store admin token separately from user token
        localStorage.setItem("artstop_admin_token", response.data.data.accessToken);

        window.dispatchEvent(new CustomEvent("adminAuthUpdated"));
        toast({ title: "Welcome", description: "Logged in to admin panel." });
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const errorMessage = error.response?.data?.message || "Login failed";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-12 w-auto mx-auto object-contain drop-shadow-sm"
            />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 text-sm">Use your admin credentials to access the dashboard</p>
        </div>

        <Card className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-gray-200 rounded-xl shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@artstop.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type={form.showPassword ? "text" : "password"}
                    placeholder="********"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                </div>
                <label className="inline-flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={form.showPassword}
                    onChange={(e) =>
                      setForm({ ...form, showPassword: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-700">Show password</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign In"}
              </Button>

            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-indigo-600 hover:underline">
                Back to Store
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;