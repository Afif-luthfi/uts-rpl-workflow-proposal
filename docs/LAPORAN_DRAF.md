# Implementasi Workflow Proposal Skripsi dengan BPMN dan Spring Boot

Draf untuk review UTS Rekayasa Perangkat Lunak Lanjut

Nama: [isi sendiri]  
NIM: [isi sendiri]  
Kelas: [isi sendiri]  
Tanggal pengerjaan: 13 Oktober 2026

Dokumen ini menjelaskan aplikasi kecil untuk mengatur pemeriksaan proposal
skripsi. Model BPMN dijalankan oleh Camunda di dalam Spring Boot. Pengajuan
bergerak melalui sekretaris prodi, dosen, dan ketua prodi, dengan pilihan revisi
atau penolakan. Dokumen adalah bahan belajar dan review berbantuan AI; bagian
naratif perlu ditulis ulang berdasarkan pemahaman penulis sebelum dikumpulkan,
sesuai aturan soal UTS.

## 1 Konsep dan hubungan teknologi

### 1.1 Spring dan Spring Boot dalam 5W

**What.** Spring adalah ekosistem pengembangan aplikasi Java. Spring Boot
memudahkan penyusunan aplikasi Spring melalui konfigurasi otomatis, paket
dependensi starter, dan cara menjalankan aplikasi sebagai program mandiri.

**Why.** Pada tugas ini, Boot mengurangi konfigurasi web server, JSON, validasi,
dan koneksi database sehingga pengerjaan dapat berfokus pada alur proposal.

**Who.** Pengembang menggunakan framework untuk membangun aplikasi;
mahasiswa dan pengelola prodi menggunakan hasil aplikasinya.

**Where.** Boot berjalan pada backend. Browser mengirim HTTP ke controller;
engine dan database berada di sisi server.

**When.** Boot digunakan sejak penyusunan proyek, implementasi layanan,
pengujian, sampai pengemasan JAR. Rujukan konsep: [1].

### 1.2 BPM dan BPMN dalam 5W

**What.** BPM mengelola proses bisnis, sedangkan BPMN menyediakan notasi untuk
mendeskripsikan proses tersebut. Diagram menyatakan aktivitas, peristiwa,
keputusan, dan urutan pekerjaan. BPMN 2.0 memiliki representasi XML [2].

**Why.** Pada kasus proposal, diagram membuat jalur pemeriksaan dan pengembalian
revisi dapat dibahas sebelum kode dibuat. Tanggung jawab dan kemungkinan hasil
tidak tersembunyi di dalam serangkaian kondisi program.

**Who.** Mahasiswa, sekretaris prodi, dosen, dan ketua prodi merupakan aktor
kasus ini. Pengembang menerjemahkan hasil analisis menjadi proses executable.

**Where.** Model disimpan di `src/main/resources/processes/proposal.bpmn`.
Camunda menjalankan model di backend; viewer hanya menampilkannya.

**When.** Model disusun saat analisis, dihubungkan ke Java saat implementasi,
dan ditinjau kembali ketika prosedur berubah.

### 1.3 Hubungan BPMN dan Spring Boot dalam 5W

**What.** Integrasi menghubungkan model proses executable dengan layanan Java.
Camunda mengelola status proses, sedangkan Spring menyediakan komponen aplikasi.

**Why.** Dalam demo ini, daftar tugas dan riwayat tersedia melalui engine.
Controller tidak perlu menulis sendiri seluruh mesin perpindahan status.

**Who.** Pengembang memetakan service task ke bean Java. Pengguna menyelesaikan
user task melalui formulir yang menjalankan API aplikasi.

**Where.** Keduanya berada dalam satu aplikasi Spring Boot. Ekspresi
`${outcomeDelegate}` menghubungkan service task BPMN dengan `OutcomeDelegate`.

**When.** Saat startup, model dideploy. Saat pengajuan masuk, satu process
instance dibuat. Setelah manusia menyelesaikan tugas, gateway menentukan
jalur berikutnya berdasarkan variabel keputusan. Pola embedded ini mengikuti
pendekatan integrasi pada panduan resmi [3].

### 1.4 Manfaat untuk pengembangan Java enterprise

J2EE merupakan penamaan lama platform Java enterprise yang kemudian dikenal
sebagai Java EE dan Jakarta EE. Aplikasi tugas ini menggunakan Spring Boot
dengan API `jakarta.validation`, bukan aplikasi yang memerlukan instalasi
application server Jakarta EE lengkap. Spring Boot tidak identik dengan
Jakarta EE, tetapi dapat memakai API dari ekosistem Jakarta.

Manfaat BPM tampak ketika pekerjaan berhenti menunggu manusia. Sesudah
sekretaris prodi menerima pengajuan, proses dapat bertahan pada user task dosen
tanpa menahan satu HTTP request. Status dan histori disimpan di database.
Perubahan rute, misalnya penambahan tahap verifikasi, dapat dibahas pada model.
Kode Java tetap diperlukan untuk validasi, integrasi, dan aturan teknis.
Diagram tidak otomatis menghasilkan seluruh aplikasi Java tanpa pemrograman.

## 2 Instalasi dan konfigurasi

### 2.1 Komponen yang dipilih

| Komponen | Versi atau fungsi |
| --- | --- |
| Java | Target kompilasi 17; JDK 21 direkomendasikan untuk reproduksi |
| Spring Boot | 3.5.5, backend HTTP dan konfigurasi aplikasi |
| Camunda | 7.24.0 Community, process engine dan Cockpit |
| Maven | Pengelolaan dependensi, tes, pengemasan |
| H2 | Database file untuk demo, database memori untuk tes |
| bpmn-js | 18.6.2, viewer lokal model BPMN |

Kombinasi Boot dan Camunda mengikuti contoh setup resmi [3] dan diperiksa
terhadap halaman kompatibilitas [4]. Camunda 7 Community telah mencapai akhir
dukungan pada 2025 [5]. Pemilihan versi ini bertujuan mengikuti referensi UTS
yang memakai Camunda 7, bukan rekomendasi deployment produksi baru.

### 2.2 Langkah yang dapat diulang

1. Sediakan JDK 21 dan Maven 3.9 atau lebih baru; pastikan `java -version`
   serta `mvn -version` berhasil. Lingkungan aktual direkam di bukti terpisah.
2. Buka folder `proposal-workflow`, lalu periksa dependensi pada `pom.xml`.
   Starter JDBC menyediakan data source dan transaction manager untuk engine.
3. Jalankan `mvn -B -ntp verify`. Maven mengunduh library pada penggunaan awal,
   mengompilasi Java, menjalankan tes, dan membentuk executable JAR.
4. Jalankan `java -jar target/proposal-workflow-1.0.0.jar` dari folder proyek.
5. Buka `http://127.0.0.1:8080/` dan `http://127.0.0.1:8080/api/hello`.

Pada workspace pengerjaan ini, parameter
`-Dmaven.repo.local=../.tools/m2` menempatkan cache Maven di folder workspace.
Ini pilihan lokasi cache, bukan syarat fungsional aplikasi.

Lingkungan Windows saat pengerjaan mengalami error `Unable to establish
loopback connection` ketika Java membuka socket internal Tomcat. Pengaturan
`jdk.net.unixdomain.tmpdir` ke direktori workspace menyelesaikannya. Skrip
`run.ps1` menyediakan pengaturan tersebut. JDK 21 portable disiapkan lokal
agar lingkungan demo selaras dengan versi yang direkomendasikan.

`application.yaml` menetapkan server lokal, koneksi H2, pola auto-deployment
`classpath*:/processes/*.bpmn`, dan history level `full`. Job executor
dinonaktifkan karena model hanya menggunakan tugas sinkron dan user task,
tanpa timer atau kelanjutan asynchronous. File XML memuat BPMN DI sehingga
diagram dapat ditampilkan dan dibuka pada alat pemodelan kompatibel.

### 2.3 Hello World

Endpoint `GET /api/hello` mengembalikan pesan Hello World, kunci proses,
dan `bpmnDeployed`. Nilai terakhir dihitung dari `RepositoryService`, sehingga
tes memeriksa integrasi dengan engine selain sekadar HTTP aktif.
Screenshot dan respons aktual disimpan dalam `docs/bukti` setelah pengujian.

## 3 Analisis studi kasus

### 3.1 Dasar pemilihan

Artikel Bahaweres, Viva A., dan Wahyudianto [6] membahas pengelolaan dokumen
proposal skripsi pada Program Studi Teknik Informatika UIN Jakarta. Masalah
yang menjadi dasarnya meliputi dokumen kertas, komunikasi pemeriksaan, dan
kesulitan mengetahui prosedur. Artikel tersebut menggunakan Alfresco dan
Extreme Programming. Pada tugas ini, domain masalah diadaptasi, sementara
implementasi teknis menggunakan Spring Boot dan Camunda.

### 3.2 Ruang lingkup dan penyederhanaan

Mahasiswa menyimpan identitas demo, judul, ringkasan, dan tautan proposal.
Sekretaris prodi memeriksa kelengkapan. Dosen memeriksa isi sekaligus menyatakan
kesediaan menjadi calon pembimbing. Ketua prodi memberi keputusan akhir.
Hasil yang disetujui menghasilkan draf data pembimbingan.

Berbeda dari proses lengkap pada artikel, demo memakai satu calon pembimbing,
tidak mengelola surat resmi fakultas, dan tidak mengirim email. Fungsi ECM,
penyimpanan binary file, serta pemilihan dua pembimbing berada di luar lingkup.
Loop revisi kembali ke verifikasi merupakan aturan adaptasi demo. Klaim
efisiensi waktu dalam artikel tidak dianggap sebagai hasil pengukuran aplikasi
ini karena belum dilakukan pengamatan pengguna nyata.

### 3.3 Kebutuhan dan aturan bisnis

| Kode | Kebutuhan dan hasil yang diharapkan |
| --- | --- |
| F01 | Pengajuan valid membuat satu instance dengan tugas verifikasi |
| F02 | Sekretaris prodi dapat melanjutkan, meminta revisi, atau menolak |
| F03 | Dosen dapat melanjutkan dengan nama pembimbing, revisi, atau menolak |
| F04 | Revisi memperbarui isi, menaikkan versi, dan kembali ke verifikasi |
| F05 | Ketua prodi hanya menyetujui atau menolak |
| F06 | Keputusan final menjalankan Java delegate dan menutup proses |
| F07 | Riwayat dan catatan dapat dilihat untuk pengajuan aktif maupun selesai |
| F08 | Data salah, peran salah, dan penyelesaian ulang ditolak API |

Catatan wajib di semua keputusan. NIM terdiri dari 8 sampai 20 digit,
judul minimal 10 karakter, ringkasan minimal 20 karakter, dan tautan memakai
HTTP/HTTPS. Batas ini adalah aturan demo, bukan klaim aturan resmi kampus.
Nilai peran pada request divalidasi terhadap tugas, tetapi belum berasal dari
sesi login terpercaya sehingga belum menjadi pengamanan pengguna sungguhan.

## 4 Model dan implementasi

### 4.1 Urutan proses

Model dimulai setelah pengajuan disimpan sebagai variabel proses. User task
`verifikasi` menunggu sekretaris prodi. Keputusan SETUJU membawa token ke
`review`; REVISI membawa token ke `revisi`; TOLAK menuju layanan penolakan.
Pada penilaian dosen, SETUJU menuju `persetujuan`, sedangkan revisi dan
penolakan memiliki cabang sendiri. Ketua prodi memilih persetujuan atau
penolakan akhir. Proses revisi mengulang verifikasi, bukan langsung kembali
ke ketua prodi.

Exclusive gateway memilih satu jalur berdasarkan variabel `keputusan`.
Service task `terbitkan` dan `tolak` memanggil bean yang sama dengan ID
aktivitas berbeda. Bean menyimpan `hasil` dan `notifikasi`; nomor draf hanya
dibuat ketika disetujui. Kedua cabang berakhir pada end event masing-masing.

### 4.2 Hubungan model dengan kode

| Elemen | Implementasi |
| --- | --- |
| Start instance | `RuntimeService.startProcessInstanceByKey` |
| User task | `TaskService` menyediakan tugas dan operasi `complete` |
| Kondisi gateway | Ekspresi pada XML membaca variabel `keputusan` |
| Service task | `camunda:delegateExpression` memanggil `OutcomeDelegate` |
| Histori | `HistoryService` membaca proses, variabel, dan tugas |
| Catatan keputusan | Komentar tugas disimpan sebelum tugas diselesaikan |
| Penyimpanan | Tabel engine Camunda pada H2; tidak ada tabel domain tambahan |

Controller memberi batasan input dan keputusan, tetapi perpindahan antar
tugas berasal dari BPMN. Operasi pembuatan dan penyelesaian tugas memakai
transaksi Spring; kegagalan validasi tidak boleh memajukan token proses.
Browser hanya menampilkan formulir dan memanggil endpoint, sehingga refresh
halaman tidak menghapus status workflow.

### 4.3 Antarmuka dan endpoint

Portal menyediakan daftar proposal, filter tugas berdasarkan peran, formulir
pengajuan, detail, riwayat, dan formulir keputusan. Viewer menampilkan XML
yang sama dengan model yang dideploy. Tautan dokumen dibuka oleh browser
pengguna; server tidak mengunduh dokumen tersebut.

| Metode dan endpoint | Fungsi |
| --- | --- |
| GET /api/hello | Hello World dan status model |
| GET /api/model | XML BPMN executable |
| POST /api/proposals | Membuat pengajuan |
| GET /api/proposals | Membaca daftar pengajuan |
| GET /api/proposals/{id} | Detail, tugas aktif, dan histori |
| POST /api/tasks/{id}/complete | Menyimpan keputusan atau revisi |
| GET /api/proposals/{id}/draft | Draf teks sesudah persetujuan |

## 5 Pengujian dan bukti

Pengujian integrasi memakai Spring Boot, MockMvc, database H2 memori, dan
engine Camunda nyata. Pengujian ini tidak mengganti engine dengan mock.
Rangkaian tes memeriksa deployment, jalur persetujuan, revisi dari dua tahap,
penolakan di tiga tahap, validasi, peran salah, dan penyelesaian ganda.
Hasil eksekusi final dicatat dalam `docs/bukti/hasil-pengujian.txt`.

Uji browser menambah pemeriksaan terhadap formulir, navigasi, filter, diagram,
riwayat, tampilan ponsel, serta pesan kegagalan. Screenshot berasal dari
aplikasi yang berjalan. Rekaman demo merupakan interaksi browser otomatis,
tanpa narasi manusia; rekaman tersebut dapat dijadikan bahan penjelasan ulang.
Daftar screenshot dan hasil aktual tersedia pada indeks bukti.

Tes belum membuktikan keamanan produksi, kelayakan pengguna nyata, performa
dengan banyak pengajuan, atau pengiriman email. Diperlukan autentikasi,
otorisasi berbasis identitas, basis data produksi, dan pengujian lanjutan
sebelum mempertimbangkan pemakaian di lingkungan institusi.

## 6 Dokumentasi ABC dan GitHub

Dalam draf ini, ABC dipakai sebagai Accuracy, Brevity, dan Clarity. Karena
soal tidak menetapkan kepanjangannya, ini adalah interpretasi kerja yang perlu
disesuaikan jika dosen memberi definisi berbeda. Accuracy diterapkan dengan
mencocokkan klaim terhadap kode dan bukti. Brevity diterapkan dengan memilih
penjelasan yang relevan terhadap tugas. Clarity diterapkan dengan urutan
konsep, konfigurasi, model, implementasi, lalu pengujian.

Repositori GitHub disiapkan private sesuai pilihan pemilik akun. Source code,
model, dokumentasi, dan workflow CI disertakan. File database lokal, cache
dependensi, hasil build, dan token tidak dimasukkan ke repository. GitHub
Actions menjalankan `mvn verify` menggunakan Java 21. Status eksekusi CI
harus dibaca dari bukti aktual, bukan diasumsikan dari keberadaan file YAML.

Instruksi soal meminta berbagi GitHub kepada dosen pada
`rizalbroer@uinjkt.ac.id`. Sebelum berbagi, pemilik perlu meninjau isi dan
memberi akses ke repositori private atau mengubah visibilitasnya. Tidak ada
undangan maupun email yang dikirim pada tahap review ini.

## 7 Kesimpulan dan pekerjaan lanjutan

Implementasi menghubungkan model BPMN executable dengan aplikasi Java kecil.
Tugas manusia, percabangan keputusan, pengulangan revisi, dan layanan otomatis
terwakili dalam model serta diakses melalui portal. Bahan yang dihasilkan
memungkinkan peninjauan hubungan antara prosedur bisnis, variabel proses,
kode Java, dan pengujian. Sebelum pengumpulan, penulis perlu mengisi identitas,
menulis ulang penjelasan mandiri, menjalankan demonstrasi sendiri, dan
menyelesaikan pembagian akses GitHub kepada dosen.

## Daftar rujukan

[1] Spring. Spring Boot. https://spring.io/projects/spring-boot/

[2] Object Management Group. Business Process Model and Notation 2.0.2.
https://www.omg.org/spec/BPMN/2.0.2/About-BPMN

[3] Camunda. Setup a Spring Boot Project.
https://docs.camunda.org/get-started/spring-boot/project-setup/

[4] Camunda. Spring Boot Version Compatibility 7.24.
https://docs.camunda.org/manual/7.24/user-guide/spring-boot-integration/version-compatibility/

[5] Camunda. Camunda 7 Enterprise End of Life Extension Announcement,
termasuk penjelasan akhir dukungan Community Edition.
https://camunda.com/blog/2025/02/camunda-7-enterprise-end-of-life-extension/

[6] Bahaweres, R. B., Viva A., dan Wahyudianto. 2012. Pengembangan Sistem Alur
Kerja Workflow Dokumen Prosedur Pengajuan Proposal Skripsi dengan Alfresco
Enterprise Content Management ECM Studi Kasus Program Studi Teknik Informatika
UIN Jakarta. Semantik 2012, hlm. 356-363. PDF disediakan bersama soal UTS.

[7] Referensi utama yang tercantum pada soal: Business process automation with
Spring Boot and Camunda.
https://medium.com/@svosh2/business-process-automation-with-spring-boot-and-camunda-7a80fdb0389a

Dokumentasi daring diakses 13 Oktober 2026. Penjelasan konfigurasi mengacu
pada dokumentasi resmi; artikel Medium diposisikan sebagai referensi tugas.
