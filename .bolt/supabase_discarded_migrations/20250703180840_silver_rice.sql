/*
  # Sistem Evaluasi Fleksibel dengan Struktur Database Dinamis

  1. Tabel Baru
    - `evaluation_scores` - Menyimpan skor evaluasi dengan struktur fleksibel
    - Menggantikan kolom statis di `employee_evaluations`
  
  2. Perubahan
    - Struktur yang dapat menampung kriteria baru tanpa perubahan skema
    - Relasi yang jelas antara karyawan, kriteria, dan skor
    
  3. Keamanan
    - Enable RLS pada tabel baru
    - Policy yang sesuai untuk akses data
*/

-- Buat tabel baru untuk menyimpan skor evaluasi secara fleksibel
CREATE TABLE IF NOT EXISTS public.evaluation_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
  score DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, criteria_id)
);

-- Enable Row Level Security
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on evaluation_scores" ON public.evaluation_scores FOR ALL USING (true);

-- Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_employee_id ON public.evaluation_scores(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_criteria_id ON public.evaluation_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_employee_criteria ON public.evaluation_scores(employee_id, criteria_id);

-- Migrasi data dari employee_evaluations ke evaluation_scores (jika ada data)
DO $$
DECLARE
    eval_record RECORD;
    criteria_record RECORD;
    employee_record RECORD;
BEGIN
    -- Loop through existing evaluations
    FOR eval_record IN SELECT * FROM public.employee_evaluations LOOP
        -- Loop through each criteria and insert corresponding scores
        
        -- Kualitas Kerja
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Kualitas Kerja' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.kualitas_kerja)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Tanggung Jawab
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Tanggung Jawab' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.tanggung_jawab)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Kuantitas Kerja
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Kuantitas Kerja' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.kuantitas_kerja)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Pemahaman Tugas
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Pemahaman Tugas' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.pemahaman_tugas)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Inisiatif
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Inisiatif' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.inisiatif)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Kerjasama
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Kerjasama' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.kerjasama)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Jumlah Hari Alpa
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Jumlah Hari Alpa' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.hari_alpa)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Jumlah Keterlambatan
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Jumlah Keterlambatan' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.keterlambatan)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Jumlah Hari Izin
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Jumlah Hari Izin' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.hari_izin)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Jumlah Hari Sakit
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Jumlah Hari Sakit' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.hari_sakit)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Pulang Cepat
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Pulang Cepat' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.pulang_cepat)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Prestasi
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Prestasi' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.prestasi)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
        -- Surat Peringatan
        SELECT id INTO criteria_record FROM public.criteria WHERE name = 'Surat Peringatan' LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.evaluation_scores (employee_id, criteria_id, score)
            VALUES (eval_record.employee_id, criteria_record.id, eval_record.surat_peringatan)
            ON CONFLICT (employee_id, criteria_id) DO UPDATE SET score = EXCLUDED.score;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Data migration completed successfully';
END $$;