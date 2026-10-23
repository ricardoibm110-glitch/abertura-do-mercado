import { describe, it, expect } from 'vitest';
import { pressure, classify, nearby, signedGap, arbitrage } from '@/lib/auction';
import { canViewMarket } from '@/lib/access';
describe('Auction corrections', () => {
  it('preserves the gap direction', () => { expect(signedGap(129000,129500)).toBe(-500); });
  it('rejects missing depth instead of issuing a sell signal', () => { expect(classify(pressure(0,0))).toBe('SEM DADOS'); });
  it('counts only valid levels within the original 125 point band', () => { expect(nearby([{price:1000,quantity:1},{price:875,quantity:1},{price:870,quantity:1},{price:0,quantity:1}],1000,125)).toBe(2); });
  it('uses the actual mini-full difference at the original 100 threshold', () => { expect(arbitrage(130100,130000,100)).toBe('VENDA'); });
  it('normalizes depth quantities', () => { expect(pressure(700,300)).toBe(40); expect(classify(40)).toBe('COMPRA FORTE'); });
});
describe('Admin approval', () => {
  it('denies pending access', () => { expect(canViewMarket('pending')).toBe(false); });
  it('denies rejected access', () => { expect(canViewMarket('rejected')).toBe(false); });
  it('allows approved access', () => { expect(canViewMarket('approved')).toBe(true); });
  it('allows the verified admin', () => { expect(canViewMarket('pending',true)).toBe(true); });
});