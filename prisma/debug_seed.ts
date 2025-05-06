import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
    const email = "test@cyberhub.jp";
  
    // Remove memos created by this user to avoid FK constraint errors
    await prisma.memo.deleteMany({ where: { createdBy: { email } } });
    await prisma.user.deleteMany({ where: { email } });
  
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

    const testIds = [1, 2, 3, 4, 5];
    for (const id of testIds) {
      const email = `test${id}@cyberhub.jp`;
      // Remove memos created by this test user
      await prisma.memo.deleteMany({ where: { createdBy: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }

    for (const id of testIds) {
      const email = `test${id}@cyberhub.jp`;
      const testUser = await prisma.user.create({
        data: {
          email,
          uuid: `test${id}`,
          name: `Test User ${id}`,
          password: { create: { hash: hashedPassword } },
        },
      });
      console.log(`テストユーザー${id}を作成しました 🌱`, testUser);
    }
  
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