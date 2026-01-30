import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { User, Mail } from "lucide-react";

import DashBoardLayout from "../components/layout/DashBoardLayout";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const ProfilePage = () => {
  const { user, updateUser, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize form ONLY once when user loads
  useEffect(() => {
    if (!user) return;

    setFormData((prev) => {
      if (prev.name || prev.email) return prev;

      return {
        name: user.name ?? "",
        email: user.email ?? "",
      };
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        { name: formData.name }
      );

      updateUser(response.data);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <DashBoardLayout activeMenu="profile">
      <div className="max-w-2xl mx-auto px-5">
        <h1 className="text-md md:text-2xl font-bold text-slate-900 mb-2 mt-10">
          Profile
        </h1>
        <p className="text-sm text-slate-600 mb-8">
          Manage your account details.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Full Name"
              name="name"
              type="text"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              icon={Mail}
              value={formData.email}
              disabled
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashBoardLayout>
  );
};

export default ProfilePage;
