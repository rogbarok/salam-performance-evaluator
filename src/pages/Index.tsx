import { useState } from "react";
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
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      name: "Budi",
      kualitasKerja: 4,
      tanggungJawab: 5,
      kuantitasKerja: 4,
      pemahamanTugas: 4,
      inisiatif: 3,
      kerjasama: 4,
      hariAlpa: 1,
      keterlambatan: 3,
      hariIzin: 2,
      hariSakit: 4,
      pulangCepat: 1,
      prestasi: 0,
      suratPeringatan: 0
    },
    {
      id: "2",
      name: "Citra",
      kualitasKerja: 5,
      tanggungJawab: 4,
      kuantitasKerja: 4,
      pemahamanTugas: 5,
      inisiatif: 4,
      kerjasama: 5,
      hariAlpa: 0,
      keterlambatan: 1,
      hariIzin: 2,
      hariSakit: 1,
      pulangCepat: 0,
      prestasi: 1,
      suratPeringatan: 0
    },
    {
      id: "3",
      name: "Dedi",
      kualitasKerja: 3,
      tanggungJawab: 3,
      kuantitasKerja: 5,
      pemahamanTugas: 3,
      inisiatif: 3,
      kerjasama: 4,
      hariAlpa: 3,
      keterlambatan: 5,
      hariIzin: 4,
      hariSakit: 1,
      pulangCepat: 2,
      prestasi: 0,
      suratPeringatan: 1
    }
  ]);

  const [results, setResults] = useState<SAWResult[]>([]);

  const addEmployee = (employee: Employee) => {
    setEmployees([...employees, employee]);
  };

  const calculateResults = (sawResults: SAWResult[]) => {
    setResults(sawResults);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sistem Evaluasi Kinerja Karyawan
          </h1>
          <p className="text-xl text-gray-600 mb-4">Yayasan As-Salam</p>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Metode Simple Additive Weighting (SAW)
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">13</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terevaluasi</p>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
