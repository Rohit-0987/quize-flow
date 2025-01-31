'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Timer, Star, Heart, Zap, Award, Target, Crown, Flame, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizApp = () => {
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
  const [mistakeCount, setMistakeCount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [xpForNextLevel, setXpForNextLevel] = useState(100);
  const [showAnswer, setShowAnswer] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // Calculate XP required for next level
  const calculateXpForNextLevel = (currentLevel) => {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  };

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch('/api/quiz');
        if (!response.ok) throw new Error('Failed to fetch quiz data');
        const data = await response.json();
        setQuizData(data);
        setLives(data.max_mistake_count || 3);
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        setError('Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  // Level up check
  useEffect(() => {
    if (xp >= xpForNextLevel) {
      setLevel(prev => prev + 1);
      setShowLevelUp(true);
      setXpForNextLevel(calculateXpForNextLevel(level + 1));
      
      // Award power-ups for leveling up
      setPowerups(prev => ({
        extraTime: prev.extraTime + 1,
        fiftyFifty: prev.fiftyFifty + 1,
        extraLife: prev.extraLife + 1
      }));

      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [xp, level, xpForNextLevel]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0 && !showAnswer) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && gameState === 'playing') {
      handleAnswer(null);
    }
    return () => clearInterval(interval);
  }, [gameState, timer, showAnswer]);

  // Combo multiplier effect
  useEffect(() => {
    if (streak >= 3) {
      setComboMultiplier(1.5);
    } else if (streak >= 5) {
      setComboMultiplier(2);
    } else {
      setComboMultiplier(1);
    }
  }, [streak]);

  const startQuiz = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setLives(quizData?.max_mistake_count || 3);
    setStreak(0);
    setTimer(30);
    setError(null);
    setMistakeCount(0);
    setAnsweredQuestions([]);
    setComboMultiplier(1);
    setPowerups({
      extraTime: 2,
      fiftyFifty: 1,
      extraLife: 1
    });
  };

  const handlePowerup = (type) => {
    if (powerups[type] <= 0) return;

    setPowerups(prev => ({ ...prev, [type]: prev[type] - 1 }));

    switch (type) {
      case 'extraTime':
        setTimer(prev => prev + 15);
        break;
      case 'fiftyFifty': {
        const currentQ = quizData.questions[currentQuestion];
        const correctOption = currentQ.options.find(opt => opt.is_correct);
        const incorrectOptions = currentQ.options.filter(opt => !opt.is_correct);
        const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        const newOptions = [correctOption, randomIncorrect].sort(() => Math.random() - 0.5);
        const updatedQuestions = [...quizData.questions];
        updatedQuestions[currentQuestion] = { ...currentQ, options: newOptions };
        setQuizData({ ...quizData, questions: updatedQuestions });
        break;
      }
      case 'extraLife':
        setLives(prev => prev + 1);
        break;
    }
  };

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    setShowAnswer(true);
    
    setTimeout(() => {
      const correct = option?.is_correct || false;
      const questionPoints = parseFloat(quizData.correct_answer_marks) || 4;
      const negativePoints = parseFloat(quizData.negative_marks) || 1;
      
      // Store answered question data
      setAnsweredQuestions(prev => [...prev, {
        question: quizData.questions[currentQuestion].description,
        userAnswer: option?.description,
        correct: correct,
        solution: quizData.questions[currentQuestion].detailed_solution,
        points: correct ? questionPoints : -negativePoints
      }]);

      if (correct) {
        const streakBonus = streak >= 2 ? questionPoints * 0.5 : 0;
        const timeBonus = Math.floor(timer / 10);
        const comboBonus = questionPoints * (comboMultiplier - 1);
        const totalPoints = (questionPoints + streakBonus + timeBonus + comboBonus);
        
        setScore(prev => prev + totalPoints);
        setStreak(prev => prev + 1);
        setXp(prev => prev + Math.floor(totalPoints));
      } else {
        setMistakeCount(prev => prev + 1);
        setLives(prev => prev - 1);
        setStreak(0);
        setComboMultiplier(1);
        setScore(prev => prev - negativePoints);
      }

      setTimeout(() => {
        setShowAnswer(false);
        if (mistakeCount + 1 >= quizData.max_mistake_count || currentQuestion + 1 >= quizData.questions.length) {
          setGameState('summary');
          localStorage.setItem('lastQuizResults', JSON.stringify({
            score,
            answeredQuestions,
            totalQuestions: quizData.questions.length
          }));
        } else {
          setCurrentQuestion(prev => prev + 1);
          setTimer(30);
          setSelectedAnswer(null);
        }
      }, 1500);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-white border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black p-8 rounded-lg shadow-xl z-50"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1 }}
            >
              <Trophy className="w-16 h-16 mx-auto text-yellow-600" />
            </motion.div>
            <h2 className="text-4xl font-bold text-center mt-4">Level Up!</h2>
            <p className="text-xl mt-2 text-center">You reached Level {level}</p>
            <div className="mt-4 text-center">
              <p className="font-bold">Bonus Power-ups Awarded!</p>
              <div className="flex justify-center space-x-4 mt-2">
                <div className="flex items-center">
                  <Timer className="w-5 h-5 mr-1" /> +1
                </div>
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-1" /> +1
                </div>
                <div className="flex items-center">
                  <Heart className="w-5 h-5 mr-1" /> +1
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-bold">Level {level}</span>
            </div>
            <div className="flex flex-col w-full max-w-[200px]">
              <div className="flex justify-between text-sm">
                <span>XP: {xp}</span>
                <span>Next: {xpForNextLevel}</span>
              </div>
              <Progress value={(xp / xpForNextLevel) * 100} className="h-2" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {quizData?.title || 'Quiz Challenge'}
          </CardTitle>
        </CardHeader>

        <CardContent>
        {gameState === 'start' && (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center space-y-6"
  >
    {/* Quiz Info Cards */}
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
        <h3 className="font-bold flex items-center justify-center mb-4">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
          Quiz Info
        </h3>
        <div className="text-sm space-y-2">
          <p className="flex justify-between">
            <span>Questions:</span>
            <span className="font-medium">{quizData?.questions_count}</span>
          </p>
          <p className="flex justify-between">
            <span>Max Mistakes:</span>
            <span className="font-medium">{quizData?.max_mistake_count}</span>
          </p>
          <p className="flex justify-between">
            <span>Points per correct:</span>
            <span className="font-medium">+{quizData?.correct_answer_marks}</span>
          </p>
          <p className="flex justify-between">
            <span>Points per wrong:</span>
            <span className="font-medium text-red-500">-{quizData?.negative_marks}</span>
          </p>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
        <h3 className="font-bold flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 mr-2 text-blue-500" />
          Power-ups Available
        </h3>
        <div className="space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span className="flex items-center">
              <Timer className="w-4 h-4 mr-2" />
              Extra Time
            </span>
            <span className="font-medium">×2</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              50/50
            </span>
            <span className="font-medium">×1</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              Extra Life
            </span>
            <span className="font-medium">×1</span>
          </p>
        </div>
      </div>
    </div>

    {/* Rules and Features */}
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg mb-8">
      <h3 className="font-bold text-lg mb-4 flex items-center justify-center">
        <Star className="w-6 h-6 mr-2 text-yellow-500" />
        Features & Rules
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="flex items-center mb-2">
            <Flame className="w-4 h-4 mr-2 text-orange-500" />
            Combo multiplier for streaks
          </p>
          <p className="flex items-center mb-2">
            <Timer className="w-4 h-4 mr-2 text-blue-500" />
            Time bonus for quick answers
          </p>
        </div>
        <div>
          <p className="flex items-center mb-2">
            <Zap className="w-4 h-4 mr-2 text-purple-500" />
            Earn XP to level up
          </p>
          <p className="flex items-center mb-2">
            <Award className="w-4 h-4 mr-2 text-yellow-500" />
            Power-ups for assistance
          </p>
        </div>
      </div>
    </div>

    {/* Start Button */}
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="pt-4"
    >
      <Button 
        onClick={startQuiz}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-xl shadow-lg"
      >
        Start Quiz Challenge
      </Button>
    </motion.div>
  </motion.div>
)}

          {gameState === 'playing' && quizData?.questions[currentQuestion] && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
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
                    <span className="font-bold text-orange-500">x{comboMultiplier.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                {Object.entries(powerups).map(([type, count]) => (
                  <Button
                    key={type}
                    onClick={() => handlePowerup(type)}
                    disabled={count <= 0}
                    className={`flex items-center space-x-2 ${count <= 0 ? 'opacity-50' : ''}`}
                  >
                    {type === 'extraTime' && <Timer className="w-4 h-4" />}
                    {type === 'fiftyFifty' && <Target className="w-4 h-4" />}
                    {type === 'extraLife' && <Heart className="w-4 h-4" />}
                    <span>{count}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestion + 1} of {quizData.questions.length}
                  </span>
                  <span className="text-sm font-medium">
                    Remaining: {quizData.questions.length - currentQuestion}
                  </span>
                </div>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-medium text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg"
                >
                  {quizData.questions[currentQuestion].description}
                </motion.p>

                <div className="grid grid-cols-1 gap-3">
                  {quizData.questions[currentQuestion].options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        onClick={() => handleAnswer(option)}
                        className={`w-full p-6 text-black text-lg transition-all transform hover:scale-102 ${
                          showAnswer
                            ? option.is_correct
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : selectedAnswer === option
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-white hover:bg-gray-100'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                        disabled={showAnswer || selectedAnswer !== null}
                      >
                        <motion.span
                          initial={false}
                          animate={showAnswer && option.is_correct ? { scale: [1, 1.2, 1] } : {}}
                        >
                          {option.description}
                        </motion.span>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-lg bg-gray-50"
                  >
                    <p className="font-medium mb-2">
                      {selectedAnswer?.is_correct 
                        ? `Correct! ${streak > 1 ? `Combo x${comboMultiplier}!` : ''}`
                        : 'Incorrect!'}
                    </p>
                    {quizData.questions[currentQuestion].detailed_solution && (
                      <p className="text-sm text-gray-600">
                        {quizData.questions[currentQuestion].detailed_solution}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {gameState === 'summary' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Trophy className="w-24 h-24 mx-auto text-yellow-500" />
              </motion.div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-lg">
                    <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500">
                      {score}
                    </p>
                    <p className="text-sm font-medium mt-2">Final Score</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-lg">
                    <p className="text-4xl font-bold text-blue-600">
                      {xp}
                    </p>
                    <p className="text-sm font-medium mt-2">XP Gained</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {answeredQuestions.filter(q => q.correct).length}
                    </p>
                    <p className="text-sm font-medium">Correct Answers</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((answeredQuestions.filter(q => q.correct).length / quizData.questions.length) * 100)}%
                    </p>
                    <p className="text-sm font-medium">Accuracy</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => window.location.href = '/solution-page'}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Book className="mr-2 h-4 w-4" />
                    View Solutions
                  </Button>
                  <Button 
                    onClick={startQuiz}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="justify-center p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-center"
            >
              {error}
            </motion.div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizApp;