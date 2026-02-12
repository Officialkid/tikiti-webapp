import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(
        /^(?:254|\+254|0)?([71](?:(?:[0-2][0-9])|(?:4[0-1])|(?:5[0-5])|(?:9[0-9]))[0-9]{6})$/,
        "Invalid Kenyan phone number (format: 0712345678 or 254712345678)"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
    role: z.enum(["customer", "organizer"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
