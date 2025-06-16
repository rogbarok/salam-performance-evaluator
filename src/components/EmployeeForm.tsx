import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Employee as DBEmployee, EmployeeEvaluation } from "@/types/database";
import type { Employee, SAWResult } from "@/pages/Index";

interface EmployeeFormProps {
  onAddEmployee: (employee: Employee) => void;
  employees: Employee[];
}

export const EmployeeForm = ({ onAddEmployee, employees }: EmployeeFormProps) => {
  const [dbEmployees, setDbEmployees] = useState<DBEmployee[]>([]);
  const [evaluations, setEvaluations] = useState<EmployeeEvaluation[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [formData, setFormData] = useState({
    kualitasKerja: 1,
    tanggungJawab: 1,
    kuantitasKerja: 1,
    pemahamanTugas: 1,
    inisiatif: 1,
    kerjasama: 1,
    hariAlpa: 0,
    keterlambatan: 0,
    hariIzin: 0,
    hariSakit: 0,
    pulangCepat: 0,
    prestasi: 0,
    suratPeringatan: 0
  });

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setDbEmployees(data || []);
    }
  };

  const fetchEvaluations = async () => {
    const { data, error } = await supabase
      .from('employee_evaluations')
      .select('*');
    
    if (error) {
      console.error('Error fetching evaluations:', error);
    } else {
      setEvaluations(data || []);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchEvaluations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    const selectedEmployee = dbEmployees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) return;

    try {
      // Save to database
      const { data, error } = await supabase
        .from('employee_evaluations')
        .insert([{
          employee_id: selectedEmployeeId,
          kualitas_kerja: formData.kualitasKerja,
          tanggung_jawab: formData.tanggungJawab,
          kuantitas_kerja: formData.kuantitasKerja,
          pemahaman_tugas: formData.pemahamanTugas,
          inisiatif: formData.inisiatif,
          kerjasama: formData.kerjasama,
          hari_alpa: formData.hariAlpa,
          keterlambatan: formData.keterlambatan,
          hari_izin: formData.hariIzin,
          hari_sakit: formData.hariSakit,
          pulang_cepat: formData.pulangCepat,
          prestasi: formData.prestasi,
          surat_peringatan: formData.suratPeringatan
        }])
        .select()
        .single();

      if (error) throw error;

      // Convert to old format for compatibility
      const newEmployee: Employee = {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        kualitasKerja: formData.kualitasKerja,
        tanggungJawab: formData.tanggungJawab,
        kuantitasKerja: formData.kuantitasKerja,
        pemahamanTugas: formData.pemahamanTugas,
        inisiatif: formData.inisiatif,
        kerjasama: formData.kerjasama,
        hariAlpa: formData.hariAlpa,
        keterlambatan: formData.keterlambatan,
        hariIzin: formData.hariIzin,
        hariSakit: formData.hariSakit,
        pulangCepat: formData.pulangCepat,
        prestasi: formData.prestasi,
        suratPeringatan: formData.suratPeringatan
      };

      onAddEmployee(newEmployee);
      
      // Reset form
      setSelectedEmployeeId("");
      setFormData({
        kualitasKerja: 1,
        tanggungJawab: 1,
        kuantitasKerja: 1,
        pemahamanTugas: 1,
        inisiatif: 1,
        kerjasama: 1,
        hariAlpa: 0,
        keterlambatan: 0,
        hariIzin: 0,
        hariSakit: 0,
        pulangCepat: 0,
        prestasi: 0,
        suratPeringatan: 0
      });

      fetchEvaluations();
    } catch (error) {
      console.error('Error saving evaluation:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get evaluated employee IDs
  const evaluatedEmployeeIds = evaluations.map(evaluation => evaluation.employee_id);
  const availableEmployees = dbEmployees.filter(emp => !evaluatedEmployeeIds.includes(emp.id));

  return (
    <div className="space-y-6">
      {/* Current Employees */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <User className="w-5 h-5" />
            Data Evaluasi Karyawan ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada data evaluasi karyawan</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Kualitas Kerja: {employee.kualitasKerja}/5</p>
                    <p>Tanggung Jawab: {employee.tanggungJawab}/5</p>
                    <p>Alpa: {employee.hariAlpa} hari</p>
                    <div className="flex gap-2 mt-2">
                      {employee.prestasi === 1 && (
                        <Badge variant="default" className="text-xs">Prestasi</Badge>
                      )}
                      {employee.suratPeringatan === 1 && (
                        <Badge variant="destructive" className="text-xs">SP</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Employee Evaluation Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <UserPlus className="w-5 h-5" />
            Tambah Evaluasi Karyawan Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <Label htmlFor="employee">Pilih Karyawan</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan untuk dievaluasi" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.length === 0 ? (
                    <SelectItem value="" disabled>Semua karyawan sudah dievaluasi</SelectItem>
                  ) : (
                    availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position} ({employee.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployeeId && (
              <>
                {/* Performance Criteria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">A. Kinerja Inti (Skala 1-5)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="kualitasKerja">Kualitas Kerja</Label>
                      <Input
                        id="kualitasKerja"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.kualitasKerja}
                        onChange={(e) => handleInputChange("kualitasKerja", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggungJawab">Tanggung Jawab</Label>
                      <Input
                        id="tanggungJawab"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.tanggungJawab}
                        onChange={(e) => handleInputChange("tanggungJawab", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kuantitasKerja">Kuantitas Kerja</Label>
                      <Input
                        id="kuantitasKerja"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.kuantitasKerja}
                        onChange={(e) => handleInputChange("kuantitasKerja", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pemahamanTugas">Pemahaman Tugas</Label>
                      <Input
                        id="pemahamanTugas"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.pemahamanTugas}
                        onChange={(e) => handleInputChange("pemahamanTugas", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inisiatif">Inisiatif</Label>
                      <Input
                        id="inisiatif"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.inisiatif}
                        onChange={(e) => handleInputChange("inisiatif", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kerjasama">Kerjasama</Label>
                      <Input
                        id="kerjasama"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.kerjasama}
                        onChange={(e) => handleInputChange("kerjasama", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Discipline Criteria */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">B. Kedisiplinan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hariAlpa">Jumlah Hari Alpa</Label>
                      <Input
                        id="hariAlpa"
                        type="number"
                        min="0"
                        value={formData.hariAlpa}
                        onChange={(e) => handleInputChange("hariAlpa", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="keterlambatan">Jumlah Keterlambatan</Label>
                      <Input
                        id="keterlambatan"
                        type="number"
                        min="0"
                        value={formData.keterlambatan}
                        onChange={(e) => handleInputChange("keterlambatan", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hariIzin">Jumlah Hari Izin</Label>
                      <Input
                        id="hariIzin"
                        type="number"
                        min="0"
                        value={formData.hariIzin}
                        onChange={(e) => handleInputChange("hariIzin", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hariSakit">Jumlah Hari Sakit</Label>
                      <Input
                        id="hariSakit"
                        type="number"
                        min="0"
                        value={formData.hariSakit}
                        onChange={(e) => handleInputChange("hariSakit", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pulangCepat">Pulang Cepat</Label>
                      <Input
                        id="pulangCepat"
                        type="number"
                        min="0"
                        value={formData.pulangCepat}
                        onChange={(e) => handleInputChange("pulangCepat", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Factors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">C. Faktor Tambahan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prestasi">Prestasi (0=Tidak, 1=Ada)</Label>
                      <Input
                        id="prestasi"
                        type="number"
                        min="0"
                        max="1"
                        value={formData.prestasi}
                        onChange={(e) => handleInputChange("prestasi", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="suratPeringatan">Surat Peringatan (0=Tidak, 1=Ada)</Label>
                      <Input
                        id="suratPeringatan"
                        type="number"
                        min="0"
                        max="1"
                        value={formData.suratPeringatan}
                        onChange={(e) => handleInputChange("suratPeringatan", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedEmployeeId}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Evaluasi Karyawan
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
