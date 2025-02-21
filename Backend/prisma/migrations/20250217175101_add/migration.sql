/*
  Warnings:

  - Added the required column `resetCode` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resetCodeExpires` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetCode" TEXT NOT NULL,
ADD COLUMN     "resetCodeExpires" TEXT NOT NULL;
