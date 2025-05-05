/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId]` on the table `Friend` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Friend_fromId_toId_key" ON "Friend"("fromId", "toId");
