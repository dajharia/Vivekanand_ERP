"use client";
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, UserCheck, ChevronRight, X, Settings, Edit, Trash2, Book, FileText, Camera, CheckCircle, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Classes() {
  // 1. स्टेट्स (States)
  const [classesData, setClassesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manageClass, setManageClass] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [showLeaveUI, setShowLeaveUI] = useState(false);
  const [leaveData, setLeaveData] = useState({ studentName: '', photo: null, preview: null });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // 2. बैकएंड से डेटा लाना (GET Request)
  const fetchClasses = async () => {
    try {
      const [classesRes, staffRes] = await Promise.all([
        fetch(`${API_BASE_URL}/classes/`),
        fetch(`${API_BASE_URL}/staff/`)
      ]);
      
      let fetchedClasses = [];
      if (classesRes.ok) {
        const data = await classesRes.json();
        fetchedClasses = Array.isArray(data) ? data : [];
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(Array.isArray(staffData) ? staffData : []);
      }

      // हर एक क्लास के लिए आज की अटेंडेंस का डेटा लाएं (Present काउंट करने के लिए)
      if (fetchedClasses.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const classesWithAttendance = await Promise.all(
          fetchedClasses.map(async (cls) => {
            try {
              const attRes = await fetch(`${API_BASE_URL}/attendance/students/${cls.id}?date_val=${today}`);
              if (attRes.ok) {
                const attData = await attRes.json();
                // केवल उन्हीं छात्रों को गिनें जिनकी अटेंडेंस 'is_marked' true है और 'status' Present है
                const presentCount = attData.filter(r => r.is_marked && r.status === 'Present').length;
                return { ...cls, present_today: presentCount };
              }
            } catch (e) {
              console.error("Attendance fetch error for class", cls.id, e);
            }
            return { ...cls, present_today: 0 };
          })
        );
        setClassesData(classesWithAttendance);
      } else {
        setClassesData([]);
      }
    } catch (error) {
      console.error("डेटा लाने में त्रुटि:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // टीचर के नाम से उसका photo_url ढूँढने का हेल्पर फंक्शन
  const getTeacherPhoto = (teacherName) => {
    if (!teacherName || teacherName.trim() === "" || teacherName === "Not Assigned") return null;
    
    const searchName = teacherName.trim().toLowerCase();
    const teacher = staffList.find(staff => {
      const fName = (staff.first_name || "").trim().toLowerCase();
      const lName = (staff.last_name || "").trim().toLowerCase();
      const fullName = `${fName} ${lName}`.trim();
      
      return fullName === searchName || fName === searchName || searchName.includes(fName);
    });
    return teacher ? teacher.photo_url : null;
  };

  // 3. नया क्लास सेव करने का फंक्शन (POST Request)
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const classInfo = {
      name: formData.get("name"),
      section: formData.get("section"),
      teacher: formData.get("teacher"),
      room: formData.get("room"),
      capacity: parseInt(formData.get("capacity")) || 40
    };

    try {
      const res = await fetch(`${API_BASE_URL}/classes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classInfo),
      });

      if (res.ok) {
        toast.success("कक्षा सफलतापूर्वक जोड़ी गई!");
        setIsModalOpen(false); // फॉर्म बंद करें
        fetchClasses(); // लिस्ट रिफ्रेश करें
      } else {
        const err = await res.json();
        toast.error("एरर: " + (err.detail || "त्रुटि!"));
      }
    } catch (err) {
      toast.error("सर्वर से संपर्क विफल! (CORS या IP चेक करें)");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-heading dark:text-white">Classes Overview</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold"
        >
          + Add New Class
        </button>
      </div>

      {/* Main Content */}
{isLoading ? (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
    <p className="font-medium text-gray-500">Loading classes...</p>
  </div>
) : classesData.length === 0 ? (
  <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-20 text-center border border-dashed border-gray-300 dark:border-slate-700">
    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
    <p className="text-gray-500 font-medium">No classes found. Please add your first class.</p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 print:grid-cols-2">
    {classesData.map((cls) => (
      <div key={cls.id} className="bg-white dark:bg-background-dark p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden">
        
        {/* Top Header & Class Identity */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-background-light dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-heading dark:text-white leading-none mb-1.5">
                {cls.name} <span className="text-[#4318FF]/40 px-1">|</span> {cls.section}
              </h3>
              <p className="text-[10px] text-text-secondary dark:text-text-dark font-bold uppercase tracking-wider">Class Info</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Room No.</span>
            <span className="bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/50">
              {cls.room || 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Stats Info Block */}
        <div className="space-y-4">
          {/* Class Teacher */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md">
            {(() => {
              const photoUrl = getTeacherPhoto(cls.teacher);
              return photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={cls.teacher} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${cls.teacher}&background=4318FF&color=fff`; }} 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary font-bold text-lg uppercase shadow-sm border-2 border-white dark:border-slate-700">
                  {cls.teacher && cls.teacher !== 'Not Assigned' ? cls.teacher.charAt(0) : <UserCheck size={20} className="text-primary dark:text-primary-light"/>}
                </div>
              );
            })()}
            <div className="flex-1">
              <p className="text-[10px] text-primary dark:text-blue-400 font-black uppercase tracking-wider mb-1">Class Teacher</p>
              <p className="text-lg font-bold text-heading dark:text-gray-100 leading-tight">
                {cls.teacher || 'Not Assigned'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Registered Students */}
            <div className="p-3 bg-success/10 dark:bg-success/10 rounded-2xl">
              <p className="text-[10px] text-emerald-600/70 font-bold uppercase mb-1">Registered</p>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-500" />
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{cls.students}</span>
              </div>
            </div>

            {/* Today's Attendance (Placeholder) */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl">
              <p className="text-[10px] text-orange-600/70 font-bold uppercase mb-1">Present Today</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-lg font-black text-orange-700 dark:text-orange-400">{cls.present_today || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div onClick={() => setManageClass(cls)} className="mt-6 pt-4 border-t border-border-light dark:border-border-dark flex justify-between items-center text-primary font-bold text-sm cursor-pointer hover:text-blue-700 group/btn">
          Manage Class
          <div className="w-8 h-8 rounded-full bg-background-light dark:bg-slate-800 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
            <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>
    ))}
  </div>
)}

      {/* 4. Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border-light dark:border-border-dark">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-background-light dark:bg-background-dark">
              <h3 className="text-lg font-bold text-heading dark:text-heading-dark">Create New Class</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24}/>
              </button>
            </div>
            
            <form onSubmit={handleClassSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-text-secondary dark:text-text-dark">Class Name</label>
                  <input name="name" required placeholder="e.g. 10th" className="w-full p-3 border rounded-xl bg-background-light dark:bg-background-darker dark:border-border-dark text-heading dark:text-text-darker" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-text-secondary dark:text-text-dark">Section</label>
                  <input name="section" required placeholder="e.g. A" className="w-full p-3 border rounded-xl bg-background-light dark:bg-background-darker dark:border-border-dark text-heading dark:text-text-darker" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Class Teacher</label>
                <select name="teacher" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-medium text-slate-700 dark:text-gray-200">
                  <option value="Not Assigned">-- Select Teacher --</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`.trim()}>
                      {staff.first_name} {staff.last_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-text-secondary dark:text-text-dark">Room No.</label>
                  <input name="room" placeholder="e.g. 101" className="w-full p-3 border rounded-xl bg-background-light dark:bg-background-darker dark:border-border-dark text-heading dark:text-text-darker" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-text-secondary dark:text-text-dark">Max Capacity</label>
                  <input name="capacity" type="number" defaultValue="40" className="w-full p-3 border rounded-xl bg-background-light dark:bg-background-darker dark:border-border-dark text-heading dark:text-text-darker" />
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg transition-all mt-2">
                Create Class
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Manage Class Modal */}
      {manageClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-border-light dark:border-border-dark">
            {/* Header */}
            <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-background-darker text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Settings size={20}/></div>
                <div>
                  <h3 className="text-lg font-bold leading-tight text-white">Manage {manageClass.name}</h3>
                  <p className="text-xs text-text-secondary font-medium">Section {manageClass.section}</p>
                </div>
              </div>
              <button onClick={() => { setManageClass(null); setShowLeaveUI(false); setLeaveData({ studentName: '', photo: null, preview: null }); }} className="text-white/60 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3">
                {/* Quick Stats - Total Students */}
                <div className="bg-white dark:bg-background-dark p-4 rounded-2xl shadow-sm border border-border-light dark:border-border-dark flex flex-col items-center justify-center text-center">
                  <Users size={24} className="text-primary mb-2" />
                  <p className="text-2xl font-black text-heading dark:text-white">{manageClass.students}</p>
                  <p className="text-[10px] uppercase font-bold text-text-secondary dark:text-text-dark mt-1">Total Students</p>
                </div>
                {/* Quick Stats - Present Today */}
                <div className="bg-white dark:bg-background-dark p-4 rounded-2xl shadow-sm border border-border-light dark:border-border-dark flex flex-col items-center justify-center text-center">
                  <UserCheck size={24} className="text-emerald-500 mb-2" />
                  <p className="text-2xl font-black text-heading dark:text-white">{manageClass.present_today || 0}</p>
                  <p className="text-[10px] uppercase font-bold text-text-secondary dark:text-text-dark mt-1">Present Today</p>
                </div>
                {/* Quick Stats - Max Capacity */}
                <div className="bg-white dark:bg-background-dark p-4 rounded-2xl shadow-sm border border-border-light dark:border-border-dark flex flex-col items-center justify-center text-center">
                  <Book size={24} className="text-orange-500 mb-2" />
                  <p className="text-2xl font-black text-heading dark:text-white">{manageClass.capacity}</p>
                  <p className="text-[10px] uppercase font-bold text-text-secondary dark:text-text-dark mt-1">Max Capacity</p>
                </div>
              </div>

              <div className="bg-white dark:bg-background-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
                <div className="p-4 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50"><h4 className="font-bold text-heading dark:text-heading-dark flex items-center gap-2"><Edit size={16} className="text-primary"/> Quick Actions</h4></div>
                <div className="p-4 space-y-3">
                  {showLeaveUI ? (
                    <div className="bg-[#F4F7FE] dark:bg-slate-900 p-4 rounded-xl space-y-4 border border-blue-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-heading dark:text-white flex items-center gap-2"><FileText size={16} className="text-primary"/> Submit / Approve Leave</h5>
                        <button onClick={() => setShowLeaveUI(false)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Student Name / Admission No" 
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:border-primary"
                        value={leaveData.studentName}
                        onChange={e => setLeaveData({...leaveData, studentName: e.target.value})}
                      />
                      
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                          <Camera size={24} className="text-primary mb-2" />
                          <span className="text-xs font-bold text-gray-500 text-center">Capture / Upload<br/>Leave Letter</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={e => {
                              const file = e.target.files[0];
                              if(file) setLeaveData({...leaveData, photo: file, preview: URL.createObjectURL(file)});
                            }} 
                          />
                        </label>
                        {leaveData.preview && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 relative shrink-0 shadow-sm">
                            <img src={leaveData.preview} alt="Leave Letter" className="w-full h-full object-cover" />
                            <button onClick={() => setLeaveData({...leaveData, photo: null, preview: null})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X size={12}/></button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button 
                          disabled={isSubmittingLeave}
                          onClick={() => {
                            if(!leaveData.studentName) return toast.error("कृपया छात्र का नाम दर्ज करें");
                            setIsSubmittingLeave(true);
                            // बैकएंड API कॉल यहाँ आएगी
                            setTimeout(() => { toast.success(`Leave Approved directly for ${leaveData.studentName}`); setIsSubmittingLeave(false); setShowLeaveUI(false); setLeaveData({studentName: '', photo: null, preview: null}); }, 1000);
                          }}
                          className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                          {isSubmittingLeave ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Direct Approve
                        </button>
                        <button 
                          disabled={isSubmittingLeave}
                          onClick={() => {
                            if(!leaveData.studentName) return toast.error("कृपया छात्र का नाम दर्ज करें");
                            if(!leaveData.photo) return toast.error("कृपया छुट्टी के आवेदन की फोटो लें या अपलोड करें");
                            setIsSubmittingLeave(true);
                            // बैकएंड API कॉल यहाँ आएगी (प्रिंसिपल को नोटिफ़िकेशन भेजने के लिए)
                            setTimeout(() => { toast.success(`Leave letter forwarded to Principal for ${leaveData.studentName}`); setIsSubmittingLeave(false); setShowLeaveUI(false); setLeaveData({studentName: '', photo: null, preview: null}); }, 1500);
                          }}
                          className="flex-1 bg-[#4318FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                          {isSubmittingLeave ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send to Principal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowLeaveUI(true)} className="w-full flex items-center justify-between p-4 bg-[#F4F7FE] dark:bg-slate-900 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30">
                      <div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600 transition-colors text-sm flex items-center gap-2">
                          <FileText size={16} /> Manage Student Leaves
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Approve directly or forward letter to Principal</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm"><ChevronRight size={16}/></div>
                    </button>
                  )}
                  
                  <button className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left group mt-4 border border-red-100 dark:border-red-900/30">
                    <div>
                      <p className="font-bold text-red-600 dark:text-red-400 text-sm">Delete Class</p>
                      <p className="text-xs text-red-500/70 mt-0.5">Permanently remove this class</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm"><Trash2 size={16}/></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}