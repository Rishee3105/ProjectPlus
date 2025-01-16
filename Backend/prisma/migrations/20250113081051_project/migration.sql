/*
  Warnings:

  - You are about to drop the column `details` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - Added the required column `pdefinition` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdescription` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pduration` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phost` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pname` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectPrivacy` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredDomain` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamSize` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectPrivacy" AS ENUM ('PUBLIC_FOR_ALL', 'PUBLIC_FOR_CHARUSAT', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "details",
DROP COLUMN "link",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "documentation" TEXT[],
ADD COLUMN     "pdefinition" TEXT NOT NULL,
ADD COLUMN     "pdescription" TEXT NOT NULL,
ADD COLUMN     "pduration" INTEGER NOT NULL,
ADD COLUMN     "phost" TEXT NOT NULL,
ADD COLUMN     "pname" TEXT NOT NULL,
ADD COLUMN     "projectPrivacy" "ProjectPrivacy" NOT NULL,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "requiredDomain" TEXT NOT NULL,
ADD COLUMN     "teamSize" INTEGER NOT NULL,
ADD COLUMN     "techStack" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currWorkingProjects" TEXT[];

-- CreateTable
CREATE TABLE "UserProject" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "details" TEXT,

    CONSTRAINT "UserProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "charusatID" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "id" SERIAL NOT NULL,
    "charusatID" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MentorToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MentorToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_charusatID_key" ON "Member"("charusatID");

-- CreateIndex
CREATE INDEX "Member_charusatID_idx" ON "Member"("charusatID");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_charusatID_key" ON "Mentor"("charusatID");

-- CreateIndex
CREATE INDEX "Mentor_charusatID_idx" ON "Mentor"("charusatID");

-- CreateIndex
CREATE INDEX "Suggestion_projectId_createdAt_idx" ON "Suggestion"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "_MentorToProject_B_index" ON "_MentorToProject"("B");

-- CreateIndex
CREATE INDEX "Project_pname_phost_idx" ON "Project"("pname", "phost");

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MentorToProject" ADD CONSTRAINT "_MentorToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MentorToProject" ADD CONSTRAINT "_MentorToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
