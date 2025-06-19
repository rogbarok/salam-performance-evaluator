
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, Trophy, AlertTriangle } from "lucide-react";
import { EmployeeForm } from "@/components/EmployeeForm";
import { SAWCalculator } from "@/components/SAWCalculator";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { CriteriaTable } from "@/components/CriteriaTable";
import { CriteriaManagement } from "@/components/CriteriaManagement";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Employee {
  id: string;
  name: string;
  kualitasKerja: number;
  tanggungJawab: number;
  kuantitasKerja: number;
  pemahamanTugas: number;
  inisiatif: number;
  kerjasama: number;
  hariAlpa: number;
  keterlambatan: number;
  hariIzin: number;
  hariSakit: number;
  pulangCepat: number;
  prestasi: number;
  suratPeringatan: number;
}

export interface SAWResult {
  employee: Employee;
  normalizedScores: number[];
  finalScore: number;
  convertedScore: number;
  rank: number;
  recommendation: string;
  note?: string;
}

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [results, setResults] = useState<SAWResult[]>([]);
  const [totalCriteria, setTotalCriteria] = useState(0);
  const [totalEmployeesInDB, setTotalEmployeesInDB] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from database
  const loadDataFromDatabase = async () => {
    setLoading(true);
    try {
      // Load employees and their evaluations
      const { data: evaluationsData, error: evalError } = await supabase
        .from('employee_evaluations')
        .select(`
          *,
          employees!inner(id, name, position, department)
        `);

      if (evalError) {
        console.error('Error fetching evaluations:', evalError);
      } else {
        // Convert database evaluations to Employee format
        const convertedEmployees: Employee[] = (evaluationsData || []).map(evaluation => ({
          id: evaluation.employees.id,
          name: evaluation.employees.name,
          kualitasKerja: evaluation.kualitas_kerja,
          tanggungJawab: evaluation.tanggung_jawab,
          kuantitasKerja: evaluation.kuantitas_kerja,
          pemahamanTugas: evaluation.pemahaman_tugas,
          inisiatif: evaluation.inisiatif,
          kerjasama: evaluation.kerjasama,
          hariAlpa: evaluation.hari_alpa,
          keterlambatan: evaluation.keterlambatan,
          hariIzin: evaluation.hari_izin,
          hariSakit: evaluation.hari_sakit,
          pulangCepat: evaluation.pulang_cepat,
          prestasi: evaluation.prestasi,
          suratPeringatan: evaluation.surat_peringatan
        }));

        setEmployees(convertedEmployees);
        console.log('Loaded employees with evaluations:', convertedEmployees.length);
      }

      // Load criteria count
      const { count: criteriaCount, error: criteriaError } = await supabase
        .from('criteria')
        .select('*', { count: 'exact', head: true });

      if (criteriaError) {
        console.error('Error fetching criteria count:', criteriaError);
      } else {
        setTotalCriteria(criteriaCount || 0);
      }

      // Load total employees count
      const { count: employeesCount, error: employeesError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      if (employeesError) {
        console.error('Error fetching employees count:', employeesError);
      } else {
        setTotalEmployeesInDB(employeesCount || 0);
      }

    } catch (error) {
      console.error('Network error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dari database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  const addEmployee = (employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
  };

  const calculateResults = (sawResults: SAWResult[]) => {
    setResults(sawResults);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data dari database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sistem Evaluasi Kinerja Karyawan
          </h1>
          <p className="text-xl text-gray-600 mb-4">Yayasan As-Salam</p>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Metode Simple Additive Weighting (SAW)
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmployeesInDB}</p>
                  <p className="text-xs text-gray-500">Terevaluasi: {employees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kriteria</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCriteria}</p>
                  <p className="text-xs text-gray-500">Dari database</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terhitung</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                  <p className="text-xs text-gray-500">Hasil SAW</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Perlu Perhatian</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {results.filter(r => r.convertedScore < 3).length}
                  </p>
                  <p className="text-xs text-gray-500">Skor &lt; 3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="criteria" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="criteria">Kriteria & Bobot</TabsTrigger>
            <TabsTrigger value="criteria-crud">Kelola Kriteria</TabsTrigger>
            <TabsTrigger value="employees">Kelola Karyawan</TabsTrigger>
            <TabsTrigger value="input">Input Data</TabsTrigger>
            <TabsTrigger value="calculate">Perhitungan SAW</TabsTrigger>
            <TabsTrigger value="results">Hasil & Rekomendasi</TabsTrigger>
          </TabsList>

          <TabsContent value="criteria">
            <CriteriaTable />
          </TabsContent>

          <TabsContent value="criteria-crud">
            <CriteriaManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="input">
            <EmployeeForm onAddEmployee={addEmployee} employees={employees} />
          </TabsContent>

          <TabsContent value="calculate">
            <SAWCalculator employees={employees} onCalculate={calculateResults} />
          </TabsContent>

          <TabsContent value="results">
            <ResultsDisplay results={results} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
