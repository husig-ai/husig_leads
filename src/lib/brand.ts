// src/lib/brand.ts - CREATE THIS FILE
export const getLeadScoreStyle = (score: number) => {
  if (score >= 80) return {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: '🔥 Hot'
  };
  if (score >= 60) return {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    label: '🟠 Warm'
  };
  if (score >= 40) return {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    label: '🟡 Qualified'
  };
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    label: '⚪ Cold'
  };
};