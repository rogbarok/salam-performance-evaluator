
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

-- Create RLS policies (allowing public access for now since no auth is implemented)
CREATE POLICY "Allow all operations on criteria" ON public.criteria FOR ALL USING (true);
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on employee_evaluations" ON public.employee_evaluations FOR ALL USING (true);

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
