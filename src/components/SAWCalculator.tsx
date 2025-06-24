import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Play, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Criteria } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import type { Employee, SAWResult } from "@/pages/Index";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SAWCalculatorProps {
  employees: Employee[];
  onCalculate: (results: SAWResult[]) => void;
}

export const SAWCalculator = ({ employees, onCalculate }: SAWCalculatorProps) => {
  const [criteriaWeights, setCriteriaWeights] = useState<{ [key: string]: number }>({});
  const [criteriaTypes, setCriteriaTypes] = useState<{ [key: string]: string }>({});
  const [criteriaData, setCriteriaData] = useState<Criteria[]>([]);
  const [decisionMatrix, setDecisionMatrix] = useState<number[][]>([]);
  const [normalizedMatrix, setNormalizedMatrix] = useState<number[][]>([]);
  const [finalScores, setFinalScores] = useState<SAWResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCriteriaWeights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/criteria');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      const weights: { [key: string]: number } = {};
      const types: { [key: string]: string } = {};

      data.forEach((criteria: Criteria) => {
        weights[criteria.name] = criteria.weight / 100; // Convert percentage to decimal
        types[criteria.name] = criteria.type;
      });

      setCriteriaWeights(weights);
      setCriteriaTypes(types);
      setCriteriaData(data);

      console.log('Criteria weights fetched successfully:', weights);
      toast({
        title: "Berhasil",
        description: "Data kriteria berhasil dimuat dari database",
      });
    } catch (error) {
      console.error('Error fetching criteria weights:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kriteria dari database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteriaWeights();
  }, []);

  // Function to convert form score (1-5) to a scale (e.g., 20-100)
  const convertFormScoreToScale = (score: number): number => {
    return score * 20; // Assuming a linear scale from 20 to 100
  };

  // Function to convert SAW score back to form scale (1-5)
  const convertSAWScoreToFormScale = (sawScore: number): number => {
    return Math.max(1, Math.min(5, Math.round(sawScore * 5)));
  };

  const calculateSAW = async () => {
    if (employees.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data karyawan untuk dihitung",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(criteriaWeights).length === 0) {
      toast({
        title: "Error",
        description: "Data kriteria belum dimuat dari database",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("Starting SAW calculation for employees:", employees.length);
    console.log("Using criteria weights (decimals):", criteriaWeights);

    try {
      const allCriteria = [
        'kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 'pemahamanTugas', 
        'inisiatif', 'kerjasama', 'hariAlpa', 'keterlambatan', 'hariIzin', 
        'hariSakit', 'pulangCepat', 'prestasi', 'suratPeringatan'
      ];

      const activeCriteria = allCriteria.filter(criterion => criteriaWeights[criterion] !== undefined);
      
      console.log("Active criteria for calculation:", activeCriteria);

      // Step 1: Create decision matrix - use RAW DATA (no conversion yet)
      const matrix = employees.map(emp => 
        activeCriteria.map(criterion => {
          const rawValue = emp[criterion as keyof Employee] as number;
          return rawValue; // Keep raw data as is
        })
      );

      console.log("Decision Matrix (Raw Data):", matrix);
      setDecisionMatrix(matrix);

      // Step 2: Apply SAW normalization with corrected logic for cost criteria
      const normalized = matrix.map(() => new Array(activeCriteria.length).fill(0));

      for (let j = 0; j < activeCriteria.length; j++) {
        const criterion = activeCriteria[j];
        const columnValues = matrix.map(row => row[j]);
        const criterionType = criteriaTypes[criterion] || 'Benefit';
        
        console.log(`Normalizing criterion ${criterion} (${criterionType}):`, columnValues);
        
        // Check if this is a performance criteria (1-5 scale)
        const isPerformanceCriteria = ['kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 
          'pemahamanTugas', 'inisiatif', 'kerjasama'].includes(criterion);
        
        if (criterionType === 'Benefit') {
          if (isPerformanceCriteria) {
            // For performance criteria: convert to scale first, then normalize
            const scaleValues = columnValues.map(val => convertFormScoreToScale(val));
            const maxScaleValue = Math.max(...scaleValues);
            console.log(`Scale values for ${criterion}:`, scaleValues, 'Max:', maxScaleValue);
            
            if (maxScaleValue > 0) {
              for (let i = 0; i < matrix.length; i++) {
                const scaleValue = convertFormScoreToScale(matrix[i][j]);
                normalized[i][j] = scaleValue / maxScaleValue;
              }
            } else {
              for (let i = 0; i < matrix.length; i++) {
                normalized[i][j] = 0;
              }
            }
          } else if (criterion === 'prestasi') {
            // C12 - Prestasi: if = 1 → 1.000, if = 0 → 0.000
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] === 1 ? 1.000 : 0.000;
            }
            console.log(`Prestasi normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          } else {
            // For other benefit criteria: direct normalization
            const maxValue = Math.max(...columnValues);
            console.log(`Max value for ${criterion}:`, maxValue);
            
            if (maxValue > 0) {
              for (let i = 0; i < matrix.length; i++) {
                normalized[i][j] = matrix[i][j] / maxValue;
              }
            } else {
              for (let i = 0; i < matrix.length; i++) {
                normalized[i][j] = 0;
              }
            }
          }
        } else {
          // For Cost criteria
          if (criterion === 'hariAlpa') {
            // C7 - Hari Alpa: Special rule - if > 0 → 0.000, if = 0 → 1.000
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] > 0 ? 0.000 : 1.000;
            }
            console.log(`Hari Alpa normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          } else if (criterion === 'suratPeringatan') {
            // C13 - Surat Peringatan: if = 0 → 1.000, if = 1 → 0.000
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] === 0 ? 1.000 : 0.000;
            }
            console.log(`Surat Peringatan normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          } else {
            // C8-C11 - Other cost criteria: min(Xij) / Xij
            // Find minimum non-zero value
            const nonZeroValues = columnValues.filter(val => val > 0);
            
            if (nonZeroValues.length === 0) {
              // All values are 0, give everyone perfect score
              for (let i = 0; i < matrix.length; i++) {
                normalized[i][j] = 1.000;
              }
            } else {
              const minValue = Math.min(...nonZeroValues);
              console.log(`Min non-zero value for ${criterion}:`, minValue);
              
              for (let i = 0; i < matrix.length; i++) {
                if (matrix[i][j] === 0) {
                  normalized[i][j] = 1.000; // Best score if no cost
                } else {
                  normalized[i][j] = minValue / matrix[i][j];
                }
              }
            }
            console.log(`${criterion} normalization: [${normalized.map(row => row[j].toFixed(3)).join(', ')}]`);
          }
        }
      }

      console.log("Normalized Matrix:", normalized);
      setNormalizedMatrix(normalized);

      // Step 3: Calculate weighted scores (SAW method)
      const results: SAWResult[] = employees.map((employee, index) => {
        const normalizedScores = normalized[index];
        
        // Calculate final SAW score: sum of (weight * normalized_score)
        const finalScore = normalizedScores.reduce((sum, normalizedScore, j) => {
          const criterion = activeCriteria[j];
          const weight = criteriaWeights[criterion];
          const weightedScore = normalizedScore * weight;
          
          console.log(`Employee ${employee.name}, criterion ${criterion}: normalized=${normalizedScore.toFixed(3)}, weight=${weight}, weighted=${weightedScore.toFixed(3)}`);
          
          return sum + weightedScore;
        }, 0);

        console.log(`Final SAW score for ${employee.name}:`, finalScore.toFixed(4));

        // Convert SAW score back to form scale (1-5)
        const convertedScore = convertSAWScoreToFormScale(finalScore);
        console.log(`Converted score for ${employee.name}: ${finalScore.toFixed(4)} -> ${convertedScore}`);
        
        // Check for automatic termination
        const isAutoTerminated = employee.hariAlpa > 10;
        
        // Generate recommendation
        const { recommendation, note } = getRecommendation(convertedScore, isAutoTerminated, employee.hariAlpa);

        return {
          employee,
          normalizedScores,
          finalScore,
          convertedScore,
          rank: 0,
          recommendation,
          note
        };
      });

      // Step 4: Rank employees (excluding auto-terminated ones)
      const nonTerminatedResults = results.filter(r => r.employee.hariAlpa <= 10);
      const terminatedResults = results.filter(r => r.employee.hariAlpa > 10);
      
      nonTerminatedResults.sort((a, b) => b.finalScore - a.finalScore);
      nonTerminatedResults.forEach((result, index) => {
        result.rank = index + 1;
      });
      
      terminatedResults.forEach(result => {
        result.rank = 999; // Special rank for terminated employees
      });

      const finalResults = [...nonTerminatedResults, ...terminatedResults];

      console.log("Final Results:", finalResults);
      setFinalScores(finalResults);
      setIsCalculated(true);
      onCalculate(finalResults);

      toast({
        title: "Berhasil",
        description: `Perhitungan SAW selesai menggunakan ${activeCriteria.length} kriteria`,
      });
    } catch (error) {
      console.error('Error in SAW calculation:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan dalam perhitungan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (convertedScore: number, isAutoTerminated: boolean, alpaDays: number): { recommendation: string, note?: string } => {
    if (isAutoTerminated) {
      return {
        recommendation: "Pemberhentian",
        note: `Karyawan diberhentikan otomatis karena alpa lebih dari ${alpaDays} hari.`
      };
    }

    if (convertedScore >= 4) {
      return { recommendation: "Promosi" };
    } else if (convertedScore >= 3) {
      return { recommendation: "Pertahankan" };
    } else if (convertedScore >= 2) {
      return { recommendation: "Evaluasi Lanjutan" };
    } else {
      return { recommendation: "Pemberhentian" };
    }
  };

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
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Calculator className="w-5 h-5" />
            Perhitungan Simple Additive Weighting (SAW)
          </CardTitle>
          <p className="text-gray-600">
            Proses perhitungan otomatis menggunakan metode SAW untuk evaluasi kinerja karyawan
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Total karyawan: <span className="font-semibold">{employees.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Kriteria dimuat: <span className="font-semibold">{Object.keys(criteriaWeights).length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Total kriteria di database: <span className="font-semibold">{criteriaData.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Status: {isCalculated ? (
                    <Badge variant="default" className="ml-1">Sudah dihitung</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-1">Belum dihitung</Badge>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={fetchCriteriaWeights}
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Kriteria
                </Button>
                <Button 
                  onClick={calculateSAW}
                  disabled={employees.length === 0 || loading || Object.keys(criteriaWeights).length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? "Menghitung..." : "Hitung SAW"}
                </Button>
              </div>
            </div>

            {employees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tambahkan data evaluasi karyawan terlebih dahulu</p>
              </div>
            )}

            {Object.keys(criteriaWeights).length === 0 && criteriaData.length === 0 && (
              <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg">
                <p>Kriteria belum dimuat dari database. Pastikan ada kriteria di database dan klik "Muat Ulang Kriteria".</p>
              </div>
            )}

            {criteriaData.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Kriteria yang Dimuat dari Database:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {criteriaData.map((criteria) => (
                    <div key={criteria.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{criteria.name}</span>
                      <span className="text-gray-600">
                        {criteria.type} - Bobot: {criteria.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};
