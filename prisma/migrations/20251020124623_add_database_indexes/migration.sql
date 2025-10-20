-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Content_creatorId_idx" ON "Content"("creatorId");

-- CreateIndex
CREATE INDEX "Content_createdAt_idx" ON "Content"("createdAt");

-- CreateIndex
CREATE INDEX "Content_creatorAddress_idx" ON "Content"("creatorAddress");

-- CreateIndex
CREATE INDEX "PlatformBinding_contentId_idx" ON "PlatformBinding"("contentId");

-- CreateIndex
CREATE INDEX "PlatformBinding_platform_idx" ON "PlatformBinding"("platform");

-- CreateIndex
CREATE INDEX "PlatformBinding_createdAt_idx" ON "PlatformBinding"("createdAt");

-- CreateIndex
CREATE INDEX "Verification_contentHash_idx" ON "Verification"("contentHash");

-- CreateIndex
CREATE INDEX "Verification_status_idx" ON "Verification"("status");

-- CreateIndex
CREATE INDEX "Verification_createdAt_idx" ON "Verification"("createdAt");

-- CreateIndex
CREATE INDEX "Verification_contentId_idx" ON "Verification"("contentId");

-- CreateIndex
CREATE INDEX "Verification_contentHash_createdAt_idx" ON "Verification"("contentHash", "createdAt");

-- CreateIndex
CREATE INDEX "Verification_status_createdAt_idx" ON "Verification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_provider_idx" ON "Account"("userId", "provider");

-- CreateIndex
CREATE INDEX "Account_username_idx" ON "Account"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");
