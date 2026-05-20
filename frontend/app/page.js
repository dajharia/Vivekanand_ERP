"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, LayoutDashboard, Users, GraduationCap, 
  CalendarCheck, Receipt, UserPlus, X, Printer, ChevronDown,
  CalendarDays, BookOpen, UserCheck, FileText, CheckCircle,
  Moon, Sun, ChevronRight, CheckSquare, Briefcase, Calendar, Loader2, ShieldCheck,
  Library, BarChart2, Settings as SettingsIcon, MinusCircle, Bus, Menu, Lock, User
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Toaster } from 'react-hot-toast';
import Classes from './classes';
import Students from './students';
import Attendance from './attendance'; 
import StaffManagement from './staff'; 
import ExamsDashboard from './Exams'; 
import Fees from './fees'; 
import Settings from './settings'; 
import PrincipalDesk from './principal';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });
  const [notices, setNotices] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- Admin Profile & Auth State ---
  const [userRole, setUserRole] = useState('super_admin'); // Demo के लिए login bypass
  const [loggedInUsername, setLoggedInUsername] = useState('Admin'); // Demo के लिए login bypass
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPhoto, setAdminPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // --- Actual Login States ---
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- New Admission Trigger State ---
  const [triggerNewAdmission, setTriggerNewAdmission] = useState(false);

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAdminPhoto(imageUrl);
    }
  };

  const data = [
    { name: 'Jan', pv: 90 }, { name: 'Feb', pv: 94 }, { name: 'Mar', pv: 92 },
    { name: 'Apr', pv: 93 }, { name: 'May', pv: 97 }, { name: 'Jun', pv: 98 },
  ];

 
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const session = sessionStorage.getItem('userSession');
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data && data.role) {
          setUserRole(data.role);
          setLoggedInUsername(data.username);
        }
      } catch (e) {}
    }
    const bg = localStorage.getItem('theme-bg');
    const card = localStorage.getItem('theme-card');
    const primary = localStorage.getItem('theme-primary');
    const text = localStorage.getItem('theme-text');
    const sidebar = localStorage.getItem('theme-sidebar');
    
    if (bg) document.documentElement.style.setProperty('--live-bg', bg);
    if (card) document.documentElement.style.setProperty('--live-card', card);
    if (primary) document.documentElement.style.setProperty('--live-primary', primary);
    if (text) document.documentElement.style.setProperty('--live-text', text);
    if (sidebar) document.documentElement.style.setProperty('--live-sidebar', sidebar);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchStats = async () => {
        try {
          const [studentsRes, staffRes, classesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/students/`).catch(() => ({ ok: false })),
                fetch(`${API_BASE_URL}/staff/`).catch(() => ({ ok: false })),
                fetch(`${API_BASE_URL}/classes/`).catch(() => ({ ok: false }))
          ]);
          const students = studentsRes.ok ? await studentsRes.json() : [];
          const staff = staffRes.ok ? await staffRes.json() : [];
          const classes = classesRes.ok ? await classesRes.json() : [];
          setStats({
            students: Array.isArray(students) ? students.length : 0,
            teachers: Array.isArray(staff) ? staff.length : 0,
            classes: Array.isArray(classes) ? classes.length : 0,
          });
         try {
                const noticesRes = await fetch(`${API_BASE_URL}/notices/`);
            if (noticesRes.ok) {
              setNotices(await noticesRes.json());
            } else { throw new Error("Notices API not found"); }
          } catch (e) {
            setNotices([{ id: 1, text: "Summer vacation will start from 10th June." }, { id: 2, text: "Submit your term fee by June 15." }]);
          }
        } catch (error) { console.error("Stats fetch error:", error); }
      };
      fetchStats();
    }
  }, [activeTab]);

  const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: 'text-white', hasChevron: false },
    { id: 'principal', label: 'Principal Desk', icon: <ShieldCheck size={20} className="text-purple-500" />, color: 'text-[#A3AED0]', hasChevron: false },
    { id: 'students', label: 'Students', icon: <Users size={20} className="text-teal-400" />, color: 'text-[#A3AED0]', hasChevron: false },
    { id: 'classes', label: 'Classes', icon: <BookOpen size={20} className="text-blue-400" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'attendance', label: 'Attendance', icon: <CheckSquare size={20} className="text-orange-400" />, color: 'text-[#A3AED0]', hasChevron: false },
    { id: 'exams', label: 'Exams', icon: <FileText size={20} className="text-blue-500" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'staff', label: 'Staff Management', icon: <Briefcase size={20} className="text-yellow-500" />, color: 'text-[#A3AED0]', hasChevron: false },
    { id: 'timetable', label: 'Timetable', icon: <Calendar size={20} className="text-teal-500" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'fees', label: 'Fees Collection', icon: <Receipt size={20} className="text-blue-400" />, color: 'text-[#A3AED0]', hasChevron: false },
    { id: 'library', label: 'Library', icon: <Library size={20} className="text-red-400" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'transport', label: 'Transport', icon: <Bus size={20} className="text-emerald-500" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'events', label: 'Events', icon: <CalendarDays size={20} className="text-blue-300" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart2 size={20} className="text-gray-400" />, color: 'text-[#A3AED0]', hasChevron: true },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} className="text-gray-400" />, color: 'text-[#A3AED0]', hasChevron: false },
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
        setLoggedInUsername(data.username);
        sessionStorage.setItem('userSession', JSON.stringify(data)); // Session सेव करें (sessionStorage use करें)
        setActiveTab('dashboard');
        setShowLoginModal(false);
        setLoginData({ username: '', password: '' });
      } else {
        setLoginError("Invalid username or password");
      }
    } catch (err) {
      setLoginError("Server connection failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const rolePermissions = {
    guest: ['dashboard', 'library', 'events'],
    super_admin: ['dashboard', 'principal', 'students', 'classes', 'attendance', 'exams', 'staff', 'timetable', 'fees', 'library', 'transport', 'events', 'reports', 'settings'],
    accountant: ['dashboard', 'students', 'attendance', 'timetable', 'fees', 'library', 'transport', 'events', 'reports'],
    exam: ['dashboard', 'students', 'attendance', 'exams', 'timetable', 'library', 'transport', 'events', 'reports']
  };
  const currentRole = userRole || 'guest';
  const visibleMenuItems = menuItems.filter(item => rolePermissions[currentRole] && rolePermissions[currentRole].includes(item.id));
  return (
    <div className={`flex w-full h-screen font-sans overflow-hidden transition-colors duration-300 print:block print:h-auto print:overflow-visible ${isDarkMode ? 'dark bg-background-darker' : 'bg-background-light'}`}>
      
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            background: isDarkMode ? '#1E293B' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
          }
        }} 
      />
      <style dangerouslySetInnerHTML={{__html: `
        /* LIGHT MODE OVERRIDES */
        :root:not(.dark) .bg-background-light, 
        :root:not(.dark) .bg-gray-50,
        :root:not(.dark) body { background-color: var(--live-bg, #FDFDFF) !important; }
        
        :root:not(.dark) .bg-white { background-color: var(--live-card, #FFFFFF) !important; }
        
        :root:not(.dark) .text-heading,
        :root:not(.dark) .text-\\[\\#1B2559\\] { color: var(--live-text, #1B2559) !important; }

        /* PRIMARY COLOR OVERRIDES (BOTH MODES) */
        .bg-primary, .bg-\\[\\#4318FF\\] { background-color: var(--live-primary, #4318FF) !important; }
        .text-primary, .text-\\[\\#4318FF\\] { color: var(--live-primary, #4318FF) !important; }
        .border-primary, .border-\\[\\#4318FF\\] { border-color: var(--live-primary, #4318FF) !important; }

        /* SIDEBAR OVERRIDES */
        .bg-\\[\\#111C44\\] { background-color: var(--live-sidebar, #111C44) !important; }
      `}} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      <aside className={`w-[260px] bg-[#111C44] flex flex-col z-[100] shrink-0 shadow-xl fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out print:hidden`}>
        <button className="md:hidden absolute top-4 right-4 text-white hover:text-red-400 transition-colors z-50" onClick={() => setIsSidebarOpen(false)}>
          <X size={24}/>
        </button>
        {/* Premium School Logo Card with Light/Dark Mode Glass Effect */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl flex flex-col items-center justify-center py-6 border-b border-gray-200 dark:border-white/10 shrink-0 transition-all duration-300 relative overflow-hidden">
          {/* Soft background glow behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-primary/20 blur-[20px] rounded-full pointer-events-none"></div>
          <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-white dark:border-[#1B2559] shadow-lg shrink-0 mb-3 relative z-10 transition-transform hover:scale-105 cursor-pointer">
             <img 
               src={`${API_BASE_URL}/uploads/system/logo.webp`} 
               alt="Logo" 
               className="w-full h-full object-cover bg-orange-50" 
               onError={(e) => {
                 const fallback = "https://ui-avatars.com/api/?name=VS&background=FF8A65&color=fff";
                 if (e.target.src !== fallback) {
                   e.target.src = fallback;
                 }
               }}
             />
          </div>
          <h2 className="text-[16px] font-black text-heading dark:text-white leading-tight text-center whitespace-nowrap px-2 relative z-10 drop-shadow-sm">Vivekanand H.S.S Nainpur</h2>
          <p className="text-[11px] text-warning font-bold mt-1 tracking-widest relative z-10 uppercase">तमसो मा ज्योतिर्गमय</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden pb-24 custom-scrollbar">
          {visibleMenuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/50 font-bold'
                  : 'text-[#A3AED0] hover:bg-white/5 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={activeTab === item.id ? 'text-white' : ''}>
                  {React.cloneElement(item.icon, { 
                    className: activeTab === item.id ? "text-white" : item.icon.props.className || 'text-text-secondary' 
                  })}
                </div>
                <span className="text-[14px]">{item.label}</span>
              </div>
              {item.hasChevron && (
                <ChevronRight size={18} className={activeTab === item.id ? 'text-white' : 'text-text/50'} />
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-background-darker">
           <div className="bg-border-dark border border-border-dark/50 rounded-xl p-3 flex items-center gap-3 text-success shadow-inner">
              <MinusCircle size={20} className="fill-[#4CAF50] text-white" />
              <div className="text-left leading-tight">
                 <p className="text-sm font-bold text-white">System: Online</p>
                 <p className="text-xs text-[#A3AED0]">(Localhost)</p>
              </div>
           </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative print:block print:h-auto print:overflow-visible">
        
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-[999] w-full h-[88px] bg-white dark:bg-background-dark border-b border-gray-100 dark:border-border-dark flex items-center justify-between px-4 md:px-8 shrink-0 transition-colors print:hidden shadow-sm">
  <div className="flex-1 flex items-center">
    <button className="md:hidden mr-4 text-gray-500 hover:text-primary transition-colors focus:outline-none" onClick={() => setIsSidebarOpen(true)}>
      <Menu size={24} />
    </button>
    <h1 className="hidden lg:block text-sm font-medium text-gray-500 dark:text-[#94A3B8]">
      Pages / <span className="text-heading dark:text-heading-dark font-bold capitalize">Dashboard</span>
    </h1>
  </div>

  <div className="flex items-center gap-2 sm:gap-5">
    {/* Search Bar */}
    <div className="relative hidden md:block">
      <Search className="absolute left-4 top-2.5 text-gray-400" size={18} />
      <input 
        type="text" 
        placeholder="Search..."
        className="pl-11 pr-4 py-2.5 bg-background-light dark:bg-background-darker border-none rounded-full focus:ring-2 focus:ring-primary outline-none w-72 text-sm font-medium text-slate-700 dark:text-heading-dark transition-colors"
      />
    </div>

    {/* Theme Toggle */}
    <button type="button" onClick={toggleTheme} className="relative z-50 cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50 dark:bg-background-darker rounded-full hover:bg-gray-100 dark:hover:bg-background-dark transition-colors focus:outline-none shrink-0">
      {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
    </button>

    {/* Notifications */}
    <div className="relative cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50 dark:bg-[#131620] rounded-full hover:bg-gray-100 dark:hover:bg-[#1D212F] transition-colors shrink-0">
      <Bell className="text-gray-600 dark:text-heading-dark" size={18} />
      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1D212F]">5</span>
    </div>

    {/* Profile Section & Login/Logout Toggle */}
    <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-3 border-l border-border-light dark:border-border-dark ml-1 sm:ml-2 shrink-0">
      {userRole !== 'guest' ? (
        <>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end hidden sm:flex">
            <p className="text-sm font-bold text-heading dark:text-heading-dark leading-tight">
              {userRole === 'super_admin' ? 'Admin / Principal' : userRole === 'accountant' ? 'Accountant' : 'Exam Coordinator'}
            </p>
            <p className="text-[10px] text-gray-500 font-medium italic capitalize">
              {userRole.replace('_', ' ')}
            </p>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
          />
          <div
            className="w-11 h-11 rounded-full border-2 border-primary p-0.5 overflow-hidden shadow-sm hover:opacity-80 transition"
            onClick={() => fileInputRef.current?.click()}
            title="Click to Upload Profile Photo"
          >
            <img 
              src={adminPhoto || (loggedInUsername ? `${API_BASE_URL}/uploads/profiles/${loggedInUsername}.jpg?t=${new Date().getTime()}` : `${API_BASE_URL}/uploads/system/guest.webp`)} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover aspect-square"
              onError={(e) => {
                const fallback = `https://ui-avatars.com/api/?name=${loggedInUsername || 'User'}&background=4318FF&color=fff`;
                if (e.target.src !== fallback) {
                  e.target.src = fallback;
                }
              }}
            />
          </div>
        </div>

          <button
            onClick={() => {setUserRole('guest'); setLoggedInUsername(''); sessionStorage.removeItem('userSession'); setActiveTab('dashboard');}}
            className="ml-1 sm:ml-2 px-3 sm:px-4 py-2 bg-red-50 dark:bg-danger/20 text-danger dark:text-danger/70 font-bold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-danger/40 transition-colors shadow-sm"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          className="ml-1 sm:ml-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-primary text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1.5 sm:gap-2 cursor-pointer relative z-50 focus:outline-none"
        >
          <UserCheck size={16} /> <span className="hidden sm:inline">Login</span><span className="sm:hidden">Login</span>
        </button>
      )}
    </div>
  </div>
</header>

        {/* ================= DYNAMIC CONTENT AREA ================= */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 print:block print:p-0 print:overflow-visible">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6 print:hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark transition-colors">
                <div>
                  <h1 className="text-[22px] font-bold text-heading dark:text-heading-dark">Welcome to Vivekanand School, Headmaster</h1>
                  <p className="text-text-secondary dark:text-text-dark text-sm mt-1 flex items-center gap-2">
                    <CalendarDays size={16}/> {currentDate}
                  </p>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0 items-center min-h-[48px]">
                  <div className="relative group">
                    <button onClick={() => { setActiveTab('students'); setTriggerNewAdmission(true); }} className="flex items-center justify-center p-3.5 bg-gradient-to-r from-indigo-500 to-[#4318FF] text-white rounded-full shadow-[0_4px_15px_rgba(67,24,255,0.4)] animate-bounce hover:animate-none transition-all duration-300 hover:shadow-[0_6px_20px_rgba(67,24,255,0.6)] focus:outline-none">
                      <UserPlus size={22} className="shrink-0" />
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-background-dark shadow-sm z-10">NEW</span>
                    </button>
                    {/* Hover Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-gray-800 dark:bg-slate-700 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[9999] shadow-lg">
                      New Admission
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-background-dark border border-gray-200 dark:border-border-dark text-slate-700 dark:text-heading-dark rounded-full hover:bg-gray-50 dark:hover:bg-background-darker font-medium text-sm shadow-sm transition-all">
                    <Printer size={18} className="text-primary dark:text-primary-light" /> Print Last Receipt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-background-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark flex items-center gap-4 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-background-light dark:bg-background-darker flex items-center justify-center text-primary dark:text-primary-light"><Users size={28} /></div>
                  <div><p className="text-text-secondary dark:text-text-dark text-sm font-medium">Total Students</p><div className="flex items-end gap-1"><h3 className="text-2xl font-bold text-heading dark:text-heading-dark">{stats.students}</h3></div><p className="text-success text-xs font-bold mt-1">Active Records</p></div>
                </div>
                <div className="bg-white dark:bg-background-dark p-5 rounded-2xl shadow-sm border border-gray-50 dark:border-border-dark flex items-center gap-4 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-info/10 dark:bg-background-darker flex items-center justify-center text-info"><UserCheck size={28} /></div>
                  <div><p className="text-text-secondary dark:text-text-dark text-sm font-medium">Teachers & Staff</p><h3 className="text-2xl font-bold text-heading dark:text-heading-dark">{stats.teachers}</h3><p className="text-info text-xs font-bold mt-1">Registered</p></div>
                </div>
                <div className="bg-white dark:bg-background-dark p-5 rounded-2xl shadow-sm border border-gray-50 dark:border-border-dark flex items-center gap-4 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-warning/10 dark:bg-background-darker flex items-center justify-center text-warning"><BookOpen size={28} /></div>
                  <div><p className="text-text-secondary dark:text-text-dark text-sm font-medium">Classes</p><div className="flex items-end gap-2"><h3 className="text-2xl font-bold text-heading dark:text-heading-dark">{stats.classes}</h3><span className="bg-background-light dark:bg-background-darker text-primary dark:text-primary-light text-xs px-2 py-0.5 rounded font-bold mb-1">Active</span></div></div>
                </div>
                <div className="bg-white dark:bg-background-dark p-5 rounded-2xl shadow-sm border border-gray-50 dark:border-border-dark flex items-center gap-4 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-success/10 dark:bg-background-darker flex items-center justify-center text-success"><CheckCircle size={28} /></div>
                  <div><p className="text-text-secondary dark:text-text-dark text-sm font-medium">Attendance Rate</p><h3 className="text-2xl font-bold text-heading dark:text-heading-dark">94%</h3><p className="text-success text-xs font-bold mt-1">● Today</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark lg:col-span-2 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-heading dark:text-heading-dark">Attendance Overview</h2>
                  </div>
                  {/* अनावश्यक नेस्टेड div को हटा दिया गया है */}
                  <div className="h-[300px] w-full mt-4" style={{ minWidth: 0 }}> 
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#2B3041' : '#E9EDF7'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 12}} domain={[88, 100]} />
                        <Tooltip 
                          contentStyle={{backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: '12px', border: `1px solid ${isDarkMode ? '#2B3041' : '#E9EDF7'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} 
                          labelStyle={{color: isDarkMode ? '#E2E8F0' : '#1B2559', fontWeight: 'bold'}}
                        />
                        <Line type="monotone" dataKey="pv" stroke="#4318FF" strokeWidth={3} dot={{r: 4, fill: '#4318FF', strokeWidth: 2, stroke: isDarkMode ? '#131620' : '#FFFFFF'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-heading dark:text-heading-dark">Recent Notices</h2>
                  </div>
                  <ul className="space-y-4">
                    {notices.length > 0 ? notices.map((notice) => (
                      <li key={notice.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-heading-dark font-medium leading-relaxed">{notice.text || notice.title}</p>
                      </li>
                    )) : (
                      <p className="text-sm text-gray-400 font-medium">No new notices at the moment.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRINCIPAL DESK */}
          {activeTab === 'principal' && (
            <PrincipalDesk />
          )}

          {/* TAB 2: STUDENTS DATABASE LIST */}
          {activeTab === 'students' && (
            <Students triggerNewAdmission={triggerNewAdmission} setTriggerNewAdmission={setTriggerNewAdmission} />
          )}

          {/* TAB 3: CLASSES */}
          {activeTab === 'classes' && (
            <Classes />
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <Attendance />
          )}

          {/* TAB 5: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <StaffManagement />
          )}
          
          {/* TAB 6: EXAMS DASHBOARD */}
          {activeTab === 'exams' && (
            <ExamsDashboard />
          )}

          {/* TAB 3: FEES COLLECTION */}
          {activeTab === 'fees' && (
            <Fees />
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>

      {/* ================= LOGIN MODAL (POPUP) ================= */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 transition-all duration-200 print:hidden"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white dark:bg-background-dark p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center border border-border-light dark:border-border-dark relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
             <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
             <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6 overflow-hidden border-2 border-orange-100 shadow-inner">
                <img 
                  src={`${API_BASE_URL}/uploads/system/logo.webp`} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const fallback = "https://ui-avatars.com/api/?name=VS&background=FF8A65&color=fff";
                    if (e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />
             </div>
             <h2 className="text-2xl font-black text-heading dark:text-heading-dark mb-2">User Login</h2>
             <p className="text-text-secondary dark:text-text-dark mb-6 font-medium text-sm">Enter your credentials to access the dashboard</p>
             
             <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
               {loginError && (
                 <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl text-center border border-red-100 dark:border-red-900/30">
                   {loginError}
                 </div>
               )}
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Username</label>
                 <div className="relative">
                   <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                   <input type="text" required value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} placeholder="Enter username" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-background-darker border border-gray-200 dark:border-border-dark rounded-xl font-medium dark:text-white outline-none focus:border-primary transition-all" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                 <div className="relative">
                   <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                   <input type="password" required value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} placeholder="Enter password" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-background-darker border border-gray-200 dark:border-border-dark rounded-xl font-medium dark:text-white outline-none focus:border-primary transition-all" />
                 </div>
               </div>
               
               <button type="submit" disabled={loginLoading} className="w-full mt-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                 {loginLoading ? <Loader2 size={18} className="animate-spin"/> : <UserCheck size={18}/>} 
                 {loginLoading ? 'Authenticating...' : 'Secure Login'}
               </button>
             </form>
          </div>
        </div>
      )}
  </div>
  );
}