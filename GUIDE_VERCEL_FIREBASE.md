# Panduan Deployment SI-GURUKU ke Vercel dengan Firebase

Panduan ini akan membantu Anda menghubungkan aplikasi ke proyek Firebase Anda sendiri dan mendeploynya ke Vercel.

## 1. Persiapan di Firebase Console

Buka [Firebase Console](https://console.firebase.google.com/) dan pilih proyek Anda (`siguruku`).

### A. Aktifkan Authentikasi
1. Masuk ke menu **Build** > **Authentication**.
2. Klik **Get Started**.
3. Di tab **Sign-in method**, klik **Add new provider**.
4. Pilih **Google**, aktifkan, dan simpan (Gunakan email support proyek Anda).

### B. Aktifkan Firestore Database
1. Masuk ke menu **Build** > **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi server (misalnya `asia-southeast1` untuk Indonesia).
4. Pilih **Start in test mode** (kita akan ganti rulesnya nanti).
5. Klik **Create**.

### C. Pasang Security Rules
1. Di halaman Firestore, masuk ke tab **Rules**.
2. Salin isi file `firestore.rules` dari aplikasi ini (lihat di sidebar editor kode AI Studio).
3. Tempelkan ke editor di Firebase Console dan klik **Publish**.

---

## 2. Otorisasi Pengguna (Penting!)

Aplikasi ini memiliki fitur keamanan di mana hanya email yang terdaftar di "authorized_users" yang bisa masuk.

1. Di Firestore Database, klik **Start collection**.
2. Beri nama collection: `authorized_users`.
3. Untuk Document ID: Masukkan **alamat email Anda** (contoh: `emailanda@gmail.com`). **Harus huruf kecil semua**.
4. Tambahkan field:
   - Field name: `authorized`
   - Type: `boolean`
   - Value: `true`
5. Klik **Save**.
6. Ulangi untuk email guru lain yang ingin diberi akses.

---

## 3. Pengaturan Variabel Lingkungan (Environment Variables) di Vercel

Saat mendeploy di Vercel, Anda perlu menambahkan variabel berikut di bagian **Environment Variables** pada pengaturan proyek Vercel Anda:

| Variabel | Nilai (Value) |
|----------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyD-5Bzbnw_ZanF8RBiH0gZIfifhC3L9fmA` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `siguruku.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `siguruku` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `siguruku.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `197968840922` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:197968840922:web:bd9775cd73e951c8cabde3` |
| `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` | `(default)` |
| `GEMINI_API_KEY` | (Kunci API Gemini Anda dari AI Studio atau Google AI Studio) |

> **Catatan**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` tidak wajib. Jika tidak ada di config Firebase Anda, kosongkan saja atau tidak perlu ditambahkan di Vercel.

---

## 4. Langkah Akhir di Vercel

1. Hubungkan repository GitHub Anda ke Vercel.
2. Masukkan variabel lingkungan di atas.
3. Klik **Deploy**.
4. Setelah selesai, buka domain vercel Anda.
5. Coba login dengan Google (Pastikan email Anda sudah ada di koleksi `authorized_users` seperti langkah nomor 2).

Jika muncul pesan "Akses Ditolak", periksa kembali apakah email di Firestore sudah benar-benar sama (case-sensitive, gunakan huruf kecil) dan field `authorized` bernilai `true`.
