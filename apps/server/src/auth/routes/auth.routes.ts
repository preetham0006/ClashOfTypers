import bcrypt from "bcrypt";
import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { loginSchema, signupSchema } from "../validators/auth.validators.js";
import { signAuthToken } from "../utils/jwt.js";
import {
	createUser,
	findUserByEmail,
	findUserById,
	findUserByUsername
} from "../../users/user.service.js";

export const authRoutes = Router();

authRoutes.post("/signup", async (req, res) => {
	const parsed = signupSchema.safeParse(req.body);

	if (!parsed.success) {
		res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
		return;
	}

	const { email, username, password } = parsed.data;

	const existingByEmail = await findUserByEmail(email);
	if (existingByEmail) {
		res.status(409).json({ message: "Email already exists" });
		return;
	}

	const existingByUsername = await findUserByUsername(username);
	if (existingByUsername) {
		res.status(409).json({ message: "Username already exists" });
		return;
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const createdUser = await createUser({ email, username, passwordHash });

	const token = signAuthToken({
		sub: createdUser.id,
		email: createdUser.email,
		username: createdUser.username
	});

	res.status(201).json({
		token,
		user: {
			id: createdUser.id,
			email: createdUser.email,
			username: createdUser.username
		}
	});
});

authRoutes.post("/login", async (req, res) => {
	const parsed = loginSchema.safeParse(req.body);

	if (!parsed.success) {
		res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
		return;
	}

	const { email, password } = parsed.data;
	const user = await findUserByEmail(email);

	if (!user) {
		res.status(401).json({ message: "Invalid credentials" });
		return;
	}

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	if (!isPasswordValid) {
		res.status(401).json({ message: "Invalid credentials" });
		return;
	}

	const token = signAuthToken({
		sub: user.id,
		email: user.email,
		username: user.username
	});

	res.status(200).json({
		token,
		user: {
			id: user.id,
			email: user.email,
			username: user.username
		}
	});
});

authRoutes.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
	const userId = req.authUser?.userId;
	if (!userId) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	const user = await findUserById(userId);
	if (!user) {
		res.status(404).json({ message: "User not found" });
		return;
	}

	res.status(200).json({
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			createdAt: user.createdAt
		}
	});
});
