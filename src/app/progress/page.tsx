'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Droplets, TrendingUp, Award, Star } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface WeeklyData {
  date: string;
  dayName: string;
  glasses: number;
  target: number;
  completed: boolean;
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

interface ProgressData {
  weeklyData: WeeklyData[];
  streak: number;
  bestStreak: number;
  stats: {
    totalGlasses: number;
    completedDays: number;
    weeklyAverage: number;
  };
  achievements: Achievement[];
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData>({
    weeklyData: [],
    streak: 0,
    bestStreak: 0,
    stats: {
      totalGlasses: 0,
      completedDays: 0,
      weeklyAverage: 0
    },
    achievements: []
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const email = 'muhammad0alire@gmail.com';
      const response = await fetch(`/api/progress?email=${email}`);
      
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayStatus = (glasses: number, target: number) => {
    if (glasses === 0) return 'empty';
    if (glasses >= target) return 'completed';
    return 'partial';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-br from-pink-300 to-purple-300 text-white';
      case 'partial':
        return 'bg-gradient-to-br from-purple-200 to-pink-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-serif text-pink-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Your Progress
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Celebrating every beautiful step of your journey ✨
          </p>
        </header>

        {/* Navigation */}
        <Navigation />

        <main className="space-y-8">
          {/* Weekly Overview */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Weekly Overview
            </h2>
            
            <div className="grid grid-cols-7 gap-4 mb-8">
              {progressData.weeklyData.map((day, index) => {
                const status = getDayStatus(day.glasses, day.target);
                const colorClass = getDayColor(status);
                
                return (
                  <div
                    key={index}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-pink-200 transition-all duration-200 hover:scale-105 ${colorClass}`}
                  >
                    <div className="text-xs font-semibold mb-1">
                      {day.dayName}
                    </div>
                    <div className="text-2xl font-bold">
                      {day.glasses}
                    </div>
                    <div className="text-xs opacity-75">
                      / {day.target}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Hydration Trends Chart */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Hydration Trends
            </h2>
            
            <div className="h-64 flex items-end justify-between gap-2">
              {progressData.weeklyData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-pink-400 to-purple-400 rounded-t-lg transition-all duration-500"
                      style={{ 
                        height: `${(day.glasses / day.target) * 200}px`,
                        minHeight: day.glasses > 0 ? '20px' : '0'
                      }}
                    />
                    <div className="text-xs text-gray-600 font-medium">
                      {day.dayName}
                    </div>
                    <div className="text-sm font-bold text-pink-400">
                      {day.glasses}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats Grid */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Your Amazing Stats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-pink-100 rounded-xl border-2 border-pink-200">
                <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-pink-400 font-bold mb-2">
                  {progressData.streak}
                </div>
                <div className="text-gray-600">Current Streak</div>
              </div>
              
              <div className="text-center p-6 bg-purple-100 rounded-xl border-2 border-purple-200">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-purple-400 font-bold mb-2">
                  {progressData.bestStreak}
                </div>
                <div className="text-gray-600">Best Streak</div>
              </div>
              
              <div className="text-center p-6 bg-blue-100 rounded-xl border-2 border-blue-200">
                <Droplets className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-blue-400 font-bold mb-2">
                  {progressData.stats.totalGlasses}
                </div>
                <div className="text-gray-600">Total Glasses</div>
              </div>
              
              <div className="text-center p-6 bg-green-100 rounded-xl border-2 border-green-200">
                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-green-400 font-bold mb-2">
                  {progressData.stats.weeklyAverage}
                </div>
                <div className="text-gray-600">Weekly Average</div>
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Beautiful Achievements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-pink-100 to-purple-100 border-pink-300 shadow-lg'
                      : 'bg-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="text-xl font-serif text-pink-400 font-bold mb-2">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {achievement.description}
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      achievement.unlocked
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {achievement.unlocked ? 'Unlocked!' : 'Locked'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Motivation Section */}
          <Card className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 shadow-xl">
            <div className="text-center">
              <Star className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <div className="text-2xl font-serif text-pink-400 font-bold mb-4 leading-relaxed">
                "Every glass you drink is a love letter to yourself. Stay hydrated, stay radiant, and remember - you're absolutely magical. ✨"
              </div>
              <div className="text-lg text-gray-600 italic">
                — With all my love, forever 💕
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}