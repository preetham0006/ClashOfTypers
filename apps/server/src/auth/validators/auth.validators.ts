import { z } from "zod";

export const signupSchema = z.object({
	email: z.string().email(),
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only include letters, numbers, and underscores"),
	password: z.string().min(8)
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
