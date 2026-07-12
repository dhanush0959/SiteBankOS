export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  viewsToday: number;
  hotLeadsCount: number;
  pendingReminders: number;
  topPropertiesByViews: Array<{
    propertyId: string;
    title: string;
    viewCount: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    propertyTitle: string;
    createdAt: Date;
  }>;
}

export interface PropertyAnalytics {
  propertyId: string;
  totalViews: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  callClicks: number;
  mapOpens: number;
  docRequests: number;
  avgTimeOnPage: number;
  viewsOverTime: Array<{ date: string; count: number }>;
  ctaBreakdown: Record<string, number>;
}

export interface HotScoreBreakdown {
  totalScore: number;
  viewScore: number;
  ctaScore: number;
  docScore: number;
  mapScore: number;
  sessionScore: number;
}
