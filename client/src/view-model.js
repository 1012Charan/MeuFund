export function navigationFor(role) {
  if (role === 'founder') return ['Dashboard', 'My startups'];
  if (role === 'investor') return ['Dashboard', 'Browse startups'];
  return [];
}

export function statusLabel(status) {
  return status === 'pending' ? 'Awaiting response' : status;
}

export function formatFundingGoal(amount) {
  if (amount === undefined || amount === null || amount === '') return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
