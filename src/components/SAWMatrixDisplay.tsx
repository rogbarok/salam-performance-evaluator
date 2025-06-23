
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Employee, SAWResult } from "@/pages/Index";
import type { Criteria } from "@/types/database";

interface SAWMatrixDisplayProps {
  employees: Employee[];
  criteriaData: Criteria[];
  decisionMatrix: number[][];
  normalizedMatrix: number[][];
  finalScores: SAWResult[];
}

export const SAWMatrixDisplay = ({ 
  employees, 
  criteriaData, 
  decisionMatrix, 
  normalizedMatrix, 
  finalScores 
}: SAWMatrixDisplayProps) => {
  const getScoreLabel = (score: number): string => {
    if (score >= 4) {
      return "Sangat Baik";
    } else if (score >= 3) {
      return "Baik";
    } else if (score >= 2) {
      return "Cukup";
    } else {
      return "Kurang";
    }
  };

  return (
    <>
      {decisionMatrix.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Decision Matrix</CardTitle>
            <p className="text-sm text-gray-600">Matriks keputusan awal (nilai asli)</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Data mentah karyawan</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nama</TableHead>
                    {criteriaData.map((criteria) => (
                      <TableHead key={criteria.id}>{criteria.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      {decisionMatrix[index].map((value, j) => (
                        <TableCell key={j}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {normalizedMatrix.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Normalized Matrix</CardTitle>
            <p className="text-sm text-gray-600">
              Matriks yang sudah dinormalisasi menggunakan metode SAW
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Data Normalisasi</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Nama</TableHead>
                    {criteriaData.map((criteria) => (
                      <TableHead key={criteria.id}>{criteria.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      {normalizedMatrix[index].map((value, j) => (
                        <TableCell key={j}>{value.toFixed(3)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {finalScores.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Final Scores</CardTitle>
            <p className="text-sm text-gray-600">
              Hasil akhir perhitungan SAW dan rekomendasi
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Hasil Perhitungan SAW</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Peringkat</TableHead>
                    <TableHead className="w-[200px]">Nama</TableHead>
                    <TableHead>Nilai Akhir</TableHead>
                    <TableHead>Nilai Konversi</TableHead>
                    <TableHead>Rekomendasi</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalScores.map((result) => (
                    <TableRow key={result.employee.id}>
                      <TableCell>{result.rank === 999 ? 'Diberhentikan' : result.rank}</TableCell>
                      <TableCell className="font-medium">{result.employee.name}</TableCell>
                      <TableCell>{result.finalScore.toFixed(4)}</TableCell>
                      <TableCell>
                        {result.rank === 999 ? '-' : `${result.convertedScore} (${getScoreLabel(result.convertedScore)})`}
                      </TableCell>
                      <TableCell>{result.recommendation}</TableCell>
                      <TableCell>{result.note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
