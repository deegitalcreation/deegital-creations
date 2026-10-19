const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const baseOf = env => env.TOYYIB_SANDBOX === "true" ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.TOYYIB_SECRET || !env.TOYYIB_CATEGORY) return json({ error: "Payment is not configured" }, 503);
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const data = await (await fetch(origin + "/products.json")).json();
    const list = (data.products || []).filter(p => p && p.name && p.active !== false);

    let total = 0; const lines = [];
    for (const it of (body.items || [])) {
      const p = list.find(x => String(x.name) === String(it.id));
      const q = Math.floor(Number(it.qty));
      if (!p || !(q >= 1) || q > 50) return json({ error: "Invalid cart" }, 400);
      total += Number(p.price) * q; lines.push(p.name + " x" + q);
    }
    if (!lines.length || !(total > 0)) return json({ error: "Empty cart" }, 400);

    const c = body.customer || {};
    const name = String(c.name || "").trim().slice(0, 100);
    const email = String(c.email || "").trim().slice(0, 120);
    const phone = String(c.phone || "").replace(/\D/g, "").slice(0, 15);
    if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Invalid customer details" }, 400);

    const ref = "DC-" + Date.now().toString(36).toUpperCase();
    const form = new URLSearchParams({
      userSecretKey: env.TOYYIB_SECRET,
      categoryCode: env.TOYYIB_CATEGORY,
      billName: "Deegital Creations",
      billDescription: (ref + ": " + lines.join(", ")).slice(0, 100),
      billPriceSetting: "0",
      billPayorInfo: "0",
      billAmount: String(Math.round(total * 100)),
      billReturnUrl: origin + "/",
      billCallbackUrl: origin + "/api/callback",
      billExternalReferenceNo: ref,
      billTo: name,
      billEmail: email,
      billPhone: phone,
      billPaymentChannel: "0"
    });
    const res = await fetch(baseOf(env) + "/index.php/api/createBill", { method: "POST", body: form });
    const text = await res.text();
    let code = null;
    try { code = JSON.parse(text)[0].BillCode; } catch (e) {}
    if (!code) return json({ error: "Gateway error" }, 502);
    return json({ payUrl: baseOf(env) + "/" + code, ref, total });
  } catch (e) {
    return json({ error: "Server error" }, 500);
  }
}
