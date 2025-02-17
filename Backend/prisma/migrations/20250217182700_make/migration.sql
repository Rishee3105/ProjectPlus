-- AlterTable
ALTER TABLE "users" ALTER COLUMN "resetCode" DROP NOT NULL,
ALTER COLUMN "resetCodeExpires" DROP NOT NULL;
