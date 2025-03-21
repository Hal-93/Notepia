-- AlterTable
ALTER TABLE "Memo" ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'white';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "uuid" DROP DEFAULT;
