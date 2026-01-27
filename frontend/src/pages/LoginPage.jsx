import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("handleSubmit : start", { formData});

    try {
      // use correct axios method
      console.log("handleSubmit : calling axiosInstance.post->", API_PATHS.AUTH.LOGIN);
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, formData);
      console.log("handleSubmit : login reponse recived", response);

      const token = response.data?.token;
      console.log("handleSubmit : extracted token", token);
      if (!token) {
        throw new Error("No token returned from login");
      }

      // save token so axios interceptor attaches it automatically on further requests
      localStorage.setItem("token", token);
      console.log("handleSubmit : token saved to localStorage");

      // fetch profile to get user details (axiosInstance will now send Authorization header)
      console.log("handleSubmit : fetching profile", API_PATHS.GET_PROFILE);
      const profileResponse = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log("handleSubmit : profileResponse", profileResponse);

      
      login(profileResponse.data, token);
      // console.log("handleSubmit: calling login(context) with user and token");
      // let loginResult;
      //   try {
      //     loginResult = login(profileResponse.data, token);
      //     console.log("handleSubmit: login() returned:", loginResult);
      //     if (loginResult instanceof Promise) {
      //       console.log("handleSubmit: login() returned a Promise — awaiting it");
      //       await loginResult;
      //       console.log("handleSubmit: awaited login() promise resolved");
      //     }
      //   } catch (loginErr) {
      //     console.error("handleSubmit: login(context) threw an error:", loginErr);
      //     throw loginErr; // bubble up to outer catch
      //   }

      toast.success("Login successful!");
      console.log("Login successful, navigating to dashboard");
      navigate("/dashboard");
    } catch (error) {
      // try to extract meaningful message
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again";

      // clear any stale token
      localStorage.removeItem("token");

      toast.error(message);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-500 rounded-full mb-4 shadow-md">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-600 mt-2">Sign in to continue to your eBook dashboard.</p>

          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <InputField
                label="Email"
                name="email"
                type="email"
                placeholder="yours@example.com"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                required
              />

              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="*******"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-8">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-violet-600 hover:text-violet-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
