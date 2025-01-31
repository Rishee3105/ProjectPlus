-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "prequest" (
    "id" SERIAL NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "prequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prequest_userId_projectId_idx" ON "prequest"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "prequest" ADD CONSTRAINT "prequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prequest" ADD CONSTRAINT "prequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
