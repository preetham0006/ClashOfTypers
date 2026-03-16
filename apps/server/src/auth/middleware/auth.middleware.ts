import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
	authUser?: {
		userId: string;
		email: string;
		username: string;
	};
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	const authHeader = req.header("authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	const token = authHeader.slice("Bearer ".length).trim();

	try {
		const payload = verifyAuthToken(token);
		req.authUser = {
			userId: payload.sub,
			email: payload.email,
			username: payload.username
		};
		next();
	} catch {
		res.status(401).json({ message: "Invalid or expired token" });
	}
}
