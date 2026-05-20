"use client";
import React, { useState, useEffect } from 'react';
import { ShieldCheck, IndianRupee, Users, UserCheck, Clock, CheckCircle, XCircle, Bell, AlertTriangle, LayoutDashboard, Calendar, FileText, FileBadge, FileSignature, GraduationCap, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PrincipalDesk() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, leaves, certificates

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    todayCollection: 0,
    pendingLeaves: 3 // Simulated
  });

  const [pendingLeaves, setPendingLeaves] = useState([
    { id: 1, name: 'Rahul Sharma', role: 'student', details: 'Class 10A', date: new Date().toLocaleDateString(), reason: 'Fever & medical checkup', isFrequent: true, status: 'Pending' },
    { id: 2, name: 'Priya Verma', role: 'staff', details: 'Math Teacher', date: new Date().toLocaleDateString(), reason: 'Family Function in hometown', isFrequent: false, status: 'Pending' },
    { id: 3, name: 'Amit Singh', role: 'student', details: 'Class 8B', date: new Date().toLocaleDateString(), reason: 'Going out of town', isFrequent: false, status: 'Pending' }
  ]);

  const staffLeaves = pendingLeaves.filter(leave => leave.role === 'staff');
  const studentLeaves = pendingLeaves.filter(leave => leave.role === 'student');

  useEffect(() => {
    // वास्तविक आँकड़े बैकएंड से लाएं (जहाँ उपलब्ध हों)
    const fetchStats = async () => {
      try {
        const [studentsRes, staffRes] = await Promise.all([
          fetch(`${API_BASE_URL}/students/`).catch(() => ({ ok: false })),
          fetch(`${API_BASE_URL}/staff/`).catch(() => ({ ok: false }))
        ]);
        const students = studentsRes.ok ? await studentsRes.json() : [];
        const staff = staffRes.ok ? await staffRes.json() : [];
        
        setStats(prev => ({
          ...prev,
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalStaff: Array.isArray(staff) ? staff.length : 0,
          todayCollection: 15400 // फिलहाल के लिए डमी डेटा (इसे Fees API से जोड़ा जा सकता है)
        }));
      } catch (error) {
        console.error("Stats fetch error:", error);
      }
    };
    fetchStats();
  }, []);

  const handleApprove = (id) => {
    setPendingLeaves(pendingLeaves.filter(leave => leave.id !== id));
    setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }));
    toast.success("Leave Approved!");
  };

  const handleReject = (id) => {
    setPendingLeaves(pendingLeaves.filter(leave => leave.id !== id));
    setStats(prev => ({ ...prev, pendingLeaves: prev.pendingLeaves - 1 }));
    toast.error("Leave Request Rejected!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-heading dark:text-white flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <ShieldCheck className="text-purple-600 dark:text-purple-400" size={28} />
          </div>
          Principal's Desk
        </h2>
        <div className="text-sm font-bold text-gray-500 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-6 w-full max-w-2xl border border-gray-100 dark:border-slate-700">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <LayoutDashboard size={18} /> Overview
        </button>
        <button onClick={() => setActiveTab('leaves')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all relative ${activeTab === 'leaves' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <Calendar size={18} /> Leave Approvals
          {pendingLeaves.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></span>}
        </button>
        <button onClick={() => setActiveTab('certificates')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'certificates' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
          <FileText size={18} /> Certificates
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-500/20 text-white transform hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><IndianRupee size={24} /></div>
          </div>
          <h3 className="text-3xl font-black mb-1">₹{stats.todayCollection.toLocaleString('en-IN')}</h3>
          <p className="text-sm font-medium text-white/80">Today's Collection</p>
        </div>
        
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 transform hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Users size={24} /></div>
          </div>
          <h3 className="text-3xl font-black text-heading dark:text-white mb-1">{stats.totalStudents}</h3>
          <p className="text-sm font-medium text-gray-500">Active Students</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 transform hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><UserCheck size={24} /></div>
          </div>
          <h3 className="text-3xl font-black text-heading dark:text-white mb-1">{stats.totalStaff}</h3>
          <p className="text-sm font-medium text-gray-500">Total Staff</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 transform hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl"><Clock size={24} /></div>
          </div>
          <h3 className="text-3xl font-black text-heading dark:text-white mb-1">{stats.pendingLeaves}</h3>
          <p className="text-sm font-medium text-gray-500">Pending Leaves</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Quick Alerts */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700">
          <h3 className="text-lg font-bold text-heading dark:text-white mb-6">System Alerts</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div><p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Low Attendance Alert</p><p className="text-xs text-red-600/80">Class 9B has less than 60% attendance today.</p></div>
            </div>
            {studentLeaves.some(l => l.isFrequent) && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex items-start gap-3 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveTab('leaves')}>
                <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div><p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">Frequent Absentees Noticed</p><p className="text-xs text-orange-600/80">Some students are requesting frequent leaves. Require principal attention.</p></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary Widget */}
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-primary mb-4">
            <FileBadge size={32} />
          </div>
          <h3 className="text-lg font-bold text-heading dark:text-white mb-2">Pending Certificates</h3>
          <p className="text-sm text-gray-500 mb-6">4 Marksheets pending for principal signature.</p>
          <button onClick={() => setActiveTab('certificates')} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all w-full">View Documents</button>
        </div>
      </div>
        </>
      )}

      {/* TAB 2: LEAVE APPROVALS */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700">
            <h3 className="text-xl font-bold text-heading dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-4">
              <UserCheck size={24} className="text-emerald-500" /> Staff Leave Requests
            </h3>
            
            {staffLeaves.length === 0 ? (
              <p className="text-gray-500 font-medium text-center py-6">No staff leave requests pending.</p>
            ) : (
              <div className="space-y-4">
                {staffLeaves.map(leave => (
                  <div key={leave.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-600 gap-4 hover:border-emerald-200 transition-colors">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-heading dark:text-white text-lg">{leave.name}</h4>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">{leave.date}</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">Staff • {leave.details}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reason: {leave.reason}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                      <button onClick={() => handleApprove(leave.id)} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"><CheckCircle size={16}/> Approve</button>
                      <button onClick={() => handleReject(leave.id)} className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"><XCircle size={16}/> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700">
            <h3 className="text-xl font-bold text-heading dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-4">
              <GraduationCap size={24} className="text-[#4318FF]" /> Student Leave Requests
            </h3>
            
            {studentLeaves.length === 0 ? (
              <p className="text-gray-500 font-medium text-center py-6">No student leave requests pending.</p>
            ) : (
              <div className="space-y-4">
                {studentLeaves.map(leave => (
                  <div key={leave.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border gap-4 transition-colors ${leave.isFrequent ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 hover:border-red-300' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-600 hover:border-blue-200'}`}>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-heading dark:text-white text-lg flex items-center gap-2">
                          {leave.name}
                          {leave.isFrequent && <span className="bg-red-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-black animate-pulse">Frequent</span>}
                        </h4>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 px-3 py-1 rounded-full shadow-sm">{leave.date}</span>
                      </div>
                      <p className={`text-xs font-bold mb-1.5 ${leave.isFrequent ? 'text-red-600 dark:text-red-400' : 'text-[#4318FF] dark:text-blue-400'}`}>Student • {leave.details}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Reason: {leave.reason}</p>
                      {leave.isFrequent && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle size={12} /> This student has requested 4 leaves in the past month.</p>}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                      <button onClick={() => handleApprove(leave.id)} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"><CheckCircle size={16}/> Approve</button>
                      <button onClick={() => handleReject(leave.id)} className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"><XCircle size={16}/> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700">
             <div>
               <h3 className="text-xl font-bold text-heading dark:text-white">Issue Certificates & Documents</h3>
               <p className="text-sm text-gray-500 font-medium">Select a document type to search for a student and generate it.</p>
             </div>
             <div className="hidden md:flex relative">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Quick search student Adm No..." className="pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-sm outline-none focus:border-primary" />
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <CertificateCard icon={<FileBadge size={32} />} title="Transfer Certificate (TC)" desc="Generate and sign TC for school leaving students." color="text-orange-500" bg="bg-orange-50" />
             <CertificateCard icon={<FileSignature size={32} />} title="Character Certificate" desc="Issue character/conduct certificate for students." color="text-purple-500" bg="bg-purple-50" />
             <CertificateCard icon={<FileText size={32} />} title="Migration Certificate" desc="Issue migration certificate for board transfers." color="text-emerald-500" bg="bg-emerald-50" />
             <CertificateCard icon={<GraduationCap size={32} />} title="Marksheet Sign" desc="Approve and digitally sign final marksheets." color="text-[#4318FF]" bg="bg-blue-50" />
          </div>
        </div>
      )}

    </div>
  );
}

function CertificateCard({ icon, title, desc, color, bg }) {
  return (
    <div className="p-6 bg-white dark:bg-[#1E293B] rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 flex flex-col text-center cursor-pointer hover:border-[#4318FF] hover:shadow-lg hover:-translate-y-1 transition-all group">
      <div className={`w-16 h-16 mx-auto ${bg} dark:bg-slate-800 rounded-2xl flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-heading dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{desc}</p>
      <button className="mt-5 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 text-heading dark:text-white font-bold rounded-xl w-full group-hover:bg-[#4318FF] group-hover:text-white transition-colors">
        Generate
      </button>
    </div>
  );
}
