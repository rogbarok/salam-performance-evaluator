
# Sistem Evaluasi Karyawan dengan Metode SAW (Simple Additive Weighting)

Aplikasi web untuk mengevaluasi kinerja karyawan menggunakan metode SAW (Simple Additive Weighting) yang dibangun dengan React, TypeScript, dan Supabase.

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Prasyarat](#prasyarat)
- [Instalasi dan Setup](#instalasi-dan-setup)
- [Konfigurasi Database](#konfigurasi-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Database](#struktur-database)
- [Cara Penggunaan](#cara-penggunaan)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🚀 Fitur Utama

- **Manajemen Karyawan**: Tambah, edit, dan hapus data karyawan
- **Manajemen Kriteria**: Kelola kriteria evaluasi dengan bobot yang dapat disesuaikan
- **Evaluasi Kinerja**: Input nilai evaluasi untuk setiap karyawan berdasarkan kriteria yang telah ditentukan
- **Perhitungan SAW**: Otomatis menghitung ranking karyawan menggunakan metode Simple Additive Weighting
- **Dashboard Interaktif**: Tampilan hasil evaluasi yang mudah dipahami dengan grafik dan tabel
- **Responsive Design**: Dapat diakses dari berbagai perangkat (desktop, tablet, mobile)

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database & Authentication)
- **State Management**: TanStack React Query
- **Icons**: Lucide React
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod validation

## 📋 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Node.js (versi 18 atau lebih baru)
- npm atau yarn package manager
- Git
- Akun Supabase (gratis di [supabase.com](https://supabase.com))

## 🔧 Instalasi dan Setup

### 1. Clone Repository

```bash
git clone <URL_REPOSITORY>
cd sistem-evaluasi-karyawan
```

### 2. Install Dependencies

```bash
npm install
```

atau jika menggunakan yarn:

```bash
yarn install
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project dan tambahkan konfigurasi Supabase:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Cara mendapatkan Supabase credentials:**
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda atau buat project baru
3. Pergi ke Settings > API
4. Copy `Project URL` dan `anon public` key

## 🗄️ Konfigurasi Database

### 1. Setup Database Schema

Jalankan SQL migration berikut di Supabase SQL Editor:

```sql
-- Create table for criteria and weights
CREATE TABLE public.criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Benefit', 'Cost')),
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  category TEXT NOT NULL,
  scale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for employees
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hire_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for employee evaluations
CREATE TABLE public.employee_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  kualitas_kerja INTEGER NOT NULL CHECK (kualitas_kerja >= 1 AND kualitas_kerja <= 5),
  tanggung_jawab INTEGER NOT NULL CHECK (tanggung_jawab >= 1 AND tanggung_jawab <= 5),
  kuantitas_kerja INTEGER NOT NULL CHECK (kuantitas_kerja >= 1 AND kuantitas_kerja <= 5),
  pemahaman_tugas INTEGER NOT NULL CHECK (pemahaman_tugas >= 1 AND pemahaman_tugas <= 5),
  inisiatif INTEGER NOT NULL CHECK (inisiatif >= 1 AND inisiatif <= 5),
  kerjasama INTEGER NOT NULL CHECK (kerjasama >= 1 AND kerjasama <= 5),
  hari_alpa INTEGER NOT NULL DEFAULT 0 CHECK (hari_alpa >= 0),
  keterlambatan INTEGER NOT NULL DEFAULT 0 CHECK (keterlambatan >= 0),
  hari_izin INTEGER NOT NULL DEFAULT 0 CHECK (hari_izin >= 0),
  hari_sakit INTEGER NOT NULL DEFAULT 0 CHECK (hari_sakit >= 0),
  pulang_cepat INTEGER NOT NULL DEFAULT 0 CHECK (pulang_cepat >= 0),
  prestasi INTEGER NOT NULL DEFAULT 0 CHECK (prestasi IN (0, 1)),
  surat_peringatan INTEGER NOT NULL DEFAULT 0 CHECK (surat_peringatan IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access)
CREATE POLICY "Allow all operations on criteria" ON public.criteria FOR ALL USING (true);
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on employee_evaluations" ON public.employee_evaluations FOR ALL USING (true);
```

### 2. Insert Data Awal

```sql
-- Insert default criteria data
INSERT INTO public.criteria (name, type, weight, category, scale) VALUES
('Kualitas Kerja', 'Benefit', 15.00, 'A. Kinerja Inti', '1-5'),
('Tanggung Jawab', 'Benefit', 15.00, 'A. Kinerja Inti', '1-5'),
('Kuantitas Kerja', 'Benefit', 10.00, 'A. Kinerja Inti', '1-5'),
('Pemahaman Tugas', 'Benefit', 10.00, 'A. Kinerja Inti', '1-5'),
('Inisiatif', 'Benefit', 5.00, 'A. Kinerja Inti', '1-5'),
('Kerjasama', 'Benefit', 5.00, 'A. Kinerja Inti', '1-5'),
('Jumlah Hari Alpa', 'Cost', 10.00, 'B. Kedisiplinan', 'Hari'),
('Jumlah Keterlambatan', 'Cost', 7.00, 'B. Kedisiplinan', 'Kali'),
('Jumlah Hari Izin', 'Cost', 3.00, 'B. Kedisiplinan', 'Hari'),
('Jumlah Hari Sakit', 'Cost', 3.00, 'B. Kedisiplinan', 'Hari'),
('Pulang Cepat', 'Cost', 2.00, 'B. Kedisiplinan', 'Kali'),
('Prestasi', 'Benefit', 10.00, 'C. Faktor Tambahan', '0/1'),
('Surat Peringatan', 'Cost', 5.00, 'C. Faktor Tambahan', '0/1');

-- Insert sample employees data
INSERT INTO public.employees (name, position, department, email, hire_date) VALUES
('Budi Santoso', 'Staff Admin', 'Administrasi', 'budi.santoso@as-salam.org', '2020-01-15'),
('Citra Dewi', 'Guru Kelas', 'Pendidikan', 'citra.dewi@as-salam.org', '2019-08-20'),
('Dedi Rahman', 'Staff Keuangan', 'Keuangan', 'dedi.rahman@as-salam.org', '2021-03-10');
```

## 🏃‍♂️ Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

### Build untuk Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## 📊 Struktur Database

### Tabel `criteria`
Menyimpan kriteria evaluasi dan bobotnya:
- `id`: UUID primary key
- `name`: Nama kriteria
- `type`: 'Benefit' atau 'Cost'
- `weight`: Bobot kriteria (0-100)
- `category`: Kategori kriteria
- `scale`: Skala penilaian

### Tabel `employees`
Menyimpan data karyawan:
- `id`: UUID primary key
- `name`: Nama karyawan
- `position`: Jabatan
- `department`: Departemen
- `email`: Email (unique)
- `hire_date`: Tanggal masuk kerja

### Tabel `employee_evaluations`
Menyimpan hasil evaluasi karyawan:
- `id`: UUID primary key
- `employee_id`: Foreign key ke tabel employees
- `kualitas_kerja`: Nilai kualitas kerja (1-5)
- `tanggung_jawab`: Nilai tanggung jawab (1-5)
- `kuantitas_kerja`: Nilai kuantitas kerja (1-5)
- `pemahaman_tugas`: Nilai pemahaman tugas (1-5)
- `inisiatif`: Nilai inisiatif (1-5)
- `kerjasama`: Nilai kerjasama (1-5)
- `hari_alpa`: Jumlah hari alpa
- `keterlambatan`: Jumlah keterlambatan
- `hari_izin`: Jumlah hari izin
- `hari_sakit`: Jumlah hari sakit
- `pulang_cepat`: Jumlah pulang cepat
- `prestasi`: Prestasi (0/1)
- `surat_peringatan`: Surat peringatan (0/1)

## 📱 Cara Penggunaan

### 1. Manajemen Karyawan
- Akses menu "Kelola Karyawan"
- Tambah karyawan baru dengan mengisi form
- Edit atau hapus data karyawan yang sudah ada

### 2. Manajemen Kriteria
- Akses menu "Kelola Kriteria"
- Lihat dan edit bobot kriteria evaluasi
- Pastikan total bobot = 100%

### 3. Evaluasi Karyawan
- Akses menu "Evaluasi Karyawan"
- Pilih karyawan yang akan dievaluasi
- Isi nilai untuk setiap kriteria
- Simpan evaluasi

### 4. Melihat Hasil
- Akses menu "Hasil Evaluasi"
- Lihat ranking karyawan berdasarkan perhitungan SAW
- Lihat detail normalisasi dan perhitungan

## 🚀 Deployment

### Deploy ke Vercel

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy ke Vercel**
   - Login ke [Vercel](https://vercel.com)
   - Import repository dari GitHub
   - Tambahkan environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy

### Deploy ke Netlify

1. **Build Project**
   ```bash
   npm run build
   ```

2. **Deploy ke Netlify**
   - Login ke [Netlify](https://netlify.com)
   - Drag & drop folder `dist` ke dashboard
   - Atau connect dengan GitHub repository

### Deploy ke Lovable

Jika menggunakan Lovable:
1. Klik tombol "Publish" di dashboard Lovable
2. Aplikasi akan otomatis di-deploy

## 🔧 Troubleshooting

### Error: Supabase connection failed
- Pastikan URL dan API key Supabase sudah benar
- Cek apakah project Supabase masih aktif
- Periksa RLS policies sudah diatur dengan benar

### Error: Build failed
- Jalankan `npm install` untuk memastikan semua dependencies terinstall
- Hapus folder `node_modules` dan `package-lock.json`, lalu install ulang
- Pastikan versi Node.js sesuai (18+)

### Error: Database query failed
- Periksa apakah tabel sudah dibuat dengan benar
- Pastikan RLS policies sudah diaktifkan
- Cek apakah data sample sudah dimasukkan

### Performance Issues
- Pastikan menggunakan React Query untuk caching
- Optimize komponen dengan React.memo jika diperlukan
- Gunakan lazy loading untuk komponen yang besar

## 📞 Support

Jika mengalami masalah atau membutuhkan bantuan:
1. Periksa troubleshooting guide di atas
2. Cek console browser untuk error messages
3. Pastikan semua langkup setup sudah diikuti dengan benar

## 📄 License

Project ini menggunakan MIT License.

---

**Selamat menggunakan Sistem Evaluasi Karyawan!** 🎉
