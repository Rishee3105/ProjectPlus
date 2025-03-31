-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'FACULTY');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectPrivacy" AS ENUM ('PUBLIC_FOR_ALL', 'PUBLIC_FOR_CHARUSAT', 'PRIVATE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "charusatId" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "domain" TEXT,
    "aboutMe" TEXT,
    "currCgpa" DOUBLE PRECISION,
    "phoneNumber" TEXT,
    "profilePhoto" TEXT,
    "currWorkingProjects" TEXT[],
    "achievements" TEXT[],
    "socialLinks" TEXT[],
    "verificationCode" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "pname" TEXT NOT NULL,
    "pdescription" TEXT NOT NULL,
    "pdefinition" TEXT NOT NULL,
    "phost" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL,
    "pduration" INTEGER NOT NULL,
    "documentation" TEXT[],
    "deleteDocs" TEXT[],
    "requiredDomain" TEXT NOT NULL,
    "techStack" TEXT[],
    "rating" DOUBLE PRECISION,
    "projectPrivacy" "ProjectPrivacy" NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prequest" (
    "id" SERIAL NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "prequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "charusatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "id" SERIAL NOT NULL,
    "charusatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_charusatId_key" ON "users"("charusatId");

-- CreateIndex
CREATE INDEX "users_firstName_lastName_idx" ON "users"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "users_email_domain_role_idx" ON "users"("email", "domain", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_skill_key" ON "UserSkill"("userId", "skill");

-- CreateIndex
CREATE INDEX "Project_pname_phost_idx" ON "Project"("pname", "phost");

-- CreateIndex
CREATE INDEX "prequest_userId_projectId_idx" ON "prequest"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Member_charusatId_idx" ON "Member"("charusatId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_charusatId_projectId_key" ON "Member"("charusatId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_charusatId_key" ON "Mentor"("charusatId");

-- CreateIndex
CREATE UNIQUE INDEX "Mentor_emailId_key" ON "Mentor"("emailId");

-- CreateIndex
CREATE INDEX "Mentor_charusatId_idx" ON "Mentor"("charusatId");

-- CreateIndex
CREATE INDEX "Suggestion_projectId_createdAt_idx" ON "Suggestion"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prequest" ADD CONSTRAINT "prequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prequest" ADD CONSTRAINT "prequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
