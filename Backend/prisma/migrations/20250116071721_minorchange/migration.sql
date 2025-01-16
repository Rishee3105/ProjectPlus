/*
  Warnings:

  - You are about to drop the column `charusatID` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `charusatID` on the `Mentor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[charusatId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[charusatId]` on the table `Mentor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `charusatId` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `charusatId` to the `Mentor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Member_charusatID_idx";

-- DropIndex
DROP INDEX "Member_charusatID_key";

-- DropIndex
DROP INDEX "Mentor_charusatID_idx";

-- DropIndex
DROP INDEX "Mentor_charusatID_key";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "charusatID",
ADD COLUMN     "charusatId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Mentor" DROP COLUMN "charusatID",
ADD COLUMN     "charusatId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Member_charusatId_key" ON "Member"("charusatId");

-- CreateIndex
CREATE INDEX "Member_charusatId_idx" ON "Member"("charusatId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_charusatId_key" ON "Mentor"("charusatId");

-- CreateIndex
CREATE INDEX "Mentor_charusatId_idx" ON "Mentor"("charusatId");
