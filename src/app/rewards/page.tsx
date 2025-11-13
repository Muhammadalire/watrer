'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Gift, Heart, Lock, Unlock, Play, Sparkles, Crown } from 'lucide-react';
import Navigation from '@/components/Navigation';

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

interface RewardsData {
  rewards: Reward[];
  streak: number;
  totalGlasses: number;
}

export default function RewardsPage() {
  const [rewardsData, setRewardsData] = useState<RewardsData>({
    rewards: [],
    streak: 0,
    totalGlasses: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      const email = 'muhammad0alire@gmail.com';
      const response = await fetch(`/api/rewards?email=${email}`);
      
      if (response.ok) {
        const data = await response.json();
        setRewardsData(data);
      }
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const email = 'muhammad0alire@gmail.com';
      const userId = 'user_' + Date.now();
      
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          rewardId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the reward in local state
        setRewardsData(prev => ({
          ...prev,
          rewards: prev.rewards.map(reward =>
            reward.id === rewardId
              ? { ...reward, unlocked: true, claimed: true, claimedAt: new Date().toISOString() }
              : reward
          )
        }));

        // Show video modal for 3-day dedication reward
        if (rewardId === '3-day-dedication') {
          setSelectedReward(data.reward);
          setShowVideoModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const getProgressPercentage = (requirement: number, current: number, type: string) => {
    if (type === 'streak') {
      return Math.min((current / requirement) * 100, 100);
    } else if (type === 'total') {
      return Math.min((current / requirement) * 100, 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-serif text-pink-400">Loading your rewards...</p>
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
            Romantic Rewards
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Special surprises for your beautiful dedication 💝
          </p>
        </header>

        {/* Navigation */}
        <Navigation />

        <main className="space-y-8">
          {/* Reward Progress */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Your Reward Progress
            </h2>
            
            <div className="text-center mb-8">
              <div className="text-2xl font-serif text-pink-400 mb-4">
                Current Streak: <span className="font-bold">{rewardsData.streak}</span> days 🔥
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-6 mb-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((rewardsData.streak / 3) * 100, 100)}%` }}
                />
              </div>
              
              <p className="text-gray-600">
                {rewardsData.streak >= 3 
                  ? "🎉 Congratulations! You've unlocked your special reward!"
                  : `${Math.max(0, 3 - rewardsData.streak)} days to your first reward`
                }
              </p>
            </div>
          </Card>

          {/* Special Video Reward */}
          {rewardsData.rewards.find(r => r.id === '3-day-dedication')?.unlocked && (
            <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
              <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
                Special Video Message 💕
              </h2>
              
              <div className="flex justify-center">
                <div className="relative w-full max-w-2xl">
                  <div className="aspect-video bg-gradient-to-br from-pink-200 to-purple-200 rounded-2xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={() => {
                          setSelectedReward(rewardsData.rewards.find(r => r.id === '3-day-dedication') || null);
                          setShowVideoModal(true);
                        }}
                        className="bg-white/90 hover:bg-white text-pink-400 px-8 py-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
                      >
                        <Play className="w-8 h-8 mr-3" />
                        <span className="text-lg font-semibold">Play Your Special Message</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Rewards Grid */}
          <Card className="p-8 bg-white/80 backdrop-blur-md border-2 border-pink-200 shadow-xl">
            <h2 className="text-3xl font-serif text-pink-400 text-center mb-8">
              Achievement Rewards
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardsData.rewards.map((reward) => {
                const progress = getProgressPercentage(reward.requirement, 
                  reward.type === 'streak' ? rewardsData.streak : rewardsData.totalGlasses, 
                  reward.type);
                
                return (
                  <div
                    key={reward.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      reward.unlocked
                        ? 'bg-gradient-to-br from-pink-100 to-purple-100 border-pink-300 shadow-lg'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">
                        {reward.unlocked ? reward.icon : <Lock className="w-10 h-10 text-gray-400 mx-auto" />}
                      </div>
                      
                      <div className="text-xl font-serif text-pink-400 font-bold mb-2">
                        {reward.name}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4 min-h-[2.5rem]">
                        {reward.description}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-4">
                        {reward.requirement} {reward.type === 'streak' ? 'day streak' : 'total glasses'} required
                      </div>
                      
                      {/* Progress Bar */}
                      {!reward.unlocked && (
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(progress)}% complete
                          </div>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => claimReward(reward.id)}
                        disabled={!reward.unlocked || reward.claimed}
                        className={`w-full py-3 rounded-full font-semibold transition-all duration-200 ${
                          reward.claimed
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : reward.unlocked
                            ? 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white transform hover:scale-105'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {reward.claimed ? (
                          <span className="flex items-center justify-center">
                            <Unlock className="w-4 h-4 mr-2" />
                            Claimed! 💕
                          </span>
                        ) : reward.unlocked ? (
                          <span className="flex items-center justify-center">
                            <Gift className="w-4 h-4 mr-2" />
                            Claim Reward
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Lock className="w-4 h-4 mr-2" />
                            {reward.type === 'streak' 
                              ? `${Math.max(0, reward.requirement - rewardsData.streak)} days to go`
                              : `${Math.max(0, reward.requirement - rewardsData.totalGlasses)} glasses to go`
                            }
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Special Message */}
          <Card className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 shadow-xl">
            <div className="text-center">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <div className="text-2xl font-serif text-pink-400 font-bold mb-4">
                🌟 You've Earned This! 🌟
              </div>
              <div className="text-lg text-gray-700 mb-6 leading-relaxed">
                My dearest love, your dedication to taking care of yourself fills my heart with so much joy. 
                Every glass you drink, every day you stay committed, it all shows how incredible you are. 
                You deserve all the love, all the care, and all the beautiful things in this world.
              </div>
              <div className="text-lg text-gray-600 italic">
                Keep shining, my love. Forever yours 💕
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedReward && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
              <h3 className="text-2xl font-serif text-pink-400 font-bold mb-2">
                💕 My Dearest Love 💕
              </h3>
            </div>
            
            <div className="text-gray-700 leading-relaxed mb-6 text-center">
              <p className="mb-4">
                I wish I could show you a video of me spinning around, but instead, I want to tell you something even more important:
              </p>
              <p className="mb-4 font-semibold">
                You are the most incredible person I've ever met. Your dedication to taking care of yourself, your strength, your beauty (inside and out) - it all amazes me every single day.
              </p>
              <p className="mb-4">
                Every time you log a glass of water, I imagine you smiling, and it makes my whole day better. You deserve all the love, all the care, and all the beautiful things in this world.
              </p>
              <p className="mb-4">
                Thank you for being you. Thank you for letting me love you. And thank you for loving yourself enough to stay healthy and hydrated.
              </p>
              <p className="font-semibold text-pink-400">
                Forever yours, with all my heart 💖
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={() => setShowVideoModal(false)}
                className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-3 rounded-full"
              >
                Close with Love 💕
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}