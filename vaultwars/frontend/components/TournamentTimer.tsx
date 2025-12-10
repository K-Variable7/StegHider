'use client';

import { useState, useEffect } from 'react';

interface TournamentTimerProps {
  endTime: Date;
  onTournamentEnd?: () => void;
  className?: string;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({ 
  endTime, 
  onTournamentEnd,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        if (onTournamentEnd) {
          onTournamentEnd();
        }
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTournamentEnd]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  const getUrgencyClass = () => {
    if (isExpired) return 'text-red-400';
    if (timeLeft.days === 0 && timeLeft.hours < 24) return 'text-orange-400';
    if (timeLeft.days === 0 && timeLeft.hours < 1) return 'text-red-400';
    return 'text-blue-400';
  };

  const getProgressPercentage = () => {
    const totalSeconds = Math.floor((endTime.getTime() - new Date().getTime()) / 1000);
    const maxSeconds = 7 * 24 * 60 * 60; // 7 days
    const percentage = Math.max(0, Math.min(100, (totalSeconds / maxSeconds) * 100));
    return percentage;
  };

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-red-400 font-bold text-lg mb-2">
          🏆 Tournament Ended!
        </div>
        <div className="text-gray-400 text-sm">
          Winners will be announced soon
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-3 sm:p-4 border border-purple-500/30 ${className}`}>
      {/* Header */}
      <div className="text-center mb-2 sm:mb-3">
        <h3 className="text-white font-bold text-base sm:text-lg mb-1">
          🏆 Tournament Countdown
        </h3>
        <div className="text-gray-300 text-xs sm:text-sm">
          Ends on {endTime.toLocaleDateString()} at {endTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex justify-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
        {/* Days */}
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className={`text-2xl sm:text-3xl font-bold ${getUrgencyClass()}`}>
              {formatNumber(timeLeft.days)}
            </div>
            <div className="text-gray-400 text-xs uppercase tracking-wide">
              Days
            </div>
          </div>
        )}

        {/* Hours */}
        <div className="text-center">
          <div className={`text-2xl sm:text-3xl font-bold ${getUrgencyClass()}`}>
            {formatNumber(timeLeft.hours)}
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Hours
          </div>
        </div>

        {/* Minutes */}
        <div className="text-center">
          <div className={`text-2xl sm:text-3xl font-bold ${getUrgencyClass()}`}>
            {formatNumber(timeLeft.minutes)}
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Min
          </div>
        </div>

        {/* Seconds */}
        <div className="text-center">
          <div className={`text-2xl sm:text-3xl font-bold ${getUrgencyClass()} animate-pulse`}>
            {formatNumber(timeLeft.seconds)}
          </div>
          <div className="text-gray-400 text-xs uppercase tracking-wide">
            Sec
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-1 sm:h-2 overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Status Message */}
      <div className="text-center">
        {timeLeft.days === 0 && timeLeft.hours < 24 ? (
          <div className="text-orange-400 text-xs sm:text-sm font-medium animate-pulse">
            ⚡ Final Hours - Race to the top!
          </div>
        ) : timeLeft.days === 0 && timeLeft.hours < 1 ? (
          <div className="text-red-400 text-xs sm:text-sm font-medium animate-pulse">
            🔥 Last Minute - Every second counts!
          </div>
        ) : (
          <div className="text-blue-400 text-xs sm:text-sm">
            ⏰ Time remaining to compete
          </div>
        )}
      </div>
    </div>
  );
};

// Utility function to create tournament end time (7 days from now)
export const createTournamentEndTime = (): Date => {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
};

// Hook for tournament state management
export const useTournamentTimer = (initialEndTime?: Date) => {
  const [endTime] = useState(initialEndTime || createTournamentEndTime());
  const [isActive, setIsActive] = useState(true);

  const handleTournamentEnd = () => {
    setIsActive(false);
  };

  return {
    endTime,
    isActive,
    onTournamentEnd: handleTournamentEnd
  };
};

export default TournamentTimer;
