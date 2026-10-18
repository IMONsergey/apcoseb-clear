import type { Plan } from '../content/plans';

/** Annual prices use a 20% discount relative to twelve monthly payments. */
export type BillingPeriod = 'monthly' | 'annually';
export const ANNUAL_DISCOUNT_PERCENT = 20;
export function calculatePrice(monthlyDollars: number, period: BillingPeriod) {
  if (!Number.isFinite(monthlyDollars) || monthlyDollars < 0)
    throw new RangeError('Invalid monthly price');
  const baseCents = Math.round(monthlyDollars * 100);
  const monthlyCents =
    period === 'annually'
      ? Math.round((baseCents * (100 - ANNUAL_DISCOUNT_PERCENT)) / 100)
      : baseCents;
  return {
    monthly: monthlyCents / 100,
    total: (monthlyCents * (period === 'annually' ? 12 : 1)) / 100,
  };
}
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
export const formatPrice = (amount: number) => currency.format(amount);

const count = new Intl.NumberFormat('en-US');
export const formatCredits = (value: number, compact = false) =>
  compact ? count.format(value).replaceAll(',', '\u00a0') : count.format(value);
export const formatApiRate = (
  plan: Plan,
  translate: (source: string, values?: Record<string, string | number>) => string = (
    source,
    values = {},
  ) => source.replace(/\{(\w+)\}/g, (token, name: string) => String(values[name] ?? token)),
) =>
  plan.apiRequestsPerSecond === null
    ? '—'
    : translate(plan.apiRequestsPerSecond === 1 ? '{count} request/s' : '{count} requests/s', {
        count: plan.apiRequestsPerSecond,
      });
const included = (value: boolean) => (value ? 'Included' : 'Not included');
export const planComparison = [
  { label: 'Credits', value: (plan: Plan) => formatCredits(plan.credits) },
  { label: 'Users', value: (plan: Plan) => String(plan.users) },
  { label: 'Search & filters', value: (plan: Plan) => plan.searchFilters },
  { label: 'API access', value: (plan: Plan) => included(plan.api) },
  { label: 'API rate limit', value: formatApiRate },
  { label: 'CVE context', value: (plan: Plan) => included(plan.cveContext) },
  { label: 'Buckets', value: (plan: Plan) => included(plan.buckets) },
  { label: 'Leaked Data', value: (plan: Plan) => included(plan.leakedData) },
  {
    label: 'Private Scanner',
    value: (plan: Plan) =>
      plan.privateScanner
        ? `Listed for ${plan.name[0]}${plan.name.slice(1).toLowerCase()}`
        : 'Not included',
  },
  { label: 'Support', value: () => 'Contact team' },
] as const;
