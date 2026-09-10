export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export const TEST_COUPONS: Record<string, { discountPercent?: number; flatDiscount?: number; minSpend: number; description: string }> = {
  'BAZAARO10': { discountPercent: 10, minSpend: 1999, description: '10% instant discount on orders above ₹1,999' },
  'DESITECH': { flatDiscount: 1500, minSpend: 15000, description: 'Flat ₹1,500 off on premium electronics above ₹15,000' },
  'FIRST500': { flatDiscount: 500, minSpend: 2500, description: 'Flat ₹500 off on your first Bazaaro order' },
};
