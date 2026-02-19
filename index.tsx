
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  BrainCircuit, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  ArrowRight,
  CheckCircle2,
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

// 1. Splash Screen Component (Strictly "JS STUDY" only)
const SplashScreen: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #000000 100%)', // Premium Dark
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      flexDirection: 'column'
    }}>
      <div style={{
        animation: 'fadeReveal 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        opacity: 0,
        transform: 'translateY(10px)'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '900',
          letterSpacing: '0.15em',
          margin: 0,
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          textShadow: '0 10px 30px rgba(255,255,255,0.1)'
        }}>
          JS STUDY
        </h1>
      </div>
      <style>{`
        @keyframes fadeReveal {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  // --- State ---
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Effects ---

  // Splash Screen Logic (5 Seconds Strict)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Load data
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

  // Save data
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

  const mainStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
    backgroundColor: '#f1f5f9',
    height: '100vh',
    position: 'relative' as const
  };

  const sidebarStyle = {
    width: isSidebarOpen ? '280px' : '0',
    backgroundColor: 'white',
    height: '100vh',
    borderRight: '1px solid #e2e8f0',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const, 
    zIndex: 50,
    top: 0,
    left: 0,
    boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
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
    transition: 'background-color 0.2s'
  });

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      
      {/* Mobile Menu Button */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '16px', 
          left: '16px', 
          zIndex: 40,
          background: 'white',
          borderRadius: '12px',
          padding: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: isSidebarOpen ? 'none' : 'flex',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center'
        }} 
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={24} color="#334155" />
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 45
          }}
        />
      )}

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>JS STUDY</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>
        
        <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
          <div onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} style={navItemStyle('dashboard')}>
            <LayoutDashboard size={20} style={{ marginRight: '12px' }} />
            Dashboard
          </div>
          {currentSession && (
            <>
              <div style={{ padding: '24px 0 8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Study
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

        {/* Saved Sessions History */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase' }}>History</div>
          <div style={{ overflowY: 'auto', maxHeight: '150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sessions.map(s => (
              <div key={s.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: currentSession?.id === s.id ? '#e2e8f0' : 'white',
                border: '1px solid',
                borderColor: currentSession?.id === s.id ? '#cbd5e1' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <span 
                  style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, fontWeight: 500, color: '#334155' }}
                  onClick={() => { setCurrentSession(s); setActiveTab('summarizer'); setIsSidebarOpen(false); }}
                >
                  {s.topic}
                </span>
                <Trash2 
                  size={14} 
                  color="#ef4444" 
                  style={{ cursor: 'pointer', marginLeft: '8px', opacity: 0.7 }}
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} 
                />
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', padding: '0 4px' }}>No history yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={mainStyle}>
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '60px', paddingBottom: '40px' }}>
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#1e293b', fontWeight: 800 }}>What do you want to learn?</h1>
              <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '1.1rem' }}>Enter a topic and AI will generate a complete study guide.</p>
              
              <div style={{ display: 'flex', maxWidth: '600px', margin: '0 auto', gap: '12px', flexDirection: 'row' }}>
                <input 
                  type="text" 
                  placeholder="e.g. React Hooks, Photosynthesis..." 
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                    padding: '0 24px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    opacity: loading ? 0.7 : 1,
                    minWidth: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {loading ? (
                    <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : <Plus size={24} />}
                </button>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>

              {sessions.length > 0 && (
                <div style={{ marginTop: '60px', textAlign: 'left' }}>
                  <h3 style={{ color: '#334155', fontSize: '1.2rem', marginBottom: '20px' }}>Recent Sessions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                    {sessions.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setCurrentSession(s); setActiveTab('summarizer'); }}
                        style={{
                          backgroundColor: 'white',
                          padding: '24px',
                          borderRadius: '16px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                          cursor: 'pointer',
                          border: '1px solid #f1f5f9',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                           e.currentTarget.style.transform = 'translateY(-2px)';
                           e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                        }}
                      >
                        <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.1rem' }}>{s.topic}</h4>
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
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '10px', background: '#dbeafe', borderRadius: '12px', color: '#2563eb' }}>
                  <BookOpen size={24} />
                </div>
                <h2 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Summary</h2>
              </div>
              
              <div style={{ 
                backgroundColor: 'white', 
                padding: '32px', 
                borderRadius: '20px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                lineHeight: '1.8',
                color: '#334155',
                fontSize: '1.1rem',
                border: '1px solid #f8fafc'
              }}>
                {currentSession.summary}
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setActiveTab('flashcards')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Study Flashcards <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Flashcards View */}
          {activeTab === 'flashcards' && currentSession && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                <div style={{ padding: '10px', background: '#f3e8ff', borderRadius: '12px', color: '#9333ea' }}>
                  <BrainCircuit size={24} />
                </div>
                <h2 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Flashcards</h2>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                {currentSession.flashcards.map((card, idx) => (
                  <div key={idx} style={{ perspective: '1000px' }}>
                     <details className="flashcard-details" style={{ 
                       backgroundColor: 'white', 
                       borderRadius: '16px', 
                       boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                       overflow: 'hidden',
                       cursor: 'pointer',
                       border: '1px solid #f1f5f9'
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
                         <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#64748b' }}>Q{idx + 1}</span>
                            <span>{card.question}</span>
                         </div>
                         <ArrowRight size={16} color="#cbd5e1" style={{ transform: 'rotate(90deg)' }} />
                       </summary>
                       <div style={{ 
                         padding: '24px', 
                         borderTop: '1px solid #f1f5f9',
                         color: '#475569',
                         backgroundColor: '#f8fafc',
                         textAlign: 'left',
                         lineHeight: '1.6'
                       }}>
                         <strong style={{ color: '#2563eb' }}>Answer:</strong> {card.answer}
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
                    gap: '12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Take Quiz <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Quiz View */}
          {activeTab === 'quiz' && currentSession && (
             <div style={{ animation: 'fadeIn 0.5s ease' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '10px', background: '#dcfce7', borderRadius: '12px', color: '#16a34a' }}>
                  <CheckCircle2 size={24} />
                </div>
                <h2 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Quiz</h2>
              </div>

               <div style={{ display: 'grid', gap: '32px' }}>
                 {currentSession.quiz.map((q, qIdx) => (
                   <div key={qIdx} style={{ 
                     backgroundColor: 'white', 
                     padding: '32px', 
                     borderRadius: '20px', 
                     boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                     border: '1px solid #f1f5f9'
                   }}>
                     <h3 style={{ marginTop: 0, marginBottom: '24px', color: '#0f172a', fontSize: '1.25rem' }}>{qIdx + 1}. {q.question}</h3>
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
                             padding: '16px 20px',
                             textAlign: 'left',
                             borderRadius: '12px',
                             border: '2px solid #e2e8f0',
                             backgroundColor: 'white',
                             cursor: 'pointer',
                             fontSize: '1rem',
                             transition: 'all 0.2s',
                             color: '#475569',
                             fontWeight: 500
                           }}
                         >
                           {opt}
                         </button>
                       ))}
                     </div>
                     <div id={`expl-${qIdx}`} style={{ 
                       display: 'none', 
                       marginTop: '20px', 
                       padding: '20px', 
                       backgroundColor: '#f0f9ff', 
                       borderRadius: '12px', 
                       borderLeft: '4px solid #0ea5e9',
                       color: '#0369a1',
                       lineHeight: '1.6'
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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
