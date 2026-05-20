"use client";
import React, { useState, useEffect } from "react";
import { Download, Upload, Printer, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Database, FileText, UploadCloud, ChevronRight, X, Save, BookOpen } from "lucide-react";
import SubjectsManagement from './Subjects';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ExamsDashboard() {
    const [activeTab, setActiveTab] = useState('entry'); // 'entry' (Save to DB) or 'report' (Print Marksheets)
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "", details: "" });
    const [marksheetData, setMarksheetData] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/classes/`);
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            }
        } catch (error) {
            console.error("कक्षाएं लाने में त्रुटि:", error);
            setMessage({ type: "error", text: "क्लासेज लोड करने में विफल। सर्वर से संपर्क नहीं हो सका।" });
        }
    };

    const handleDownloadTemplate = async () => {
        if (!selectedClass) {
            setMessage({ type: "error", text: "कृपया पहले कक्षा चुनें!" });
            return;
        }
        try {
            setLoading(true);
            setMessage({ type: "", text: "", details: "" });
            const url = `${API_BASE_URL}/exams/download-consolidated-template?class_id=${selectedClass}`;
            
            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "फ़ाइल डाउनलोड करने में त्रुटि।");
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `Consolidated_Marks_Class_${selectedClass}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setMessage({ type: "success", text: "समेकित एक्सेल टेंप्लेट डाउनलोड हो गया! सभी विषयों के नंबर भरकर अपलोड करें।" });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadToDB = async (e) => {
        e.preventDefault();
        if (!selectedClass || !file) {
            setMessage({ type: "error", text: "कृपया कक्षा और भरी हुई एक्सेल फ़ाइल चुनें!" });
            return;
        }
        try {
            setLoading(true);
            setMessage({ type: "", text: "", details: "" });
            const formData = new FormData();
            formData.append("class_id", selectedClass);
            formData.append("file", file);

            const res = await fetch(`${API_BASE_URL}/exams/upload-consolidated-marks`, {
                method: "POST",
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.detail || "फ़ाइल अपलोड करने में त्रुटि");

            setMessage({ type: "success", text: "✅ अंक सफलतापूर्वक डेटाबेस में सेव कर लिए गए हैं!" });
            setFile(null); // Reset file
        } catch (error) {
            setMessage({ type: "error", text: "अपलोड विफल रहा", details: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewMarksheet = async (e) => {
        e.preventDefault();
        if (!selectedClass || !file) {
            setMessage({ type: "error", text: "कृपया कक्षा और एक्सेल फ़ाइल दोनों चुनें!" });
            return;
        }

        try {
            setLoading(true);
            setMessage({ type: "", text: "", details: "" });
            setMarksheetData(null);

            const formData = new FormData();
            formData.append("class_id", selectedClass);
            formData.append("file", file);

            const res = await fetch(`${API_BASE_URL}/exams/preview-marksheet`, {
                method: "POST",
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.detail || "फ़ाइल अपलोड करने में त्रुटि");
            }

            setMarksheetData(result.data);
            setMessage({ type: "success", text: "मार्कशीट डेटा सफलतापूर्वक जेनरेट हो गया! अब आप इसे प्रिंट कर सकते हैं।" });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const resetAll = () => {
        setFile(null);
        setMarksheetData(null);
        setMessage({ type: "", text: "", details: "" });
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
            
            {/* --- HEADER & TABS (HIDDEN ON PRINT) --- */}
            <div className="print:hidden">
                <div className="flex justify-between items-center mb-6"> 
                    <h2 className="text-2xl font-bold text-heading dark:text-white">Exams & Results Dashboard</h2>
                </div>
 
                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-6 w-full max-w-2xl border border-gray-100 dark:border-slate-700">
                    <button onClick={() => {setActiveTab('entry'); resetAll();}} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'entry' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                        <Database size={18} /> Marks Entry (DB)
                    </button>
                    <button onClick={() => {setActiveTab('report'); resetAll();}} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'report' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                        <FileText size={18} /> Report Cards
                    </button>
                    <button onClick={() => {setActiveTab('subjects'); resetAll();}} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${activeTab === 'subjects' ? 'bg-[#4318FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                        <BookOpen size={18} /> Subjects
                    </button>
                </div>

                {/* Alert Messages */}
                {message.text && (
                    <div className={`p-4 mb-6 rounded-2xl flex items-start gap-3 shadow-sm border ${message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300" : "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"}`}>
                        {message.type === "success" ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                        <div>
                            <p className="font-bold">{message.text}</p>
                            {message.details && <p className="text-sm mt-1 opacity-80">{message.details}</p>}
                        </div>
                        <button onClick={() => setMessage({ type: "", text: "", details: "" })} className="ml-auto opacity-50 hover:opacity-100"><X size={18}/></button>
                    </div>
                )}

                {/* SUBJECTS MANAGEMENT TAB */}
                {activeTab === 'subjects' && (
                    <SubjectsManagement />
                )}

                {/* MAIN CONTROL CARD */}
                {activeTab !== 'subjects' && (
                 <div className="bg-white dark:bg-background-dark rounded-3xl shadow-sm border border-gray-50 dark:border-slate-700 p-6 md:p-8 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Class Selector */}
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">1. Select Class</label>
                            <select className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3.5 font-bold text-heading dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                <option value="">-- Choose Class --</option>
                                {classes.map(c => (<option key={c.id} value={c.id}>{c.name} {c.section}</option>))}
                            </select>
                        </div>

                        {/* Download Template */}
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Get Blank Sheet</label>
                            <button onClick={handleDownloadTemplate} disabled={loading || !selectedClass} className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary dark:text-primary-light py-3.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                Download Template
                            </button>
                        </div>

                        {/* Upload Excel */}
                        <div className="flex-[1.5] space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. Upload Filled Excel</label>
                            <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3.5 px-4 cursor-pointer transition-all w-full font-bold ${file ? 'border-primary bg-blue-50 text-primary dark:bg-blue-900/20' : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-800'}`}>
                                <UploadCloud className="w-5 h-5 shrink-0" />
                                <span className="truncate">{file ? file.name : "Select Excel File (.xlsx)"}</span>
                                <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                        {activeTab === 'entry' ? (
                            <button onClick={handleUploadToDB} disabled={loading || !file || !selectedClass} className="flex-1 flex items-center justify-center gap-2 bg-[#4318FF] text-white py-4 rounded-xl hover:bg-blue-700 transition-all font-bold text-lg disabled:opacity-50 shadow-lg shadow-blue-900/20">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                {loading ? "Saving to Database..." : "Save Marks to Database"}
                            </button>
                        ) : (
                            <>
                                <button onClick={handlePreviewMarksheet} disabled={loading || !file || !selectedClass} className="flex-1 flex items-center justify-center gap-2 bg-[#4318FF] text-white py-4 rounded-xl hover:bg-blue-700 transition-all font-bold text-lg disabled:opacity-50 shadow-lg shadow-blue-900/20">
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6" />}
                                    {loading ? "Generating Cards..." : "Generate Report Cards"}
                                </button>
                                {marksheetData && (
                                    <button onClick={handlePrint} className="flex-1 sm:max-w-xs flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-xl hover:bg-emerald-600 transition-all font-bold text-lg shadow-lg shadow-emerald-900/20">
                                        <Printer className="w-6 h-6" /> Print All
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* --- REPORT CARDS PREVIEW SECTION --- */}
            {marksheetData && marksheetData.length > 0 && (
                <div className="mt-12 print:mt-0 space-y-12 print:space-y-0 bg-gray-100 print:bg-white p-6 print:p-0 rounded-3xl print:rounded-none">
                    {marksheetData.map((data, idx) => (
                        <div key={idx} className="bg-white p-10 border-4 border-double border-gray-800 max-w-4xl mx-auto break-after-page shadow-2xl print:shadow-none print:border-0 text-black font-serif relative">
                            
                            {/* Header Section */}
                            <div className="flex justify-between items-center border-b-4 border-gray-800 pb-6 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-wider uppercase mb-1">Vivekanand H.S.S</h1>
                                    <p className="text-lg font-bold text-gray-700">Nainpur, Madhya Pradesh</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-gray-900 uppercase">Report Card</h2>
                                    <p className="text-md font-bold text-gray-600">Academic Session 2025-26</p>
                                </div>
                            </div>

                            {/* Student Details Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 text-[15px] font-medium bg-gray-50 p-6 border border-gray-300 rounded-lg">
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Student's Name:</span> <span className="font-bold text-lg uppercase">{data.student.name}</span></p>
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Class & Section:</span> <span className="font-bold text-lg uppercase">{classes.find(c => c.id == selectedClass)?.name || ""} {classes.find(c => c.id == selectedClass)?.section || "A"}</span></p>
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Father's Name:</span> <span className="font-bold uppercase">{data.student.father_name}</span></p>
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Admission No:</span> <span className="font-bold uppercase">{data.student.admission_no}</span></p>
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Mother's Name:</span> <span className="font-bold uppercase">{data.student.mother_name}</span></p>
                                <p className="flex justify-between border-b border-gray-200 pb-1"><span className="text-gray-500 font-bold">Date of Birth:</span> <span className="font-bold uppercase">{data.student.dob}</span></p>
                            </div>
                            
                            {/* Marks Table */}
                            <table className="w-full border-collapse border border-gray-800 mb-8 text-[15px]">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-900 font-bold uppercase">
                                        <th className="border border-gray-800 p-3 text-left w-1/3">Scholastic Subjects</th>
                                        <th className="border border-gray-800 p-3 text-center">Term 1</th>
                                        <th className="border border-gray-800 p-3 text-center">Term 2</th>
                                        <th className="border border-gray-800 p-3 text-center">Annual<br/><span className="text-xs font-normal">(Th+Pr)</span></th>
                                        <th className="border border-gray-800 p-3 text-center bg-gray-300">Total<br/>Obtained</th>
                                        <th className="border border-gray-800 p-3 text-center">Max<br/>Marks</th>
                                        <th className="border border-gray-800 p-3 text-center">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.subjects.map((sub, sIdx) => (
                                        <tr key={sIdx} className="hover:bg-gray-50 transition-colors">
                                            <td className="border border-gray-800 p-3 font-bold text-gray-800">{sub.subject}</td>
                                            <td className="border border-gray-800 p-3 text-center">{sub.term1}</td>
                                            <td className="border border-gray-800 p-3 text-center">{sub.term2}</td>
                                            <td className="border border-gray-800 p-3 text-center">{sub.annual_th + sub.annual_pr}</td>
                                            <td className="border border-gray-800 p-3 text-center font-black bg-gray-100">{sub.total}</td>
                                            <td className="border border-gray-800 p-3 text-center text-gray-500 font-bold">{sub.max_total}</td>
                                            <td className="border border-gray-800 p-3 text-center font-black">{sub.grade}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200 font-black text-gray-900 uppercase">
                                        <td colSpan="4" className="border border-gray-800 p-4 text-right">Grand Total</td>
                                        <td className="border border-gray-800 p-4 text-center text-xl">{data.total_obtained}</td>
                                        <td className="border border-gray-800 p-4 text-center text-xl">{data.max_total}</td>
                                        <td className="border border-gray-800 p-4 text-center text-xl">{data.grade}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Result Summary */}
                            <div className="flex items-center gap-6 mb-16 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                                <p className="text-lg font-bold">Final Percentage: <span className="text-2xl ml-2">{data.percentage}%</span></p>
                                <div className="w-px h-8 bg-gray-300"></div>
                                <p className="text-lg font-bold">Result Status: <span className={`text-2xl ml-2 ${data.percentage >= 33 ? 'text-green-600' : 'text-red-600'}`}>{data.percentage >= 33 ? 'PASS' : 'FAIL'}</span></p>
                            </div>
                            
                            {/* Signatures Section */}
                            <div className="flex justify-between items-end px-8 mt-12">
                                <div className="text-center">
                                    <div className="w-40 border-b-2 border-gray-800 mb-2"></div>
                                    <p className="font-bold text-gray-800 uppercase text-sm">Class Teacher</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-40 border-b-2 border-gray-800 mb-2"></div>
                                    <p className="font-bold text-gray-800 uppercase text-sm">Parent / Guardian</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-40 border-b-2 border-gray-800 mb-2"></div>
                                    <p className="font-bold text-gray-800 uppercase text-sm">Principal</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
