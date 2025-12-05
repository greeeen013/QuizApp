import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  orderIndex: number;
  answers: Answer[];
  images?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
}

export interface QuizRunAnswer {
  questionId: string;
  selectedAnswerIds: string[];
  isCorrect: boolean;
}

export interface QuizRun {
  id: string;
  quizId: string;
  quizTitle: string;
  timestamp: Date;
  scorePercentage: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  answers: QuizRunAnswer[];
}

export interface Settings {
  defaultShuffle: boolean;
  displayName: string;
  avatarPreset: number;
  vibrationEnabled: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastCompletedDate: string | null;
}

interface StoreState {
  quizzes: Quiz[];
  runs: QuizRun[];
  settings: Settings;
  streak: StreakData;
}

interface StoreContextValue extends StoreState {
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt" | "updatedAt">) => Quiz;
  updateQuiz: (id: string, updates: Partial<Omit<Quiz, "id" | "createdAt">>) => void;
  deleteQuiz: (id: string) => void;
  getQuiz: (id: string) => Quiz | undefined;
  addQuestion: (quizId: string, question: Omit<Question, "id" | "orderIndex">) => Question;
  updateQuestion: (quizId: string, questionId: string, updates: Partial<Omit<Question, "id">>) => void;
  deleteQuestion: (quizId: string, questionId: string) => void;
  reorderQuestions: (quizId: string, questionIds: string[]) => void;
  addRun: (run: Omit<QuizRun, "id" | "timestamp">) => QuizRun;
  getRun: (id: string) => QuizRun | undefined;
  getRunsByQuiz: (quizId: string) => QuizRun[];
  updateSettings: (updates: Partial<Settings>) => void;
  updateStreak: () => void;
  isInitialized: boolean;
}

const STORAGE_KEY = "@quiz_app_data_v1";

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultSettings: Settings = {
  defaultShuffle: false,
  displayName: "",
  avatarPreset: 0,
  vibrationEnabled: true,
};

const defaultStreak: StreakData = {
  currentStreak: 0,
  lastCompletedDate: null,
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [runs, setRuns] = useState<QuizRun[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const data = JSON.parse(jsonValue);
          // Parse dates back from strings
          if (data.quizzes) {
            setQuizzes(
              data.quizzes.map((q: any) => ({
                ...q,
                createdAt: new Date(q.createdAt),
                updatedAt: new Date(q.updatedAt),
              }))
            );
          }
          if (data.runs) {
            setRuns(
              data.runs.map((r: any) => ({
                ...r,
                timestamp: new Date(r.timestamp),
              }))
            );
          }
          if (data.settings) {
            setSettings({ ...defaultSettings, ...data.settings });
          }
          if (data.streak) {
            setStreak(data.streak);
          }
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Save data on changes
  useEffect(() => {
    if (!isInitialized) return;

    const saveData = async () => {
      try {
        const data = {
          quizzes,
          runs,
          settings,
          streak,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save data", e);
      }
    };

    const timeoutId = setTimeout(saveData, 500); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [quizzes, runs, settings, streak, isInitialized]);

  const addQuiz = useCallback((quiz: Omit<Quiz, "id" | "createdAt" | "updatedAt">) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setQuizzes((prev) => [...prev, newQuiz]);
    return newQuiz;
  }, []);

  const updateQuiz = useCallback((id: string, updates: Partial<Omit<Quiz, "id" | "createdAt">>) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q
      )
    );
  }, []);

  const deleteQuiz = useCallback((id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setRuns((prev) => prev.filter((r) => r.quizId !== id));
  }, []);

  const getQuiz = useCallback((id: string) => {
    return quizzes.find((q) => q.id === id);
  }, [quizzes]);

  const addQuestion = useCallback((quizId: string, question: Omit<Question, "id" | "orderIndex">) => {
    const newQuestion: Question = {
      ...question,
      id: generateId(),
      orderIndex: 0,
    };
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const maxOrder = q.questions.reduce((max, qn) => Math.max(max, qn.orderIndex), -1);
          newQuestion.orderIndex = maxOrder + 1;
          return {
            ...q,
            questions: [...q.questions, newQuestion],
            updatedAt: new Date(),
          };
        }
        return q;
      })
    );
    return newQuestion;
  }, []);

  const updateQuestion = useCallback(
    (quizId: string, questionId: string, updates: Partial<Omit<Question, "id">>) => {
      setQuizzes((prev) =>
        prev.map((q) => {
          if (q.id === quizId) {
            return {
              ...q,
              questions: q.questions.map((qn) =>
                qn.id === questionId ? { ...qn, ...updates } : qn
              ),
              updatedAt: new Date(),
            };
          }
          return q;
        })
      );
    },
    []
  );

  const deleteQuestion = useCallback((quizId: string, questionId: string) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          return {
            ...q,
            questions: q.questions.filter((qn) => qn.id !== questionId),
            updatedAt: new Date(),
          };
        }
        return q;
      })
    );
  }, []);

  const reorderQuestions = useCallback((quizId: string, questionIds: string[]) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const reordered = questionIds.map((id, index) => {
            const question = q.questions.find((qn) => qn.id === id);
            if (question) {
              return { ...question, orderIndex: index };
            }
            return null;
          }).filter(Boolean) as Question[];
          return {
            ...q,
            questions: reordered,
            updatedAt: new Date(),
          };
        }
        return q;
      })
    );
  }, []);

  const addRun = useCallback((run: Omit<QuizRun, "id" | "timestamp">) => {
    const newRun: QuizRun = {
      ...run,
      id: generateId(),
      timestamp: new Date(),
    };
    setRuns((prev) => [newRun, ...prev]);
    return newRun;
  }, []);

  const getRun = useCallback((id: string) => {
    return runs.find((r) => r.id === id);
  }, [runs]);

  const getRunsByQuiz = useCallback((quizId: string) => {
    return runs.filter((r) => r.quizId === quizId);
  }, [runs]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setStreak((prev) => {
      if (prev.lastCompletedDate === today) {
        return prev;
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (prev.lastCompletedDate === yesterdayStr) {
        return {
          currentStreak: prev.currentStreak + 1,
          lastCompletedDate: today,
        };
      }
      return {
        currentStreak: 1,
        lastCompletedDate: today,
      };
    });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (streak.lastCompletedDate) {
      const lastDate = new Date(streak.lastCompletedDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (streak.lastCompletedDate !== today && streak.lastCompletedDate !== yesterdayStr) {
        setStreak({ currentStreak: 0, lastCompletedDate: null });
      }
    }
  }, [streak.lastCompletedDate]);

  const value: StoreContextValue = {
    quizzes,
    runs,
    settings,
    streak,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    getQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    addRun,
    getRun,
    getRunsByQuiz,
    updateSettings,
    updateStreak,
    isInitialized,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
