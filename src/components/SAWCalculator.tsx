
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Criteria } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import type { Employee, SAWResult } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { SAWMatrixDisplay } from "./SAWMatrixDisplay";
import { SAWCriteriaInfo } from "./SAWCriteriaInfo";
import { SAWCalculationEngine } from "./SAWCalculationEngine";

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
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching criteria:', error);
        throw error;
      }

      const weights: { [key: string]: number } = {};
      const types: { [key: string]: string } = {};

      // Map database names to form field names
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

      // Type cast the data to ensure proper typing
      const typedCriteriaData: Criteria[] = (data || []).map(item => ({
        ...item,
        type: item.type as 'Benefit' | 'Cost'
      }));

      typedCriteriaData.forEach((criteria: Criteria) => {
        const fieldName = criteriaMapping[criteria.name];
        if (fieldName) {
          weights[fieldName] = criteria.weight / 100; // Convert percentage to decimal
          types[fieldName] = criteria.type;
        }
      });

      setCriteriaWeights(weights);
      setCriteriaTypes(types);
      setCriteriaData(typedCriteriaData);

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
    try {
      const calculationEngine = new SAWCalculationEngine(criteriaWeights, criteriaTypes);
      const results = await calculationEngine.calculate(employees);
      
      setDecisionMatrix(results.decisionMatrix);
      setNormalizedMatrix(results.normalizedMatrix);
      setFinalScores(results.finalResults);
      setIsCalculated(true);
      onCalculate(results.finalResults);

      toast({
        title: "Berhasil",
        description: `Perhitungan SAW selesai menggunakan ${Object.keys(criteriaWeights).length} kriteria`,
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

            <SAWCriteriaInfo />
          </div>
        </CardContent>
      </Card>

      <SAWMatrixDisplay 
        employees={employees}
        criteriaData={criteriaData}
        decisionMatrix={decisionMatrix}
        normalizedMatrix={normalizedMatrix}
        finalScores={finalScores}
      />
    </div>
  );
};
