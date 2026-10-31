import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Award, HelpCircle } from 'lucide-react';
import { api } from '../services/api.js';

export function QuizModal({ isOpen, onClose, requirementId, onQuizPassed }) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && requirementId) {
      loadQuiz();
    }
  }, [isOpen, requirementId]);

  async function loadQuiz() {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      const data = await api.getQuizByRequirement(requirementId);
      setQuizData(data);
    } catch (err) {
      setError(err.message || 'Failed to load safety quiz');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectOption = (questionId, optionIndex) => {
    if (result) return; // locked after submission
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quizData) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quizData.questions.length) {
      alert(`Please answer all ${quizData.questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitQuiz(quizData.quiz.id, answers);
      setResult(res);
      if (res.passed && onQuizPassed) {
        onQuizPassed();
      }
    } catch (err) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Award className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">{quizData?.quiz?.title || 'Safety & Operations Quiz'}</h3>
              <p className="text-xs text-indigo-200">
                Pass mark: {quizData?.quiz?.pass_percentage || 80}% to earn Passport qualification badge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading quiz assessment...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm">{error}</div>
          ) : (
            <>
              {/* Score result banner if submitted */}
              {result && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.passed ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {result.passed ? '🎉 Congratulations! You Passed!' : 'Assessment Not Passed'}
                      </h4>
                      <p className="text-xs opacity-90">
                        You scored {result.score}% ({result.correctCount}/{result.totalQuestions} correct). Required: {result.pass_percentage}%.
                      </p>
                    </div>
                  </div>
                  {!result.passed && (
                    <button
                      onClick={loadQuiz}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                    >
                      Retake Quiz
                    </button>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {quizData.questions.map((q, idx) => {
                  const reviewItem = result?.review?.find(r => r.questionId === q.id);
                  return (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-xs text-indigo-700 uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        {reviewItem && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            reviewItem.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {reviewItem.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-slate-900 text-sm">{q.question}</p>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answers[q.id] === optIdx;
                          let optStyle = 'border-slate-200 bg-white hover:border-indigo-300';

                          if (result) {
                            if (optIdx === q.correct_option_index) {
                              optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                            } else if (isSelected && !reviewItem?.isCorrect) {
                              optStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                            }
                          } else if (isSelected) {
                            optStyle = 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-medium ring-1 ring-indigo-600';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                isSelected ? 'border-indigo-600 bg-indigo-600 text-white text-[10px]' : 'border-slate-300'
                              }`}>
                                {isSelected ? '●' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {reviewItem && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-800">Explanation: </span>
                            {reviewItem.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {submitting ? 'Scoring Answers...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

