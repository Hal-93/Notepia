import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByUuid(uuid: User["uuid"]) {
  return prisma.user.findUnique({ where: { uuid } });
}

export async function createUser(
  email: User["email"],
  password: string,
  uuid: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      uuid,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function updateUserAvatar(id: string, avatar: string) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      avatar: avatar,
    },
  });
}

export async function updateUserName(id: string, username: string) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      name: username,
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function searchUsersByUuid(query: string): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      uuid: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: 5,
  });
}
