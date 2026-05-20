"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, X, Camera, Loader2, Eye, Edit, Trash2, Lock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Students({ triggerNewAdmission = false, setTriggerNewAdmission = () => {} }) {
  const [studentsList, setStudentsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(''); // Added photo file name state
  const [filterClass, setFilterClass] = useState(''); // क्लास फ़िल्टर स्टेट
  const [searchQuery, setSearchQuery] = useState(''); // सर्च स्टेट

  // Fallback static classes if API fails or returns empty
  const fallbackStaticClasses = [
    { id: 901, name: "LKG", section: "A" },
    { id: 902, name: "UKG", section: "A" },
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, // Use 1 to 12 as IDs for classes
      name: `Class ${i + 1}`,
      section: "A"
    }))
  ];
  const [classesList, setClassesList] = useState(fallbackStaticClasses); // Initialize with fallback
  const [isLoading, setIsLoading] = useState(true); // लोडिंग स्टेट जोड़ा गया

  // फॉर्म के लिए एक निश्चित प्रारंभिक अवस्था बनाएं
  const initialFormData = {
    first_name: '', last_name: '', mother_name: '', father_name: '',
    dob: '', gender: 'Male', category: 'General', mobile_no: '', photo_path: '',
    samagra_id: '', aadhar_no: '', address: '', section: 'A',
  };

  const [formData, setFormData] = useState({
    ...initialFormData,
    class_id: fallbackStaticClasses.length > 0 ? fallbackStaticClasses[0].id : ''
  });

  // View, Edit, Delete States
  const [viewStudent, setViewStudent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [studentToDelete, setStudentToDelete] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    } else {
      setSelectedFileName('');
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students/`);
      if (res.ok) {
        const data = await res.json();
        setStudentsList(Array.isArray(data) ? data : []);
      } else {
        const errText = await res.text();
        console.error(`छात्रों का डेटा फेच करने में विफल (Status: ${res.status})`, errText);
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      
      // 14 डिफ़ॉल्ट (fallback) क्लासेस की एक कॉपी बनाएँ
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
            // अगर नाम मैच होता है, तो डिफ़ॉल्ट वाले की ID को असली DB ID से अपडेट करें
            combinedClasses[existingIndex].id = dbClass.id;
          } else {
            // अगर नई क्लास है, तो उसे लिस्ट में जोड़ दें
            combinedClasses.push({ ...dbClass, name: dbClassName });
          }
        });
      }

      setClassesList(combinedClasses);
      setFormData(prev => ({ ...prev, class_id: combinedClasses[0].id }));
    } catch (error) {
      console.error("क्लास फेच करने में विफल:", error);
      setClassesList(fallbackStaticClasses);
      // सुनिश्चित करें कि formData में भी फॉलबैक सेट हो
      setFormData(prev => ({ ...prev, class_id: fallbackStaticClasses[0].id }));
    }
  };

  // --- ACTION HANDLERS ---
  const handleView = (student) => {
    setViewStudent(student);
  };

  const handleEdit = (student) => {
    setFormData({
      first_name: student.first_name || '', last_name: student.last_name || '', mother_name: student.mother_name || '', father_name: student.father_name || '',
      dob: student.dob || '', gender: student.gender || 'Male', category: student.category || 'General', mobile_no: student.mobile_no || '', photo_path: '',
      samagra_id: student.samagra_id || '', aadhar_no: student.aadhar_no || '', address: student.address || '', section: student.section || 'A',
      class_id: student.class_id || (classesList.length > 0 ? classesList[0].id : '')
    });
    setIsEditMode(true);
    setEditStudentId(student.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (studentId) => {
    setStudentToDelete(studentId);
    setShowPinModal(true); // PIN मॉडल खोलें
  };

  const handlePinSubmit = async () => {
    if (pin === '1234') { // एडमिन PIN
      try {
        const res = await fetch(`${API_BASE_URL}/students/${studentToDelete}/`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('छात्र का रिकॉर्ड सुरक्षित रूप से हटा दिया गया है।');
          fetchStudents();
        } else { toast.error('डिलीट करने में विफल। सर्वर एरर।'); }
      } catch (err) { toast.error('सर्वर से संपर्क विफल!'); }
      setShowPinModal(false);
      setPin('');
      setStudentToDelete(null);
    } else {
      toast.error('गलत PIN! एक्सेस ठुकरा दिया गया।');
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // बैकएंड 'Form(...)' और 'File(...)' का उपयोग कर रहा है, इसलिए FormData भेजना होगा (JSON नहीं)
  const formDataToSend = new FormData();
  formDataToSend.append("first_name", formData.first_name);
  formDataToSend.append("last_name", formData.last_name);
  formDataToSend.append("mother_name", formData.mother_name);
  formDataToSend.append("father_name", formData.father_name);
  formDataToSend.append("dob", formData.dob);
  formDataToSend.append("gender", formData.gender || "Male");
  formDataToSend.append("category", formData.category || "General");
  formDataToSend.append("mobile_no", formData.mobile_no);
  formDataToSend.append("samagra_id", formData.samagra_id || "");
  formDataToSend.append("aadhar_no", formData.aadhar_no || "");
  formDataToSend.append("address", formData.address || "");
  formDataToSend.append("class_id", parseInt(formData.class_id) || 901);
  formDataToSend.append("section", formData.section || "A");

  // फोटो अटैच करना 
  const fileInput = document.getElementById('photo-upload');
  if (fileInput && fileInput.files[0]) {
    formDataToSend.append('photo', fileInput.files[0]);
  }

  try {
    // Edit मोड है तो PUT रिक्वेस्ट, अन्यथा POST
    const url = isEditMode ? `${API_BASE_URL}/students/${editStudentId}/` : `${API_BASE_URL}/students/`;
    const method = isEditMode ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method: method,
      // ध्यान दें: FormData के साथ Content-Type हेडर को मैन्युअली सेट नहीं करते, ब्राउज़र खुद multipart/form-data सेट करता है
      body: formDataToSend,
    });

    if (res.ok) {
      toast.success(isEditMode ? "छात्र का विवरण अपडेट हो गया है।" : "छात्र का पंजीकरण हो गया है।");
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditStudentId(null);
      fetchStudents();
      // फॉर्म को उसकी प्रारंभिक स्थिति में रीसेट करें
      setFormData({
        ...initialFormData,
        class_id: classesList.length > 0 ? classesList[0].id : ''
      });
      setSelectedFileName(''); // फोटो का नाम भी साफ़ करें
    } else {
      // सर्वर रिस्पॉन्स को पहले Text के रूप में पढ़ें ताकि खाली रिस्पॉन्स क्रैश न करे
      const errorText = await res.text();
      let errorDetail = {};
      try {
        errorDetail = errorText ? JSON.parse(errorText) : {};
      } catch (e) {
        console.error("Non-JSON Server Response:", errorText);
      }
      
      console.error("Backend Error Response:", errorDetail, "Status Code:", res.status);
      
      let msg = `अज्ञात सर्वर त्रुटि (Status: ${res.status})`;
      if (errorDetail && errorDetail.detail) {
        if (Array.isArray(errorDetail.detail)) {
          msg = errorDetail.detail.map(err => `${err.loc ? err.loc[err.loc.length - 1] : 'Field'}: ${err.msg}`).join("\n");
        } else {
          msg = typeof errorDetail.detail === 'string' ? errorDetail.detail : JSON.stringify(errorDetail.detail);
        }
      } else if (Object.keys(errorDetail).length === 0) {
        msg = `सर्वर ने कोई स्पष्ट एरर नहीं भेजी। Status: ${res.status}\nशायद बैकएंड PUT रिक्वेस्ट के लिए FormData की बजाय JSON की उम्मीद कर रहा है।`;
      } else if (Object.keys(errorDetail).length > 0) {
        msg = JSON.stringify(errorDetail);
      } else if (errorText) {
        msg = errorText;
      }
        toast.error("डेटा सेव/अपडेट करने में त्रुटि:\n" + msg);
    }
  } catch (err) {
    console.error("Fetch Error:", err);
      toast.error("सर्वर से संपर्क नहीं हो पाया।");
  }
};
  useEffect(() => {
    fetchStudents();
    fetchClasses(); // Fetch classes when component mounts
  }, []);

  useEffect(() => {
    if (triggerNewAdmission) {
      setFormData({ ...initialFormData, class_id: classesList.length > 0 ? classesList[0].id : '' });
      setIsEditMode(false);
      setEditStudentId(null);
      setIsModalOpen(true); // Modal / Form ओपन करें
      setTriggerNewAdmission(false); // इसे वापस false कर दें ताकि बार-बार ट्रिगर ना हो
    }
  }, [triggerNewAdmission, classesList]);

  // क्लास ID को क्लास के नाम से मैप करने के लिए एक लुकअप ऑब्जेक्ट बनाएं (useMemo के साथ)
  const classMap = useMemo(() => new Map(classesList.map(c => [c.id, c.name || c.class_name])), [classesList]);

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    return studentsList.filter(student => {
      const matchesClass = filterClass ? String(student.class_id) === String(filterClass) : true;
      const matchesSearch = searchQuery ? (
        (student.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.admission_no || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;
      return matchesClass && matchesSearch;
    });
  }, [studentsList, filterClass, searchQuery]);

  return (
    <React.Fragment>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-heading dark:text-heading-dark">Students Database</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or Adm No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-background-darker text-sm font-medium text-heading dark:text-text-darker outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider hidden sm:block">Filter:</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-background-darker text-sm font-bold text-heading dark:text-text-darker outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all cursor-pointer"
              >
                <option value="">All Classes</option>
                {classesList.map((c, index) => (
                  <option key={`class-${c.id}-${index}`} value={c.id}>{c.name || c.class_name}{c.section && c.section !== 'A' ? ` (${c.section})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark rounded-2xl shadow-sm border border-gray-100 dark:border-border-dark overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="print:table-header-group">
                <tr className="bg-background-light dark:bg-background-dark text-text-secondary dark:text-text-dark text-sm border-b border-border-light dark:border-border-dark">
                  <th className="p-4 font-semibold whitespace-nowrap">Adm No.</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Student Name</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Class</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Parents</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Mobile</th>
                  <th className="p-4 font-semibold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-text-secondary dark:text-text-dark">
                    <div className="flex justify-center items-center gap-2 text-primary dark:text-primary-light"><Loader2 className="animate-spin" size={20} /> Loading students...</div>
                  </td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-text-secondary dark:text-text-dark">No students found for the selected filter.</td></tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors">
                      <td className="p-4 font-medium text-heading dark:text-heading-dark">{student.admission_no}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {student.photo_path && student.photo_path !== 'null' ? (
                            <img src={`${API_BASE_URL}/uploads/${student.photo_path}`} className="w-8 h-8 rounded-full object-cover border border-border-light dark:border-border-dark" alt="Student" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-info font-bold text-xs">
                              {student.first_name[0]}
                            </div>
                          )} 
                          <div>
                            <p className="font-bold text-primary dark:text-primary-light">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-text-secondary dark:text-text-dark">{student.gender} • {student.dob}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                        {classMap.get(student.class_id) || `ID: ${student.class_id}`}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-gray-400">
                        F: {student.father_name} <br/> M: {student.mother_name}
                      </td>
                      <td className="p-4 text-sm font-medium text-heading dark:text-text-darker">{student.mobile_no}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleView(student)} className="p-1.5 bg-info/10 text-info hover:bg-info/20 rounded-lg transition-colors" title="View Profile"><Eye size={16}/></button>
                          <button onClick={() => handleEdit(student)} className="p-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors" title="Edit Info"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteClick(student.id)} className="p-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors" title="Delete Record"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transition-colors flex flex-col max-h-[90vh] border border-border-light dark:border-border-dark">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-background-light dark:bg-background-dark shrink-0">
              <h3 className="text-lg font-bold text-heading dark:text-heading-dark flex items-center gap-2"><UserPlus size={20} className="text-primary dark:text-primary-light"/> {isEditMode ? "Edit Student Record" : "Student Registration"}</h3>
              <button onClick={() => {setIsModalOpen(false); setSelectedFileName('');}} className="text-gray-400 hover:text-danger"><X size={24} /></button>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {/* (बाकी का फॉर्म UI जो page.js में था) */}
              <h4 className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-4 border-b border-border-light dark:border-border-dark pb-2">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">First Name *</label><input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Last Name *</label><input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Father's Name *</label><input type="text" name="father_name" required value={formData.father_name} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Mother's Name *</label><input type="text" name="mother_name" required value={formData.mother_name} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Date of Birth *</label><input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div><label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Category</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"><option value="General">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option></select></div>
                </div>
              </div>
              <h4 className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-4 border-b border-border-light dark:border-border-dark pb-2">Identity & Contact</h4>
              <div className="grid grid-cols-2 gap-4 mb-6"> 
  {/* Samagra ID */}
  <div>
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Samagra ID</label>
    <input type="text" name="samagra_id" placeholder="9/10 Digit ID" value={formData.samagra_id} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
  </div>

  {/* Aadhar No. */}
  <div>
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Aadhar No.</label>
    <input type="text" name="aadhar_no" placeholder="12 Digit Aadhar" value={formData.aadhar_no} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
  </div>

  {/* Admission Class Dropdown */}
  <div>
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">
      Admission Class *
    </label>
    <select 
      name="class_id" 
      required 
      value={formData.class_id} 
      onChange={handleInputChange}
      className="w-full p-2.5 border border-border-light dark:border-border-dark bg-white dark:bg-background-darker dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
    >
      <option value="">-- Select Class --</option>
          {classesList.map((c, index) => (
            <option key={`form-class-${c.id}-${index}`} value={c.id}>{c.name || c.class_name}{c.section && c.section !== 'A' ? ` (${c.section})` : ''}</option>
      ))}
    </select>
  </div>

  {/* Section Dropdown - Fixed 4 Items */}
  <div>
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">
      Section *
    </label>
    <select 
      name="section" 
      required 
      value={formData.section || "A"} 
      onChange={handleInputChange}
      className="w-full p-2.5 border border-border-light dark:border-border-dark bg-white dark:bg-background-darker dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
    >
      <option value="A">Section A</option>
      <option value="B">Section B</option>
      <option value="C">Section C</option>
      <option value="D">Section D</option>
    </select>
  </div>
</div>

   {/* Mobile No. */}
  <div>
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Mobile No. *</label>
    <input type="tel" name="mobile_no" required placeholder="+91" value={formData.mobile_no} onChange={handleInputChange} className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
  </div>

  {/* Address */}
  <div className="col-span-2">
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-1">Full Address</label>
    <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} placeholder="House no, Street, Village/City" className="w-full p-2.5 border border-border-light dark:border-border-dark bg-transparent dark:text-text-darker rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"></textarea>
  </div>

  {/* Photo Upload */}
  <div className="col-span-2">
    <label className="block text-sm font-medium text-heading dark:text-text-dark mb-2">Student Photo (Passport Size)</label>
    <div className="flex items-center gap-4">
      <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-info/10 dark:bg-primary/20 text-info dark:text-primary-light rounded-xl border border-dashed border-info dark:border-primary hover:bg-info/20 dark:hover:bg-primary/10 transition-all text-sm font-bold shadow-sm">
        <Camera size={18} className="text-info dark:text-primary-light" />
        {selectedFileName ? 'Change Photo' : 'Upload Photo'}
      </label>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-[300px]">
        {selectedFileName || 'No photo selected'}
      </span>
      <input id="photo-upload" type="file" name="photo" accept="image/*" className="hidden" onChange={handleFileChange}/>
    </div>
  </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark mt-auto shrink-0">
                <button type="button" onClick={() => {setIsModalOpen(false); setSelectedFileName('');}} className="px-5 py-2.5 text-text-secondary dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark rounded-xl font-medium text-sm transition-all">Cancel</button> 
                <button type="submit" className="px-5 py-2.5 bg-[#4318FF] text-white rounded-xl hover:bg-blue-800 font-medium text-sm shadow-md transition-all">{isEditMode ? "Update Record" : "Save Registration"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW STUDENT MODAL ================= */}
      {viewStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-border-light dark:border-border-dark">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-primary text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><Eye size={20}/> Student Details</h3>
              <button onClick={() => setViewStudent(null)} className="text-white/80 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center gap-6 mb-6">
                {viewStudent.photo_path && viewStudent.photo_path !== 'null' ? (
                  <img src={`${API_BASE_URL}/uploads/${viewStudent.photo_path}`} className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/10" alt="Student" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-info/10 flex items-center justify-center text-info font-bold text-3xl">
                    {viewStudent.first_name[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-heading dark:text-heading-dark">{viewStudent.first_name} {viewStudent.last_name}</h2>
                  <p className="text-primary font-bold">Admission No: {viewStudent.admission_no}</p>
                  <p className="text-text-secondary font-medium">Class: {classMap.get(viewStudent.class_id) || viewStudent.class_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Father's Name</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.father_name}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Mother's Name</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.mother_name}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Date of Birth</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.dob}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Contact No.</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.mobile_no}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Aadhar No.</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.aadhar_no || 'N/A'}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Samagra ID</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.samagra_id || 'N/A'}</p>
                </div>
                <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl col-span-2">
                  <p className="text-xs text-text-secondary uppercase font-bold mb-1">Address</p>
                  <p className="font-semibold dark:text-text-darker">{viewStudent.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECURITY PIN MODAL FOR DELETE ================= */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark">
            <div className="bg-danger p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Lock size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Confirm Deletion</h3>
              <p className="text-white/80 text-xs">Enter Admin PIN to delete student</p>
            </div>
            <div className="p-6">
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="Enter PIN (1234)" 
                className="w-full p-4 bg-background-light dark:bg-background-darker border-2 border-border-light dark:border-border-dark rounded-xl text-center text-2xl font-black tracking-[0.5em] mb-6 outline-none focus:border-danger transition-colors"
                autoFocus
              />
              <div className="flex gap-3 print:hidden">
                <button onClick={() => {setShowPinModal(false); setPin(''); setStudentToDelete(null);}} className="flex-1 py-3.5 bg-background-light dark:bg-background-dark text-text-secondary dark:text-text-dark rounded-xl font-bold hover:bg-background-light/70 dark:hover:bg-background-dark/70 transition-colors">Cancel</button>
                <button onClick={handlePinSubmit} className="flex-1 py-3.5 bg-danger text-white rounded-xl font-bold shadow-lg hover:bg-danger/80 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
