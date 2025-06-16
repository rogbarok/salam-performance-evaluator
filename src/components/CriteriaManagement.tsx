import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Criteria } from "@/types/database";

export const CriteriaManagement = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Benefit" as "Benefit" | "Cost",
    weight: 0,
    category: "",
    scale: ""
  });

  const fetchCriteria = async () => {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error fetching criteria:', error);
    } else {
      // Type cast the data to match our Criteria interface
      setCriteria((data || []) as Criteria[]);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
            scale: formData.scale,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCriteria.id);

        if (error) throw error;
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
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        type: "Benefit",
        weight: 0,
        category: "",
        scale: ""
      });
      setEditingCriteria(null);
      setIsDialogOpen(false);
      fetchCriteria();
    } catch (error) {
      console.error('Error saving criteria:', error);
    }
  };

  const handleEdit = (criteriaItem: Criteria) => {
    setEditingCriteria(criteriaItem);
    setFormData({
      name: criteriaItem.name,
      type: criteriaItem.type,
      weight: criteriaItem.weight,
      category: criteriaItem.category,
      scale: criteriaItem.scale
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) {
      try {
        const { error } = await supabase
          .from('criteria')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchCriteria();
      } catch (error) {
        console.error('Error deleting criteria:', error);
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Settings className="w-5 h-5" />
          Kelola Kriteria dan Bobot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
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
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipe</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Benefit">Benefit</SelectItem>
                      <SelectItem value="Cost">Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weight">Bobot (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scale">Skala</Label>
                  <Input
                    id="scale"
                    value={formData.scale}
                    onChange={(e) => handleInputChange("scale", e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCriteria ? 'Update' : 'Tambah'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Kriteria</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Tipe</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Bobot (%)</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Kategori</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Skala</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((criteriaItem) => (
                <tr key={criteriaItem.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{criteriaItem.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <Badge variant={criteriaItem.type === 'Benefit' ? 'default' : 'destructive'}>
                      {criteriaItem.type}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {criteriaItem.weight}%
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {criteriaItem.category}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {criteriaItem.scale}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(criteriaItem)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(criteriaItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
