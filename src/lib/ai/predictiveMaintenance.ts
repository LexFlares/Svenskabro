import { supabase } from '@/lib/supabase';

export interface MaintenancePrediction {
  bridgeId: string;
  bridgeName: string;
  predictedIssues: Array<{
    type: string;
    probability: number;
    estimatedTimeframe: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  recommendedInspectionDate: Date;
  riskScore: number;
  factorsInfluencing: string[];
  estimatedCost: {
    min: number;
    max: number;
    currency: 'SEK';
  };
}

export interface WeatherImpact {
  temperature: { min: number; max: number; avg: number };
  precipitation: number;
  freezeThawCycles: number;
  snowLoad: number;
}

export class PredictiveMaintenanceService {
  async analyzeBridge(bridgeId: string): Promise<MaintenancePrediction> {
    const [historicalData, weatherData, trafficData] = await Promise.all([
      this.getHistoricalMaintenanceData(bridgeId),
      this.getWeatherImpactData(bridgeId),
      this.getTrafficLoadData(bridgeId)
    ]);

    const riskScore = this.calculateRiskScore(historicalData, weatherData, trafficData);
    const predictedIssues = this.predictIssues(historicalData, weatherData, trafficData);
    const recommendedDate = this.calculateNextInspectionDate(riskScore, historicalData);

    const bridge = await this.getBridgeInfo(bridgeId);

    return {
      bridgeId,
      bridgeName: bridge?.name || 'Unknown',
      predictedIssues,
      recommendedInspectionDate: recommendedDate,
      riskScore,
      factorsInfluencing: this.identifyRiskFactors(historicalData, weatherData, trafficData),
      estimatedCost: this.estimateMaintenanceCost(predictedIssues)
    };
  }

  async analyzeAllBridges(): Promise<MaintenancePrediction[]> {
    const { data: bridges } = await supabase
      .from('bridges')
      .select('id');

    if (!bridges) return [];

    const predictions = await Promise.all(
      bridges.map(bridge => this.analyzeBridge(bridge.id))
    );

    return predictions.sort((a, b) => b.riskScore - a.riskScore);
  }

  private async getHistoricalMaintenanceData(bridgeId: string) {
    const { data: jobs } = await supabase
      .from('jobb')
      .select('*')
      .eq('bro_id', bridgeId)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: deviations } = await supabase
      .from('deviations')
      .select('*')
      .eq('bridge_id', bridgeId)
      .order('created_at', { ascending: false })
      .limit(100);

    return {
      jobs: jobs || [],
      deviations: deviations || [],
      lastInspection: jobs?.[0]?.created_at ? new Date(jobs[0].created_at) : null,
      totalJobs: jobs?.length || 0,
      totalDeviations: deviations?.length || 0,
      criticalDeviations: deviations?.filter(d => d.type === 'critical').length || 0
    };
  }

  private async getWeatherImpactData(bridgeId: string): Promise<WeatherImpact> {
    return {
      temperature: { min: -20, max: 30, avg: 10 },
      precipitation: 600,
      freezeThawCycles: 45,
      snowLoad: 150
    };
  }

  private async getTrafficLoadData(bridgeId: string) {
    return {
      averageDailyTraffic: 5000,
      heavyVehiclePercentage: 15,
      peakHourVolume: 800,
      estimatedAnnualLoad: 1825000
    };
  }

  private calculateRiskScore(historical: any, weather: WeatherImpact, traffic: any): number {
    let score = 0;

    const daysSinceLastInspection = historical.lastInspection
      ? (Date.now() - new Date(historical.lastInspection).getTime()) / (1000 * 60 * 60 * 24)
      : 365;

    score += Math.min(daysSinceLastInspection / 365 * 30, 30);

    score += historical.criticalDeviations * 20;
    score += historical.totalDeviations * 2;

    if (weather.freezeThawCycles > 40) score += 15;
    if (weather.snowLoad > 100) score += 10;

    if (traffic.averageDailyTraffic > 10000) score += 10;
    if (traffic.heavyVehiclePercentage > 20) score += 10;

    return Math.min(Math.round(score), 100);
  }

  private predictIssues(historical: any, weather: WeatherImpact, traffic: any) {
    const issues = [];

    if (weather.freezeThawCycles > 40) {
      issues.push({
        type: 'Sprickbildning från fryscykler',
        probability: 0.75,
        estimatedTimeframe: '3-6 månader',
        severity: 'high' as const,
        description: 'Fryssprickbildning på grund av upprepade temperaturväxlingar'
      });
    }

    if (historical.criticalDeviations > 0) {
      issues.push({
        type: 'Försämring av befintliga skador',
        probability: 0.85,
        estimatedTimeframe: '1-3 månader',
        severity: 'critical' as const,
        description: 'Kritiska skador kan förvärras utan åtgärd'
      });
    }

    if (traffic.heavyVehiclePercentage > 20) {
      issues.push({
        type: 'Utmattningsskador',
        probability: 0.65,
        estimatedTimeframe: '6-12 månader',
        severity: 'medium' as const,
        description: 'Hög tung trafik kan orsaka utmattning i bärande konstruktion'
      });
    }

    if (weather.precipitation > 500) {
      issues.push({
        type: 'Korrosion och fuktskador',
        probability: 0.70,
        estimatedTimeframe: '6-12 månader',
        severity: 'medium' as const,
        description: 'Hög nederbörd ökar risk för korrosion i armeringsjärn'
      });
    }

    return issues;
  }

  private calculateNextInspectionDate(riskScore: number, historical: any): Date {
    const baseIntervalDays = 180;
    const adjustedInterval = baseIntervalDays * (1 - riskScore / 200);

    const lastInspection = historical.lastInspection || new Date();
    const nextDate = new Date(lastInspection);
    nextDate.setDate(nextDate.getDate() + Math.max(adjustedInterval, 30));

    return nextDate;
  }

  private identifyRiskFactors(historical: any, weather: WeatherImpact, traffic: any): string[] {
    const factors = [];

    if (historical.criticalDeviations > 0) {
      factors.push(`${historical.criticalDeviations} kritiska avvikelser registrerade`);
    }

    if (weather.freezeThawCycles > 40) {
      factors.push(`Högt antal fryscykler (${weather.freezeThawCycles})`);
    }

    if (traffic.averageDailyTraffic > 10000) {
      factors.push(`Hög trafikbelastning (${traffic.averageDailyTraffic} fordon/dag)`);
    }

    if (traffic.heavyVehiclePercentage > 20) {
      factors.push(`Hög andel tung trafik (${traffic.heavyVehiclePercentage}%)`);
    }

    const daysSinceInspection = historical.lastInspection
      ? Math.floor((Date.now() - new Date(historical.lastInspection).getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    if (daysSinceInspection > 180) {
      factors.push(`${daysSinceInspection} dagar sedan senaste inspektion`);
    }

    return factors;
  }

  private estimateMaintenanceCost(predictedIssues: any[]): { min: number; max: number; currency: 'SEK' } {
    const baseCosts: Record<string, { min: number; max: number }> = {
      'Sprickbildning från fryscykler': { min: 50000, max: 200000 },
      'Försämring av befintliga skador': { min: 100000, max: 500000 },
      'Utmattningsskador': { min: 200000, max: 800000 },
      'Korrosion och fuktskador': { min: 75000, max: 300000 }
    };

    let minTotal = 0;
    let maxTotal = 0;

    predictedIssues.forEach(issue => {
      const cost = baseCosts[issue.type] || { min: 25000, max: 100000 };
      minTotal += cost.min * issue.probability;
      maxTotal += cost.max * issue.probability;
    });

    return {
      min: Math.round(minTotal),
      max: Math.round(maxTotal),
      currency: 'SEK'
    };
  }

  private async getBridgeInfo(bridgeId: string) {
    const { data } = await supabase
      .from('bridges')
      .select('*')
      .eq('id', bridgeId)
      .single();

    return data;
  }

  async generateMaintenanceSchedule(months: number = 12): Promise<Array<{
    month: string;
    bridges: Array<{ id: string; name: string; priority: string }>;
  }>> {
    const predictions = await this.analyzeAllBridges();
    const schedule: Record<string, Array<{ id: string; name: string; priority: string }>> = {};

    predictions.forEach(prediction => {
      const month = new Date(prediction.recommendedInspectionDate).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long'
      });

      if (!schedule[month]) {
        schedule[month] = [];
      }

      schedule[month].push({
        id: prediction.bridgeId,
        name: prediction.bridgeName,
        priority: prediction.riskScore > 70 ? 'Hög' : prediction.riskScore > 40 ? 'Medel' : 'Låg'
      });
    });

    return Object.entries(schedule).map(([month, bridges]) => ({ month, bridges }));
  }
}

export const predictiveMaintenance = new PredictiveMaintenanceService();
