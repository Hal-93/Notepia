import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
    const email = "test@cyberhub.jp";
  
    await prisma.user.delete({ where: { email } }).catch(() => {
    });
  
    const hashedPassword = await bcrypt.hash("admin1234", 10);
  
    const user = await prisma.user.create({
      data: {
        email,
        uuid: "admin",
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