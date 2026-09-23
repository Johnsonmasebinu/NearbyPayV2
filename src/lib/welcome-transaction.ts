export const NEW_ACCOUNT_DEPOSIT_TITLE = 'Hackathon New Account Deposit';
export const NEW_ACCOUNT_DEPOSIT_AMOUNT = 10000;

export function isNewAccount(createdAt: string) {
  const createdTime = Date.parse(createdAt);
  if (Number.isNaN(createdTime)) return false;

  const age = Date.now() - createdTime;
  return age >= 0 && age <= 24 * 60 * 60 * 1000;
}

export function formatTransactionDate(createdAt: string) {
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}