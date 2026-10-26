export async function onRequestPost({ request, env }) {
  const { email, name, amount } = await request.json(); // amount dalam sen (RM10 = 1000)

  const res = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CHIP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brand_id: env.CHIP_BRAND_ID,
      client: { email },
      purchase: { products: [{ name, price: amount, quantity: 1 }] },
      success_redirect: 'https://deegital-live.pages.dev/thank-you',
      failure_redirect: 'https://deegital-live.pages.dev/payment-failed',
      success_callback: 'https://deegital-live.pages.dev/api/chip-webhook/'
    })
  });

  const data = await res.json();
  return Response.json({ checkout_url: data.checkout_url });
}
