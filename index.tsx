
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  BrainCircuit, 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  Save, 
  Trash2, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  Clock,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface StudySession {
  id: string;
  topic: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  timestamp: number;
}

type Tab = 'dashboard' | 'summarizer' | 'flashcards' | 'quiz' | 'chat';

// --- Components ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load data from local storage
  useEffect(() => {
    const saved = localStorage.getItem('study_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
  }, []);

  // Save data to local storage
  useEffect(() => {
    localStorage.setItem('study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const generateStudyMaterial = async (inputTopic: string) => {
    if (!inputTopic.trim()) return;
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Generate a comprehensive study package for the topic: "${inputTopic}". 
      Include:
      1. A concise, easy-to-understand summary.
      2. 5 high-quality flashcards (Question/Answer).
      3. 5 multiple-choice quiz questions with options and explanations.
      
      Format the output as a clean JSON object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctAnswer", "explanation"]
                }
              }
            },
            required: ["summary", "flashcards", "quiz"]
          }
        }
      });

      const result = JSON.parse(response.text);
      const newSession: StudySession = {
        id: Date.now().toString(),
        topic: inputTopic,
        summary: result.summary,
        flashcards: result.flashcards,
        quiz: result.quiz,
        timestamp: Date.now()
      };

      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setActiveTab('summarizer');
    } catch (error) {
      console.error("Study generation failed", error);
      alert("Something went wrong generating your study material. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    if (current