'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Heart, Droplets, Flame, Trophy, Gem, Sparkles } from 'lucide-react';
import { useHydrationStore, useHydration, useStats, useIsLoading } from '@/lib/store';
import Navigation from '@/components/Navigation';

interface HydrationData {
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

export default function Home() {
  const hydrationData = useHydration();
  const stats = useStats();
  const isLoading = useIsLoading();
  const { addGlass, refreshData } = useHydrationStore();
  
  const [greeting, setGreeting] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number; animationDuration: number }>>([]);

  const celebrationMessages = [
    "You're doing amazing! ✨",
    "So proud of you, love! 💕",
    "Keep shining bright! 🌟",
    "You're absolutely radiant! ✨",
    "My heart blooms for you! 🌸",
    "You're simply wonderful! 💖",
    "Every drop makes you more beautiful! 💧",
    "You're my favorite hydration hero! 🦸‍♀️",
    "So much love for you! 💝",
    "You make my world sparkle! ✨"
  ];

  const romanticSubtexts = [
    "Keep shining, my love",
    "You're absolutely glowing",
    "My heart is so full of pride",
    "You make everything beautiful",
    "I'm so lucky to have you",
    "You're my favorite person",
    "Every day with you is magic",
    "You light up my whole world"
  ];

  useEffect(() => {
    updateGreeting();
    refreshData();
    startFloatingHearts();
  }, [refreshData]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = "Good morning, sunshine! 🌅";
    } else if (hour < 17) {
      greeting = "Good afternoon, beautiful! ☀️";
    } else if (hour < 21) {
      greeting = "Good evening, my love! 🌙";
    } else {
      greeting = "Sweet dreams, gorgeous! ⭐";
    }
    
    setGreeting(greeting);
  };

  const addGlassHandler = async () => {
    if (hydrationData.glasses >= hydrationData.target) {
      showCelebrationMessage("You're already glowing today! ✨", "Perfect hydration achieved!");
      return;
    }
    
    const success = await addGlass();
    
    if (success) {
      // Show celebration
      const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
      const randomSubtext = romanticSubtexts[Math.floor(Math.random() * romanticSubtexts.length)];
      showCelebrationMessage(randomMessage, randomSubtext);
      
      // Show notification toast
      toast.success(`📧 Email notification sent! Keep it up! 💕`);
      
      // Check for achievements
      if (hydrationData.glasses + 1 >= hydrationData.target) {
        setTimeout(() => {
          showCelebrationMessage("Daily goal complete! 🏆", "You're absolutely incredible!");
        }, 2000);
      }
    } else {
      toast.error('Failed to add glass. Please try again.');
    }
  };

  const showCelebrationMessage = (message: string, subtext: string) => {
    setCelebrationMessage(`${message}\n${subtext}`);
    setShowCelebration(true);
    
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const startFloatingHearts = () => {
    setInterval(() => {
      if (Math.random() < 0.3) {
        const newHeart = {
          id: Date.now(),
          left: Math.random() * 100,
          animationDuration: Math.random() * 10 + 10
        };
        
        setFloatingHearts(prev => [...prev, newHeart]);
        
        setTimeout(() => {
          setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, 20000);
      }
    }, 3000);
  };

  const waterPercentage = (hydrationData.glasses / hydrationData.target) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-50 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-100/30 via-purple-100/30 to-orange-50/30 animate-pulse" />
      
      {/* Floating Hearts */}
      {floatingHearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-pink-300 text-2xl opacity-30 animate-bounce"
          style={{
            left: `${heart.left}%`,
            animation: `floatHearts ${heart.animationDuration}s linear infinite`,
          }}
        >
          💕
        </div>
      ))}

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-gradient">
            Hydration Love
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Your daily dose of self-care and romance 💕
          </p>
        </header>

        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="space-y-8">
          {/* Hero Section */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-serif text-pink-400 mb-8">
                {greeting}
              </div>

              {/* Water Glass */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-72">
                  <div className="absolute inset-0 border-4 border-pink-300 rounded-b-2xl overflow-hidden shadow-lg">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-300 via-blue-200 to-purple-200 rounded-b-xl transition-all duration-1000 ease-out"
                      style={{ height: `${waterPercentage}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="mb-8">
                <div className="text-4xl md:text-5xl font-serif text-pink-400 font-bold mb-2">
                  {hydrationData.glasses}
                </div>
                <div className="text-gray-600 mb-6">
                  of {hydrationData.target} glasses today
                </div>
                
                {/* Streak Counter */}
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-pink-100 rounded-full border-2 border-pink-300">
                  <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                  <span className="text-xl font-serif text-pink-400 font-semibold">
                    {hydrationData.streak} day streak
                  </span>
                </div>
              </div>

              {/* Add Glass Button */}
              <Button
                onClick={addGlassHandler}
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-4 text-xl font-semibold rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Droplets className="w-6 h-6" />
                    Add a Glass
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-pink-400 font-bold mb-2">
                  {stats.weeklyAverage}
                </div>
                <div className="text-gray-600">Weekly Average</div>
              </div>
            </Card>
            
            <Card className="p-6 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center">
                <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-pink-400 font-bold mb-2">
                  {hydrationData.streak}
                </div>
                <div className="text-gray-600">Best Streak</div>
              </div>
            </Card>
            
            <Card className="p-6 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center">
                <Gem className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <div className="text-3xl font-serif text-pink-400 font-bold mb-2">
                  {stats.totalGlasses}
                </div>
                <div className="text-gray-600">Total Glasses</div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white/95 p-8 rounded-2xl border-2 border-pink-300 shadow-2xl text-center animate-bounce">
            <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <div className="text-2xl font-serif text-pink-400 font-bold whitespace-pre-line">
              {celebrationMessage}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes floatHearts {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}