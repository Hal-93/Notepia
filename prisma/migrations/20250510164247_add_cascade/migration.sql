-- DropForeignKey
ALTER TABLE "Memo" DROP CONSTRAINT "Memo_groupId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET DEFAULT '名無しの旅人';

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
