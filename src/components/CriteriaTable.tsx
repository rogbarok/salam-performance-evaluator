
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

const criteria = [
  // Kinerja Inti (60%)
  { name: "Kualitas Kerja", type: "Benefit", weight: "15%", category: "A. Kinerja Inti", scale: "1-5" },
  { name: "Tanggung Jawab", type: "Benefit", weight: "15%", category: "A. Kinerja Inti", scale: "1-5" },
  { name: "Kuantitas Kerja", type: "Benefit", weight: "10%", category: "A. Kinerja Inti", scale: "1-5" },
  { name: "Pemahaman Tugas", type: "Benefit", weight: "10%", category: "A. Kinerja Inti", scale: "1-5" },
  { name: "Inisiatif", type: "Benefit", weight: "5%", category: "A. Kinerja Inti", scale: "1-5" },
  { name: "Kerjasama", type: "Benefit", weight: "5%", category: "A. Kinerja Inti", scale: "1-5" },
  
  // Kedisiplinan (25%)
  { name: "Jumlah Hari Alpa", type: "Cost", weight: "10%", category: "B. Kedisiplinan", scale: "Hari" },
  { name: "Jumlah Keterlambatan", type: "Cost", weight: "7%", category: "B. Kedisiplinan", scale: "Kali" },
  { name: "Jumlah Hari Izin", type: "Cost", weight: "3%", category: "B. Kedisiplinan", scale: "Hari" },
  { name: "Jumlah Hari Sakit", type: "Cost", weight: "3%", category: "B. Kedisiplinan", scale: "Hari" },
  { name: "Pulang Cepat", type: "Cost", weight: "2%", category: "B. Kedisiplinan", scale: "Kali" },
  
  // Faktor Tambahan (15%)
  { name: "Prestasi", type: "Benefit", weight: "10%", category: "C. Faktor Tambahan", scale: "0/1" },
  { name: "Surat Peringatan", type: "Cost", weight: "5%", category: "C. Faktor Tambahan", scale: "0/1" },
];

export const CriteriaTable = () => {
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, typeof criteria>);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-green-700">
            Kriteria dan Pembobotan Evaluasi Kinerja
          </CardTitle>
          <p className="text-gray-600">
            Sistem evaluasi menggunakan 13 kriteria dengan total bobot 100%
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedCriteria).map(([category, criteriaList]) => (
              <div key={category} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Kriteria</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Tipe</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Bobot</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Skala</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteriaList.map((criterion, index) => (
                        <tr key={index} className="border-b hover:bg-white transition-colors">
                          <td className="py-3 px-4 font-medium">{criterion.name}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={criterion.type === "Benefit" ? "default" : "destructive"}
                              className="flex items-center gap-1 w-fit"
                            >
                              {criterion.type === "Benefit" ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {criterion.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-600">
                            {criterion.weight}
                          </td>
                          <td className="py-3 px-4">{criterion.scale}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {criterion.type === "Benefit" 
                              ? "Semakin tinggi semakin baik" 
                              : "Semakin rendah semakin baik"
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Catatan Penting:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Benefit:</strong> Nilai yang lebih tinggi menunjukkan kinerja yang lebih baik</li>
              <li>• <strong>Cost:</strong> Nilai yang lebih rendah menunjukkan kinerja yang lebih baik</li>
              <li>• Total bobot keseluruhan adalah 100%</li>
              <li>• Nilai minimum untuk rekomendasi perpanjangan kontrak adalah 3.0</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
