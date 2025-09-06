
export const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return '';
  }
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};
