import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-01-28.clover',
            typescript: true,
        });
    }
    return _stripe;
}

// Legacy export for backward compatibility
export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover', typescript: true })
    : (null as unknown as Stripe);

// ETALON pricing plans — these IDs will be created in Stripe dashboard
// Use `stripe products create` + `stripe prices create` to set up
export const PLANS = {
    free: {
        name: 'Open Source',
        priceId: null, // No Stripe price for free
        scansPerMonth: 10,
        sites: 3,
    },
    cloud: {
        name: 'Cloud',
        priceId: process.env.STRIPE_CLOUD_PRICE_ID || '',
        scansPerMonth: 100,
        sites: 20,
        priceMonthly: 2900, // €29
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID || '',
        scansPerMonth: 1000,
        sites: -1, // unlimited
        priceMonthly: 9900, // €99
    },
} as const;

export type PlanId = keyof typeof PLANS;
