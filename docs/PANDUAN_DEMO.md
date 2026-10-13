# Panduan demo dan review UTS

## Sebelum mulai

Jalankan aplikasi dari folder proyek. Gunakan data contoh bertanda DEMO;
`example.com` adalah tautan contoh, bukan tempat dokumen penelitian asli.
Siapkan jendela portal, viewer BPMN, dan terminal hasil `mvn verify`.
Video otomatis yang disertakan merekam interaksi browser asli tanpa narasi.
Tambahkan penjelasan pribadi atau buat rekaman ulang setelah memahami alurnya.

## Urutan penjelasan sekitar lima sampai tujuh menit

1. **Tujuan dan lingkungan.** Tunjukkan `java -version`, `mvn -version`,
   serta versi Spring Boot dan Camunda pada `pom.xml`. Jelaskan kasus proposal
   skripsi dan batasan satu pembimbing.
2. **Hello World.** Buka `/api/hello`; jelaskan bahwa `bpmnDeployed: true`
   berasal dari query definisi proses di engine, bukan nilai statis.
3. **Model.** Buka halaman BPMN. Tunjukkan start event, user task,
   exclusive gateway, loop revisi, service task, dan dua end event.
4. **Pengajuan.** Masukkan data DEMO dan buka detail. Tugas pertama harus
   verifikasi sekretaris prodi.
5. **Revisi.** Minta revisi dengan alasan yang konkret. Sebagai mahasiswa,
   perbaiki ringkasan dan kirim ulang. Tunjukkan versi berubah dari 1 ke 2.
6. **Persetujuan.** Lanjutkan dari sekretaris prodi ke dosen, isi pembimbing,
   lalu setujui sebagai ketua prodi. Buka draf dan catatan notifikasi simulasi.
7. **Penolakan.** Buat pengajuan DEMO kedua dan tolak. Tunjukkan proses
   selesai tanpa tautan draf.
8. **Kode dan pengujian.** Cocokkan `${outcomeDelegate}` pada XML dengan bean
   Java. Jelaskan bahwa urutan tugas ditentukan BPMN, sementara controller
   memvalidasi data dan keputusan. Tunjukkan hasil tes dan GitHub Actions.

## Pertanyaan untuk memastikan pemahaman

- Apa perbedaan BPM, BPMN, process engine, dan Spring Boot?
- Mengapa revisi mengembalikan token proses ke verifikasi?
- Apa yang terjadi jika ketua prodi mencoba menyelesaikan tugas sekretaris?
- Mengapa validasi keputusan perlu dilakukan sebelum `TaskService.complete`?
- Mengapa prototype ini belum aman untuk banyak pengguna sungguhan?
- Apa perubahan yang diperlukan untuk dua pembimbing atau notifikasi email nyata?

## Sebelum mengumpulkan

- Isi nama, NIM, kelas, dan tanggal sesuai identitas sendiri.
- Tulis ulang penjelasan berdasarkan pemahaman; jangan langsung mengumpulkan
  draf AI ini sebagai tulisan mandiri.
- Cek semua bukti dan jalankan demo sendiri. Bedakan simulasi dari fitur nyata.
- Repositori private perlu diberi akses kepada dosen atau diubah visibilitasnya
  setelah review. Instruksi soal menyebut `rizalbroer@uinjkt.ac.id`.
- Pengiriman email atau undangan GitHub dilakukan setelah keputusan pemilik
  akun. Tidak ada email atau undangan yang dikirim otomatis oleh proyek ini.
