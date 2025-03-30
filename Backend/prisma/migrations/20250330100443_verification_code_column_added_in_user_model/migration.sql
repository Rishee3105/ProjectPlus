/*
  Warnings:

  - You are about to drop the column `resetCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetCodeExpires` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "resetCode",
DROP COLUMN "resetCodeExpires",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationCode" TEXT;
