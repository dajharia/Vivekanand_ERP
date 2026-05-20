"use client";
import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Loader2, X, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SubjectsManagement() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [term1Max, setTerm1Max] = useState(50);
  const [term2Max, setTerm2Max] = useState(50);
  const [theoryMax, setTheoryMax] = useState(60);
  const [practicalMax, setPracticalMax] = useState(40);

  // 1. कक्षाएं (Classes) लाएं
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/classes/`);
        if (res.ok) {
          const data = await res.json();
          setClasses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("कक्षाओं को फेच करने में त्रुटि:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // 2. चुनी गई कक्षा के विषय (Subjects) लाएं
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const res = await fetch(`${API_BASE_URL}/exams/class-subjects/${selectedClass}`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(Array.isArray(data) ? data : []);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("विषयों को फेच करने में त्रुटि:", error);
        setSubjects([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // 3. नया विषय जोड़ें
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !selectedClass) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/exams/map-subject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: parseInt(selectedClass),
          subject_name: newSubject.trim(),
          term1_max: parseFloat(term1Max) || 0,
          term2_max: parseFloat(term2Max) || 0,
          theory_max: parseFloat(theoryMax) || 0,
          practical_max: parseFloat(practicalMax) || 0
        }),
      });

      if (res.ok) {
        const addedSubject = await res.json();
        // चेक करें कि विषय पहले से लिस्ट में मौजूद तो नहीं है (Duplicate से बचने के लिए)
        if (!subjects.find(sub => sub.id === addedSubject.id)) {
          setSubjects([...subjects, addedSubject]); 
        }
        setNewSubject("");
        setIsModalOpen(false);
      } else {
        const err = await res.json();
        alert("❌ त्रुटि: " + (err.detail || "विषय जोड़ने में विफल!"));
      }
    } catch (err) {
      alert("🚨 सर्वर से संपर्क विफल!");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. विषय हटाएं (Delete Subject)
  const handleDeleteSubject = async (subjectId) => {
    if (!confirm("क्या आप वाकई इस विषय को हटाना चाहते हैं?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/exams/class-subjects/${selectedClass}/${subjectId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSubjects(subjects.filter(sub => sub.id !== subjectId));
      } else {
        alert("❌ डिलीट करने में विफल!");
      }
    } catch (err) {
      alert("🚨 सर्वर से संपर्क विफल!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-heading dark:text-white">Subjects Management</h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full md:w-64 p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-[#1B2559] dark:text-white outline-none focus:ring-2 focus:ring-[#4318FF] shadow-sm"
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            disabled={!selectedClass} 
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4318FF] text-white rounded-xl shadow-md hover:bg-blue-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Add Subject
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 overflow-hidden min-h-[400px] p-6 transition-colors">
        {!selectedClass ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 pt-20">
            <Book size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">Please select a class to view or manage subjects.</p>
          </div>
        ) : isLoadingSubjects ? (
          <div className="flex justify-center items-center pt-20 text-[#4318FF]">
            <Loader2 size={40} className="animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 pt-20">
            <AlertCircle size={48} className="mb-4 opacity-50 text-orange-400" />
            <p className="text-lg font-medium">No subjects mapped for this class yet.</p>
            <p className="text-sm mt-1">Click "Add Subject" to map subjects (e.g., Hindi, English).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((sub, index) => (
              <div key={sub.id || index} className="flex items-center justify-between p-4 bg-background-light dark:bg-slate-800 rounded-2xl border border-transparent hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm font-black">
                    {index + 1} 
                  </div>
                  <div>
                  <p className="font-bold text-[#1B2559] dark:text-white">{sub.subject_name || sub.name || "Unknown Subject"}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">T1: 50 | T2: 50 | Th: {sub.max_theory_marks ?? 100} | Pr: {sub.max_practical_marks ?? 0}</p>
                  </div>
                </div>
              <button onClick={() => handleDeleteSubject(sub.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
              <h3 className="text-lg font-bold text-heading dark:text-white">Add New Subject</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-danger transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6">
              <label className="block text-xs font-bold mb-2 uppercase text-gray-500">Subject Name</label>
              <input autoFocus value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required placeholder="e.g., Mathematics" className="w-full p-3.5 border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#4318FF] mb-4" />
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Term 1 Max</label>
                  <input type="number" value={term1Max} onChange={(e) => setTerm1Max(e.target.value)} required className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#4318FF] text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Term 2 Max</label>
                  <input type="number" value={term2Max} onChange={(e) => setTerm2Max(e.target.value)} required className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#4318FF] text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Annual Theory Max</label>
                  <input type="number" value={theoryMax} onChange={(e) => setTheoryMax(e.target.value)} required className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#4318FF] text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase text-gray-500">Annual Practical Max</label>
                  <input type="number" value={practicalMax} onChange={(e) => setPracticalMax(e.target.value)} required className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#4318FF] text-sm" />
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
                {isSaving ? <Loader2 size={20} className="animate-spin"/> : "Save Subject"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
