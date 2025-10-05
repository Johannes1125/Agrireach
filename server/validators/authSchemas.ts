import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["worker", "recruiter", "buyer"]).optional(),
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
  role: z.enum(["worker", "recruiter", "buyer"]).optional(),
});

export type GoogleInput = z.infer<typeof GoogleSchema>;


