# Indeks bukti UTS

Semua data mahasiswa dan pembimbing pada screenshot adalah data DEMO.
Waktu browser menggunakan Asia/Jakarta. Pengujian dilakukan 13 Oktober 2026.

## Hasil aktual

- `hasil-pengujian.txt`: 9 tes integrasi, 0 kegagalan, 0 error, 0 dilewati.
- `build-java21.txt`: log Maven verify pada JDK 21, BUILD SUCCESS.
- `lingkungan.txt`: versi JDK dan Maven yang dipakai.
- `browser-check.txt`: 19 pemeriksaan browser lulus, tanpa JavaScript page error.
- `hello-world.json`: respons endpoint dan status deployment BPMN nyata.
- `demo-proposals.json`: keadaan data DEMO sesudah uji browser.
- `demo-workflow.webm`: rekaman interaksi browser otomatis asli, tanpa narasi.
- [GitHub Actions berhasil](https://github.com/Afif-luthfi/uts-rpl-workflow-proposal/actions/runs/38345093213)
  untuk commit implementasi `abc0c17`.

## Screenshot

| Nomor | Bukti |
| --- | --- |
| 01 | Daftar saat mulai sesi demo |
| 02 | Formulir pengajuan terisi data DEMO |
| 03 | Tugas verifikasi sekretaris prodi |
| 04 | Tugas revisi mahasiswa |
| 05 | Penilaian dosen dan nama calon pembimbing |
| 06 | Persetujuan ketua prodi |
| 07 | Hasil disetujui dan riwayat keputusan |
| 08 | Draf data pembimbingan |
| 09 | Hasil ditolak |
| 10 | Daftar hasil pengajuan |
| 11 | Diagram BPMN executable |
| 12 | Hello World |
| 13 | Halaman login webapp Camunda |
| 14 | Daftar pada ponsel |
| 15 | Detail pada ponsel |
| 16 | Formulir pada ponsel |
| 17 | Model pada ponsel |
| 18 | Error API yang sengaja disimulasikan untuk memeriksa UI |
| 19 | Diagram saja dalam ukuran lebih besar untuk laporan |

`model-proposal.svg` menyediakan ekspor vektor agar diagram dapat diperbesar
tanpa pecah. Screenshot 08 dan 12 diambil sebagai cuplikan browser agar isi
draf dan respons JSON lebih terbaca saat dicetak.

File screenshot diberi nama dengan nomor di atas. Angka tersebut merupakan
urutan dokumentasi, bukan klaim bahwa semua file dibuat tepat berurutan dalam
satu pengambilan. Pengujian diulang saat ditemukan masalah; bukti yang
disertakan memakai hasil pengujian akhir.
