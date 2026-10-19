const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const baseOf = env => env.TOYYIB_SANDBOX === "true" ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";

async function createBill(env, origin, p) {
  const form = new URLSearchParams({
    userSecretKey: env.TOYYIB_SECRET,
    categoryCode: env.TOYYIB_CATEGORY,
    billName: "Deegital Creations",
    billDescription: p.desc.slice(0, 100),
    billPriceSetting: "0",
    billPayorInfo: "0",
    billAmount: String(p.sen),
    billReturnUrl: origin + "/",
    billCallbackUrl: origin + "/api/callback",
    billExternalReferenceNo: p.ref,
    billTo: p.name,
    billEmail: p.email,
    billPhone: p.phone,
    billPaymentChannel: "0"
  });
  const res = await fetch(baseOf(env) + "/index.php/api/createBill", { method: "POST", body: form });
  const text = await res.text();
  let code = null;
  try { code = JSON.parse(text)[0].BillCode; } catch (e) {}
  return { code, status: res.status, text: text.slice(0, 300) };
}

// Diagnostik sementara: buka /api/checkout dalam browser. Tambah ?test=1 untuk bil ujian RM1 (sandbox sahaja).
export async function onRequestGet({ request, env }) {
  try {
    const out = {
      function: "running",
      has_secret: !!env.TOYYIB_SECRET,
      has_category: !!env.TOYYIB_CATEGORY,
      sandbox_value: env.TOYYIB_SANDBOX || null
    };
    const url = new URL(request.url);
    if (url.searchParams.get("test") === "1" && env.TOYYIB_SANDBOX === "true" && env.TOYYIB_SECRET && env.TOYYIB_CATEGORY) {
      const r = await createBill(env, url.origin, { desc: "DC-TEST: ujian", sen: 100, ref: "DC-TEST" + Date.now().toString(36).toUpperCase(), name: "Test", email: "test@example.com", phone: "60123456789" });
      out.gateway_http_status = r.status;
      out.gateway_response = r.text;
      out.pay_url = r.code ? baseOf(env) + "/" + r.code : null;
    }
    return json(out);
  } catch (e) {
    return json({ function: "error", message: String(e).slice(0, 200) }, 500);
  }
}

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
    const r = await createBill(env, origin, { desc: ref + ": " + lines.join(", "), sen: Math.round(total * 100), ref, name, email, phone });
    if (!r.code) return json({ error: "Gateway error", detail: r.text }, 502);
    return json({ payUrl: baseOf(env) + "/" + r.code, ref, total });
  } catch (e) {
    return json({ error: "Server error", detail: String(e).slice(0, 200) }, 500);
  }
}
