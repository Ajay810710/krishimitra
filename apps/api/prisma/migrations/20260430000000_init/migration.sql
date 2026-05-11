-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('HINDI', 'KANNADA', 'TELUGU', 'TAMIL', 'ENGLISH');

-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('VEGETABLE', 'GRAIN', 'FRUIT', 'SPICE', 'PULSE', 'OILSEED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DemandTrend" AS ENUM ('HIGH', 'MODERATE', 'LOW', 'DECLINING');

-- CreateEnum
CREATE TYPE "WeatherRisk" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('PLANT', 'WAIT', 'CONSIDER_ALTERNATIVES');

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" "PreferredLanguage" NOT NULL DEFAULT 'HINDI',
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "mandiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_parcels" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeAcres" DOUBLE PRECISION NOT NULL,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT,
    "soilType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHindi" TEXT,
    "nameKannada" TEXT,
    "nameTelugu" TEXT,
    "nameTamil" TEXT,
    "category" "CropCategory" NOT NULL,
    "typicalDaysToHarvest" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandi_prices" (
    "id" TEXT NOT NULL,
    "mandiId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "priceDate" DATE NOT NULL,
    "variety" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT '',
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "minPriceKg" DOUBLE PRECISION NOT NULL,
    "maxPriceKg" DOUBLE PRECISION NOT NULL,
    "modalPriceKg" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'AGMARKNET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandi_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "mandiId" TEXT NOT NULL,
    "landParcelId" TEXT,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "landSizeAcres" DOUBLE PRECISION NOT NULL,
    "seedVariety" TEXT,
    "seedBrand" TEXT,
    "seedCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fertilizerCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labourCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "irrigationCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalInputCostInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PROCESSING',
    "priceLowKg" DOUBLE PRECISION,
    "priceHighKg" DOUBLE PRECISION,
    "priceMedianKg" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "demandTrend" "DemandTrend",
    "weatherRisk" "WeatherRisk",
    "priceCrashProb" DOUBLE PRECISION,
    "lowDemandProb" DOUBLE PRECISION,
    "weatherRiskProb" DOUBLE PRECISION,
    "yieldEstTonsAcre" DOUBLE PRECISION,
    "profitLowInr" DOUBLE PRECISION,
    "profitHighInr" DOUBLE PRECISION,
    "recommendation" "Recommendation",
    "recommendationText" TEXT,
    "recommendationTextHi" TEXT,
    "modelVersion" TEXT,
    "actualPriceKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmers_phone_key" ON "farmers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mandis_name_district_key" ON "mandis"("name", "district");

-- CreateIndex
CREATE UNIQUE INDEX "mandi_prices_mandiId_cropId_priceDate_variety_grade_key" ON "mandi_prices"("mandiId", "cropId", "priceDate", "variety", "grade");

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "mandis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_parcels" ADD CONSTRAINT "land_parcels_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandi_prices" ADD CONSTRAINT "mandi_prices_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "mandis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandi_prices" ADD CONSTRAINT "mandi_prices_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "mandis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "land_parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
