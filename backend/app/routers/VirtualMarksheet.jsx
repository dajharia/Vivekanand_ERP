"use client";
import { useState, useEffect } from "react";
import { Download, Upload, Printer, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function VirtualMarksheet() {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [marksheetData, setMarksheetData] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/classes/");
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            }
        } catch (error) {
            console.error("कक्षाएं लाने में त्रुटि:", error);
        }
    };

    // --- 1. समेकित (Consolidated) टेंप्लेट डाउनलोड करें ---
    const handleDownloadTemplate = async () => {
        if (!selectedClass) {
            setMessage({ type: "error", text: "कृपया पहले कक्षा चुनें!" });
            return;
        }
        try {
            setLoading(true);
            setMessage({ type: "", text: "" });
            const url = `http://127.0.0.1:8000/exams/download-consolidated-template?class_id=${selectedClass}`;
            
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

    // --- 2. मार्क्स अपलोड करें और प्रिंट प्रीव्यू लाएं ---
    const handlePreviewMarksheet = async (e) => {
        e.preventDefault();
        if (!selectedClass || !file) {
            setMessage({ type: "error", text: "कृपया कक्षा और एक्सेल फ़ाइल दोनों चुनें!" });
            return;
        }

        try {
            setLoading(true);
            setMessage({ type: "", text: "" });
            setMarksheetData(null);

            const formData = new FormData();
            formData.append("class_id", selectedClass);
            formData.append("file", file);

            const res = await fetch("http://127.0.0.1:8000/exams/preview-marksheet", {
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

    // --- 3. प्रिंट कमांड ---
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen print:bg-white print:p-0 print:m-0">
            {/* --- CONTROLS SECTION (HIDDEN ON PRINT) --- */}
            <div className="print:hidden space-y-6 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800">Virtual Marksheet Generator</h1>
                <p className="text-gray-600">यह टूल एक्सेल से डेटा पढ़कर सीधे मार्कशीट बनाएगा (डेटाबेस में सेव किए बिना)।</p>

                {message.text && (
                    <div className={`p-4 rounded-md flex items-center gap-3 shadow-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow p-6 border border-gray-200 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">कक्षा (Class) चुनें <span className="text-red-500">*</span></label>
                        <select className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-gray-50" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">-- कक्षा चुनें --</option>
                            {classes.map(c => (<option key={c.id} value={c.id}>{c.name} {c.section}</option>))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={handleDownloadTemplate} disabled={loading} className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg hover:bg-blue-50 transition-all font-medium">
                            <Download className="w-5 h-5" /> All Subjects Template
                        </button>
                        <div className="space-y-2">
                            <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex gap-4">
                        <button onClick={handlePreviewMarksheet} disabled={loading || !file} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50">
                            <FileSpreadsheet className="w-5 h-5" /> {loading ? "Generating..." : "Generate Marksheets"}
                        </button>
                        {marksheetData && (
                            <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-all font-medium">
                                <Printer className="w-5 h-5" /> Print All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- PRINT PREVIEW SECTION (VISIBLE ON PRINT) --- */}
            {marksheetData && marksheetData.length > 0 && (
                <div className="mt-12 print:mt-0 space-y-12 print:space-y-0">
                    {marksheetData.map((data, idx) => (
                        <div key={idx} className="bg-white p-8 border-2 border-gray-800 max-w-3xl mx-auto break-after-page shadow-lg print:shadow-none print:border-0">
                            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                                <h1 className="text-4xl font-extrabold uppercase tracking-wide">Vivekanand H.S.S Nainpur</h1>
                                <h2 className="text-xl font-semibold mt-2">Annual Examination Report Card (2025-26)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                                <p><strong>Student Name:</strong> {data.student.name}</p>
                                <p><strong>Admission No:</strong> {data.student.admission_no}</p>
                                <p><strong>Father's Name:</strong> {data.student.father_name}</p>
                                <p><strong>Mother's Name:</strong> {data.student.mother_name}</p>
                                <p><strong>D.O.B:</strong> {data.student.dob}</p>
                                <p><strong>Class:</strong> {classes.find(c => c.id == selectedClass)?.name || ""}</p>
                            </div>
                            <table className="w-full border-collapse border border-gray-800 mb-6 text-sm">
                                <thead>
                                    <tr className="bg-gray-100"><th className="border border-gray-800 p-2 text-left">Subject</th><th className="border border-gray-800 p-2 text-center">Max Marks</th><th className="border border-gray-800 p-2 text-center">Marks Obtained</th></tr>
                                </thead>
                                <tbody>
                                    {data.subjects.map((sub, sIdx) => (<tr key={sIdx}><td className="border border-gray-800 p-2">{sub.subject}</td><td className="border border-gray-800 p-2 text-center">{sub.max_marks}</td><td className="border border-gray-800 p-2 text-center font-semibold">{sub.marks}</td></tr>))}
                                    <tr className="bg-gray-50 font-bold"><td className="border border-gray-800 p-2 text-right">Grand Total</td><td className="border border-gray-800 p-2 text-center">{data.max_total}</td><td className="border border-gray-800 p-2 text-center">{data.total_obtained}</td></tr>
                                </tbody>
                            </table>
                            <div className="flex justify-between items-end mt-12 pt-6"><p className="font-bold text-lg">Percentage: {data.percentage}%</p><p className="font-bold text-lg">Grade: {data.grade}</p><div className="text-center"><p className="mb-8 border-b border-gray-800 w-32 mx-auto"></p><p className="font-semibold">Principal's Signature</p></div></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
