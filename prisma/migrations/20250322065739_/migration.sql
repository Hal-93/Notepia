-- AlterTable
ALTER TABLE "Memo" ADD COLUMN     "place" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
