# Deegital Creations: panduan lengkap (GitHub + Cloudflare Pages + toyyibPay)

Isi folder:
- index.html : website
- products.json : produk (diurus melalui /admin)
- settings.json : nombor WhatsApp, teks hero, teks About, banner (diurus melalui /admin)
- admin/ : halaman admin (domainawak.com/admin). Senarai kategori ada dalam admin/config.yml
- functions/api/checkout.js : kod sambungan ke toyyibPay (berjalan di Cloudflare)
- functions/api/callback.js : placeholder untuk notifikasi toyyibPay
- images/uploads/ : gambar yang awak upload

## BAHAGIAN 1: GitHub
1. Daftar di https://github.com . Tekan New repository, nama `deegital-creations`, Create.
2. Tekan "uploading an existing file". Drag SEMUA isi folder ini (termasuk folder admin, functions, images). Commit changes.
   Pastikan folder `functions` masuk. Kalau GitHub tak terima drag folder, upload fail dalam folder tu satu persatu dan taip laluan penuh semasa Create new file (contoh `functions/api/checkout.js`).
3. Buka admin/config.yml, tekan ikon pensel, tukar `repo: USERNAME/NAMA-REPO` kepada repo awak (contoh `aisyah123/deegital-creations`). Commit.

## BAHAGIAN 2: Cloudflare Pages
1. Daftar di https://dash.cloudflare.com
2. Workers & Pages > Create > Pages > Connect to Git. Pilih repo tadi.
3. Framework preset: None. Build command: kosong. Build output directory: kosong atau `/`. Save and Deploy.
4. Buka alamat xxxx.pages.dev dan semak website. (Menu Cloudflare kadang-kadang berubah nama.)

## BAHAGIAN 3: Domain
Projek Pages > Custom domains > Set up a custom domain. Ikut arahan Cloudflare (biasanya tukar nameserver domain ke Cloudflare).

## BAHAGIAN 4: Akses admin
1. GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Repository access: Only select repositories > repo awak. Permissions > Contents: Read and write.
3. Salin token (simpan, jangan kongsi). Buka domainawak.com/admin dan sign in dengan token.
4. Menu Shop > Products: tambah/edit produk. Menu Shop > Website text and WhatsApp: ubah teks dan nombor.
Token ada tarikh luput. Bila luput, jana token baru.

## BAHAGIAN 5: toyyibPay (bayaran FPX)
Cuba SANDBOX dulu sebelum LIVE.
1. Sandbox: daftar akaun di https://dev.toyyibpay.com (akaun sandbox berasingan daripada akaun sebenar).
2. Dalam dashboard, buat satu Category. Salin Category Code. Salin User Secret Key (di bahagian profil/akaun).
3. Cloudflare: projek Pages > Settings > Variables and Secrets > tambah (untuk Production):
   - TOYYIB_SECRET = User Secret Key (pilih jenis Secret)
   - TOYYIB_CATEGORY = Category Code
   - TOYYIB_SANDBOX = true
4. Deploy semula (Deployments > Retry deployment, atau commit apa-apa di GitHub) supaya pemboleh ubah dipakai.
5. Cuba order di website. Anda akan dibawa ke halaman bayaran sandbox.

UJIAN WAJIB dalam sandbox sebelum live:
- Jumlah di halaman toyyibPay mesti sama dengan jumlah di cart (contoh RM35 tidak jadi RM0.35 atau RM3500).
- Pelanggan TIDAK boleh ubah jumlah bayaran di halaman toyyibPay.
Kalau salah satu tak betul, jangan live. Semak rujukan API di https://toyyibpay.com/apireference/ (parameter billAmount dan billPriceSetting) dan ubah dalam functions/api/checkout.js.

Pergi LIVE: daftar/sahkan akaun sebenar di https://toyyibpay.com, ambil Secret Key dan Category Code sebenar, tukar TOYYIB_SECRET dan TOYYIB_CATEGORY, dan tukar TOYYIB_SANDBOX kepada false (atau padam). Deploy semula.

Penting:
- Paparan "Thank you" di website hanya berdasarkan pelanggan dibawa balik oleh toyyibPay. SENTIASA semak status bayaran sebenar di dashboard toyyibPay sebelum mula kerja.
- Sebelum bayaran dibuat, kod pelayan mengira semula jumlah daripada products.json, bukan daripada cart pelanggan.
- Jika sambungan bayaran gagal, pelanggan boleh guna "Order via WhatsApp instead".

## Kos
Tiada yuran bulanan untuk GitHub, Cloudflare Pages (pelan percuma) dan Sveltia CMS pada skala kecil, tetapi had dan syarat pelan percuma boleh berubah. Domain perlu dibayar setiap tahun. toyyibPay tiada yuran bulanan tetapi ada caj per transaksi. Semak kadar terkini di laman toyyibPay.

## Kemas kini harian
- Tambah produk: /admin > Shop > Products > Add Product > Publish.
- Ubah teks/WhatsApp: /admin > Shop > Website text and WhatsApp.
- Tambah kategori: edit baris `options:` dalam admin/config.yml di GitHub.

## Masalah biasa
- Admin kata repo tak jumpa: semak `repo:` dalam admin/config.yml dan akses token.
- "Online payment isn't available": semak 3 pemboleh ubah di Cloudflare dan pastikan dah deploy semula.
- Gambar tak keluar: tunggu seminit selepas publish, refresh.
