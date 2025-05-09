-- AlterTable
ALTER TABLE "User" ADD COLUMN     "map" TEXT NOT NULL DEFAULT 'high',
ADD COLUMN     "tutorial" TEXT NOT NULL DEFAULT 'false';
