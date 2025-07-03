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
  
  // Dynamic form data - akan diisi berdasarkan kriteria dari database
  const [formData, setFormData] = useState<{ [key: string]: number }>({});

  // Fungsi untuk mengkonversi nama kriteria menjadi field name yang konsisten
  const createFieldName = (criteriaName: string): string => {
    return criteriaName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Hapus karakter khusus
      .replace(/\s+/g, '_') // Ganti spasi dengan underscore
      .replace(/^_+|_+$/g, '') // Hapus underscore di awal/akhir
      .replace(/_+/g, '_'); // Ganti multiple underscore dengan single
  };

  // Mapping dinamis dari nama kriteria ke field database
  const createDatabaseFieldMapping = (criteriaName: string): string => {
    const fieldName = createFieldName(criteriaName);
    
    // Mapping khusus untuk kriteria yang sudah ada di database
    const specialMappings: { [key: string]: string } = {
      'kualitas_kerja': 'kualitas_kerja',
      'tanggung_jawab': 'tanggung_jawab',
      'kuantitas_kerja': 'kuantitas_kerja',
      'pemahaman_tugas': 'pemahaman_tugas',
      'inisiatif': 'inisiatif',
      'kerjasama': 'kerjasama',
      'jumlah_hari_alpa': 'hari_alpa',
      'jumlah_keterlambatan': 'keterlambatan',
      'jumlah_hari_izin': 'hari_izin',
      'jumlah_hari_sakit': 'hari_sakit',
      'pulang_cepat': 'pulang_cepat',
      'prestasi': 'prestasi',
      'surat_peringatan': 'surat_peringatan'
    };

    return specialMappings[fieldName] || fieldName;
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
        
        // Initialize form data dengan semua kriteria dari database
        const newFormData: { [key: string]: number } = {};
        
        (criteriaData || []).forEach(criterion => {
          const fieldName = createFieldName(criterion.name);
          
          // Set default values berdasarkan tipe dan kategori kriteria
          if (criterion.type === 'Benefit') {
            if (criterion.scale.includes('1-5')) {
              newFormData[fieldName] = 1; // Default untuk skala 1-5
            } else if (criterion.scale.includes('0-1') || criterion.scale.includes('0/1')) {
              newFormData[fieldName] = 0; // Default untuk binary
            } else {
              newFormData[fieldName] = 1; // Default fallback untuk benefit
            }
          } else { // Cost criteria
            newFormData[fieldName] = 0; // Default untuk cost criteria
          }
        });
        
        setFormData(newFormData);
        console.log('Form data initialized with all criteria:', newFormData);
        console.log('Total criteria loaded:', Object.keys(newFormData).length);
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
      // Prepare evaluation data dengan mapping dinamis ke field database
      const evaluationData: any = {
        employee_id: selectedEmployeeId,
      };

      // Map semua form data ke field database yang sesuai
      criteria.forEach(criterion => {
        const formFieldName = createFieldName(criterion.name);
        const dbFieldName = createDatabaseFieldMapping(criterion.name);
        const value = formData[formFieldName] || 0;
        
        evaluationData[dbFieldName] = value;
        console.log(`Mapping: ${criterion.name} -> ${formFieldName} -> ${dbFieldName} = ${value}`);
      });

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
        // Map data kembali ke format Employee interface
        kualitasKerja: evaluationData.kualitas_kerja || 1,
        tanggungJawab: evaluationData.tanggung_jawab || 1,
        kuantitasKerja: evaluationData.kuantitas_kerja || 1,
        pemahamanTugas: evaluationData.pemahaman_tugas || 1,
        inisiatif: evaluationData.inisiatif || 1,
        kerjasama: evaluationData.kerjasama || 1,
        hariAlpa: evaluationData.hari_alpa || 0,
        keterlambatan: evaluationData.keterlambatan || 0,
        hariIzin: evaluationData.hari_izin || 0,
        hariSakit: evaluationData.hari_sakit || 0,
        pulangCepat: evaluationData.pulang_cepat || 0,
        prestasi: evaluationData.prestasi || 0,
        suratPeringatan: evaluationData.surat_peringatan || 0
      };

      onAddEmployee(newEmployee);
      
      // Reset form dengan nilai default
      const defaultFormData: { [key: string]: number } = {};
      criteria.forEach(criterion => {
        const fieldName = createFieldName(criterion.name);
        if (criterion.type === 'Benefit') {
          if (criterion.scale.includes('1-5')) {
            defaultFormData[fieldName] = 1;
          } else {
            defaultFormData[fieldName] = 0;
          }
        } else {
          defaultFormData[fieldName] = 0;
        }
      });
      
      setFormData(defaultFormData);
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

  const handleInputChange = (field: string, value: number) => {
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
                        const fieldName = createFieldName(criterion.name);
                        const currentValue = formData[fieldName] || 0;
                        
                        return (
                          <div key={criterion.id}>
                            <Label htmlFor={fieldName}>
                              {criterion.name} ({criterion.scale})
                            </Label>
                            <Input
                              id={fieldName}
                              type="number"
                              min={criterion.type === 'Benefit' && criterion.scale.includes('1-5') ? "1" : "0"}
                              max={criterion.scale.includes('1-5') ? "5" : criterion.scale.includes('0-1') || criterion.scale.includes('0/1') ? "1" : "10"}
                              value={currentValue}
                              onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Bobot: {criterion.weight}% | Tipe: {criterion.type} | Field: {fieldName}
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