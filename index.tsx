
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  BrainCircuit, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  Trash2, 
  ArrowRight,
  CheckCircle2,
  XCircle,
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

// 1. Splash Screen Component
const SplashScreen: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Deep modern blue/black
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: '#ffffff',
    }}>
      <div style={{
        animation: 'fadeInUp 1s ease-out forwards'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          letterSpacing: '4px',
          margin: 0,
          textShadow: '0 4px 6px rgba(0,0,0,0.3)',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          JS STUDY
        </h1>
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

constconst App: React.FC = () => {
  // --- State ---
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  // --- Effects ---

  // Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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

  // --- Logic ---

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
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setActiveTab('dashboard');
    }
  };

  // --- Render Helpers ---

  if (showSplash) {
    return <SplashScreen />;
  }

  // Basic layout styles
  const mainStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
    backgroundColor: '#f1f5f9',
    height: '100vh'
  };

  const sidebarStyle = {
    width: isSidebarOpen ? '260px' : '0',
    backgroundColor: 'white',
    height: '100vh',
    borderRight: '1px solid #e2e8f0',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const, // Fixed for mobile behavior
    zIndex: 50,
    top: 0,
    left: 0,
    boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
  };

  const navItemStyle = (tab: Tab) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: activeTab === tab ? '#eff6ff' : 'transparent',
    color: activeTab === tab ? '#2563eb' : '#64748b',
    borderRadius: '8px',
    marginBottom: '4px',
    fontWeight: activeTab === tab ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      
      {/* Mobile Menu Button */}
      <div style={{ 
        position: 'fixed', 
        top: '16px', 
        left: '16px', 
        zIndex: 60,
        background: 'white',
        borderRadius: '50%',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: isSidebarOpen ? 'none' : 'block',
        cursor: 'pointer'
      }} onClick={() => setIsSidebarOpen(true)}>
        <Menu size={24} color="#334155" />
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40
          }}
        />
      )}

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>JS STUDY</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>
        
        <div style={{ padding: '0 16px', flex: 1 }}>
          <div onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} style={navItemStyle('dashboard')}>
            <LayoutDashboard size={20} style={{ marginRight: '12px' }} />
            Dashboard
          </div>
          {currentSession && (
            <>
              <div style={{ padding: '16px 0 8px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Current Topic
              </div>
              <div onClick={() => { setActiveTab('summarizer'); setIsSidebarOpen(false); }} style={navItemStyle('summarizer')}>
                <BookOpen size={20} style={{ marginRight: '12px' }} />
                Summary
              </div>
              <div onClick={() => { setActiveTab('flashcards'); setIsSidebarOpen(false); }} style={navItemStyle('flashcards')}>
                <BrainCircuit size={20} style={{ marginRight: '12px' }} />
                Flashcards
              </div>
              <div onClick={() => { setActiveTab('quiz'); setIsSidebarOpen(false); }} style={navItemStyle('quiz')}>
                <CheckCircle2 size={20} style={{ marginRight: '12px' }} />
                Quiz
              </div>
            </>
          )}
        </div>

        {/* Saved Sessions List (Mini) */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', maxHeight: '30%' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>HISTORY</div>
          <div style={{ overflowY: 'auto', maxHeight: '150px' }}>
            {sessions.map(s => (
              <div key={s.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: '4px',
                backgroundColor: currentSession?.id === s.id ? '#f1f5f9' : 'transparent'
              }}>
                <span 
                  style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}
                  onClick={() => { setCurrentSession(s); setActiveTab('summarizer'); setIsSidebarOpen(false); }}
                >
                  {s.topic}
                </span>
                <Trash2 
                  size={14} 
                  color="#ef4444" 
                  style={{ cursor: 'pointer', marginLeft: '8px' }}
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={mainStyle}>
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#1e293b' }}>What do you want to learn?</h1>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Enter a topic and AI will generate a complete study guide.</p>
              
              <div style={{ display: 'flex', maxWidth: '500px', margin: '0 auto', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. React Hooks, Photosynthesis, World War II..." 
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        // @ts-ignore
                        generateStudyMaterial(e.target.value);
                    }
                  }}
                />
                <button 
                  onClick={() => {
                      const input = document.querySelector('input');
                      if (input) generateStudyMaterial(input.value);
                  }}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Generating...' : <Plus size={20} />}
                </button>
              </div>

              {sessions.length > 0 && (
                <div style={{ marginTop: '60px', textAlign: 'left' }}>
                  <h3 style={{ color: '#334155' }}>Recent Study Sessions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {sessions.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setCurrentSession(s); setActiveTab('summarizer'); }}
                        style={{
                          backgroundColor: 'white',
                          padding: '20px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{s.topic}</h4>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {new Date(s.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary View */}
          {activeTab === 'summarizer' && currentSession && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '24px' }}>Summary: {currentSession.topic}</h2>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '32px', 
                borderRadius: '16px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                lineHeight: '1.7',
                color: '#334155',
                fontSize: '1.1rem'
              }}>
                {currentSession.summary}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setActiveTab('flashcards')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Study Flashcards <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Flashcards View */}
          {activeTab === 'flashcards' && currentSession && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '24px' }}>Flashcards</h2>
              <div style={{ display: 'grid', gap: '24px' }}>
                {currentSession.flashcards.map((card, idx) => (
                  <div key={idx} style={{ perspective: '1000px' }}>
                     <details style={{ 
                       backgroundColor: 'white', 
                       borderRadius: '16px', 
                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                       overflow: 'hidden',
                       cursor: 'pointer'
                     }}>
                       <summary style={{ 
                         padding: '24px', 
                         fontWeight: 600, 
                         color: '#1e293b',
                         fontSize: '1.1rem',
                         listStyle: 'none',
                         display: 'flex',
                         justifyContent: 'space-between',
                         alignItems: 'center'
                       }}>
                         <span>Q{idx + 1}: {card.question}</span>
                         <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to flip</span>
                       </summary>
                       <div style={{ 
                         padding: '24px', 
                         borderTop: '1px solid #f1f5f9',
                         color: '#475569',
                         backgroundColor: '#f8fafc',
                         textAlign: 'left'
                       }}>
                         <strong>Answer:</strong> {card.answer}
                       </div>
                     </details>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setActiveTab('quiz')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Take Quiz <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Quiz View */}
          {activeTab === 'quiz' && currentSession && (
             <div>
               <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '24px' }}>Quiz: Test Your Knowledge</h2>
               <div style={{ display: 'grid', gap: '32px' }}>
                 {currentSession.quiz.map((q, qIdx) => (
                   <div key={qIdx} style={{ 
                     backgroundColor: 'white', 
                     padding: '24px', 
                     borderRadius: '16px', 
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                   }}>
                     <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#0f172a' }}>{qIdx + 1}. {q.question}</h3>
                     <div style={{ display: 'grid', gap: '12px' }}>
                       {q.options.map((opt, oIdx) => (
                         <button 
                           key={oIdx}
                           onClick={(e) => {
                             const btn = e.currentTarget;
                             const isCorrect = opt === q.correctAnswer;
                             const explanationDiv = document.getElementById(`expl-${qIdx}`);
                             
                             // Visual feedback
                             if (isCorrect) {
                               btn.style.backgroundColor = '#dcfce7';
                               btn.style.borderColor = '#22c55e';
                               btn.style.color = '#15803d';
                             } else {
                               btn.style.backgroundColor = '#fee2e2';
                               btn.style.borderColor = '#ef4444';
                               btn.style.color = '#b91c1c';
                             }
                             
                             if (explanationDiv) explanationDiv.style.display = 'block';
                           }}
                           style={{
                             padding: '16px',
                             textAlign: 'left',
                             borderRadius: '8px',
                             border: '2px solid #e2e8f0',
                             backgroundColor: 'white',
                             cursor: 'pointer',
                             fontSize: '1rem',
                             transition: 'all 0.2s'
                           }}
                         >
                           {opt}
                         </button>
                       ))}
                     </div>
                     <div id={`expl-${qIdx}`} style={{ 
                       display: 'none', 
                       marginTop: '16px', 
                       padding: '16px', 
                       backgroundColor: '#f0f9ff', 
                       borderRadius: '8px', 
                       borderLeft: '4px solid #0ea5e9',
                       color: '#0369a1'
                     }}>
                       <strong>Explanation:</strong> {q.explanation}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
