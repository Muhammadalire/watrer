import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HydrationRecord {
  glasses: number;
  target: number;
  completed: boolean;
  streak: number;
}

interface UserStats {
  totalGlasses: number;
  completedDays: number;
  weeklyAverage: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: string;
  unlocked: boolean;
  claimed: boolean;
  claimedAt?: string;
}

interface WeeklyData {
  date: string;
  dayName: string;
  glasses: number;
  target: number;
  completed: boolean;
}

interface HydrationStore {
  // User data
  userId: string;
  email: string;
  userName: string;
  notificationEmail: string;
  
  // Current hydration state
  hydration: HydrationRecord;
  stats: UserStats;
  
  // Progress data
  weeklyData: WeeklyData[];
  bestStreak: number;
  
  // Achievements and rewards
  achievements: Achievement[];
  rewards: Reward[];
  
  // UI state
  isLoading: boolean;
  lastUpdated: string;
  
  // Actions
  setUser: (userData: { userId: string; email: string; userName?: string; notificationEmail?: string }) => void;
  setHydration: (hydration: HydrationRecord) => void;
  setStats: (stats: UserStats) => void;
  setWeeklyData: (weeklyData: WeeklyData[]) => void;
  setBestStreak: (bestStreak: number) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setRewards: (rewards: Reward[]) => void;
  setLoading: (loading: boolean) => void;
  addGlass: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  clearData: () => void;
}

export const useHydrationStore = create<HydrationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: '',
      email: 'muhammad0alire@gmail.com',
      userName: 'Beautiful',
      notificationEmail: 'muhammad0alire@gmail.com',
      
      hydration: {
        glasses: 0,
        target: 8,
        completed: false,
        streak: 0
      },
      
      stats: {
        totalGlasses: 0,
        completedDays: 0,
        weeklyAverage: 0
      },
      
      weeklyData: [],
      bestStreak: 0,
      achievements: [],
      rewards: [],
      isLoading: false,
      lastUpdated: new Date().toISOString(),
      
      // Actions
      setUser: (userData) => set((state) => ({
        ...state,
        ...userData,
        lastUpdated: new Date().toISOString()
      })),
      
      setHydration: (hydration) => set((state) => ({
        ...state,
        hydration,
        lastUpdated: new Date().toISOString()
      })),
      
      setStats: (stats) => set((state) => ({
        ...state,
        stats,
        lastUpdated: new Date().toISOString()
      })),
      
      setWeeklyData: (weeklyData) => set((state) => ({
        ...state,
        weeklyData,
        lastUpdated: new Date().toISOString()
      })),
      
      setBestStreak: (bestStreak) => set((state) => ({
        ...state,
        bestStreak,
        lastUpdated: new Date().toISOString()
      })),
      
      setAchievements: (achievements) => set((state) => ({
        ...state,
        achievements,
        lastUpdated: new Date().toISOString()
      })),
      
      setRewards: (rewards) => set((state) => ({
        ...state,
        rewards,
        lastUpdated: new Date().toISOString()
      })),
      
      setLoading: (loading) => set((state) => ({
        ...state,
        isLoading: loading
      })),
      
      addGlass: async () => {
        const state = get();
        
        if (state.hydration.glasses >= state.hydration.target) {
          return false;
        }
        
        try {
          state.setLoading(true);
          
          const response = await fetch('/api/hydration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: state.userId || 'user_' + Date.now(),
              email: state.email,
              notificationEmail: state.notificationEmail,
              userName: state.userName
            }),
          });

          if (response.ok) {
            const data = await response.json();
            state.setHydration(data.hydration);
            state.setStats(data.stats);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error adding glass:', error);
          return false;
        } finally {
          state.setLoading(false);
        }
      },
      
      refreshData: async () => {
        const state = get();
        
        try {
          state.setLoading(true);
          
          // Load current hydration data
          const hydrationResponse = await fetch(`/api/hydration?email=${state.email}`);
          if (hydrationResponse.ok) {
            const hydrationData = await hydrationResponse.json();
            state.setHydration(hydrationData.hydration);
            state.setStats(hydrationData.stats);
          }
          
          // Load progress data
          const progressResponse = await fetch(`/api/progress?email=${state.email}`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            state.setWeeklyData(progressData.weeklyData);
            state.setBestStreak(progressData.bestStreak);
            state.setAchievements(progressData.achievements);
          }
          
          // Load rewards data
          const rewardsResponse = await fetch(`/api/rewards?email=${state.email}`);
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            state.setRewards(rewardsData.rewards);
          }
          
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          state.setLoading(false);
        }
      },
      
      clearData: () => set((state) => ({
        ...state,
        hydration: {
          glasses: 0,
          target: 8,
          completed: false,
          streak: 0
        },
        stats: {
          totalGlasses: 0,
          completedDays: 0,
          weeklyAverage: 0
        },
        weeklyData: [],
        bestStreak: 0,
        achievements: [],
        rewards: [],
        lastUpdated: new Date().toISOString()
      }))
    }),
    {
      name: 'hydration-store',
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        userName: state.userName,
        notificationEmail: state.notificationEmail,
        hydration: state.hydration,
        stats: state.stats,
        lastUpdated: state.lastUpdated
      })
    }
  )
);

// Selectors for common use cases
export const useHydration = () => useHydrationStore((state) => state.hydration);
export const useStats = () => useHydrationStore((state) => state.stats);
export const useWeeklyData = () => useHydrationStore((state) => state.weeklyData);
export const useAchievements = () => useHydrationStore((state) => state.achievements);
export const useRewards = () => useHydrationStore((state) => state.rewards);
export const useIsLoading = () => useHydrationStore((state) => state.isLoading);
export const useUser = () => useHydrationStore((state) => ({
  userId: state.userId,
  email: state.email,
  userName: state.userName,
  notificationEmail: state.notificationEmail
}));