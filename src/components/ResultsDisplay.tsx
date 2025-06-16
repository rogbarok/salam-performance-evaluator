
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { SAWResult } from "@/pages/Index";

interface ResultsDisplayProps {
  results: SAWResult[];
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const handlePrint = () => {
    const printContent = document.getElementById('results-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hasil Evaluasi Kinerja Karyawan</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #22c55e;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #1f2937; 
              margin-bottom: 5px;
            }
            .header h2 { 
              color: #22c55e; 
              margin-bottom: 5px;
            }
            .summary { 
              margin-bottom: 30px; 
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .summary-card {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .summary-card h3 {
              margin: 0 0 5px 0;
              font-size: 24px;
              font-weight: bold;
            }
            .summary-card p {
              margin: 0;
              font-size: 12px;
              color: #6b7280;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #22c55e; 
              color: white; 
              font-weight: bold;
            }
            .rank-1 { 
              background-color: #fef3c7; 
            }
            .badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-success { background: #22c55e; color: white; }
            .badge-warning { background: #f59e0b; color: white; }
            .badge-danger { background: #ef4444; color: white; }
            .badge-secondary { background: #6b7280; color: white; }
            .analysis {
              margin-top: 30px;
              background: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hasil Evaluasi Kinerja Karyawan</h1>
            <h2>Yayasan As-Salam</h2>
            <p>Metode Simple Additive Weighting (SAW)</p>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          
          <div class="summary">
            <h3>Ringkasan Evaluasi</h3>
            <div class="summary-grid">
              <div class="summary-card">
                <h3>${results.filter(r => r.recommendation === "Dapat diperpanjang").length}</h3>
                <p>Dapat Diperpanjang</p>
              </div>
              <div class="summary-card">
                <h3>${results.filter(r => r.recommendation === "Diberhentikan").length}</h3>
                <p>Diberhentikan</p>
              </div>
              <div class="summary-card">
                <h3>${results.filter(r => r.note === "Kandidat promosi").length}</h3>
                <p>Kandidat Promosi</p>
              </div>
              <div class="summary-card">
                <h3>${(results.reduce((sum, r) => sum + r.convertedScore, 0) / results.length).toFixed(1)}</h3>
                <p>Rata-rata Skor</p>
              </div>
            </div>
            <ul>
              <li>Total karyawan dievaluasi: <strong>${results.length} orang</strong></li>
              <li>Rata-rata skor: <strong>${(results.reduce((sum, r) => sum + r.convertedScore, 0) / results.length).toFixed(2)}</strong></li>
              <li>Persentase lulus standar minimum (≥3.0): <strong>${((results.filter(r => r.convertedScore >= 3).length / results.length) * 100).toFixed(1)}%</strong></li>
              <li>Kandidat promosi: <strong>${results.filter(r => r.note === "Kandidat promosi").length} orang</strong></li>
            </ul>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Nama Karyawan</th>
                <th>Skor SAW</th>
                <th>Skor Konversi</th>
                <th>Kategori</th>
                <th>Rekomendasi</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((result, index) => `
                <tr class="${index === 0 ? 'rank-1' : ''}">
                  <td>#${result.rank}${result.rank === 1 ? ' 🏆' : ''}</td>
                  <td><strong>${result.employee.name}</strong></td>
                  <td>${result.finalScore.toFixed(4)}</td>
                  <td><span class="badge ${result.convertedScore >= 4 ? 'badge-success' : result.convertedScore >= 3 ? 'badge-warning' : 'badge-danger'}">${result.convertedScore.toFixed(1)}</span></td>
                  <td>${result.convertedScore >= 4.5 ? "Sangat Baik" : result.convertedScore >= 3.5 ? "Baik" : result.convertedScore >= 2.5 ? "Cukup" : result.convertedScore >= 1.5 ? "Kurang" : "Sangat Kurang"}</td>
                  <td><span class="badge ${result.recommendation === "Dapat diperpanjang" ? 'badge-success' : 'badge-danger'}">${result.recommendation}</span></td>
                  <td>${result.note ? `<span class="badge ${result.note === "Kandidat promosi" ? 'badge-success' : 'badge-danger'}">${result.note}</span>` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="analysis">
            <h3>Karyawan Terbaik (Top 3)</h3>
            ${results.slice(0, 3).map((result, index) => `
              <p><strong>#${result.rank} ${result.employee.name}</strong> - Skor: ${result.convertedScore.toFixed(1)}</p>
            `).join('')}
            
            ${results.filter(r => r.convertedScore < 3).length > 0 ? `
              <h3>Perlu Perbaikan</h3>
              ${results.filter(r => r.convertedScore < 3).map((result) => `
                <p><strong>#${result.rank} ${result.employee.name}</strong> - Skor: ${result.convertedScore.toFixed(1)}</p>
              `).join('')}
            ` : '<p><em>Semua karyawan memenuhi standar minimum</em></p>'}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (results.length === 0) {
    return (
      <Card className="bg-white shadow-lg">
        <CardContent className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Hasil</h3>
          <p className="text-gray-500">Lakukan perhitungan SAW terlebih dahulu untuk melihat hasil evaluasi</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = results.map(result => ({
    name: result.employee.name,
    score: result.finalScore,
    converted: result.convertedScore,
    rank: result.rank
  }));

  // Recommendation distribution
  const recommendationData = results.reduce((acc, result) => {
    const rec = result.recommendation;
    acc[rec] = (acc[rec] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(recommendationData).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / results.length) * 100).toFixed(1)
  }));

  const COLORS = {
    "Dapat diperpanjang": "#22c55e",
    "Diberhentikan": "#ef4444"
  };

  return (
    <div id="results-content" className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white print:hidden"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak Hasil
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Dapat Diperpanjang</p>
                <p className="text-2xl font-bold">
                  {results.filter(r => r.recommendation === "Dapat diperpanjang").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Diberhentikan</p>
                <p className="text-2xl font-bold">
                  {results.filter(r => r.recommendation === "Diberhentikan").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Kandidat Promosi</p>
                <p className="text-2xl font-bold">
                  {results.filter(r => r.note === "Kandidat promosi").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-sm opacity-90">Rata-rata Skor</p>
                <p className="text-2xl font-bold">
                  {(results.reduce((sum, r) => sum + r.convertedScore, 0) / results.length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Trophy className="w-5 h-5" />
            Hasil Evaluasi Kinerja Karyawan - Perangkingan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold">Rank</th>
                  <th className="text-left py-4 px-4 font-semibold">Nama Karyawan</th>
                  <th className="text-center py-4 px-4 font-semibold">Skor SAW</th>
                  <th className="text-center py-4 px-4 font-semibold">Skor Konversi</th>
                  <th className="text-center py-4 px-4 font-semibold">Kategori</th>
                  <th className="text-left py-4 px-4 font-semibold">Rekomendasi</th>
                  <th className="text-left py-4 px-4 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr 
                    key={result.employee.id} 
                    className={`border-b hover:bg-gray-50 ${index === 0 ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={result.rank === 1 ? "default" : "secondary"}
                          className={result.rank === 1 ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          #{result.rank}
                        </Badge>
                        {result.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{result.employee.name}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {result.finalScore.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge 
                        variant={result.convertedScore >= 4 ? "default" : 
                                result.convertedScore >= 3 ? "secondary" : "destructive"}
                        className="font-bold text-base px-3 py-1"
                      >
                        {result.convertedScore.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-gray-600">
                        {result.convertedScore >= 4.5 ? "Sangat Baik" :
                         result.convertedScore >= 3.5 ? "Baik" :
                         result.convertedScore >= 2.5 ? "Cukup" :
                         result.convertedScore >= 1.5 ? "Kurang" : "Sangat Kurang"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant={result.recommendation === "Dapat diperpanjang" ? "default" : "destructive"}
                        className="text-sm"
                      >
                        {result.recommendation}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {result.note && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.note === "Kandidat promosi" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {result.note}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Perbandingan Skor Karyawan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value, 
                    name === 'converted' ? 'Skor Konversi' : 'Skor SAW'
                  ]}
                />
                <Legend />
                <Bar dataKey="converted" fill="#22c55e" name="Skor Konversi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Distribusi Rekomendasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} orang`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Analisis Hasil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-700">Karyawan Terbaik</h4>
              {results.slice(0, 3).map((result, index) => (
                <div key={result.employee.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="bg-green-600">
                      #{result.rank}
                    </Badge>
                    <span className="font-medium">{result.employee.name}</span>
                  </div>
                  <Badge variant="secondary">{result.convertedScore.toFixed(1)}</Badge>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-red-700">Perlu Perbaikan</h4>
              {results.filter(r => r.convertedScore < 3).map((result) => (
                <div key={result.employee.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">
                      #{result.rank}
                    </Badge>
                    <span className="font-medium">{result.employee.name}</span>
                  </div>
                  <Badge variant="destructive">{result.convertedScore.toFixed(1)}</Badge>
                </div>
              ))}
              {results.filter(r => r.convertedScore < 3).length === 0 && (
                <p className="text-gray-500 italic">Semua karyawan memenuhi standar minimum</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Ringkasan Evaluasi:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Total karyawan dievaluasi: <strong>{results.length} orang</strong></li>
              <li>• Rata-rata skor: <strong>{(results.reduce((sum, r) => sum + r.convertedScore, 0) / results.length).toFixed(2)}</strong></li>
              <li>• Persentase lulus standar minimum (≥3.0): <strong>{((results.filter(r => r.convertedScore >= 3).length / results.length) * 100).toFixed(1)}%</strong></li>
              <li>• Kandidat promosi: <strong>{results.filter(r => r.note === "Kandidat promosi").length} orang</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
