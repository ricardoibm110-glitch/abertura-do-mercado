export function canViewMarket(status: string | null | undefined, admin = false) {
  return admin || status === 'approved';
}