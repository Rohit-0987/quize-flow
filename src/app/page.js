'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Timer, Star, Heart, Zap, Award, Target, Crown, Flame } from 'lucide-react';

// Define sample quiz data
const sampleQuizData = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    difficulty: "easy",
    points: 100
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    difficulty: "easy",
    points: 100
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4",
    difficulty: "easy",
    points: 100
  }
];

// Define difficulty multipliers
const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 1.5,
  hard: 2
};

const QuizApp = () => {
  // State declarations
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('start');
  const [timer, setTimer] = useState(30);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [powerups, setPowerups] = useState({
    extraTime: 2,
    fiftyFifty: 1,
    extraLife: 1
  });
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([]);
  const [showPowerupEffect, setShowPowerupEffect] = useState(null);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch('/api/quiz'); // Fetch from our own API route
        if (!response.ok) throw new Error('Failed to fetch quiz data');
        const data = await response.json();
        console.log(data)
        setQuizData(data);
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        setError('Using sample questions');
        setQuizData(sampleQuizData); // Use fallback sample data
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && gameState === 'playing') {
      handleAnswer(null);
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  // Start new quiz
  const startQuiz = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setTimer(30);
    setError(null);
    setPowerups({
      extraTime: 2,
      fiftyFifty: 1,
      extraLife: 1
    });
  };

  // Handle power-up usage
  const handlePowerup = (type) => {
    if (powerups[type] <= 0) return;

    setPowerups(prev => ({ ...prev, [type]: prev[type] - 1 }));
    setShowPowerupEffect(type);
    setTimeout(() => setShowPowerupEffect(null), 1500);

    switch (type) {
      case 'extraTime':
        setTimer(prev => prev + 15);
        break;
      case 'fiftyFifty': {
        const correctAnswer = quizData[currentQuestion].correctAnswer;
        const incorrectOptions = quizData[currentQuestion].options.filter(
          opt => opt !== correctAnswer
        );
        const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        const newOptions = [correctAnswer, randomIncorrect].sort(() => Math.random() - 0.5);
        setQuizData(prev => ({
          ...prev,
          [currentQuestion]: {
            ...prev[currentQuestion],
            options: newOptions
          }
        }));
        break;
      }
      case 'extraLife':
        setLives(prev => prev + 1);
        break;
      default:
        break;
    }
  };

  // Handle answer selection
  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    
    setTimeout(() => {
      const correct = answer === quizData[currentQuestion].correctAnswer;
      const questionDifficulty = quizData[currentQuestion].difficulty || 'easy';
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[questionDifficulty];
      
      if (correct) {
        const streakBonus = streak >= 2 ? 50 : 0;
        const timeBonus = Math.floor(timer / 2);
        const basePoints = quizData[currentQuestion].points || 100;
        const totalPoints = Math.floor((basePoints + streakBonus + timeBonus) * difficultyMultiplier);
        
        setScore(prev => prev + totalPoints);
        setStreak(prev => prev + 1);
        setXp(prev => prev + Math.floor(totalPoints / 10));
      } else {
        setLives(prev => prev - 1);
        setStreak(0);
      }

      if ((lives <= 1 && !correct) || currentQuestion + 1 >= quizData.length) {
        setGameState('summary');
      } else {
        setCurrentQuestion(prev => prev + 1);
        setTimer(30);
        setSelectedAnswer(null);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <Card className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-bold">Level {level}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold">{xp} XP</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {gameState === 'start' ? 'Epic Knowledge Quest!' : 
             gameState === 'playing' ? `Challenge ${currentQuestion + 1}/${quizData.length}` :
             'Quest Complete!'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {gameState === 'start' && (
            <div className="text-center space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                  <h3 className="font-bold flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Rewards
                  </h3>
                  <p className="text-sm">Earn XP, unlock achievements, level up!</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <h3 className="font-bold flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 mr-2 text-blue-500" />
                    Power-ups
                  </h3>
                  <p className="text-sm">Use special abilities to overcome challenges!</p>
                </div>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                <div className="flex items-center space-x-1">
                  {[...Array(lives)].map((_, i) => (
                    <Heart key={i} className="w-5 h-5 text-red-500" fill="currentColor" />
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-blue-500" />
                  <span className="font-bold">{timer}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">{score}</span>
                </div>
                {streak >= 2 && (
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-orange-500">x{streak}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                {Object.entries(powerups).map(([type, count]) => (
                  <Button
                    key={type}
                    onClick={() => handlePowerup(type)}
                    disabled={count <= 0}
                    className="flex items-center space-x-2"
                  >
                    {type === 'extraTime' && <Timer className="w-4 h-4" />}
                    {type === 'fiftyFifty' && <Target className="w-4 h-4" />}
                    {type === 'extraLife' && <Heart className="w-4 h-4" />}
                    <span>{count}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-xl font-medium text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  {quizData[currentQuestion].question}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {quizData[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-6 text-lg transition-all transform hover:scale-105 ${
                        selectedAnswer === option
                          ? option === quizData[currentQuestion].correctAnswer
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      disabled={selectedAnswer !== null}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState === 'summary' && (
            <div className="text-center space-y-8">
              <Trophy className="w-24 h-24 mx-auto text-yellow-500" />
              <div className="space-y-4">
                <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500">
                  Final Score: {score}
                </p>
                <p className="text-xl">
                  XP Gained: {Math.floor(score / 10)}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          {(gameState === 'start' || gameState === 'summary') && (
            <Button 
              onClick={startQuiz}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {gameState === 'start' ? 'Start Quest' : 'Play Again'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizApp;