import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/pwa/hapticFeedback';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'quality' | 'safety' | 'efficiency' | 'teamwork' | 'innovation';
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirementType: string;
  requirementValue: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  progress: number;
  completed: boolean;
  achievement?: Achievement;
}

export interface UserStats {
  totalPoints: number;
  totalAchievements: number;
  level: number;
  rank: string;
  completionRate: number;
  recentAchievements: UserAchievement[];
}

export class GamificationService {
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();

  async initialize() {
    await this.loadAchievements();
  }

  private async loadAchievements() {
    const { data } = await supabase
      .from('achievements')
      .select('*');

    if (data) {
      data.forEach((achievement: any) => {
        this.achievements.set(achievement.id, {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          icon: achievement.icon,
          points: achievement.points,
          rarity: achievement.rarity,
          requirementType: achievement.requirement_type,
          requirementValue: achievement.requirement_value
        });
      });
    }

    console.log('✅ Loaded', this.achievements.size, 'achievements');
  }

  async checkAndAwardAchievement(
    userId: string,
    achievementType: string,
    currentValue: number
  ): Promise<UserAchievement[]> {
    const awarded: UserAchievement[] = [];

    for (const [id, achievement] of this.achievements) {
      if (achievement.requirementType !== achievementType) continue;

      const existing = await this.getUserAchievement(userId, id);
      if (existing && existing.completed) continue;

      if (currentValue >= achievement.requirementValue) {
        const userAchievement = await this.awardAchievement(userId, id);
        if (userAchievement) {
          awarded.push(userAchievement);
        }
      } else if (existing) {
        await this.updateProgress(userId, id, currentValue);
      }
    }

    return awarded;
  }

  private async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        progress: 100,
        completed: true
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }

    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    hapticFeedback.success();

    if (Notification.permission === 'granted') {
      new Notification(`${achievement.icon} Achievement Unlocked!`, {
        body: `${achievement.name}: ${achievement.description}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: `achievement_${achievementId}`
      });
    }

    console.log('🏆 Achievement unlocked:', achievement.name);

    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      earnedAt: new Date(data.earned_at),
      progress: data.progress,
      completed: data.completed,
      achievement
    };
  }

  private async updateProgress(userId: string, achievementId: string, progress: number) {
    await supabase
      .from('user_achievements')
      .update({ progress })
      .match({ user_id: userId, achievement_id: achievementId });
  }

  private async getUserAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .match({ user_id: userId, achievement_id: achievementId })
      .single();

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      earnedAt: new Date(data.earned_at),
      progress: data.progress,
      completed: data.completed
    };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('earned_at', { ascending: false });

    const totalPoints = (userAchievements || []).reduce((sum, ua) => {
      return sum + (ua.achievements?.points || 0);
    }, 0);

    const totalAchievements = (userAchievements || []).length;
    const allAchievements = this.achievements.size;
    const completionRate = (totalAchievements / allAchievements) * 100;

    const level = this.calculateLevel(totalPoints);
    const rank = this.calculateRank(totalPoints, totalAchievements);

    const recentAchievements = (userAchievements || []).slice(0, 5).map((ua: any) => ({
      id: ua.id,
      userId: ua.user_id,
      achievementId: ua.achievement_id,
      earnedAt: new Date(ua.earned_at),
      progress: ua.progress,
      completed: ua.completed,
      achievement: ua.achievements ? {
        id: ua.achievements.id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        category: ua.achievements.category,
        icon: ua.achievements.icon,
        points: ua.achievements.points,
        rarity: ua.achievements.rarity,
        requirementType: ua.achievements.requirement_type,
        requirementValue: ua.achievements.requirement_value
      } : undefined
    }));

    return {
      totalPoints,
      totalAchievements,
      level,
      rank,
      completionRate,
      recentAchievements
    };
  }

  private calculateLevel(points: number): number {
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  private calculateRank(points: number, achievements: number): string {
    if (points >= 1000) return '🏆 Mästare';
    if (points >= 500) return '⭐ Expert';
    if (points >= 250) return '💎 Erfaren';
    if (points >= 100) return '🎖️ Kompetent';
    if (achievements >= 5) return '🌟 Nybörjare Plus';
    return '🔰 Nybörjare';
  }

  async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    totalPoints: number;
    achievements: number;
    rank: string;
  }>> {
    const { data } = await supabase
      .from('user_achievements')
      .select('user_id, achievements(points), profiles(full_name)')
      .eq('completed', true);

    if (!data) return [];

    const userScores = new Map<string, { points: number; achievements: number; name: string }>();

    data.forEach((ua: any) => {
      const userId = ua.user_id;
      const points = ua.achievements?.points || 0;
      const name = ua.profiles?.full_name || 'Unknown';

      const existing = userScores.get(userId) || { points: 0, achievements: 0, name };
      userScores.set(userId, {
        points: existing.points + points,
        achievements: existing.achievements + 1,
        name
      });
    });

    const leaderboard = Array.from(userScores.entries())
      .map(([userId, stats]) => ({
        userId,
        userName: stats.name,
        totalPoints: stats.points,
        achievements: stats.achievements,
        rank: this.calculateRank(stats.points, stats.achievements)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    return leaderboard;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (!data) return [];

    return data.map((ua: any) => ({
      id: ua.id,
      userId: ua.user_id,
      achievementId: ua.achievement_id,
      earnedAt: new Date(ua.earned_at),
      progress: ua.progress,
      completed: ua.completed,
      achievement: ua.achievements ? {
        id: ua.achievements.id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        category: ua.achievements.category,
        icon: ua.achievements.icon,
        points: ua.achievements.points,
        rarity: ua.achievements.rarity,
        requirementType: ua.achievements.requirement_type,
        requirementValue: ua.achievements.requirement_value
      } : undefined
    }));
  }

  async trackJobCompletion(userId: string) {
    const { count } = await supabase
      .from('jobb')
      .select('id', { count: 'exact' })
      .eq('ansvarig_anvandare', userId);

    await this.checkAndAwardAchievement(userId, 'jobs_completed', count || 0);
  }

  async trackChecklistCompletion(userId: string) {
    const { count } = await supabase
      .from('safety_checklists')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed');

    await this.checkAndAwardAchievement(userId, 'checklists_completed', count || 0);
  }

  async trackAIAnalysis(userId: string) {
    const { count } = await supabase
      .from('ai_analyses')
      .select('id', { count: 'exact' })
      .eq('analyzed_by', userId);

    await this.checkAndAwardAchievement(userId, 'ai_analyses_used', count || 0);
  }
}

export const gamification = new GamificationService();
