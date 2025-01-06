/*
  Warnings:

  - You are about to drop the column `collegeId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[charusatId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `charusatId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_collegeId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "collegeId",
ADD COLUMN     "charusatId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_charusatId_key" ON "users"("charusatId");
