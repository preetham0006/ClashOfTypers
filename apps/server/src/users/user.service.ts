import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function findUserByEmail(email: string) {
	return prisma.user.findUnique({ where: { email } });
}

export function findUserByUsername(username: string) {
	return prisma.user.findUnique({ where: { username } });
}

export function findUserById(id: string) {
	return prisma.user.findUnique({ where: { id } });
}

export function createUser(input: { email: string; username: string; passwordHash: string }) {
	return prisma.user.create({
		data: input
	});
}
