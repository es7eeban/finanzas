-- CreateTable
CREATE TABLE "exchange_rate_cache" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(14,4) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mindicador.cl',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rate_cache_fromCurrency_toCurrency_key" ON "exchange_rate_cache"("fromCurrency", "toCurrency");
