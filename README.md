# Workflow Proposal Skripsi

Aplikasi demo UTS Rekayasa Perangkat Lunak Lanjut: BPMN 2.0 dijalankan oleh
Camunda 7.24.0 di dalam Spring Boot 3.5.5. Mahasiswa mengajukan proposal,
sekretaris prodi memeriksa, dosen menilai sekaligus menyatakan kesediaan
menjadi pembimbing, lalu ketua prodi memutuskan.

**Status: bahan review dan pembelajaran.** Soal melarang menyalin langsung
tulisan AI. Pelajari kode, uji sendiri, perbaiki draf laporan dengan bahasa
sendiri, serta lengkapi kelas sebelum mengumpulkan.

Nama: Afif Luthfi  
NIM: 12409011050101

## Menjalankan

Bahan review: [laporan PDF](output/pdf/Laporan_UTS_Workflow_Proposal_DRAF.pdf),
[draf yang bisa diedit](docs/LAPORAN_DRAF.md),
[rekaman demo](docs/bukti/demo-workflow.webm), dan
[pemetaan terhadap soal](docs/STATUS_REVIEW.md).

Repositori publik: <https://github.com/Afif-luthfi/uts-rpl-workflow-proposal>.

Prasyarat: JDK 21 (direkomendasikan), Maven 3.9+, internet untuk unduhan awal.
Kode dikompilasi dengan target Java 17. Versi lingkungan yang benar-benar
dipakai dicatat dalam `docs/bukti/lingkungan.txt`.

```powershell
cd proposal-workflow
mvn -B -ntp verify
java -jar target/proposal-workflow-1.0.0.jar
```

Pada Windows dalam workspace ini, jalankan `./run.ps1` setelah build.
Skrip memilih JDK 21 portable bila tersedia dan menetapkan direktori socket
sementara agar tidak memakai lokasi temp Windows yang tervirtualisasi.

Buka <http://127.0.0.1:8080/>. Jalankan perintah dari direktori proyek supaya
database H2 tetap berada di `data/`. Tutup server dengan Ctrl+C.

Untuk workspace ini, cache dependensi berada di luar folder proyek:

```powershell
mvn "-Dmaven.repo.local=../.tools/m2" -B -ntp verify
```

| Fitur | Alamat |
| --- | --- |
| Portal demo | <http://127.0.0.1:8080/> |
| Hello World dan status deployment | <http://127.0.0.1:8080/api/hello> |
| Diagram BPMN | <http://127.0.0.1:8080/model.html> |
| XML BPMN | <http://127.0.0.1:8080/api/model> |
| Cockpit Camunda | <http://127.0.0.1:8080/camunda/app/welcome/default/> |

Login Cockpit lokal: `demo` / `demo-local-only`. Password dapat diganti
melalui environment variable `CAMUNDA_ADMIN_PASSWORD`. Akun ini hanya untuk
alat administrasi Camunda. Pemilih peran pada portal **bukan autentikasi**.
Server terikat ke `127.0.0.1`; jangan gunakan konfigurasi ini di server publik.

## Alur demo

1. Pilih **Ajukan proposal** dan isi data bertanda DEMO.
2. Sekretaris prodi memilih setuju, revisi, atau tolak dengan catatan wajib.
3. Jika revisi, perbarui judul, ringkasan, dan tautan. Pengiriman ulang menaikkan
   versi dan mengembalikan proses ke verifikasi.
4. Dosen memilih setuju sekaligus bersedia membimbing, revisi, atau tolak.
   Nama pembimbing wajib ketika menyetujui.
5. Ketua prodi menyetujui atau menolak. Persetujuan menjalankan Java delegate
   untuk mencatat hasil dan menghasilkan data draf pembimbingan.
6. Riwayat, keputusan, dan catatan tetap dapat dibaca setelah proses selesai.

## Peta berkas

| Berkas | Kegunaan |
| --- | --- |
| `src/main/resources/processes/proposal.bpmn` | Model executable dan koordinat diagram |
| `ProposalController.java` | Validasi, memulai proses, menyelesaikan tugas, riwayat |
| `OutcomeDelegate.java` | Service task hasil dan simulasi notifikasi |
| `application.yaml` | H2, server lokal, deployment, history |
| `src/main/resources/static/` | Portal dan viewer BPMN yang bekerja lokal |
| `src/test/java/.../WorkflowIntegrationTest.java` | Pengujian engine nyata dan API |
| `docs/LAPORAN_DRAF.md` | Bahan laporan untuk ditinjau dan ditulis ulang |
| `docs/PANDUAN_DEMO.md` | Urutan demonstrasi dan perekaman |
| `docs/bukti/` | Screenshot, hasil pengujian, dan rekaman |
| `.github/workflows/verify.yml` | Build dan tes otomatis pada GitHub Actions |

## Batasan yang disengaja

- Adaptasi kecil dari artikel Bahaweres dkk. (2012), bukan salinan seluruh
  implementasi Alfresco. Satu dosen/calon pembimbing; tidak ada dua pembimbing,
  surat fakultas resmi, ataupun tanda tangan elektronik.
- Penyimpanan metadata dan tautan dokumen, bukan unggah berkas atau ECM lengkap.
- Notifikasi berupa catatan simulasi. Tidak mengirim email, mengundang dosen,
  atau menghubungi pihak lain.
- H2 untuk satu demo lokal. Tidak ada login portal, pembatasan akses per
  mahasiswa, SLA, eskalasi timer, atau pengujian beban produksi.
- Camunda 7 Community sudah EOL. Dipilih untuk kesesuaian referensi UTS dan
  demo embedded; pilihan produksi baru perlu evaluasi terpisah.

## Referensi

- [Setup resmi Spring Boot dan Camunda](https://docs.camunda.org/get-started/spring-boot/project-setup/)
- [Kompatibilitas versi](https://docs.camunda.org/manual/7.24/user-guide/spring-boot-integration/version-compatibility/)
- [Spring Boot](https://spring.io/projects/spring-boot/)
- [Spesifikasi BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/About-BPMN)
- [Referensi utama pada soal](https://medium.com/@svosh2/business-process-automation-with-spring-boot-and-camunda-7a80fdb0389a)
- [Status dukungan Camunda 7](https://camunda.com/blog/2025/02/camunda-7-enterprise-end-of-life-extension/)

Viewer menggunakan bpmn-js 18.6.2. Lisensinya disertakan di
`src/main/resources/static/vendor/BPMN-JS-LICENSE.txt`; watermark bpmn.io dipertahankan.

Hasil pemeriksaan antarmuka dan bukti per aturan tersedia di
[REVIEW_QA.md](docs/REVIEW_QA.md).
