import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Use service role for webhook processing (no auth context)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('[webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[webhook] ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session);
            break;
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(subscription);
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription);
            break;
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            await handlePaymentFailed(invoice);
            break;
        }
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const supabase = getSupabase();
    const userId = session.metadata?.supabase_user_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
        console.error('[webhook] Missing metadata on checkout session');
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId);

    if (error) {
        console.error('[webhook] Failed to update profile:', error.message);
    } else {
        console.log(`[webhook] User ${userId} upgraded to ${plan}`);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const supabase = getSupabase();
    const userId = subscription.metadata?.supabase_user_id;
    const plan = subscription.metadata?.plan;
    if (!userId) return;

    // Check if subscription became active after past_due or paused
    if (subscription.status === 'active') {
        await supabase
            .from('profiles')
            .update({ plan: plan || 'cloud' })
            .eq('id', userId);
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        // Don't downgrade immediately — Stripe retry will handle
        console.log(`[webhook] Subscription ${subscription.id} is ${subscription.status}`);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const supabase = getSupabase();
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) return;

    const { error } = await supabase
        .from('profiles')
        .update({
            plan: 'free',
            stripe_subscription_id: null,
        })
        .eq('id', userId);

    if (error) {
        console.error('[webhook] Failed to downgrade user:', error.message);
    } else {
        console.log(`[webhook] User ${userId} downgraded to free`);
    }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const supabase = getSupabase();
    const customerId = invoice.customer as string;

    // Find user by Stripe customer ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('stripe_customer_id', customerId)
        .single();

    if (profile) {
        console.log(`[webhook] Payment failed for user ${profile.id}`);
        // Could send email here via unosend
    }
}
