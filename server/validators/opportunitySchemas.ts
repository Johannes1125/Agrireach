import { z } from "zod";

export const CreateJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  category: z.string().min(1),
  location: z.string().min(1),
  pay_rate: z.coerce.number().positive(),
  pay_rate_max: z.preprocess((v) => (v === undefined || v === null || v === "" ? undefined : v), z.coerce.number().positive().optional()),
  pay_type: z.enum(["hourly", "daily", "weekly", "monthly", "project"]),
  duration: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent"]),
  required_skills: z.array(z.string()).optional(),
  company_name: z.string().optional(),
  company_logo: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  contact_email: z.string().email().optional(),
  experience_level: z.string().optional(),
  work_schedule: z.string().optional(),
  start_date: z.preprocess((v) => (typeof v === "string" && v.length ? v : undefined), z.string().optional()),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = CreateJobSchema.partial().extend({ status: z.enum(["active", "closed", "filled"]).optional() });
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

export const ApplyJobSchema = z.object({
  cover_letter: z.string().optional(),
  resume_url: z.string().url().optional(),
});
export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;

export const UpdateApplicationSchema = z.object({ status: z.enum(["pending", "reviewed", "accepted", "rejected"]) });
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;


