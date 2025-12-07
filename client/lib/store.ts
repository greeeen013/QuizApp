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
  isIncomplete?: boolean;
  diamondsEarned?: number;
}

export interface PausedRun {
  id: string;
  quizId: string;
  currentQuestionIndex: number;
  selectedAnswerIds: string[]; // Answers for the current question if any
  answers: QuizRunAnswer[]; // Already answered questions
  timestamp: Date;
  shuffle: boolean;
  shuffleAnswers?: boolean;
  questionIds?: string[]; // If a subset of questions was used
}

export interface Settings {
  defaultShuffle: boolean;
  defaultShuffleAnswers: boolean;
  displayName: string;
  avatarPreset: number;
  profileImage: string | null;
  vibrationEnabled: boolean;
  autoAdvanceDelay: number;
  manualConfirmation: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastCompletedDate: string | null;
  freezers: number;
  history: Record<string, "completed" | "freezed" | "missed">;
}

interface StoreState {
  quizzes: Quiz[];
  runs: QuizRun[];
  pausedRuns: PausedRun[];
  settings: Settings;
  streak: StreakData;
  diamonds: number;
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
  addRun: (run: Omit<QuizRun, "id" | "timestamp" | "diamondsEarned">) => QuizRun;
  getRun: (id: string) => QuizRun | undefined;
  getRunsByQuiz: (quizId: string) => QuizRun[];
  savePausedRun: (run: Omit<PausedRun, "id" | "timestamp"> & { id?: string }) => string;
  deletePausedRun: (id: string) => void;
  getPausedRun: (id: string) => PausedRun | undefined;
  updateSettings: (updates: Partial<Settings>) => void;
  updateStreak: () => void;
  buyFreezer: () => boolean;
  isInitialized: boolean;
}

const STORAGE_KEY = "@quiz_app_data_v1";

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultSettings: Settings = {
  defaultShuffle: false,
  defaultShuffleAnswers: false,
  displayName: "",
  avatarPreset: 0,
  profileImage: null,
  vibrationEnabled: true,
  autoAdvanceDelay: 1.5,
  manualConfirmation: false,
};

const defaultStreak: StreakData = {
  currentStreak: 0,
  lastCompletedDate: null,
  freezers: 0,
  history: {},
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [runs, setRuns] = useState<QuizRun[]>([]);
  const [pausedRuns, setPausedRuns] = useState<PausedRun[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const [diamonds, setDiamonds] = useState<number>(0);
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
          if (data.pausedRuns) {
            setPausedRuns(
              data.pausedRuns.map((r: any) => ({
                ...r,
                timestamp: new Date(r.timestamp),
              }))
            );
          }
          if (data.settings) {
            setSettings({ ...defaultSettings, ...data.settings });
          }
          if (data.streak) {
            setStreak({ ...defaultStreak, ...data.streak });
          }
          if (data.diamonds !== undefined) {
            setDiamonds(data.diamonds);
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
          pausedRuns,
          settings,
          streak,
          diamonds,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save data", e);
      }
    };

    const timeoutId = setTimeout(saveData, 500); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [quizzes, runs, pausedRuns, settings, streak, diamonds, isInitialized]);

  // Check streak status on initialization
  useEffect(() => {
    if (!isInitialized) return;

    const checkStreak = () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      setStreak((prev) => {
        // If already completed today, do nothing
        if (prev.lastCompletedDate === today) return prev;

        // If completed yesterday, streak is safe
        if (prev.lastCompletedDate === yesterdayStr) return prev;

        // If no last completed date, streak is 0 (or safe if 0)
        if (!prev.lastCompletedDate) return prev;

        // If missed more than 1 day
        const lastDate = new Date(prev.lastCompletedDate);
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // Days missed between

        if (diffDays > 0) {
          // Check if we have enough freezers
          if (prev.freezers >= diffDays) {
            // Use freezers
            const newHistory = { ...prev.history };
            // Mark missed days as freezed
            for (let i = 1; i <= diffDays; i++) {
              const d = new Date(lastDate);
              d.setDate(d.getDate() + i);
              const dStr = d.toISOString().split("T")[0];
              newHistory[dStr] = "freezed";
            }

            return {
              ...prev,
              freezers: prev.freezers - diffDays,
              lastCompletedDate: yesterdayStr, // Pretend we finished yesterday to keep streak alive? 
              // Actually, if we freeze, the streak count stays, but lastCompletedDate should probably update to "yesterday" effectively?
              // Or we just don't reset the streak.
              // If we set lastCompletedDate to yesterdayStr, the next check will see it as "completed yesterday".
              history: newHistory,
            };
          } else {
            // Not enough freezers, reset streak
            // Mark days as missed?
            const newHistory = { ...prev.history };
            // We could mark them, but for now just reset
            return {
              ...prev,
              currentStreak: 0,
              // lastCompletedDate stays as is, so we know when it broke? Or null?
              // If we keep it, the next check will still see a gap.
              // But currentStreak is 0, so it doesn't matter much.
            };
          }
        }
        return prev;
      });
    };

    checkStreak();
  }, [isInitialized]);


  const addQuiz = useCallback((quiz: Omit<Quiz, "id" | "createdAt" | "updatedAt">) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: quiz.questions.map((q) => ({
        ...q,
        id: q.id || generateId(),
        answers: q.answers.map((a) => ({
          ...a,
          id: a.id || generateId(),
        })),
      })),
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
    setPausedRuns((prev) => prev.filter((r) => r.quizId !== id));
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

  const addRun = useCallback((run: Omit<QuizRun, "id" | "timestamp" | "diamondsEarned">) => {
    // Calculate diamonds
    // 0.5 diamonds per question * (scorePercentage / 100)
    const rawDiamonds = run.totalQuestions * 0.5 * (run.scorePercentage / 100);
    // Store as float, but we might want to round it for display or storage? 
    // Requirement: "hodnota se uloží v desetinném čísle" (store as decimal)
    const diamondsEarned = rawDiamonds;

    const newRun: QuizRun = {
      ...run,
      id: generateId(),
      timestamp: new Date(),
      diamondsEarned,
    };
    setRuns((prev) => [newRun, ...prev]);
    setDiamonds((prev) => prev + diamondsEarned);

    return newRun;
  }, []);

  const getRun = useCallback((id: string) => {
    return runs.find((r) => r.id === id);
  }, [runs]);

  const getRunsByQuiz = useCallback((quizId: string) => {
    return runs.filter((r) => r.quizId === quizId);
  }, [runs]);

  const savePausedRun = useCallback((run: Omit<PausedRun, "id" | "timestamp"> & { id?: string }) => {
    const existingId = run.id;
    const newId = existingId || generateId();

    setPausedRuns((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === newId);
      const newPausedRun: PausedRun = {
        ...run,
        id: newId,
        timestamp: new Date(),
      };

      if (existingIndex >= 0) {
        const newRuns = [...prev];
        newRuns[existingIndex] = newPausedRun;
        return newRuns;
      }
      return [newPausedRun, ...prev];
    });

    return newId;
  }, []);

  const deletePausedRun = useCallback((id: string) => {
    setPausedRuns((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getPausedRun = useCallback((id: string) => {
    return pausedRuns.find((r) => r.id === id);
  }, [pausedRuns]);

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

      let newStreak = 1;
      if (prev.lastCompletedDate === yesterdayStr) {
        newStreak = prev.currentStreak + 1;
      }

      return {
        ...prev,
        currentStreak: newStreak,
        lastCompletedDate: today,
        history: {
          ...prev.history,
          [today]: "completed",
        },
      };
    });
  }, []);

  const buyFreezer = useCallback(() => {
    if (diamonds >= 100) {
      setDiamonds((prev) => prev - 100);
      setStreak((prev) => ({
        ...prev,
        freezers: prev.freezers + 1,
      }));
      return true;
    }
    return false;
  }, [diamonds]);

  const value: StoreContextValue = {
    quizzes,
    runs,
    pausedRuns,
    settings,
    streak,
    diamonds,
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
    savePausedRun,
    deletePausedRun,
    getPausedRun,
    updateSettings,
    updateStreak,
    buyFreezer,
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
