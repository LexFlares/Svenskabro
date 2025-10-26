export interface VisionAnalysisResult {
  detectedIssues: Array<{
    type: 'crack' | 'corrosion' | 'spalling' | 'deformation' | 'water_damage' | 'vegetation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    location: { x: number; y: number; width: number; height: number };
    description: string;
  }>;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendedActions: string[];
  estimatedRepairCost?: number;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
}

export class VisionAnalysisService {
  private apiEndpoint = '/api/ai/vision-analysis';

  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    try {
      const base64Image = await this.fileToBase64(imageFile);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          analysisType: 'bridge_inspection'
        })
      });

      if (!response.ok) {
        throw new Error('Vision analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Vision analysis error:', error);
      throw error;
    }
  }

  async analyzeMultipleImages(images: File[]): Promise<VisionAnalysisResult[]> {
    const results = await Promise.all(
      images.map(image => this.analyzeImage(image))
    );
    return results;
  }

  async compareImages(beforeImage: File, afterImage: File): Promise<{
    improvements: string[];
    newIssues: string[];
    unchangedIssues: string[];
    overallChange: 'improved' | 'worsened' | 'unchanged';
  }> {
    const [beforeAnalysis, afterAnalysis] = await Promise.all([
      this.analyzeImage(beforeImage),
      this.analyzeImage(afterImage)
    ]);

    const beforeIssues = new Set(beforeAnalysis.detectedIssues.map(i => `${i.type}-${i.severity}`));
    const afterIssues = new Set(afterAnalysis.detectedIssues.map(i => `${i.type}-${i.severity}`));

    const improvements: string[] = [];
    const newIssues: string[] = [];
    const unchangedIssues: string[] = [];

    beforeIssues.forEach(issue => {
      if (!afterIssues.has(issue)) {
        improvements.push(issue);
      } else {
        unchangedIssues.push(issue);
      }
    });

    afterIssues.forEach(issue => {
      if (!beforeIssues.has(issue)) {
        newIssues.push(issue);
      }
    });

    let overallChange: 'improved' | 'worsened' | 'unchanged' = 'unchanged';
    if (improvements.length > newIssues.length) {
      overallChange = 'improved';
    } else if (newIssues.length > improvements.length) {
      overallChange = 'worsened';
    }

    return { improvements, newIssues, unchangedIssues, overallChange };
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generateInspectionReport(images: File[], bridgeId: string): Promise<string> {
    const analyses = await this.analyzeMultipleImages(images);

    const report = {
      bridgeId,
      timestamp: new Date().toISOString(),
      totalImages: images.length,
      analyses,
      summary: this.generateSummary(analyses)
    };

    return JSON.stringify(report, null, 2);
  }

  private generateSummary(analyses: VisionAnalysisResult[]): string {
    const allIssues = analyses.flatMap(a => a.detectedIssues);
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const highCount = allIssues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) {
      return `KRITISKT: ${criticalCount} kritiska problem upptäckta. Omedelbar åtgärd krävs.`;
    } else if (highCount > 0) {
      return `VARNING: ${highCount} allvarliga problem upptäckta. Planera underhåll inom kort.`;
    } else {
      return `Bron är i acceptabelt skick. ${allIssues.length} mindre problem identifierade för uppföljning.`;
    }
  }
}

export const visionAnalysis = new VisionAnalysisService();
