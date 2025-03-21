/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `Memo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Memo" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'No Name',
ADD COLUMN     "uuid" TEXT NOT NULL DEFAULT '00000000';

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");
