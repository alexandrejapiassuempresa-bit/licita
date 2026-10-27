import { PriceQuote, ProcurementItem } from '../types/procurement';

export function calculateStats(
  quotes: PriceQuote[],
  quantity: number = 1,
  preferredMethod: 'media' | 'mediana' | 'menor_preco' = 'media'
): Partial<ProcurementItem> {
  const activeQuotes = quotes.filter((q) => !q.isExcluded && q.price > 0);

  if (activeQuotes.length === 0) {
    return {
      lowestPrice: undefined,
      averagePrice: undefined,
      medianPrice: undefined,
      standardDeviation: undefined,
      coefficientOfVariation: undefined,
      totalEstimated: undefined,
      methodologyApplied: preferredMethod,
    };
  }

  const sortedQuotes = [...activeQuotes].sort((a, b) => a.price - b.price);
  const lowestQuote = sortedQuotes[0];
  const lowestPrice = lowestQuote ? lowestQuote.price : 0;
  const lowestPriceBrand = lowestQuote ? lowestQuote.brand : undefined;
  const lowestPriceSupplier = lowestQuote ? lowestQuote.supplier : undefined;
  const lowestPriceUrl = lowestQuote ? lowestQuote.url : undefined;

  const prices = sortedQuotes.map((q) => q.price);
  const n = prices.length;
  const sum = prices.reduce((acc, curr) => acc + curr, 0);
  const averagePrice = sum / n;

  // Median
  let medianPrice = 0;
  if (n % 2 === 1) {
    medianPrice = prices[Math.floor(n / 2)];
  } else {
    medianPrice = (prices[n / 2 - 1] + prices[n / 2]) / 2;
  }

  // Standard deviation (sample standard deviation if n > 1)
  let standardDeviation = 0;
  if (n > 1) {
    const variance =
      prices.reduce((acc, val) => acc + Math.pow(val - averagePrice, 2), 0) /
      (n - 1);
    standardDeviation = Math.sqrt(variance);
  }

  // Coefficient of Variation (%)
  const coefficientOfVariation =
    averagePrice > 0 ? (standardDeviation / averagePrice) * 100 : 0;

  // Selected base price based on preferred method
  let unitReferencePrice = averagePrice;
  if (preferredMethod === 'mediana') {
    unitReferencePrice = medianPrice;
  } else if (preferredMethod === 'menor_preco') {
    unitReferencePrice = lowestPrice;
  }

  const totalEstimated = unitReferencePrice * (quantity || 1);

  return {
    lowestPrice: Number(lowestPrice.toFixed(2)),
    lowestPriceBrand: lowestPriceBrand || 'Marca do Menor Preço',
    lowestPriceSupplier,
    lowestPriceUrl,
    averagePrice: Number(averagePrice.toFixed(2)),
    medianPrice: Number(medianPrice.toFixed(2)),
    standardDeviation: Number(standardDeviation.toFixed(2)),
    coefficientOfVariation: Number(coefficientOfVariation.toFixed(2)),
    totalEstimated: Number(totalEstimated.toFixed(2)),
    methodologyApplied: preferredMethod,
  };
}

export function formatCurrencyBRL(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
