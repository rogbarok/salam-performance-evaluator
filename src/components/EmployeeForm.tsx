
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, User } from "lucide-react";
import type { Employee } from "@/pages/Index";

interface EmployeeFormProps {
  onAddEmployee: (employee: Employee) => void;
  employees: Employee[];
}

export const EmployeeForm = ({ onAddEmployee, employees }: EmployeeFormProps) => {
  const [formData, setFormData] = useState<Omit<Employee, "id">>({
    name: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      const newEmployee: Employee = {
        ...formData,
        id: Date.now().toString()
      };
      onAddEmployee(newEmployee);
      
      // Reset form
      setFormData({
        name: "",
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
    }
  };

  const handleInputChange = (field: keyof Omit<Employee, "id">, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Current Employees */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <User className="w-5 h-5" />
            Data Karyawan ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada data karyawan</p>
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

      {/* Add New Employee Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <UserPlus className="w-5 h-5" />
            Tambah Data Karyawan Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <Label htmlFor="name">Nama Karyawan</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Masukkan nama karyawan"
                required
              />
            </div>

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

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Karyawan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
