import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Play, RefreshCw, AlertTriangle, Database, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface Criteria {
  id: string;
  name: string;
  type: 'Benefit' | 'Cost';
  weight: number;
  category: string;
  scale: string;
}

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
  const [hasSavedResults, setHasSavedResults] = useState(false);
  const [lastCalculationDate, setLastCalculationDate] = useState<string>('');
  const { toast } = useToast();

  // Mapping dari nama kriteria di database ke field evaluasi
  const criteriaMapping: { [key: string]: string } = {
    'Kualitas Kerja': 'kualitasKerja',
    'Tanggung Jawab': 'tanggungJawab',
    'Kuantitas Kerja': 'kuantitasKerja',
    'Pemahaman Tugas': 'pemahamanTugas',
    'Inisiatif': 'inisiatif',
    'Kerjasama': 'kerjasama',
    'Jumlah Hari Alpa': 'hariAlpa',
    'Jumlah Keterlambatan': 'keterlambatan',
    'Jumlah Hari Izin': 'hariIzin',
    'Jumlah Hari Sakit': 'hariSakit',
    'Pulang Cepat': 'pulangCepat',
    'Prestasi': 'prestasi',
    'Surat Peringatan': 'suratPeringatan'
  };

  // Mapping untuk kode kriteria C1-C13 dengan urutan yang benar
  const criteriaCodeMapping: { [key: string]: string } = {
    'kualitasKerja': 'C1',
    'tanggungJawab': 'C2',
    'kuantitasKerja': 'C3',
    'pemahamanTugas': 'C4',
    'inisiatif': 'C5',
    'kerjasama': 'C6',
    'hariAlpa': 'C7',
    'keterlambatan': 'C8',
    'hariIzin': 'C9',
    'hariSakit': 'C10',
    'pulangCepat': 'C11',
    'prestasi': 'C12',
    'suratPeringatan': 'C13'
  };

  // Urutan kriteria berdasarkan kode C1-C13
  const orderedCriteria = [
    'kualitasKerja',
    'tanggungJawab', 
    'kuantitasKerja',
    'pemahamanTugas',
    'inisiatif',
    'kerjasama',
    'hariAlpa',
    'keterlambatan',
    'hariIzin',
    'hariSakit',
    'pulangCepat',
    'prestasi',
    'suratPeringatan'
  ];

  // Check if there are saved SAW results in database
  const checkSavedResults = async () => {
    try {
      const { data, error } = await supabase
        .from('saw_results')
        .select('calculation_date')
        .order('calculation_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking saved results:', error);
        return;
      }

      if (data && data.length > 0) {
        setHasSavedResults(true);
        setLastCalculationDate(new Date(data[0].calculation_date).toLocaleString('id-ID'));
        console.log('Found saved SAW results from:', data[0].calculation_date);
      } else {
        setHasSavedResults(false);
        console.log('No saved SAW results found');
      }
    } catch (error) {
      console.error('Error checking saved results:', error);
    }
  };

  // Load saved SAW results from database
  const loadSavedResults = async () => {
    if (employees.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data karyawan untuk dimuat",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Loading saved SAW results from database...');

      // Get the latest calculation date
      const { data: latestCalc, error: calcError } = await supabase
        .from('saw_results')
        .select('calculation_date')
        .order('calculation_date', { ascending: false })
        .limit(1);

      if (calcError || !latestCalc || latestCalc.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada hasil perhitungan tersimpan",
          variant: "destructive",
        });
        return;
      }

      const calculationDate = latestCalc[0].calculation_date;

      // Load SAW results
      const { data: savedResults, error: resultsError } = await supabase
        .from('saw_results')
        .select(`
          *,
          employees!inner(id, name, position, department)
        `)
        .eq('calculation_date', calculationDate)
        .order('rank');

      // Load normalized matrix data
      const { data: normalizedData, error: normalizedError } = await supabase
        .from('saw_normalized_matrix')
        .select('*')
        .eq('calculation_date', calculationDate)
        .order('employee_id');

      if (resultsError || normalizedError) {
        console.error('Error loading saved data:', resultsError || normalizedError);
        toast({
          title: "Error",
          description: "Gagal memuat data hasil perhitungan",
          variant: "destructive",
        });
        return;
      }

      // Convert database results to SAWResult format
      const convertedResults: SAWResult[] = (savedResults || []).map(result => {
        // Find employee from current employees list
        const employee = employees.find(emp => emp.id === result.employee_id);
        if (!employee) {
          console.warn(`Employee not found for ID: ${result.employee_id}`);
          return null;
        }

        // Get normalized scores for this employee
        const employeeNormalizedData = (normalizedData || [])
          .filter(norm => norm.employee_id === result.employee_id)
          .sort((a, b) => a.criteria_code.localeCompare(b.criteria_code));

        return {
          employee,
          normalizedScores: employeeNormalizedData.map(norm => norm.normalized_value),
          finalScore: result.final_score,
          convertedScore: result.converted_score,
          rank: result.rank,
          recommendation: result.recommendation,
          note: result.note || undefined
        };
      }).filter(Boolean) as SAWResult[];

      console.log('Loaded saved results:', convertedResults.length);
      
      setFinalScores(convertedResults);
      setIsCalculated(true);
      onCalculate(convertedResults);

      toast({
        title: "Berhasil",
        description: `Berhasil memuat ${convertedResults.length} hasil perhitungan tersimpan`,
      });
    } catch (error) {
      console.error('Error loading saved results:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save SAW results to database
  const saveResultsToDatabase = async (results: SAWResult[], normalizedMatrix: number[][]) => {
    try {
      console.log('Saving SAW results to database...');
      
      const calculationDate = new Date().toISOString();
      const activeCriteria = orderedCriteria.filter(criterion => criteriaWeights[criterion] !== undefined);

      // 1. Save calculation session
      const { error: calcSessionError } = await supabase
        .from('saw_calculations')
        .insert({
          total_employees: results.length,
          total_criteria: activeCriteria.length,
          calculation_date: calculationDate
        });

      if (calcSessionError) {
        console.error('Error saving calculation session:', calcSessionError);
        throw calcSessionError;
      }

      // 2. Save SAW results
      const resultsToInsert = results.map(result => ({
        employee_id: result.employee.id,
        final_score: result.finalScore,
        converted_score: result.convertedScore,
        rank: result.rank,
        recommendation: result.recommendation,
        note: result.note || null,
        calculation_date: calculationDate
      }));

      const { error: resultsError } = await supabase
        .from('saw_results')
        .insert(resultsToInsert);

      if (resultsError) {
        console.error('Error saving SAW results:', resultsError);
        throw resultsError;
      }

      // 3. Save normalized matrix data
      const matrixDataToInsert: any[] = [];
      
      results.forEach((result, empIndex) => {
        result.normalizedScores.forEach((normalizedValue, criteriaIndex) => {
          const criterion = activeCriteria[criteriaIndex];
          const criteriaCode = criteriaCodeMapping[criterion];
          const rawValue = employees.find(emp => emp.id === result.employee.id)?.[criterion as keyof Employee] as number;
          
          matrixDataToInsert.push({
            employee_id: result.employee.id,
            criteria_code: criteriaCode,
            raw_value: rawValue,
            normalized_value: normalizedValue,
            weight: criteriaWeights[criterion],
            calculation_date: calculationDate
          });
        });
      });

      const { error: matrixError } = await supabase
        .from('saw_normalized_matrix')
        .insert(matrixDataToInsert);

      if (matrixError) {
        console.error('Error saving normalized matrix:', matrixError);
        throw matrixError;
      }

      console.log('Successfully saved SAW results to database');
      setHasSavedResults(true);
      setLastCalculationDate(new Date(calculationDate).toLocaleString('id-ID'));

      toast({
        title: "Berhasil",
        description: "Hasil perhitungan SAW berhasil disimpan ke database",
      });
    } catch (error) {
      console.error('Error saving to database:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan hasil ke database",
        variant: "destructive",
      });
    }
  };

  // Clear saved results from database
  const clearSavedResults = async () => {
    setLoading(true);
    try {
      console.log('Clearing saved SAW results...');

      // Delete in order: normalized matrix, results, calculations
      await supabase.from('saw_normalized_matrix').delete().neq('id', '');
      await supabase.from('saw_results').delete().neq('id', '');
      await supabase.from('saw_calculations').delete().neq('id', '');

      setHasSavedResults(false);
      setLastCalculationDate('');
      setFinalScores([]);
      setIsCalculated(false);
      onCalculate([]);

      toast({
        title: "Berhasil",
        description: "Semua hasil perhitungan tersimpan telah dihapus",
      });
    } catch (error) {
      console.error('Error clearing saved results:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus hasil tersimpan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCriteriaWeights = async () => {
    setLoading(true);
    try {
      console.log('Fetching criteria from Supabase...');
      
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('No criteria found in database');
        toast({
          title: "Peringatan",
          description: "Tidak ada kriteria ditemukan di database. Silakan tambahkan kriteria terlebih dahulu.",
          variant: "destructive",
        });
        return;
      }

      console.log('Raw criteria data from Supabase:', data);

      const weights: { [key: string]: number } = {};
      const types: { [key: string]: string } = {};
      const processedCriteria: Criteria[] = [];

      data.forEach((item) => {
        const criteria: Criteria = {
          id: item.id,
          name: item.name,
          type: item.type as 'Benefit' | 'Cost',
          weight: item.weight,
          category: item.category,
          scale: item.scale
        };

        const fieldName = criteriaMapping[criteria.name];
        if (fieldName) {
          weights[fieldName] = criteria.weight / 100;
          types[fieldName] = criteria.type;
          console.log(`Mapped ${criteria.name} -> ${fieldName}`);
        } else {
          console.warn(`No mapping found for criteria: ${criteria.name}`);
        }

        processedCriteria.push(criteria);
      });

      setCriteriaWeights(weights);
      setCriteriaTypes(types);
      setCriteriaData(processedCriteria);

      console.log('Processed criteria weights:', weights);
      console.log('Processed criteria types:', types);
      console.log('Total criteria loaded:', processedCriteria.length);
      console.log('Mapped criteria fields:', Object.keys(weights));

      toast({
        title: "Berhasil",
        description: `Data ${processedCriteria.length} kriteria berhasil dimuat dari database. ${Object.keys(weights).length} kriteria berhasil dipetakan.`,
      });
    } catch (error) {
      console.error('Error fetching criteria:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memuat data kriteria dari database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteriaWeights();
    checkSavedResults();
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
        description: "Data kriteria belum dimuat dari database. Klik 'Muat Ulang Kriteria' terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("Starting SAW calculation for employees:", employees.length);
    console.log("Using criteria weights (decimals):", criteriaWeights);

    try {
      const activeCriteria = orderedCriteria.filter(criterion => criteriaWeights[criterion] !== undefined);
      
      console.log("Active criteria for calculation:", activeCriteria);
      console.log("Available criteria weights:", Object.keys(criteriaWeights));

      if (activeCriteria.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada kriteria yang aktif untuk perhitungan. Pastikan mapping kriteria sudah benar.",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Create decision matrix - use RAW DATA
      const matrix = employees.map(emp => 
        activeCriteria.map(criterion => {
          const rawValue = emp[criterion as keyof Employee] as number;
          return rawValue;
        })
      );

      console.log("Decision Matrix (Raw Data):", matrix);
      setDecisionMatrix(matrix);

      // Step 2: Apply SAW normalization
      const normalized = matrix.map(() => new Array(activeCriteria.length).fill(0));

      for (let j = 0; j < activeCriteria.length; j++) {
        const criterion = activeCriteria[j];
        const columnValues = matrix.map(row => row[j]);
        const criterionType = criteriaTypes[criterion] || 'Benefit';
        
        console.log(`Normalizing criterion ${criterion} (${criterionType}):`, columnValues);
        
        if (criterionType === 'Benefit') {
          if (['kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 'pemahamanTugas', 'inisiatif', 'kerjasama'].includes(criterion)) {
            for (let i = 0; i < matrix.length; i++) {
              const rawValue = matrix[i][j];
              normalized[i][j] = rawValue / 5;
            }
            console.log(`${criterion} normalization (new rule): [${normalized.map(row => row[j].toFixed(3)).join(', ')}]`);
          } else if (criterion === 'prestasi') {
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] === 1 ? 1.000 : 0.000;
            }
            console.log(`Prestasi normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          }
        } else {
          if (['hariAlpa', 'keterlambatan', 'hariIzin', 'hariSakit', 'pulangCepat'].includes(criterion)) {
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] > 0 ? 0.000 : 1.000;
            }
            console.log(`${criterion} normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          } else if (criterion === 'suratPeringatan') {
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = matrix[i][j] === 0 ? 1.000 : 0.000;
            }
            console.log(`Surat Peringatan normalization: [${normalized.map(row => row[j]).join(', ')}]`);
          }
        }
      }

      console.log("Normalized Matrix:", normalized);
      setNormalizedMatrix(normalized);

      // Step 3: Calculate weighted scores (SAW method)
      const results: SAWResult[] = employees.map((employee, index) => {
        const normalizedScores = normalized[index];
        
        const finalScore = normalizedScores.reduce((sum, normalizedScore, j) => {
          const criterion = activeCriteria[j];
          const weight = criteriaWeights[criterion];
          const weightedScore = normalizedScore * weight;
          
          console.log(`Employee ${employee.name}, criterion ${criterion}: normalized=${normalizedScore.toFixed(3)}, weight=${weight}, weighted=${weightedScore.toFixed(3)}`);
          
          return sum + weightedScore;
        }, 0);

        console.log(`Final SAW score for ${employee.name}:`, finalScore.toFixed(4));

        const convertedScore = Math.max(1, Math.min(5, finalScore * 5));
        console.log(`Converted score for ${employee.name}: ${finalScore.toFixed(4)} -> ${convertedScore.toFixed(2)}`);
        
        const isAutoTerminated = employee.hariAlpa > 10;
        
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

      // Step 4: Rank employees
      const nonTerminatedResults = results.filter(r => r.employee.hariAlpa <= 10);
      const terminatedResults = results.filter(r => r.employee.hariAlpa > 10);
      
      nonTerminatedResults.sort((a, b) => b.finalScore - a.finalScore);
      nonTerminatedResults.forEach((result, index) => {
        result.rank = index + 1;
      });
      
      terminatedResults.forEach(result => {
        result.rank = 999;
      });

      const finalResults = [...nonTerminatedResults, ...terminatedResults];

      console.log("Final Results:", finalResults);
      setFinalScores(finalResults);
      setIsCalculated(true);
      onCalculate(finalResults);

      // Save results to database
      await saveResultsToDatabase(finalResults, normalized);

      toast({
        title: "Berhasil",
        description: `Perhitungan SAW selesai menggunakan ${activeCriteria.length} kriteria dan disimpan ke database`,
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
        recommendation: "Diberhentikan",
        note: `Karyawan diberhentikan otomatis karena alpa lebih dari ${alpaDays} hari.`
      };
    }

    if (convertedScore >= 4) {
      return { 
        recommendation: "Dapat diperpanjang",
        note: "Kandidat promosi"
      };
    } else if (convertedScore >= 3) {
      return { recommendation: "Dapat diperpanjang" };
    } else {
      return { recommendation: "Diberhentikan" };
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
                {hasSavedResults && (
                  <p className="text-sm text-gray-600">
                    <Database className="inline w-4 h-4 mr-1" />
                    Data tersimpan: <span className="font-semibold">{lastCalculationDate}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={fetchCriteriaWeights}
                  variant="outline"
                  disabled={loading}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Kriteria
                </Button>
                
                {hasSavedResults && (
                  <Button 
                    onClick={loadSavedResults}
                    variant="outline"
                    disabled={loading || employees.length === 0}
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Muat Hasil Tersimpan
                  </Button>
                )}
                
                <Button 
                  onClick={calculateSAW}
                  disabled={employees.length === 0 || loading || Object.keys(criteriaWeights).length === 0}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? "Menghitung..." : "Hitung SAW"}
                </Button>

                {hasSavedResults && (
                  <Button 
                    onClick={clearSavedResults}
                    variant="destructive"
                    disabled={loading}
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Data Tersimpan
                  </Button>
                )}
              </div>
            </div>

            {employees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tambahkan data evaluasi karyawan terlebih dahulu</p>
              </div>
            )}

            {Object.keys(criteriaWeights).length === 0 && criteriaData.length === 0 && !loading && (
              <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg">
                <p>Kriteria belum dimuat dari database. Pastikan ada kriteria di database dan klik "Muat Ulang Kriteria".</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg">
                <p>Sedang memuat data kriteria dari database...</p>
              </div>
            )}

            {hasSavedResults && !isCalculated && (
              <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg">
                <Database className="w-5 h-5 inline mr-2" />
                <span>Ada hasil perhitungan tersimpan dari {lastCalculationDate}. Klik "Muat Hasil Tersimpan" untuk memuatnya.</span>
              </div>
            )}

            {criteriaData.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Kriteria yang Dimuat dari Database:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {criteriaData.map((criteria) => {
                    const fieldName = criteriaMapping[criteria.name];
                    const isMapped = fieldName && criteriaWeights[fieldName] !== undefined;
                    return (
                      <div key={criteria.id} className={`flex justify-between p-2 rounded ${isMapped ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span>{criteria.name}</span>
                        <span className="text-gray-600">
                          {criteria.type} - Bobot: {criteria.weight}%
                          {isMapped ? ' ✓' : ' ✗'}
                        </span>
                      </div>
                    );
                  })}
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
                  <p><strong>C8:</strong> Keterlambatan (Cost) - <span className="text-red-600">Jika &gt; 0 → 0.000</span></p>
                  <p><strong>C9:</strong> Hari Izin (Cost) - <span className="text-red-600">Jika &gt; 0 → 0.000</span></p>
                  <p><strong>C10:</strong> Hari Sakit (Cost) - <span className="text-red-600">Jika &gt; 0 → 0.000</span></p>
                  <p><strong>C11:</strong> Pulang Cepat (Cost) - <span className="text-red-600">Jika &gt; 0 → 0.000</span></p>
                  <p><strong>C12:</strong> Prestasi (Benefit) - <span className="text-green-600">1 → 1.000, 0 → 0.000</span></p>
                  <p><strong>C13:</strong> Surat Peringatan (Cost) - <span className="text-red-600">0 → 1.000, 1 → 0.000</span></p>
                </div>
              </div>
            </div>

            {/* Updated Normalization Rules */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <h5 className="font-semibold mb-2">Aturan Normalisasi SAW (DIPERBAIKI):</h5>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <strong>Benefit Criteria (C1-C6, C12):</strong>
                  <p>• Performance (C1-C6): <span className="text-blue-600 font-semibold">nilai_asli / 5</span></p>
                  <p className="ml-4 text-blue-600">- Nilai 1 → 0.200, Nilai 2 → 0.400, Nilai 3 → 0.600, Nilai 4 → 0.800, Nilai 5 → 1.000</p>
                  <p>• Prestasi (C12): Rij = 1.000 jika nilai = 1, Rij = 0.000 jika nilai = 0</p>
                </div>
                <div className="mt-2">
                  <strong>Cost Criteria (C7-C13):</strong>
                  <p>• Cost Criteria (C7-C11): Rij = 0.000 jika nilai &gt; 0, Rij = 1.000 jika nilai = 0</p>
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
                    {orderedCriteria.filter(fieldName => criteriaWeights[fieldName] !== undefined).map((fieldName) => (
                      <TableHead key={fieldName}>{criteriaCodeMapping[fieldName]}</TableHead>
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
                    {orderedCriteria.filter(fieldName => criteriaWeights[fieldName] !== undefined).map((fieldName) => (
                      <TableHead key={fieldName}>{criteriaCodeMapping[fieldName]}</TableHead>
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
