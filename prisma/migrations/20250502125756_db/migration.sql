-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bar" TEXT NOT NULL DEFAULT 'bottom',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT '#4F46E5',
ALTER COLUMN "name" SET DEFAULT '名称未設定';
