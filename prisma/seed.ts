import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function generateRandom8Digit(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

const prisma = new PrismaClient();

async function seed() {
    const email = "test@cyberhub.jp";
  
    await prisma.user.delete({ where: { email } }).catch(() => {
    });
  
    const hashedPassword = await bcrypt.hash("admin1234", 10);
  
    const user = await prisma.user.create({
      data: {
        email,
        uuid: generateRandom8Digit(),
        name: "Test User",
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    });
  
    console.log(`テストユーザーを作成しました 🌱`, user);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});