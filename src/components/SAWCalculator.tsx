
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Play, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Employee, SAWResult } from "@/pages/Index";
import type { Criteria } from "@/types/database";

interface SAWCalculatorProps {
  employees: Employee[];
  onCalculate: (results: SAWResult[]) => void;
}

export const SAWCalculator = ({ employees, onCalculate }: SAWCalculatorProps) => {
  const [criteriaData, setCriteriaData] = useState<Criteria[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>({});
  const [criteriaTypes, setCriteriaTypes] = useState<Record<string, string>>({});
  const [decisionMatrix, setDecisionMatrix] = useState<number[][]>([]);
  const [normalizedMatrix, setNormalizedMatrix] = useState<number[][]>([]);
  const [finalScores, setFinalScores] = useState<SAWResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load criteria from database
  const fetchCriteriaWeights = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching criteria:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data kriteria dari database",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Warning",
          description: "Tidak ada kriteria yang ditemukan di database",
          variant: "destructive",
        });
        return;
      }

      setCriteriaData(data);

      // Convert criteria data to weights and types object
      const weights: Record<string, number> = {};
      const types: Record<string, string> = {};
      
      // Map database criteria names to our internal field names
      const fieldMapping: Record<string, string> = {
        'Kualitas Kerja': 'kualitasKerja',
        'Tanggung Jawab': 'tanggungJawab',
        'Kuantitas Kerja': 'kuantitasKerja',
        'Pemahaman Tugas': 'pemahamanTugas',
        'Inisiatif': 'inisiatif',
        'Kerjasama': 'kerjasama',
        'Hari Alpa': 'hariAlpa',
        'Jumlah Hari Alpa': 'hariAlpa',
        'Keterlambatan': 'keterlambatan',
        'Jumlah Keterlambatan': 'keterlambatan',
        'Hari Izin': 'hariIzin',
        'Jumlah Hari Izin': 'hariIzin',
        'Hari Sakit': 'hariSakit',
        'Jumlah Hari Sakit': 'hariSakit',
        'Pulang Cepat': 'pulangCepat',
        'Prestasi': 'prestasi',
        'Surat Peringatan': 'suratPeringatan'
      };
      
      data.forEach((criteria: any) => {
        const fieldName = fieldMapping[criteria.name];
        if (fieldName) {
          weights[fieldName] = criteria.weight;
          types[fieldName] = criteria.type;
        }
      });

      // Normalize weights to sum to 1
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      if (totalWeight > 0) {
        Object.keys(weights).forEach(key => {
          weights[key] = weights[key] / totalWeight;
        });
      }

      setCriteriaWeights(weights);
      setCriteriaTypes(types);
      console.log('Loaded criteria from database:', data.length);
      console.log('Mapped weights:', weights);
      console.log('Mapped types:', types);
    } catch (error) {
      console.error('Network error fetching criteria:', error);
      toast({
        title: "Error",
        description: "Gagal terhubung ke database",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCriteriaWeights();
  }, []);

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
    console.log("Using criteria weights:", criteriaWeights);

    try {
      // Get all possible criteria fields
      const allCriteria = [
        'kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 'pemahamanTugas', 
        'inisiatif', 'kerjasama', 'hariAlpa', 'keterlambatan', 'hariIzin', 
        'hariSakit', 'pulangCepat', 'prestasi', 'suratPeringatan'
      ];

      // Filter to only include criteria that have weights
      const activeCriteria = allCriteria.filter(criterion => criteriaWeights[criterion] !== undefined);
      
      console.log("Active criteria for calculation:", activeCriteria);

      // Step 1: Create decision matrix
      const matrix = employees.map(emp => 
        activeCriteria.map(criterion => {
          const value = emp[criterion as keyof Employee];
          return typeof value === 'number' ? value : 0;
        })
      );

      console.log("Decision Matrix:", matrix);
      setDecisionMatrix(matrix);

      // Step 2: Normalize matrix
      const normalized = matrix.map(() => new Array(activeCriteria.length).fill(0));

      for (let j = 0; j < activeCriteria.length; j++) {
        const criterion = activeCriteria[j];
        const columnValues = matrix.map(row => row[j]);
        const criterionType = criteriaTypes[criterion] || 'Benefit';
        
        if (criterionType === 'Benefit') {
          // For benefit criteria: Rij = Xij / max(Xij)
          const maxValue = Math.max(...columnValues);
          if (maxValue > 0) {
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] / maxValue;
            }
          } else {
            // If all values are 0, set normalized to 1
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = 1;
            }
          }
        } else {
          // For cost criteria: Rij = min(Xij) / Xij
          const nonZeroValues = columnValues.filter(val => val > 0);
          const minValue = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 1;
          
          for (let i = 0; i < matrix.length; i++) {
            if (matrix[i][j] === 0) {
              normalized[i][j] = 1; // Best score for cost criteria when value is 0
            } else {
              normalized[i][j] = minValue / matrix[i][j];
            }
          }
        }
      }

      console.log("Normalized Matrix:", normalized);
      setNormalizedMatrix(normalized);

      // Step 3: Calculate final scores
      const weightValues = activeCriteria.map(key => criteriaWeights[key]);
      const results: SAWResult[] = employees.map((employee, index) => {
        const normalizedScores = normalized[index];
        const finalScore = normalizedScores.reduce((sum, score, j) => {
          return sum + (score * weightValues[j]);
        }, 0);

        // Convert to 1-5 scale
        const convertedScore = convertScore(finalScore);
        
        // Generate recommendation
        const { recommendation, note } = getRecommendation(convertedScore);

        return {
          employee,
          normalizedScores,
          finalScore,
          convertedScore,
          rank: 0, // Will be set after sorting
          recommendation,
          note
        };
      });

      // Step 4: Rank employees
      results.sort((a, b) => b.finalScore - a.finalScore);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log("Final Results:", results);
      setFinalScores(results);
      setIsCalculated(true);
      onCalculate(results);

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

  const convertScore = (sawScore: number): number => {
    // Convert SAW score (0-1) to 1-5 scale
    if (sawScore >= 0.85) return 5;
    if (sawScore >= 0.70) return 4;
    if (sawScore >= 0.50) return 3;
    if (sawScore >= 0.30) return 2;
    return 1;
  };

  const getRecommendation = (convertedScore: number): { recommendation: string; note?: string } => {
    if (convertedScore >= 4.0) {
      return {
        recommendation: "Dapat diperpanjang",
        note: "Kandidat promosi"
      };
    } else if (convertedScore >= 3.0) {
      return {
        recommendation: "Dapat diperpanjang"
      };
    } else {
      return {
        recommendation: "Diberhentikan",
        note: "Tidak memenuhi standar kinerja minimum"
      };
    }
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return "Sangat Baik";
    if (score >= 3.5) return "Baik";
    if (score >= 2.5) return "Cukup";
    if (score >= 1.5) return "Kurang";
    return "Sangat Kurang";
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
                  {criteriaData.map((criteria, index) => (
                    <div key={criteria.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{criteria.name}</span>
                      <span className="text-gray-600">
                        {criteria.type} - Bobot: {criteria.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Decision Matrix */}
      {decisionMatrix.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Langkah 1: Matriks Keputusan (X)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Karyawan</th>
                    {Object.keys(criteriaWeights).map((criterion, index) => (
                      <th key={criterion} className="text-center py-2 px-2">C{index + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr key={employee.id} className="border-b">
                      <td className="py-2 px-2 font-medium">{employee.name}</td>
                      {decisionMatrix[index].map((value, j) => (
                        <td key={j} className="text-center py-2 px-2">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Menggunakan {Object.keys(criteriaWeights).length} kriteria dari database
            </p>
          </CardContent>
        </Card>
      )}

      {/* Normalized Matrix */}
      {normalizedMatrix.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Langkah 2: Matriks Ternormalisasi (R)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p><strong>Rumus Normalisasi:</strong></p>
              <p>• Benefit: Rij = Xij / max(Xij)</p>
              <p>• Cost: Rij = min(Xij) / Xij</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Karyawan</th>
                    <th className="text-center py-2 px-2">C1</th>
                    <th className="text-center py-2 px-2">C2</th>
                    <th className="text-center py-2 px-2">C3</th>
                    <th className="text-center py-2 px-2">C4</th>
                    <th className="text-center py-2 px-2">C5</th>
                    <th className="text-center py-2 px-2">C6</th>
                    <th className="text-center py-2 px-2">C7</th>
                    <th className="text-center py-2 px-2">C8</th>
                    <th className="text-center py-2 px-2">C9</th>
                    <th className="text-center py-2 px-2">C10</th>
                    <th className="text-center py-2 px-2">C11</th>
                    <th className="text-center py-2 px-2">C12</th>
                    <th className="text-center py-2 px-2">C13</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr key={employee.id} className="border-b">
                      <td className="py-2 px-2 font-medium">{employee.name}</td>
                      {normalizedMatrix[index].map((value, j) => (
                        <td key={j} className="text-center py-2 px-2">
                          {value.toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Scores */}
      {finalScores.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Langkah 3: Perhitungan Nilai Akhir (V)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm">
              <p><strong>Rumus:</strong> Vi = Σ(Wj × Rij)</p>
              <p>Dimana Wj adalah bobot kriteria dan Rij adalah nilai ternormalisasi</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Nama</th>
                    <th className="text-center py-3 px-4">Skor SAW</th>
                    <th className="text-center py-3 px-4">Skor Konversi</th>
                    <th className="text-center py-3 px-4">Kategori</th>
                    <th className="text-left py-3 px-4">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {finalScores.map((result) => (
                    <tr key={result.employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant={result.rank === 1 ? "default" : "secondary"}>
                          #{result.rank}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{result.employee.name}</td>
                      <td className="text-center py-3 px-4 font-mono">
                        {result.finalScore.toFixed(4)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge 
                          variant={result.convertedScore >= 3 ? "default" : "destructive"}
                          className="font-bold"
                        >
                          {result.convertedScore.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {getScoreLabel(result.convertedScore)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <Badge 
                            variant={result.recommendation === "Dapat diperpanjang" ? "default" : "destructive"}
                            className="mb-1"
                          >
                            {result.recommendation}
                          </Badge>
                          {result.note && (
                            <p className="text-xs text-gray-600 mt-1">{result.note}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
