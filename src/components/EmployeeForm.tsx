
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data karyawan dari database",
          variant: "destructive",
        });
      } else {
        setDbEmployees(data || []);
        console.log('Employees fetched successfully:', data?.length || 0);
      }
    } catch (error) {
      console.error('Network error fetching employees:', error);
      toast({
        title: "Error",
        description: "Gagal terhubung ke database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_evaluations')
        .select('*');
      
      if (error) {
        console.error('Error fetching evaluations:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data evaluasi dari database",
          variant: "destructive",
        });
      } else {
        setEvaluations(data || []);
        console.log('Evaluations fetched successfully:', data?.length || 0);
      }
    } catch (error) {
      console.error('Network error fetching evaluations:', error);
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

    setLoading(true);
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

      toast({
        title: "Berhasil",
        description: "Data evaluasi karyawan berhasil disimpan",
      });

      fetchEvaluations();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data evaluasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmployeeDetailClick = (employee: Employee) => {
    setSelectedEmployeeForDetail(employee);
    setIsDetailDialogOpen(true);
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
                <div key={employee.id} className="p-4 border rounded-lg bg-gray-50 relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmployeeDetailClick(employee)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Evaluasi Karyawan</DialogTitle>
          </DialogHeader>
          {selectedEmployeeForDetail && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold">{selectedEmployeeForDetail.name}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700">Kinerja Inti</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Kualitas Kerja:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.kualitasKerja}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggung Jawab:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.tanggungJawab}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kuantitas Kerja:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.kuantitasKerja}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pemahaman Tugas:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.pemahamanTugas}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inisiatif:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.inisiatif}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kerjasama:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.kerjasama}/5</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600">Kedisiplinan</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Hari Alpa:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.hariAlpa} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keterlambatan:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.keterlambatan} kali</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hari Izin:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.hariIzin} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hari Sakit:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.hariSakit} hari</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pulang Cepat:</span>
                      <span className="font-medium">{selectedEmployeeForDetail.pulangCepat} kali</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-blue-600 mb-3">Faktor Tambahan</h4>
                <div className="flex gap-4">
                  {selectedEmployeeForDetail.prestasi === 1 && (
                    <Badge variant="default">Memiliki Prestasi</Badge>
                  )}
                  {selectedEmployeeForDetail.suratPeringatan === 1 && (
                    <Badge variant="destructive">Surat Peringatan</Badge>
                  )}
                  {selectedEmployeeForDetail.prestasi === 0 && selectedEmployeeForDetail.suratPeringatan === 0 && (
                    <span className="text-gray-500">Tidak ada faktor tambahan</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Employee Evaluation Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <UserPlus className="w-5 h-5" />
            Tambah Evaluasi Karyawan Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <Label htmlFor="employee">Pilih Karyawan</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan untuk dievaluasi" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.length === 0 ? (
                    <div className="p-2 text-center text-gray-500">
                      {loading ? "Memuat..." : "Semua karyawan sudah dievaluasi"}
                    </div>
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
                  disabled={!selectedEmployeeId || loading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? "Menyimpan..." : "Tambah Evaluasi Karyawan"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
