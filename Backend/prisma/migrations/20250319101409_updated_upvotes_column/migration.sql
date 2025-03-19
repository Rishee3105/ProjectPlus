/*
  Warnings:

  - Made the column `upvotes` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "upvotes" SET NOT NULL,
ALTER COLUMN "upvotes" SET DEFAULT 0;
