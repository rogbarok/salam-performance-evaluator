import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
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
      // Type cast the data to match our Criteria interface
      setCriteria((data || []) as Criteria[]);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const groupBy = (array: Criteria[], key: keyof Criteria) => {
    return array.reduce((result, currentValue) => {
      const groupKey = currentValue[key] as string;
      (result[groupKey] = result[groupKey] || []).push(currentValue);
      return result;
    }, {} as Record<string, Criteria[]>);
  };

  const groupedCriteria = groupBy(criteria, 'category');

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Calculator className="w-5 h-5" />
          Kriteria dan Bobot Penilaian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedCriteria).map(([category, criteriaList]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Kriteria</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Tipe</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Bobot (%)</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Skala</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaList.map((criterion) => (
                      <tr key={criterion.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{criterion.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <Badge variant={criterion.type === 'Benefit' ? 'default' : 'destructive'}>
                            {criterion.type}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {criterion.weight}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {criterion.scale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
