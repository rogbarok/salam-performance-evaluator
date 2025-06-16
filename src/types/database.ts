
export interface Criteria {
  id: string;
  name: string;
  type: 'Benefit' | 'Cost';
  weight: number;
  category: string;
  scale: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeEvaluation {
  id: string;
  employee_id: string;
  kualitas_kerja: number;
  tanggung_jawab: number;
  kuantitas_kerja: number;
  pemahaman_tugas: number;
  inisiatif: number;
  kerjasama: number;
  hari_alpa: number;
  keterlambatan: number;
  hari_izin: number;
  hari_sakit: number;
  pulang_cepat: number;
  prestasi: number;
  surat_peringatan: number;
  created_at: string;
  updated_at: string;
}
