"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/auth";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phone: data.phone,
        role: data.role,
      });
      router.push("/events");
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 via-secondary-500 to-accent-500 p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center text-white"
        >
          <h1 className="mb-4 text-6xl font-bold">TIKITI</h1>
          <p className="mb-8 text-2xl">Create Your Account</p>
          <p className="text-lg opacity-90">
            Join the revolution in event ticketing
          </p>
        </motion.div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex w-full items-center justify-center overflow-y-auto p-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Get Started
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your account in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                {...register("displayName")}
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="John Doe"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="0712345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                    selectedRole === "customer"
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-300 hover:border-primary-300 dark:border-gray-600"
                  }`}
                >
                  <input
                    {...register("role")}
                    type="radio"
                    value="customer"
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900 dark:text-white">
                    Attend Events
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Customer
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                    selectedRole === "organizer"
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-300 hover:border-primary-300 dark:border-gray-600"
                  }`}
                >
                  <input
                    {...register("role")}
                    type="radio"
                    value="organizer"
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900 dark:text-white">
                    Create Events
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Organizer
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-secondary-500 px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
