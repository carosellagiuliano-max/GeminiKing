import { NextResponse } from 'next/server';
import { fetchSumUpCheckout } from '@/lib/sumup';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkoutId = url.searchParams.get('checkout_id') ?? url.searchParams.get('id');

  if (!checkoutId) {
    return NextResponse.redirect(new URL('/booking?status=missing-checkout', url.origin));
  }

  try {
    const checkout = await fetchSumUpCheckout(checkoutId);
    const supabase = createSupabaseServiceRoleClient();

    if (['PAID', 'SETTLED', 'SUCCESSFUL'].includes(checkout.status.toUpperCase())) {
      await supabase
        .from('appointments')
        .update({ payment_status: 'PAID', status: 'CONFIRMED' })
        .eq('sumup_checkout_id', checkoutId);

      return NextResponse.redirect(new URL('/booking/success?provider=sumup', url.origin));
    }

    return NextResponse.redirect(new URL('/booking?status=pending-payment', url.origin));
  } catch (error) {
    console.error('SumUp return verification failed', error);
    return NextResponse.redirect(new URL('/booking?status=error', url.origin));
  }
}
