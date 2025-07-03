import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@/pages/Index";
import type { Criteria } from "@/types/database";

interface EditEmployeeDialogProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedEmployee: Employee) => void;
}

export const EditEmployeeDialog = ({ employee, isOpen, onClose, onUpdate }: EditEmployeeDialogProps) => {
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
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch criteria from database
  const fetchCriteria = async () => {
    try {
      const { data: criteriaData, error } = await supabase
        .from('criteria')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching criteria:', error);
      } else {
        setCriteria(criteriaData || []);
        console.log('EditEmployeeDialog: Criteria loaded:', criteriaData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching criteria:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCriteria();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee) {
      setFormData({
        kualitasKerja: employee.kualitasKerja,
        tanggungJawab: employee.tanggungJawab,
        kuantitasKerja: employee.kuantitasKerja,
        pemahamanTugas: employee.pemahamanTugas,
        inisiatif: employee.inisiatif,
        kerjasama: employee.kerjasama,
        hariAlpa: employee.hariAlpa,
        keterlambatan: employee.keterlambatan,
        hariIzin: employee.hariIzin,
        hariSakit: employee.hariSakit,
        pulangCepat: employee.pulangCepat,
        prestasi: employee.prestasi,
        suratPeringatan: employee.suratPeringatan
      });
    }
  }, [employee]);

  const handleInputChange = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_evaluations')
        .update({
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
          surat_peringatan: formData.suratPeringatan,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employee.id);

      if (error) throw error;

      const updatedEmployee: Employee = {
        ...employee,
        ...formData
      };

      onUpdate(updatedEmployee);
      onClose();

      toast({
        title: "Berhasil",
        description: "Data evaluasi karyawan berhasil diperbarui",
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data evaluasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  // Group criteria by category for dynamic form rendering
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as { [key: string]: Criteria[] });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Evaluasi Karyawan - {employee.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  
                  const currentValue = formData[fieldName as keyof typeof formData] || 0;
                  
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

          {/* Fallback for when criteria are not loaded yet */}
          {criteria.length === 0 && (
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
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};