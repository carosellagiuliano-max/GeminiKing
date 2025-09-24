interface SumUpAuth {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getToken() {
  const clientId = process.env.SUMUP_CLIENT_ID;
  const clientSecret = process.env.SUMUP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SumUp credentials missing');
  }

  const response = await fetch('https://api.sumup.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'payments.refunds payments',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain SumUp token: ${response.statusText}`);
  }

  return (await response.json()) as SumUpAuth;
}

export async function fetchSumUpCheckout(checkoutId: string) {
  const token = await getToken();
  const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch SumUp checkout ${checkoutId}: ${response.statusText}`);
  }

  return response.json() as Promise<{ status: string; amount: number; currency: string; id: string }>;
}

export async function createSumUpCheckoutLink(params: {
  amount: number;
  description: string;
  checkoutReference: string;
  email: string;
  returnUrl: string;
  merchantCode: string;
}) {
  const token = await getToken();
  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: 'CHF',
      checkout_reference: params.checkoutReference,
      merchant_code: params.merchantCode,
      description: params.description,
      pay_to_email: params.email,
      return_url: params.returnUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create SumUp checkout: ${response.statusText}`);
  }

  return response.json() as Promise<{ checkout_id: string; checkout_url: string }>;
}
