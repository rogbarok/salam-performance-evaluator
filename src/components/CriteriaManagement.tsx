
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Criteria } from "@/types/database";

export const CriteriaManagement = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    type: "Benefit" as "Benefit" | "Cost",
    weight: 0,
    category: "",
    scale: ""
  });

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
        setCriteria(data || []);
        console.log('Criteria loaded:', data?.length || 0);
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        title: "Error",
        description: "Gagal terhubung ke database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCriteria) {
        // Update existing criteria
        const { error } = await supabase
          .from('criteria')
          .update({
            name: formData.name,
            type: formData.type,
            weight: formData.weight,
            category: formData.category,
            scale: formData.scale
          })
          .eq('id', editingCriteria.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kriteria berhasil diperbarui",
        });
      } else {
        // Create new criteria
        const { error } = await supabase
          .from('criteria')
          .insert([{
            name: formData.name,
            type: formData.type,
            weight: formData.weight,
            category: formData.category,
            scale: formData.scale
          }]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kriteria baru berhasil ditambahkan",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchCriteria();
    } catch (error) {
      console.error('Error saving criteria:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan kriteria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (criteriaItem: Criteria) => {
    setEditingCriteria(criteriaItem);
    setFormData({
      name: criteriaItem.name,
      type: criteriaItem.type as "Benefit" | "Cost",
      weight: criteriaItem.weight,
      category: criteriaItem.category,
      scale: criteriaItem.scale
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('criteria')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kriteria berhasil dihapus",
      });
      
      fetchCriteria();
    } catch (error) {
      console.error('Error deleting criteria:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus kriteria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Benefit",
      weight: 0,
      category: "",
      scale: ""
    });
    setEditingCriteria(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manajemen Kriteria ({criteria.length})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Kriteria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCriteria ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Kriteria</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Jenis Kriteria</Label>
                    <Select value={formData.type} onValueChange={(value: "Benefit" | "Cost") => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Benefit">Benefit (Lebih tinggi lebih baik)</SelectItem>
                        <SelectItem value="Cost">Cost (Lebih rendah lebih baik)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">Bobot (0-1)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="scale">Skala Penilaian</Label>
                    <Input
                      id="scale"
                      value={formData.scale}
                      onChange={(e) => setFormData(prev => ({ ...prev, scale: e.target.value }))}
                      placeholder="contoh: 1-5, 0-10, dll"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Menyimpan..." : (editingCriteria ? "Update" : "Simpan")}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : criteria.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada kriteria yang didefinisikan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kriteria</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Bobot</TableHead>
                  <TableHead>Skala</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criteriaItem) => (
                  <TableRow key={criteriaItem.id}>
                    <TableCell className="font-medium">{criteriaItem.name}</TableCell>
                    <TableCell>{criteriaItem.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        criteriaItem.type === 'Benefit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {criteriaItem.type}
                      </span>
                    </TableCell>
                    <TableCell>{criteriaItem.weight}</TableCell>
                    <TableCell>{criteriaItem.scale}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(criteriaItem)}
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(criteriaItem.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
