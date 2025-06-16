
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Criteria } from "@/types/database";

export const CriteriaTable = () => {
  const [criteria, setCriteria] = useState<Criteria[]>([]);

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
          <CardTitle className="text-2xl text-green-700">
            Kriteria dan Pembobotan Evaluasi Kinerja
          </CardTitle>
          <p className="text-gray-600">
            Sistem evaluasi menggunakan {criteria.length} kriteria dengan total bobot {totalWeight.toFixed(2)}%
          </p>
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
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Keterangan</th>
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
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {criterion.type === "Benefit" 
                              ? "Semakin tinggi semakin baik" 
                              : "Semakin rendah semakin baik"
                            }
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
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Benefit:</strong> Nilai yang lebih tinggi menunjukkan kinerja yang lebih baik</li>
              <li>• <strong>Cost:</strong> Nilai yang lebih rendah menunjukkan kinerja yang lebih baik</li>
              <li>• {totalWeight === 100 ? 'Total bobot sudah seimbang (100%)' : `⚠️ Total bobot belum seimbang (${totalWeight.toFixed(2)}%)`}</li>
              <li>• Nilai minimum untuk rekomendasi perpanjangan kontrak adalah 3.0</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
