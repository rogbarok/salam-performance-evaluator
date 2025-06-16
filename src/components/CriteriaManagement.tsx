
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
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
      setCriteria(data || []);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCriteria) {
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
      
      setIsDialogOpen(false);
      setEditingCriteria(null);
      setFormData({ name: "", type: "Benefit", weight: 0, category: "", scale: "" });
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
    if (window.confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) {
      const { error } = await supabase
        .from('criteria')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting criteria:', error);
      } else {
        fetchCriteria();
      }
    }
  };

  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, Criteria[]>);

  const totalWeight = criteria.reduce((sum, criterion) => sum + Number(criterion.weight), 0);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-green-700">
                Manajemen Kriteria & Pembobotan
              </CardTitle>
              <p className="text-gray-600">
                Kelola kriteria evaluasi dan bobotnya (Total: {totalWeight.toFixed(2)}%)
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setEditingCriteria(null);
                    setFormData({ name: "", type: "Benefit", weight: 0, category: "", scale: "" });
                  }}
                >
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
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipe</Label>
                    <Select value={formData.type} onValueChange={(value: "Benefit" | "Cost") => setFormData({...formData, type: value})}>
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
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="scale">Skala</Label>
                    <Input
                      id="scale"
                      value={formData.scale}
                      onChange={(e) => setFormData({...formData, scale: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingCriteria ? 'Update' : 'Simpan'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedCriteria).map(([category, criteriaList]) => (
              <div key={category} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Kriteria</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Tipe</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Bobot</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Skala</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteriaList.map((criterion) => (
                        <tr key={criterion.id} className="border-b hover:bg-white transition-colors">
                          <td className="py-3 px-4 font-medium">{criterion.name}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={criterion.type === "Benefit" ? "default" : "destructive"}
                              className="flex items-center gap-1 w-fit"
                            >
                              {criterion.type === "Benefit" ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {criterion.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-600">
                            {criterion.weight}%
                          </td>
                          <td className="py-3 px-4">{criterion.scale}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(criterion)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(criterion.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Total Bobot: {totalWeight.toFixed(2)}%</h4>
            <p className="text-sm text-blue-700">
              {totalWeight === 100 ? '✓ Bobot sudah seimbang (100%)' : `⚠️ Bobot belum seimbang (${(100 - totalWeight).toFixed(2)}% kurang/lebih)`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
