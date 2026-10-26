export async function onRequestPost({ request, env }) {
  try {
    const { items, customer } = await request.json();
    if (!Array.isArray(items) || !items.length || !customer?.email) {
      return Response.json({ error: 'Invalid order' }, { status: 400 });
    }

    // Harga sebenar diambil dari products.json di server
    const pr = await fetch(new URL('/products.json', request.url));
    const catalog = (await pr.json()).products || [];

    const products = [];
    let totalSen = 0;
    for (const it of items) {
      const p = catalog.find(x => String(x.name) === String(it.id) && x.active !== false);
      const qty = Math.min(Math.max(parseInt(it.qty) || 1, 1), 20);
      if (!p) return Response.json({ error: 'Product not found' }, { status: 400 });
      const price = Math.round(Number(p.price) * 100);
      products.push({ name: p.name, price, quantity: qty });
      totalSen += price * qty;
    }

    const ref = 'DG' + Date.now().toString(36).toUpperCase();
    const origin = new URL(request.url).origin;

    const res = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CHIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        brand_id: env.CHIP_BRAND_ID,
        reference: ref,
        client: {
          email: customer.email,
          full_name: customer.name,
          phone: customer.phone
        },
        purchase: { currency: 'MYR', products },
        success_redirect: `${origin}/?status_id=1`,
        failure_redirect: `${origin}/?status_id=3`,
        success_callback: `${origin}/api/chip-webhook`
      })
    });

    const data = await res.json();
    if (!data.checkout_url) {
      console.log('CHIP error:', JSON.stringify(data));
      return Response.json({ error: 'CHIP error' }, { status: 502 });
    }

    return Response.json({ payUrl: data.checkout_url, ref, total: totalSen / 100 });
  } catch (e) {
    console.log('Checkout error:', e.message);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
