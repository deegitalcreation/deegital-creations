function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
}

async function verifySignature(rawBody, signatureB64, publicKeyPem) {
  const key = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sig = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, sig, new TextEncoder().encode(rawBody)
  );
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  const signature = request.headers.get('X-Signature');

  if (!signature || !(await verifySignature(raw, signature, env.CHIP_PUBLIC_KEY))) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(raw);

  if (event.status === 'paid') {
    // TODO: update order, hantar email, dll
    console.log('Paid:', event.id, event.reference);
  }

  return new Response('OK', { status: 200 });
}
