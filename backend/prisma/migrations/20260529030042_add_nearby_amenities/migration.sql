-- CreateTable
CREATE TABLE "NearbyAmenity" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "travelTime" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NearbyAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotentRequest" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL DEFAULT 'v1',
    "path" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NearbyAmenity_propertyId_idx" ON "NearbyAmenity"("propertyId");

-- CreateIndex
CREATE INDEX "NearbyAmenity_category_idx" ON "NearbyAmenity"("category");

-- CreateIndex
CREATE INDEX "IdempotentRequest_createdAt_idx" ON "IdempotentRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotentRequest_idempotencyKey_protocolVersion_key" ON "IdempotentRequest"("idempotencyKey", "protocolVersion");

-- AddForeignKey
ALTER TABLE "NearbyAmenity" ADD CONSTRAINT "NearbyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
