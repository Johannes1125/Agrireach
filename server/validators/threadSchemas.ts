import { z } from "zod";

export const CreateThreadSchema = z.object({
  category_id: z.string().optional(),
  category: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => data.category_id || data.category,
  {
    message: "Either category_id or category must be provided",
    path: ["category"],
  }
);
export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;

export const UpdateThreadSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
  status: z.enum(["active", "pending", "hidden"]).optional(),
});
export type UpdateThreadInput = z.infer<typeof UpdateThreadSchema>;

export const CreatePostSchema = z.object({
  content: z.string().min(1),
  parent_reply_id: z.string().optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = z.object({ content: z.string().min(1) });
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export const VotePostSchema = z.object({ vote_type: z.enum(["like", "dislike"]) });
export type VotePostInput = z.infer<typeof VotePostSchema>;


