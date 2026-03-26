import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, DocumentData } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { 
  Plus, 
  LogOut, 
  LogIn, 
  Video, 
  Trash2, 
  Edit2, 
  X, 
  Clock, 
  User, 
  BookOpen, 
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const PASTEL_COLORS = [
  'bg-rose-100 border-rose-200 text-rose-800',
  'bg-blue-100 border-blue-200 text-blue-800',
  'bg-green-100 border-green-200 text-green-800',
  'bg-amber-100 border-amber-200 text-amber-800',
  'bg-purple-100 border-purple-200 text-purple-800',
  'bg-orange-100 border-orange-200 text-orange-800',
  'bg-teal-100 border-teal-200 text-teal-800',
];

interface Lesson {
  id: string;
  title: string;
  teacher: string;
  startTime: string;
  endTime: string;
  day: string;
  zoomLink: string;
  color: string;
}

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Firestore collection reference
  const lessonsRef = useMemo(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'lessons');
  }, [user]);

  const [lessonsSnapshot, lessonsLoading] = useCollection(
    lessonsRef ? query(lessonsRef, orderBy('startTime')) : null
  );

  const lessons = useMemo(() => {
    if (!lessonsSnapshot) return [];
    return lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as DocumentData)
    })) as Lesson[];
  }, [lessonsSnapshot]);

  const handleAddOrUpdateLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lessonsRef) return;

    const formData = new FormData(e.currentTarget);
    const lessonData = {
      title: formData.get('title') as string,
      teacher: formData.get('teacher') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      day: formData.get('day') as string,
      zoomLink: formData.get('zoomLink') as string,
      color: formData.get('color') as string || PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    };

    try {
      if (editingLesson) {
        await updateDoc(doc(db, 'users', user!.uid, 'lessons', editingLesson.id), lessonData);
      } else {
        await addDoc(lessonsRef, lessonData);
      }
      setIsModalOpen(false);
      setEditingLesson(null);
    } catch (err) {
      handleFirestoreError(err, editingLesson ? OperationType.UPDATE : OperationType.CREATE, 'lessons');
    }
  };

  const handleDeleteLesson = async () => {
    if (!user || !lessonToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lessons', lessonToDelete));
      setLessonToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lessons/${lessonToDelete}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7E74]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-[#E8E2D9] text-center"
        >
          <div className="bg-[#FAF7F2] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="w-10 h-10 text-[#8B7E74]" />
          </div>
          <h1 className="text-3xl font-bold text-[#4A403A] mb-2 font-serif">מערכת שעות זום</h1>
          <p className="text-[#8B7E74] mb-8">נהלי את הלימודים שלך בצורה נעימה ומסודרת</p>
          
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#E8E2D9] text-[#4A403A] py-3 px-6 rounded-xl font-semibold hover:bg-[#FAF7F2] transition-all duration-300 shadow-sm"
          >
            <LogIn className="w-5 h-5" />
            התחברי עם Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#4A403A] font-sans selection:bg-[#E8E2D9]" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#E8E2D9] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF7F2] p-2 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-[#8B7E74]" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif">המערכת שלי</h1>
              <p className="text-xs text-[#8B7E74]">{user.displayName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingLesson(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#8B7E74] text-white px-4 py-2 rounded-xl hover:bg-[#766A62] transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              שיעור חדש
            </button>
            <button
              onClick={logout}
              className="p-2 text-[#8B7E74] hover:bg-[#FAF7F2] rounded-xl transition-colors"
              title="התנתקות"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {lessonsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7E74]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {DAYS.map((day) => (
              <div key={day} className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[#8B7E74] border-b-2 border-[#E8E2D9] pb-2 px-2">
                  יום {day}
                </h2>
                <div className="flex flex-col gap-4">
                  {lessons
                    .filter((l) => l.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((lesson) => (
                      <motion.div
                        layout
                        key={lesson.id}
                        className={cn(
                          "p-4 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md group relative",
                          lesson.color
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight">{lesson.title}</h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingLesson(lesson);
                                setIsModalOpen(true);
                              }}
                              className="p-1 hover:bg-black/5 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setLessonToDelete(lesson.id)}
                              className="p-1 hover:bg-black/5 rounded text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 opacity-80">
                            <User className="w-3.5 h-3.5" />
                            <span>{lesson.teacher}</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-80">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{lesson.startTime} - {lesson.endTime}</span>
                          </div>
                        </div>

                        <a
                          href={lesson.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 w-full flex items-center justify-center gap-2 bg-white/50 hover:bg-white/80 py-2 rounded-xl font-bold transition-colors border border-black/5"
                        >
                          <Video className="w-4 h-4" />
                          כניסה לזום
                        </a>
                      </motion.div>
                    ))}
                  {lessons.filter((l) => l.day === day).length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-[#E8E2D9] rounded-2xl text-[#B4ADA3] text-sm italic">
                      אין שיעורים
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
                <h2 className="text-xl font-bold font-serif">
                  {editingLesson ? 'עריכת שיעור' : 'הוספת שיעור חדש'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-[#E8E2D9] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdateLesson} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8B7E74] mr-1">שם השיעור</label>
                    <div className="relative">
                      <BookOpen className="absolute right-3 top-3 w-4 h-4 text-[#B4ADA3]" />
                      <input
                        required
                        name="title"
                        defaultValue={editingLesson?.title}
                        className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none"
                        placeholder="למשל: מבוא לכלכלה"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8B7E74] mr-1">שם המרצה</label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 w-4 h-4 text-[#B4ADA3]" />
                      <input
                        required
                        name="teacher"
                        defaultValue={editingLesson?.teacher}
                        className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none"
                        placeholder="למשל: ד״ר כהן"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8B7E74] mr-1">יום</label>
                    <select
                      required
                      name="day"
                      defaultValue={editingLesson?.day || DAYS[0]}
                      className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none appearance-none"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8B7E74] mr-1">שעת התחלה</label>
                    <div className="relative">
                      <Clock className="absolute right-3 top-3 w-4 h-4 text-[#B4ADA3]" />
                      <input
                        required
                        type="text"
                        name="startTime"
                        maxLength={5}
                        placeholder="10:30"
                        defaultValue={editingLesson?.startTime}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            val = val.slice(0, 2) + ':' + val.slice(2, 4);
                          }
                          e.target.value = val;
                        }}
                        className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8B7E74] mr-1">שעת סיום</label>
                    <div className="relative">
                      <Clock className="absolute right-3 top-3 w-4 h-4 text-[#B4ADA3]" />
                      <input
                        required
                        type="text"
                        name="endTime"
                        maxLength={5}
                        placeholder="12:00"
                        defaultValue={editingLesson?.endTime}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            val = val.slice(0, 2) + ':' + val.slice(2, 4);
                          }
                          e.target.value = val;
                        }}
                        className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B7E74] mr-1">קישור זום</label>
                  <div className="relative">
                    <ExternalLink className="absolute right-3 top-3 w-4 h-4 text-[#B4ADA3]" />
                    <input
                      required
                      type="url"
                      name="zoomLink"
                      defaultValue={editingLesson?.zoomLink}
                      className="w-full pr-10 pl-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl focus:ring-2 focus:ring-[#8B7E74] focus:outline-none"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#8B7E74] mr-1">צבע</label>
                  <div className="flex flex-wrap gap-2">
                    {PASTEL_COLORS.map((c) => (
                      <label key={c} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={c}
                          defaultChecked={editingLesson?.color === c}
                          className="hidden peer"
                        />
                        <div className={cn(
                          "w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-[#4A403A] peer-checked:scale-110 transition-all",
                          c.split(' ')[0]
                        )} />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#8B7E74] text-white py-3 rounded-xl font-bold hover:bg-[#766A62] transition-colors shadow-lg mt-4"
                >
                  {editingLesson ? 'עדכון שיעור' : 'שמירת שיעור'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {lessonToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLessonToDelete(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#4A403A] mb-2">מחיקת שיעור</h3>
              <p className="text-[#8B7E74] mb-6">האם את בטוחה שברצונך למחוק את השיעור? פעולה זו אינה ניתנת לביטול.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setLessonToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold border border-[#E8E2D9] hover:bg-[#FAF7F2] transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleDeleteLesson}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
                >
                  מחיקה
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <X className="w-5 h-5" />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}
