"use client";
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar as CalendarIcon, CheckCircle, Save, Loader2, Lock } from 'lucide-react'; // Lock आइकॉन जोड़ा गया
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'staff'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // आज की तारीख
  
  // 14 डिफ़ॉल्ट क्लासेस का फॉलबैक
  const fallbackStaticClasses = [
    { id: 901, name: "LKG", section: "A" },
    { id: 902, name: "UKG", section: "A" },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Class ${i + 1}`,
      section: "A"
    }))
  ];

  const [classes, setClasses] = useState(fallbackStaticClasses);
  const [selectedClass, setSelectedClass] = useState(fallbackStaticClasses[0].id);
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Staff Tab Security States
  const [isStaffUnlocked, setIsStaffUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  // क्लासेस फेच करें
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/classes/`);
        if (!res.ok) throw new Error("HTTP Error");
        const data = await res.json();
        
        let combinedClasses = JSON.parse(JSON.stringify(fallbackStaticClasses));
        if (data && Array.isArray(data) && data.length > 0) {
          data.forEach(dbClass => {
            let dbClassName = dbClass.name || dbClass.class_name;
            
            // यदि DB से केवल नंबर (उदा. "1", "2") आ रहा है, तो उसे "Class 1" में बदल दें ताकि डुप्लीकेट न बने
            if (!isNaN(dbClassName) && dbClassName.trim() !== '') {
              dbClassName = `Class ${dbClassName.trim()}`;
            }

            const existingIndex = combinedClasses.findIndex(c => c.name === dbClassName);
            if (existingIndex !== -1) {
              combinedClasses[existingIndex].id = dbClass.id;
            } else {
              combinedClasses.push({ ...dbClass, name: dbClassName });
            }
          });
        }
        setClasses(combinedClasses);
        setSelectedClass(combinedClasses[0].id);
      } catch (err) {
        console.error("Classes fetch error:", err);
        setClasses(fallbackStaticClasses);
        setSelectedClass(fallbackStaticClasses[0].id);
      }
    };
    loadClasses();
  }, []);

  // डेटा फेच करें जब तारीख, टैब या क्लास बदले
  useEffect(() => {
    if (activeTab === 'students' && selectedClass) {
      fetchStudentAttendance();
    } else if (activeTab === 'staff') {
      fetchStaffAttendance();
    }
  }, [activeTab, selectedClass, date]);

  const fetchStudentAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/students/${selectedClass}?date_val=${date}`);
      if (res.ok) {
        const data = await res.json();
        const recordsData = Array.isArray(data) ? data : [];
        setRecords(recordsData);
        setOriginalRecords(JSON.parse(JSON.stringify(recordsData)));
      } else {
        setRecords([]);
        setOriginalRecords([]);
      }
    } catch (error) { console.error(error); setRecords([]); setOriginalRecords([]); }
    finally { setIsLoading(false); }
  };

  const fetchStaffAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/staff/?date_val=${date}`);
      if (res.ok) {
        const data = await res.json();
        const recordsData = Array.isArray(data) ? data : [];
        setRecords(recordsData);
        setOriginalRecords(JSON.parse(JSON.stringify(recordsData)));
      } else {
        setRecords([]);
        setOriginalRecords([]);
      }
    } catch (error) { console.error(error); setRecords([]); setOriginalRecords([]); }
    finally { setIsLoading(false); }
  };

  // वन-टैप स्टेटस चेंज हैंडलर
  const handleStatusChange = (id, newStatus) => {
    setRecords(records.map(rec => {
      const recId = activeTab === 'students' ? rec.student_id : rec.staff_id;
      if (recId === id) {
        return { ...rec, status: newStatus };
      }
      return rec;
    }));
  };

  // डेटाबेस में सेव करें
  const handleSave = async () => {
    setIsSaving(true);
    const endpoint = activeTab === 'students' ? `students/?date_val=${date}` : `staff/?date_val=${date}`;
    
    // पेलोड तैयार करें
    const payload = records.map(rec => {
      if (activeTab === 'students') return { student_id: rec.student_id, class_id: selectedClass, status: rec.status };
      return { staff_id: rec.staff_id, status: rec.status };
    });

    try {
      const res = await fetch(`${API_BASE_URL}/attendance/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("अटेंडेंस सफलतापूर्वक सेव हो गई!");
        if (activeTab === 'students') {
          fetchStudentAttendance();
        } else {
          fetchStaffAttendance();
        }
      } else {
        toast.error("डेटा सेव करने में त्रुटि आई।");
      }
    } catch (err) {
      toast.error("सर्वर से संपर्क नहीं हो पाया।");
    }
    setIsSaving(false);
  };

  // Tab Switch Handler with Security
  const handleTabClick = (tab) => {
    if (tab === 'staff' && !isStaffUnlocked) {
      setShowPinModal(true); // लॉक होने पर PIN मांगें
    } else {
      setActiveTab(tab);
    }
  };

  const handlePinSubmit = () => {
    if (pin === '1234') { // यहाँ आप अपना प्रिंसिपल पासवर्ड सेट कर सकते हैं
      setIsStaffUnlocked(true);
      setActiveTab('staff');
      setShowPinModal(false);
      setPin('');
    } else {
      toast.error('गलत PIN! एक्सेस ठुकरा दिया गया।');
    }
  };

  const isAlreadyMarked = originalRecords.some(r => r.is_marked);
  const hasChanges = JSON.stringify(records) !== JSON.stringify(originalRecords);
  const isButtonDisabled = isSaving || records.length === 0 || (isAlreadyMarked && !hasChanges);

  // अटेंडेंस समरी की गणना
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const leaveCount = records.filter(r => r.status === 'Leave').length;

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1B2559] dark:text-white">Daily Attendance</h2>
      </div>

      {/* Type Toggle Tabs */}
      <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-6 w-full max-w-sm border border-gray-100 dark:border-slate-700">
        <button onClick={() => handleTabClick('students')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'students' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <Users size={18} className={activeTab === 'students' ? 'text-white' : 'text-gray-500'} /> Students
        </button>
        <button onClick={() => handleTabClick('staff')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'staff' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <UserCheck size={18} className={activeTab === 'staff' ? 'text-white' : 'text-gray-500'} /> Staff
          {!isStaffUnlocked && <Lock size={14} className="ml-1 opacity-60" />}
        </button>
      </div>

      {/* Control Bar (Date & Class Selector) */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-heading dark:text-white outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {activeTab === 'students' && (
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-[#1B2559] dark:text-white outline-none focus:ring-2 focus:ring-[#4318FF]">
              {classes.map((c, index) => ( 
                <option key={`class-${c.id}-${index}`} value={c.id}>{c.name || c.class_name} {c.section !== 'A' ? `(${c.section})` : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Attendance List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
          <h3 className="font-bold text-[#1B2559] dark:text-white flex items-center gap-2">
            <CheckCircle size={18} className="text-success" />
            Mark Attendance
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs font-bold bg-[#E9EDF7] dark:bg-slate-700 text-[#4318FF] px-2 sm:px-3 py-1 rounded-full">Total: {records.length}</span>
            <span className="text-[10px] sm:text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 sm:px-3 py-1 rounded-full">P: {presentCount}</span>
            <span className="text-[10px] sm:text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 px-2 sm:px-3 py-1 rounded-full">A: {absentCount}</span>
            <span className="text-[10px] sm:text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 sm:px-3 py-1 rounded-full">L: {leaveCount}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 flex justify-center text-[#4318FF]"><Loader2 size={32} className="animate-spin" /></div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-medium">
            {activeTab === 'students' 
              ? "इस क्लास में कोई छात्र नहीं मिला। कृपया पहले छात्र का एडमिशन करें।" 
              : "कोई स्टाफ/टीचर नहीं मिला। कृपया पहले 'Staff Management' मेनू से टीचर्स को रजिस्टर करें।"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {records.map((rec, index) => {
              const id = activeTab === 'students' ? rec.student_id : rec.staff_id;
              // यदि id मौजूद नहीं है (टैब बदलने के दौरान), तो index का उपयोग करें
              const uniqueKey = id ? `${activeTab}-${id}` : `temp-${index}`;
              return (
                <div key={uniqueKey} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-[#1B2559] dark:text-white text-lg">{rec.name}</p>
                    <p className="text-xs font-bold text-gray-400">
                      {activeTab === 'students' ? `Roll No: ${rec.roll_no}` : `Desig: ${rec.designation}`}
                    </p>
                  </div>

                  {/* One-Tap Buttons (P / A / L) */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusChange(id, 'Present')}
                      className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-xl font-bold text-sm transition-all border-2 ${rec.status === 'Present' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-105' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-transparent dark:hover:bg-emerald-900/40'}`}
                    > 
                      P
                    </button>
                    <button 
                      onClick={() => handleStatusChange(id, 'Absent')}
                      className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-xl font-bold text-sm transition-all border-2 ${rec.status === 'Absent' ? 'bg-red-500 text-white border-red-500 shadow-md scale-105' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-transparent dark:hover:bg-red-900/40'}`}
                    > 
                      A
                    </button>
                    <button 
                      onClick={() => handleStatusChange(id, 'Leave')}
                      className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-xl font-bold text-sm transition-all border-2 ${rec.status === 'Leave' ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-transparent dark:hover:bg-amber-900/40'}`}
                    > 
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Save Button For Mobile / Bottom Fixed on Desktop */}
      <div className="fixed bottom-4 left-4 right-4 md:static md:mt-6 z-50">
        <button 
          onClick={handleSave} 
          disabled={isButtonDisabled}
          className="w-full md:w-auto px-8 py-4 bg-[#4318FF] text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition-all disabled:bg-gray-400 disabled:shadow-none"
        >
          {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          {isSaving ? "Saving..." : (isAlreadyMarked ? "Update Attendance" : "Save Attendance")}
        </button>
      </div>

      {/* Security PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 transform scale-100 transition-transform">
            <div className="bg-[#111C44] p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md text-white">
                <Lock size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Principal Access</h3>
              <p className="text-white/60 text-xs">Enter PIN to access Staff Attendance</p>
            </div>
            <div className="p-6">
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="Enter PIN (1234)" 
                className="w-full p-4 bg-gray-50 dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-xl text-center text-2xl font-black tracking-[0.5em] mb-6 outline-none focus:border-[#4318FF] transition-colors"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => {setShowPinModal(false); setPin('');}} className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button> 
                <button onClick={handlePinSubmit} className="flex-1 py-3.5 bg-[#4318FF] text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors">Unlock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}