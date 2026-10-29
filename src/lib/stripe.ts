// ─────────────────────────────────────────────────────────────────────────────
// src/lib/stripe.ts
// Redirect to Stripe Checkout.
// Replace PRICE_IDs with your Stripe dashboard price IDs.
// ─────────────────────────────────────────────────────────────────────────────

// Price IDs from your Stripe dashboard
export const PRICES = {
  pro:  'price_pro_monthly',
  team: 'price_team_monthly',
};

/**
 * Redirect to Stripe Checkout for the given plan.
 * Requires a backend endpoint /api/create-checkout-session.
 * (Alternatively use Stripe Payment Links for zero-backend setup.)
 */
export async function startCheckout(
  plan: 'pro' | 'team',
  userEmail: string,
  accessToken: string,
): Promise<void> {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        priceId:    PRICES[plan],
        email:      userEmail,
        successUrl: `${window.location.origin}/#/app?checkout=success`,
        cancelUrl:  `${window.location.origin}/#/pricing`,
      }),
    });
    const { url } = await res.json();
    window.location.href = url;
  } catch {
    // Fallback: open Stripe Payment Link directly (set in env)
    const link = plan === 'pro'
      ? ('#')
      : ('#');
    window.open(link, '_blank');
  }
}

/**
 * Manage subscription (open Stripe customer portal).
 */
export async function openCustomerPortal(accessToken: string): Promise<void> {
  try {
    const res = await fetch('/api/customer-portal', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/#/app` }),
    });
    const { url } = await res.json();
    window.location.href = url;
  } catch {
    alert('Impossible d\'ouvrir le portail. Contactez support@minder.app');
  }
}
