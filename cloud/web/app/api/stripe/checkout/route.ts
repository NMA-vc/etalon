import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, PLANS, type PlanId } from '@/lib/stripe';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (plan !== 'cloud' && plan !== 'pro') {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan as PlanId];
    if (!planConfig.priceId) {
        return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
        const customer = await getStripe().customers.create({
            email: profile?.email || user.email,
            metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;

        // Store customer ID
        const { createClient: createAdmin } = await import('@supabase/supabase-js');
        const adminClient = createAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await adminClient
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard/settings?checkout=success`,
        cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
        metadata: {
            supabase_user_id: user.id,
            plan,
        },
        subscription_data: {
            metadata: {
                supabase_user_id: user.id,
                plan,
            },
        },
    });

    return NextResponse.json({ url: session.url });
}
