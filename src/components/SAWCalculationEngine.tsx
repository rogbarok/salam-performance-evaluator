
import type { Employee, SAWResult } from "@/pages/Index";

export class SAWCalculationEngine {
  private criteriaWeights: { [key: string]: number };
  private criteriaTypes: { [key: string]: string };

  constructor(criteriaWeights: { [key: string]: number }, criteriaTypes: { [key: string]: string }) {
    this.criteriaWeights = criteriaWeights;
    this.criteriaTypes = criteriaTypes;
  }

  // Function to convert form score (1-5) to a scale (e.g., 20-100)
  private convertFormScoreToScale(score: number): number {
    return score * 20; // Assuming a linear scale from 20 to 100
  }

  // Function to convert SAW score back to form scale (1-5)
  private convertSAWScoreToFormScale(sawScore: number): number {
    return Math.max(1, Math.min(5, Math.round(sawScore * 5)));
  }

  private getRecommendation(convertedScore: number, isAutoTerminated: boolean, alpaDays: number): { recommendation: string, note?: string } {
    if (isAutoTerminated) {
      return {
        recommendation: "Pemberhentian",
        note: `Karyawan diberhentikan otomatis karena alpa lebih dari ${alpaDays} hari.`
      };
    }

    if (convertedScore >= 4) {
      return { recommendation: "Promosi" };
    } else if (convertedScore >= 3) {
      return { recommendation: "Pertahankan" };
    } else if (convertedScore >= 2) {
      return { recommendation: "Evaluasi Lanjutan" };
    } else {
      return { recommendation: "Pemberhentian" };
    }
  }

  async calculate(employees: Employee[]): Promise<{
    decisionMatrix: number[][];
    normalizedMatrix: number[][];
    finalResults: SAWResult[];
  }> {
    console.log("Starting SAW calculation for employees:", employees.length);
    console.log("Using criteria weights (decimals):", this.criteriaWeights);

    const allCriteria = [
      'kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 'pemahamanTugas', 
      'inisiatif', 'kerjasama', 'hariAlpa', 'keterlambatan', 'hariIzin', 
      'hariSakit', 'pulangCepat', 'prestasi', 'suratPeringatan'
    ];

    const activeCriteria = allCriteria.filter(criterion => this.criteriaWeights[criterion] !== undefined);
    console.log("Active criteria for calculation:", activeCriteria);

    // Step 1: Create decision matrix - use RAW DATA
    const matrix = employees.map(emp => 
      activeCriteria.map(criterion => {
        const rawValue = emp[criterion as keyof Employee] as number;
        return rawValue;
      })
    );

    console.log("Decision Matrix (Raw Data):", matrix);

    // Step 2: Apply SAW normalization
    const normalized = matrix.map(() => new Array(activeCriteria.length).fill(0));

    for (let j = 0; j < activeCriteria.length; j++) {
      const criterion = activeCriteria[j];
      const columnValues = matrix.map(row => row[j]);
      const criterionType = this.criteriaTypes[criterion] || 'Benefit';
      
      console.log(`Normalizing criterion ${criterion} (${criterionType}):`, columnValues);
      
      const isPerformanceCriteria = ['kualitasKerja', 'tanggungJawab', 'kuantitasKerja', 
        'pemahamanTugas', 'inisiatif', 'kerjasama'].includes(criterion);
      
      if (criterionType === 'Benefit') {
        if (isPerformanceCriteria) {
          // For performance criteria: convert to scale first, then normalize
          const scaleValues = columnValues.map(val => this.convertFormScoreToScale(val));
          const maxScaleValue = Math.max(...scaleValues);
          console.log(`Scale values for ${criterion}:`, scaleValues, 'Max:', maxScaleValue);
          
          if (maxScaleValue > 0) {
            for (let i = 0; i < matrix.length; i++) {
              const scaleValue = this.convertFormScoreToScale(matrix[i][j]);
              normalized[i][j] = scaleValue / maxScaleValue;
            }
          }
        } else if (criterion === 'prestasi') {
          // C12 - Prestasi: if = 1 → 1.000, if = 0 → 0.000
          for (let i = 0; i < matrix.length; i++) {
            normalized[i][j] = matrix[i][j] === 1 ? 1.000 : 0.000;
          }
          console.log(`Prestasi normalization: [${normalized.map(row => row[j]).join(', ')}]`);
        }
      } else {
        // For Cost criteria
        if (criterion === 'hariAlpa') {
          // C7 - Hari Alpa: if > 0 → 0.000, if = 0 → 1.000
          for (let i = 0; i < matrix.length; i++) {
            normalized[i][j] = matrix[i][j] > 0 ? 0.000 : 1.000;
          }
          console.log(`Hari Alpa normalization: [${normalized.map(row => row[j]).join(', ')}]`);
        } else if (criterion === 'suratPeringatan') {
          // C13 - Surat Peringatan: if = 0 → 1.000, if = 1 → 0.000
          for (let i = 0; i < matrix.length; i++) {
            normalized[i][j] = matrix[i][j] === 0 ? 1.000 : 0.000;
          }
          console.log(`Surat Peringatan normalization: [${normalized.map(row => row[j]).join(', ')}]`);
        } else {
          // C8-C11 - Other cost criteria: min(Xij) / Xij
          const nonZeroValues = columnValues.filter(val => val > 0);
          
          if (nonZeroValues.length === 0) {
            // All values are 0, give everyone perfect score
            for (let i = 0; i < matrix.length; i++) {
              normalized[i][j] = 1.000;
            }
          } else {
            const minValue = Math.min(...nonZeroValues);
            console.log(`Min non-zero value for ${criterion}:`, minValue);
            
            for (let i = 0; i < matrix.length; i++) {
              if (matrix[i][j] === 0) {
                normalized[i][j] = 1.000; // Best score if no cost
              } else {
                normalized[i][j] = minValue / matrix[i][j];
              }
            }
          }
          console.log(`${criterion} normalization: [${normalized.map(row => row[j].toFixed(3)).join(', ')}]`);
        }
      }
    }

    console.log("Normalized Matrix:", normalized);

    // Step 3: Calculate weighted scores (SAW method)
    const results: SAWResult[] = employees.map((employee, index) => {
      const normalizedScores = normalized[index];
      
      // Calculate final SAW score: sum of (weight * normalized_score)
      const finalScore = normalizedScores.reduce((sum, normalizedScore, j) => {
        const criterion = activeCriteria[j];
        const weight = this.criteriaWeights[criterion];
        const weightedScore = normalizedScore * weight;
        
        console.log(`Employee ${employee.name}, criterion ${criterion}: normalized=${normalizedScore.toFixed(3)}, weight=${weight}, weighted=${weightedScore.toFixed(3)}`);
        
        return sum + weightedScore;
      }, 0);

      console.log(`Final SAW score for ${employee.name}:`, finalScore.toFixed(4));

      // Convert SAW score back to form scale (1-5)
      const convertedScore = this.convertSAWScoreToFormScale(finalScore);
      console.log(`Converted score for ${employee.name}: ${finalScore.toFixed(4)} -> ${convertedScore}`);
      
      // Check for automatic termination
      const isAutoTerminated = employee.hariAlpa > 10;
      
      // Generate recommendation
      const { recommendation, note } = this.getRecommendation(convertedScore, isAutoTerminated, employee.hariAlpa);

      return {
        employee,
        normalizedScores,
        finalScore,
        convertedScore,
        rank: 0,
        recommendation,
        note
      };
    });

    // Step 4: Rank employees (excluding auto-terminated ones)
    const nonTerminatedResults = results.filter(r => r.employee.hariAlpa <= 10);
    const terminatedResults = results.filter(r => r.employee.hariAlpa > 10);
    
    nonTerminatedResults.sort((a, b) => b.finalScore - a.finalScore);
    nonTerminatedResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    terminatedResults.forEach(result => {
      result.rank = 999; // Special rank for terminated employees
    });

    const finalResults = [...nonTerminatedResults, ...terminatedResults];
    console.log("Final Results:", finalResults);

    return {
      decisionMatrix: matrix,
      normalizedMatrix: normalized,
      finalResults
    };
  }
}
