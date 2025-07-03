import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, User, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";
import type { Employee as DBEmployee, EmployeeEvaluation, Criteria } from "@/types/database";
import type { Employee, SAWResult } from "@/pages/Index";

interface EmployeeFormProps {
  onAddEmployee: (employee: Employee) => void;
  employees: Employee[];
  criteriaUpdateTrigger?: number;
}

export const EmployeeForm = ({ onAddEmployee, employees, criteriaUpdateTrigger }: EmployeeFormProps) => {
  const [dbEmployees, setDbEmployees] = useState<DBEmployee[]>([]);
  const [evaluations, setEvaluations] = useState<EmployeeEvaluation[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Dynamic form data based on criteria - initialize with all possible fields
  const [formData, setFormData] = useState<{ [key: string]: number }>({});

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

  const fetchCriteria = async () => {
    try {
      const { data: criteriaData, error } = await supabase
        .from('criteria')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching criteria:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data kriteria",
          variant: "destructive",
        });
      } else {
        setCriteria(criteriaData || []);
        console.log('EmployeeForm: Criteria loaded:', criteriaData?.length || 0);
        
        // Initialize form data with default values for all criteria
        const newFormData: { [key: string]: number } = {};
        
        // Set default values for all known criteria fields
        const defaultValues = {
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
        };

        // Apply default values
        Object.assign(newFormData, defaultValues);

        // Add any additional criteria from database
        (criteriaData || []).forEach(criterion => {
          const fieldName = criteriaMapping[criterion.name];
          if (fieldName && !(fieldName in newFormData)) {
            // Set default values based on criterion type and category
            if (criterion.category === 'A. Kinerja Inti') {
              newFormData[fieldName] = 1; // Default rating 1-5
            } else if (criterion.category === 'B. Kedisiplinan') {
              newFormData[fieldName] = 0; // Default count 0
            } else if (criterion.category === 'C. Faktor Tambahan') {
              newFormData[fieldName] = 0; // Default binary 0/1
            } else {
              newFormData[fieldName] = 0; // Default fallback
            }
          }
        });
        
        setFormData(newFormData);
        console.log('Form data initialized:', newFormData);
      }
    } catch (error) {
      console.error('Error fetching criteria:', error);
    }
  };

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
        console.log('DB Employees fetched successfully:', data?.length || 0);
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
        .select(`
          *,
          employees!inner(id, name, position, department, email, hire_date)
        `);
      
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

  // Reload criteria when criteriaUpdateTrigger changes
  useEffect(() => {
    fetchCriteria();
  }, [criteriaUpdateTrigger]);

  // Auto-refresh evaluations when employees prop changes
  useEffect(() => {
    fetchEvaluations();
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
    fetchEvaluations();
    fetchCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Silakan pilih karyawan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const selectedEmployee = dbEmployees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Karyawan yang dipilih tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare evaluation data with proper field mapping
      const evaluationData = {
        employee_id: selectedEmployeeId,
        kualitas_kerja: formData.kualitasKerja || 1,
        tanggung_jawab: formData.tanggungJawab || 1,
        kuantitas_kerja: formData.kuantitasKerja || 1,
        pemahaman_tugas: formData.pemahamanTugas || 1,
        inisiatif: formData.inisiatif || 1,
        kerjasama: formData.kerjasama || 1,
        hari_alpa: formData.hariAlpa || 0,
        keterlambatan: formData.keterlambatan || 0,
        hari_izin: formData.hariIzin || 0,
        hari_sakit: formData.hariSakit || 0,
        pulang_cepat: formData.pulangCepat || 0,
        prestasi: formData.prestasi || 0,
        surat_peringatan: formData.suratPeringatan || 0
      };

      console.log('Saving evaluation data:', evaluationData);

      // Save to database
      const { data, error } = await supabase
        .from('employee_evaluations')
        .insert([evaluationData])
        .select()
        .single();

      if (error) throw error;

      // Convert to old format for compatibility with SAW Calculator
      const newEmployee: Employee = {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        kualitasKerja: evaluationData.kualitas_kerja,
        tanggungJawab: evaluationData.tanggung_jawab,
        kuantitasKerja: evaluationData.kuantitas_kerja,
        pemahamanTugas: evaluationData.pemahaman_tugas,
        inisiatif: evaluationData.inisiatif,
        kerjasama: evaluationData.kerjasama,
        hariAlpa: evaluationData.hari_alpa,
        keterlambatan: evaluationData.keterlambatan,
        hariIzin: evaluationData.hari_izin,
        hariSakit: evaluationData.hari_sakit,
        pulangCepat: evaluationData.pulang_cepat,
        prestasi: evaluationData.prestasi,
        suratPeringatan: evaluationData.surat_peringatan
      };

      onAddEmployee(newEmployee);
      
      // Reset form to default values
      const defaultValues = {
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
      };
      setFormData(defaultValues);
      setSelectedEmployeeId("");

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

  const handleEmployeeEditClick = (employee: Employee) => {
    setSelectedEmployeeForEdit(employee);
    setIsEditDialogOpen(true);
  };

  const handleEmployeeUpdate = async (updatedEmployee: Employee) => {
    // Refresh evaluations from database to get latest data
    await fetchEvaluations();
    
    // Also update parent component
    onAddEmployee(updatedEmployee);
    
    toast({
      title: "Berhasil",
      description: "Data evaluasi karyawan berhasil diperbarui",
    });
  };

  const handleEmployeeDelete = async (employeeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data evaluasi karyawan ini?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_evaluations')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data evaluasi karyawan berhasil dihapus",
      });

      // Refresh data
      await fetchEvaluations();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data evaluasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get evaluated employee IDs
  const evaluatedEmployeeIds = evaluations.map(evaluation => evaluation.employee_id);
  const availableEmployees = dbEmployees.filter(emp => !evaluatedEmployeeIds.includes(emp.id));

  console.log('Available employees for selection:', availableEmployees.length);
  console.log('Total DB employees:', dbEmployees.length);
  console.log('Total evaluations:', evaluations.length);

  // Group criteria by category for dynamic form rendering
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as { [key: string]: Criteria[] });

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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmployeeDetailClick(employee)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmployeeEditClick(employee)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmployeeDelete(employee.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Employee Edit Dialog */}
      <EditEmployeeDialog
        employee={selectedEmployeeForEdit}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={handleEmployeeUpdate}
      />

      {/* Add New Employee Evaluation Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <UserPlus className="w-5 h-5" />
            Tambah Evaluasi Karyawan Baru
            {criteria.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {criteria.length} Kriteria Dimuat
              </Badge>
            )}
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
                      {loading ? "Memuat..." : dbEmployees.length === 0 ? "Tidak ada data karyawan di database" : "Semua karyawan sudah dievaluasi"}
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
              <p className="text-sm text-gray-500 mt-1">
                Tersedia {availableEmployees.length} dari {dbEmployees.length} karyawan
              </p>
            </div>

            {selectedEmployeeId && criteria.length > 0 && (
              <>
                {/* Dynamic form based on criteria from database */}
                {Object.entries(groupedCriteria).map(([category, criteriaList]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {criteriaList.map((criterion) => {
                        const fieldName = criteriaMapping[criterion.name];
                        if (!fieldName) {
                          console.warn(`No mapping found for criterion: ${criterion.name}`);
                          return null;
                        }
                        
                        const currentValue = formData[fieldName] || 0;
                        
                        return (
                          <div key={criterion.id}>
                            <Label htmlFor={fieldName}>
                              {criterion.name} ({criterion.scale})
                            </Label>
                            <Input
                              id={fieldName}
                              type="number"
                              min={criterion.category === 'A. Kinerja Inti' ? "1" : "0"}
                              max={criterion.scale.includes('1-5') ? "5" : criterion.scale.includes('0-1') || criterion.scale.includes('0/1') ? "1" : "10"}
                              value={currentValue}
                              onChange={(e) => handleInputChange(fieldName as keyof typeof formData, parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Bobot: {criterion.weight}% | Tipe: {criterion.type}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

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

            {selectedEmployeeId && criteria.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada kriteria yang didefinisikan. Silakan tambahkan kriteria terlebih dahulu.</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};