/*
  Warnings:

  - A unique constraint covering the columns `[charusatId,projectId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Member_charusatId_projectId_key" ON "Member"("charusatId", "projectId");
