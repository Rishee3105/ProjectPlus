/*
  Warnings:

  - A unique constraint covering the columns `[userId,projectId]` on the table `prequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Active', 'Completed');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" DEFAULT 'Active';

-- CreateIndex
CREATE UNIQUE INDEX "prequest_userId_projectId_key" ON "prequest"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
