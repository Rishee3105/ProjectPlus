/*
  Warnings:

  - A unique constraint covering the columns `[emailId]` on the table `Mentor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `emailId` to the `Mentor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mentor" ADD COLUMN     "emailId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_emailId_key" ON "Mentor"("emailId");
