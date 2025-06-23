
import { AlertTriangle } from "lucide-react";

export const SAWCriteriaInfo = () => {
  return (
    <>
      {/* Detailed Criteria Mapping */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm">
        <h5 className="font-semibold mb-2">Pemetaan Kriteria C1-C13:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p><strong>C1:</strong> Kualitas Kerja (Benefit)</p>
            <p><strong>C2:</strong> Tanggung Jawab (Benefit)</p>
            <p><strong>C3:</strong> Kuantitas Kerja (Benefit)</p>
            <p><strong>C4:</strong> Pemahaman Tugas (Benefit)</p>
            <p><strong>C5:</strong> Inisiatif (Benefit)</p>
            <p><strong>C6:</strong> Kerjasama (Benefit)</p>
            <p><strong>C7:</strong> Hari Alpa (Cost) - <span className="text-red-600">Jika &gt; 0 → 0.000</span></p>
          </div>
          <div className="space-y-1">
            <p><strong>C8:</strong> Keterlambatan (Cost)</p>
            <p><strong>C9:</strong> Hari Izin (Cost)</p>
            <p><strong>C10:</strong> Hari Sakit (Cost)</p>
            <p><strong>C11:</strong> Pulang Cepat (Cost)</p>
            <p><strong>C12:</strong> Prestasi (Benefit) - <span className="text-green-600">1 → 1.000, 0 → 0.000</span></p>
            <p><strong>C13:</strong> Surat Peringatan (Cost) - <span className="text-red-600">0 → 1.000, 1 → 0.000</span></p>
          </div>
        </div>
      </div>

      {/* Normalization Rules */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
        <h5 className="font-semibold mb-2">Aturan Normalisasi SAW:</h5>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <strong>Benefit Criteria (C1-C6, C12):</strong>
            <p>• Performance (C1-C6): Rij = (converted_score / max_converted_score)</p>
            <p>• Prestasi (C12): Rij = 1.000 jika nilai = 1, Rij = 0.000 jika nilai = 0</p>
          </div>
          <div className="mt-2">
            <strong>Cost Criteria (C7-C11, C13):</strong>
            <p>• Hari Alpa (C7): Rij = 0.000 jika nilai &gt; 0, Rij = 1.000 jika nilai = 0</p>
            <p>• Lainnya (C8-C11): Rij = min(Xij) / Xij</p>
            <p>• Surat Peringatan (C13): Rij = 1.000 jika nilai = 0, Rij = 0.000 jika nilai = 1</p>
          </div>
        </div>
      </div>

      {/* Auto termination warning */}
      <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-800">Aturan Pemberhentian Otomatis:</p>
          <p className="text-red-700">Karyawan dengan alpa lebih dari 10 hari akan otomatis diberhentikan</p>
        </div>
      </div>
    </>
  );
};
