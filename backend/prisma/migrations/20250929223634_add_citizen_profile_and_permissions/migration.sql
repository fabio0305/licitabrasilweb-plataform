-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('READ_PUBLIC_DATA', 'READ_PRIVATE_DATA', 'WRITE_DATA', 'DELETE_DATA', 'CREATE_BIDDING', 'EDIT_BIDDING', 'DELETE_BIDDING', 'PUBLISH_BIDDING', 'CANCEL_BIDDING', 'CREATE_PROPOSAL', 'EDIT_PROPOSAL', 'DELETE_PROPOSAL', 'SUBMIT_PROPOSAL', 'CREATE_CONTRACT', 'EDIT_CONTRACT', 'SIGN_CONTRACT', 'TERMINATE_CONTRACT', 'MANAGE_USERS', 'MANAGE_SYSTEM', 'VIEW_AUDIT_LOGS', 'MANAGE_CATEGORIES', 'GENERATE_REPORTS', 'EXPORT_DATA');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CITIZEN';

-- CreateTable
CREATE TABLE "citizens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cpf" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "profession" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "interests" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citizens_userId_key" ON "citizens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permission_key" ON "user_permissions"("userId", "permission");

-- AddForeignKey
ALTER TABLE "citizens" ADD CONSTRAINT "citizens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
