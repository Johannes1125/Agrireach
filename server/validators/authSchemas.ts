import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(1),
  role: z.enum(["worker", "recruiter", "buyer", "admin"]).optional(),
  token: z.string().length(6).regex(/^\d{6}$/),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const GoogleSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum(["worker", "recruiter", "buyer", "admin"]).optional(),
});

export type GoogleInput = z.infer<typeof GoogleSchema>;


