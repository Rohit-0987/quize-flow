'use client'
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, X, ArrowLeft, Trophy, Flag } from 'lucide-react';

const SolutionsPage = () => {
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    const results = localStorage.getItem('lastQuizResults');
    if (results) {
      setQuizResults(JSON.parse(results));
    }
  }, []);

  if (!quizResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center p-8">
            <p className="text-xl">No quiz results found. Please complete a quiz first.</p>
            <Button 
              onClick={() => window.location.href = '/quiz'}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-500 mr-4" />
              Quiz Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Final Score</p>
                <p className="text-3xl font-bold text-purple-600">{quizResults.score}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">Completion</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round((quizResults.answeredQuestions.length / quizResults.totalQuestions) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {quizResults.answeredQuestions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {item.correct ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="w-6 h-6 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
                      <p className="text-gray-700 mb-4">{item.question}</p>
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="font-medium text-gray-600">Your Answer:</p>
                        <p className={`mt-1 ${item.correct ? 'text-green-600' : 'text-red-600'}`}>
                          {item.userAnswer}
                        </p>
                      </div>
                      {item.solution && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Flag className="w-5 h-5 text-blue-600 mr-2" />
                            <p className="font-medium text-blue-600">Detailed Solution:</p>
                          </div>
                          <p className="text-gray-700">{item.solution}</p>
                        </div>
                      )}
                      <div className="mt-4 text-right">
                        <span className={`font-bold ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.points > 0 ? '+' : ''}{item.points} points
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.href = '/'}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quiz
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;