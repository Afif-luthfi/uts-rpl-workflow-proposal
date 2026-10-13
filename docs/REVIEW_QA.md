# Pemeriksaan akhir untuk review

13 Oktober 2026. Lingkup: portal buatan proyek, bukan antarmuka vendor Camunda.
Mode Anti Slop during dipilih pengguna. Arah: portal akademik terang, biru
tua, tabel dan formulir. ENERGY 1 / RHYTHM 1 / MOTION 1.

## Fungsi dan bukti

- PASS: `mvn verify` pada JDK 21 menjalankan 9 tes; semua berhasil.
- PASS: GitHub Actions pada commit aplikasi `abc0c17` berhasil.
- PASS: 19 pemeriksaan browser tercatat dalam `bukti/browser-check.txt`.
- PASS: diagram memiliki elemen SVG terlihat, zoom dan unduh bekerja.
- PASS: tidak ada JavaScript page error selama pengujian akhir.

Uji browser mencakup navigasi ke daftar, pengajuan, dan model; tombol kirim
dengan form kosong dan form valid; pilihan keputusan serta isian pembimbing;
pengiriman revisi; penyimpanan keputusan; pembukaan dokumen dan draf pada tab
baru; filter peran; muat ulang; zoom dan fit diagram; unduh BPMN; Hello World;
tautan Camunda; keadaan error dan pemulihannya. Form dan detail diperiksa
pada viewport 390 piksel. Indikator fokus keyboard juga diperiksa.

## Delivery Gate

| Aturan | Hasil dan bukti |
| --- | --- |
| R-01 | PASS: warna solid untuk hierarki; tidak ada gradient atau glow |
| R-02 | PASS: teks yang ditulis untuk UI tidak mengandung em dash |
| R-03 | PASS: daftar, form, detail, dan model diuji pada 390px tanpa overflow halaman |
| R-04 | PASS: tidak ada ikon dekoratif; simbol BPMN merupakan notasi proses |
| R-05 | PASS: struktur mengikuti pekerjaan pengajuan dan keputusan, bukan landing page |
| R-06 | PASS: Segoe UI dipilih untuk keterbacaan formulir Windows, dicatat di DESIGN.md |
| R-07 | PASS: latar polos tanpa pola grid dekoratif |
| R-08 | PASS: tombol menggunakan kata kerja tanpa panah dekoratif |
| R-09 | PASS: tidak ada badge promosi; status berasal dari engine |
| R-10 | PASS: tidak ada glassmorphism |
| R-11 | PASS: sudut form 4px, tombol 5px, panel 6px; tidak berbentuk kapsul |
| R-12 | PASS: tidak ada bayangan berlebihan |
| R-13 | PASS: tidak ada glow |
| R-14 | PASS: formulir dan riwayat diatur menurut tugasnya, bukan kartu fitur seragam |
| R-15 | PASS: tindakan spesifik seperti Kirim pengajuan dan Simpan keputusan |
| R-16 | PASS: tidak ada slogan atau klaim pemasaran AI |
| R-17 | PASS: versi dan status berasal dari data proses; tidak ada statistik rekaan |
| R-18 | PASS: tidak ada testimonial atau identitas pelanggan rekaan |
| R-19 | PASS: tidak ada animasi otomatis; sesuai MOTION 1 |
| R-20 | PASS: nomor proposal, versi revisi, pemeriksa, dan riwayat merupakan isi utama |
| R-21 | PASS: tema terang sesuai pilihan pengguna |
| R-22 | PASS: tidak ada ilustrasi generik |
| R-23 | PASS: arah layout disetujui; nama produk berupa teks; data uji bertanda DEMO |
| R-24 | PASS: semua tautan navigasi menuju halaman atau bagian yang tersedia |
| R-25 | PASS: pasangan warna teks utama memiliki rasio 6.35:1 sampai 13.31:1; lihat perhitungan di bawah |
| R-26 | PASS: formulir, pilihan, muat ulang, tautan, zoom, fit, dan unduh diuji |
| R-27 | PASS: loading tertulis pada daftar dan detail; hasil filter kosong dan API error diuji |
| R-28 | PASS: tidak menambahkan FAQ yang tidak diperlukan |
| R-29 | PASS: biru tua dan warna netral; merah hanya untuk error |
| R-30 | PASS: tidak memakai tiruan layout produk populer |
| R-31 | PASS: alasan tipografi, warna, navigasi, dan struktur dicatat di DESIGN.md |
| R-32 | PASS: memakai kontrol HTML native dan outline fokus; pemeriksaan Tab berhasil |
| R-33 | PASS: perubahan UI dibuat langsung pada file sumber; tidak ada script penambal CSS |
| R-34 | PASS: hanya tema terang yang disepakati; tidak ada toggle tema parsial |
| R-35 | PASS: build, tes integrasi, uji browser, screenshot, dan rekaman tersedia |
| R-36 | PASS: tidak mengklaim autentikasi produksi, email nyata, atau efisiensi terukur |
| R-37 | PASS: arah pengguna dicatat sebelum pembuatan UI; dials 1/1/1 |
| R-38 | PASS: seluruh data demonstrasi diberi penanda DEMO; notifikasi dan surat ditandai simulasi/draf |
| C-1 | PASS: keputusan visual mengikuti tujuan administrasi, dengan alasan tertulis |
| C-2 | PASS: tindakan utama menghasilkan perubahan atau navigasi teruji |
| C-3 | PASS: isi hanya pengajuan, pemeriksaan, riwayat, dan model proses |
| C-4 | PASS: keadaan kosong/error, ponsel, dan fokus keyboard diperiksa |
| C-5 | PASS: klaim hasil dihubungkan ke bukti; tidak ada klaim pengguna nyata |

Fokus halaman adalah judul/tugas aktif. Jarak memisahkan identitas, data
proposal, dan keputusan. Biru tua menandai tindakan utama. Pola berulang nomor
pengajuan, versi, dan riwayat membentuk identitas aplikasi. Ini konsisten
dengan dials 1/1/1 dan arah pengguna.

## Kontras yang dihitung

Perhitungan memakai luminansi relatif sRGB: (L lebih terang + 0.05) dibagi
(L lebih gelap + 0.05).

| Teks / latar | Rasio |
| --- | --- |
| #233044 / #ffffff | 13.31 |
| #4c5b6a / #f3f5f7 | 6.38 |
| #526171 / #ffffff | 6.35 |
| #344b5f / #e5ebf0 | 7.54 |
| #ffffff / #193956 | 11.93 |
| #86251e / #fff1ef | 8.31 |
| #15476e / #ffffff | 9.73 |

## Batas review

Pemeriksaan ini memverifikasi demo lokal; bukan audit keamanan atau uji
aksesibilitas lengkap. Belum ada login portal, email nyata, ataupun UAT dengan
pengguna kampus. Laporan tetap berupa draf berbantuan AI yang perlu ditinjau
dan ditulis ulang sesuai ketentuan tugas.
