import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface AuthTokenPayload {
	sub: string;
	email: string;
	username: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
	return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
	const decoded = jwt.verify(token, env.JWT_SECRET);
	return decoded as AuthTokenPayload;
}
