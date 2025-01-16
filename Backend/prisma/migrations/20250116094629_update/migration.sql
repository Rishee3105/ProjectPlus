/*
  Warnings:

  - You are about to drop the `_MentorToProject` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `Mentor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MentorToProject" DROP CONSTRAINT "_MentorToProject_A_fkey";

-- DropForeignKey
ALTER TABLE "_MentorToProject" DROP CONSTRAINT "_MentorToProject_B_fkey";

-- AlterTable
ALTER TABLE "Mentor" ADD COLUMN     "projectId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_MentorToProject";

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
