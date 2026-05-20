"use client";
import React, { useState, useEffect } from 'react';
import { Search, Users, CheckCircle, X, Printer, MessageCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Fees() {
  const academicMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']; // 10 महीने
  const [selectedMonths, setSelectedMonths] = useState([]); // चुने गए महीने
  const [receiptData, setReceiptData] = useState(null); // रसीद का डेटा
  const [feeStudent, setFeeStudent] = useState(null); // खोजे गए छात्र का डेटा
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash'); // भुगतान का तरीका
  const [searchAdmissionNo, setSearchAdmissionNo] = useState(''); // खोजने के लिए एडमिशन नंबर
  const [showGateway, setShowGateway] = useState(false); // डमी गेटवे
  
  // Fees Tab के लिए स्टेट्स
  const [feeClasses, setFeeClasses] = useState([]);
  const [feeSelectedClass, setFeeSelectedClass] = useState("");
  const [feeStudentsList, setFeeStudentsList] = useState([]);
  const [isLoadingFeeStudents, setIsLoadingFeeStudents] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/classes/`)
      .then(res => res.json())
      .then(data => setFeeClasses(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching classes:", err));
  }, []);

  useEffect(() => {
    if (feeSelectedClass) {
      setIsLoadingFeeStudents(true);
      fetch(`${API_BASE_URL}/students/`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFeeStudentsList(data.filter(s => s.class_id == feeSelectedClass));
          }
        })
        .catch(err => console.error("Error fetching students:", err))
        .finally(() => setIsLoadingFeeStudents(false));
    } else {
      setFeeStudentsList([]);
    }
  }, [feeSelectedClass]);

  const handleSearchStudent = async (admissionNo) => {
    if (!admissionNo) return;
    try {
      const res = await fetch(`${API_BASE_URL}/students/search/${admissionNo}`);
      if (res.ok) {
        const data = await res.json();
        setFeeStudent(data);
        // जमा हो चुके महीनों की गणना करें
        const monthlyFee = data.fee_record?.monthly_fee || 0;
        const totalPaid = data.fee_record?.total_paid || 0;
        const paidCount = monthlyFee > 0 ? Math.floor(totalPaid / monthlyFee) : 0;
        // अगला बकाया महीना ऑटो-सेलेक्ट करें
        setSelectedMonths(paidCount < academicMonths.length ? [academicMonths[paidCount]] : []);
      } else {
        alert("प्रवेश नंबर सही नहीं है या छात्र मौजूद नहीं है।");
        setFeeStudent(null);
        setSelectedMonths([]);
      }
    } catch (err) {
      alert("सर्वर से संपर्क नहीं हो पाया।");
    }
  };

  const toggleMonth = (month) => {
    const clickedIdx = academicMonths.indexOf(month);
    const monthlyFee = feeStudent?.fee_record?.monthly_fee || 0;
    const totalPaid = feeStudent?.fee_record?.total_paid || 0;
    const paidCount = monthlyFee > 0 ? Math.floor(totalPaid / monthlyFee) : 0;
    
    if (clickedIdx < paidCount) return; 

    const currentHighestIdx = selectedMonths.length > 0 ? academicMonths.indexOf(selectedMonths[selectedMonths.length - 1]) : -1;
    let targetIdx = clickedIdx;
    
    if (clickedIdx === currentHighestIdx) targetIdx = clickedIdx - 1;

    const newSelection = [];
    for (let i = paidCount; i <= targetIdx; i++) {
      newSelection.push(academicMonths[i]);
    }
    setSelectedMonths(newSelection);
  };

  const amountToPay = selectedMonths.length * (feeStudent?.fee_record?.monthly_fee || 0); 

  const handlePayFeeClick = () => {
    if (!feeStudent || !feeStudent.fee_record) return alert("छात्र का फीस रिकॉर्ड नहीं मिला");
    if (amountToPay === 0) return alert("कृपया भुगतान के लिए कम से कम एक महीना चुनें।");
    
    if (paymentMode === 'Online') {
      setShowGateway(true); 
    } else {
      processActualPayment(); 
    }
  };

  const processActualPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fees/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: feeStudent.id,
          amount: amountToPay,
          amount_paid: amountToPay,
          payment_mode: paymentMode 
        })
      });
      
      const text = await res.text(); 
      let result;
      try {
        result = JSON.parse(text); 
      } catch (e) {
        throw new Error(`सर्वर ने गलत डेटा भेजा (Status: ${res.status})`);
      }
      
      if (res.ok) {
        setReceiptData({
          receiptNo: result.receipt || result.receipt_no || "Success",
          studentName: `${feeStudent.first_name} ${feeStudent.last_name}`,
          admissionNo: feeStudent.admission_no,
          className: feeStudent.class_id,
          amount: amountToPay,
          mode: paymentMode,
          months: selectedMonths.join(', '),
          date: new Date().toLocaleDateString('en-IN')
        });
        handleSearchStudent(feeStudent.admission_no); 
      } else {
        alert("भुगतान विफल: " + (result.error || JSON.stringify(result.detail) || "सर्वर एरर"));
      }
    } catch (err) {
      alert("भुगतान विफल! सर्वर चेक करें।\nकारण: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintAndReset = () => {
    window.print();
    // प्रिंट डायलॉग बंद होने के बाद रीसेट करें ताकि प्रिंट ब्लैंक न आए
    setTimeout(() => {
      setReceiptData(null);
      setFeeStudent(null);
      setSearchAdmissionNo('');
      setSelectedMonths([]);
    }, 500);
  };

  const handleWhatsAppReceipt = () => {
    if (!receiptData || !feeStudent) return;
    const mobile = feeStudent.mobile_no;
    if (!mobile) {
      alert("छात्र का मोबाइल नंबर दर्ज नहीं है।");
      return;
    }
    
    const text = `*Vivekanand H.S.S - Fee Receipt*\n\nDear Parent,\nFee payment of *₹${receiptData.amount}* for *${receiptData.studentName}* (Adm No: ${receiptData.admissionNo}) has been received successfully.\n\n*Receipt No:* ${receiptData.receiptNo}\n*Date:* ${receiptData.date}\n*Mode:* ${receiptData.mode}\n*Months Paid:* ${receiptData.months}\n\nThank you!`;
    
    let waNumber = String(mobile).replace(/\D/g, '');
    if (waNumber.length === 10) waNumber = '91' + waNumber;
    
    const url = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 print:m-0 print:p-0 print:block">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-heading dark:text-white">Fees Collection</h2>
        {feeStudent && (
          <button onClick={() => { setFeeStudent(null); setSearchAdmissionNo(''); }} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-bold text-sm transition-colors">
            ← Back to List
          </button>
        )}
      </div>
      
      {!feeStudent && (
        <>
          {/* Top Control Bar: Search & Dropdown Side-by-Side */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 transition-colors print:hidden mb-6">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              {/* Search Block */}
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  Search by Admission Number
                </label>
                <div className="flex gap-3">
                  <input type="text" value={searchAdmissionNo} onChange={(e) => setSearchAdmissionNo(e.target.value)} placeholder="Enter Admission Number" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-700 dark:text-gray-200 outline-none focus:border-blue-500 transition-all"/>
                  <button onClick={() => handleSearchStudent(searchAdmissionNo)} className="px-6 sm:px-8 py-4 bg-[#4318FF] text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap">
                    <Search size={20} className="text-white" /> <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>

              {/* Class Dropdown Block */}
              <div className="flex-1 w-full lg:max-w-md">
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  Select Class
                </label>
                <select value={feeSelectedClass} onChange={(e) => setFeeSelectedClass(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-700 dark:text-gray-200 outline-none focus:border-primary transition-all cursor-pointer">
                  <option value="">-- View All Classes --</option>
                  {feeClasses.map(c => (<option key={c.id} value={c.id}>{c.name}{c.section && c.section !== 'A' ? ` (${c.section})` : ''}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Area: Class Cards OR Students List */}
            {feeSelectedClass ? (
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 transition-colors print:hidden">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                 <h3 className="text-lg font-bold text-[#1B2559] dark:text-white flex items-center gap-2">
                   <Users size={20} className="text-[#4318FF]"/>
                   Students of Class {feeClasses.find(c => String(c.id) === String(feeSelectedClass))?.name}
                 </h3>
                 <button onClick={() => setFeeSelectedClass("")} className="text-sm text-gray-500 hover:text-red-500 font-bold flex items-center gap-1 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                   <X size={16}/> Close
                 </button>
              </div>
              {isLoadingFeeStudents ? (
                 <div className="py-10 text-center text-[#4318FF] animate-pulse font-bold">Loading students...</div>
              ) : feeStudentsList.length === 0 ? (
                 <div className="py-10 text-center text-gray-400 font-medium">No students found in this class.</div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {feeStudentsList.map(student => (
                     <div key={student.id} onClick={() => handleSearchStudent(student.admission_no)} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:border-[#4318FF] hover:shadow-lg transition-all group">
                       <div className="flex items-center gap-3">
                         {student.photo_path ? (
                           <img src={`${API_BASE_URL}/uploads/${student.photo_path}`} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600" alt="Student" />
                         ) : (
                           <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg uppercase">{student.first_name[0]}</div>
                           )}
                         <div className="flex-1 overflow-hidden">
                           <h4 className="font-bold text-[#1B2559] dark:text-white group-hover:text-[#4318FF] transition-colors truncate">{student.first_name} {student.last_name}</h4>
                           <p className="text-xs text-gray-500 font-medium mt-0.5">Adm: {student.admission_no}</p>
                         </div>
                       </div>
                       <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                         <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md">Paid: ₹{student.fee_record?.total_paid || 0}</span>
                         <span className="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-md">Due: ₹{student.fee_record?.balance || 0}</span>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 print:hidden">
              {feeClasses.map(c => (
                <div key={c.id} onClick={() => setFeeSelectedClass(c.id)} className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-[#4318FF] hover:shadow-md hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center gap-3 group">
                   <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#4318FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Users size={28} />
                   </div>
                   <div>
                     <h3 className="font-bold text-[#1B2559] dark:text-white text-base leading-tight">{c.name}</h3>
                     <p className="text-xs text-gray-500 font-medium mt-1">Sec: {c.section}</p>
                   </div>
                </div>
              ))}
              {feeClasses.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">Loading classes...</div>
              )}
            </div>
            )}
        </>
      )}

      {feeStudent && (
        <div className="bg-white dark:bg-background-dark p-8 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-700 transition-colors print:hidden">
          <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xl uppercase">
              {feeStudent.first_name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-heading dark:text-white">{feeStudent.first_name} {feeStudent.last_name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Class: {feeStudent.class_id} | Adm No: {feeStudent.admission_no}</p>
              <div className="flex gap-4 mt-2 text-xs font-bold">
                 <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Paid: ₹{feeStudent.fee_record?.total_paid || 0}</span>
                 <span className="text-red-500 bg-red-50 px-2 py-1 rounded">Balance: ₹{feeStudent.fee_record?.balance || 0}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Fee Status (Academic Months)</label>
            <div className="flex flex-wrap gap-2">
              {academicMonths.map((month, idx) => {
                const monthlyFee = feeStudent.fee_record?.monthly_fee || 0;
                const totalPaid = feeStudent.fee_record?.total_paid || 0;
                const paidMonthsCount = monthlyFee > 0 ? Math.floor(totalPaid / monthlyFee) : 0;
                const isPaid = idx < paidMonthsCount;
                const isSelected = selectedMonths.includes(month);
                return (
                  <button key={month} disabled={isPaid} onClick={() => toggleMonth(month)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed opacity-80' : isSelected ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-primary'}`}>{month} {isPaid && '✓'}</button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Total Payable (Selected Months)</label>
              <div className="relative">
                <span className="absolute left-4 top-4 font-bold text-blue-600">₹</span>
                <input type="number" value={amountToPay} readOnly className="w-full p-4 pl-8 bg-gray-100 dark:bg-slate-800 rounded-xl text-xl font-black text-blue-600 dark:text-blue-400 outline-none cursor-not-allowed border-2 border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">भुगतान का तरीका</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-700 dark:text-gray-200 outline-none focus:border-blue-500 transition-all">
                <option value="Cash">नकद (Cash)</option>
                <option value="Online">UPI / ऑनलाइन</option>
                <option value="Bank">बैंक ट्रांसफर</option>
              </select>
            </div>
          </div>

          <button onClick={handlePayFeeClick} disabled={isProcessing} className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3">
            {isProcessing ? "प्रक्रिया जारी है..." : "फीस जमा करें और रसीद निकालें"}
          </button>
        </div>
      )}

      {/* Gateway Modal */}
      {showGateway && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm p-4 transition-all print:hidden">
          <div className="bg-white dark:bg-background-dark rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="bg-primary p-6 text-center text-white relative">
              <button onClick={() => setShowGateway(false)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={24} /></button>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><CheckCircle size={32} className="text-primary" /></div>
              <h3 className="text-2xl font-bold mb-1 text-white">Dummy Payment Gateway</h3>
              <p className="text-white/80 text-sm">Secure Test Environment</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-xl font-bold border border-blue-100 dark:border-blue-800/30">Total Payable: ₹{amountToPay}</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Please simulate the payment to proceed.</p>
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button onClick={() => { setShowGateway(false); processActualPayment(); }} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"><CheckCircle size={20} /> Simulate Payment Success</button>
                <button onClick={() => setShowGateway(false)} className="w-full py-3 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 transition-all">Cancel Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 print:static print:bg-white print:p-0 print:z-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:overflow-visible print:shadow-none print:w-full print:max-w-none print:rounded-none border border-gray-200 print:border-0 relative">
            <div className="h-3 w-full bg-[#4318FF] print:bg-gray-800 shrink-0"></div>
            <div className="p-6 sm:p-8 text-black bg-white flex-1 overflow-y-auto print:overflow-visible print:p-0 custom-scrollbar">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b-2 border-gray-200 print:border-gray-800 pb-6 gap-4">
                <div className="flex items-center gap-4">
                  <img src={`${API_BASE_URL}/uploads/system/logo.webp`} alt="Logo" className="w-16 h-16 object-contain" />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-wider">Vivekanand H.S.S</h2>
                    <p className="text-sm font-semibold text-gray-600">Nainpur, Madhya Pradesh</p>
                    <p className="text-xs text-gray-500 mt-0.5">Contact: +91 98765 43210 | info@vivekanand.edu</p>
                  </div>
                </div> 
                <div className="text-right"><h3 className="text-xl sm:text-2xl font-black text-primary print:text-gray-800 uppercase tracking-widest border-2 border-primary print:border-gray-800 px-4 py-1.5 rounded-lg inline-block">RECEIPT</h3></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-2 bg-gray-50 print:bg-transparent p-4 print:p-0 rounded-xl print:rounded-none border border-gray-100 print:border-none text-black">
                  <p className="text-[#4318FF] print:text-gray-600 font-bold uppercase text-xs mb-3 border-b border-gray-200 pb-1">Receipt Details</p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Receipt No:</span> <span className="font-bold text-gray-900">{receiptData.receiptNo}</span></p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Date:</span> <span className="font-bold text-gray-900">{receiptData.date}</span></p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Payment Mode:</span> <span className="font-bold text-gray-900">{receiptData.mode}</span></p>
                </div>
                <div className="space-y-2 bg-gray-50 print:bg-transparent p-4 print:p-0 rounded-xl print:rounded-none border border-gray-100 print:border-none">
                  <p className="text-[#4318FF] print:text-gray-600 font-bold uppercase text-xs mb-3 border-b border-gray-200 pb-1">Student Details</p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Student Name:</span> <span className="font-bold text-gray-900 uppercase">{receiptData.studentName}</span></p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Admission No:</span> <span className="font-bold text-gray-900">{receiptData.admissionNo}</span></p>
                  <p className="flex justify-between sm:block"><span className="font-semibold w-28 inline-block text-gray-500">Class:</span> <span className="font-bold text-gray-900">Class {receiptData.className}</span></p>
                </div>
              </div>
              <table className="w-full mb-8 border-collapse">
                <thead><tr className="bg-gray-100 print:bg-gray-100 border-y-2 border-gray-300 print:border-gray-800"><th className="text-left py-3 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider">Description</th><th className="text-right py-3 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider">Amount</th></tr></thead>
                <tbody><tr className="border-b border-gray-200"><td className="py-5 px-4"><p className="font-bold text-gray-900 text-base">Academic Fee</p><p className="text-xs font-semibold text-gray-500 mt-1">Months Paid: <span className="text-[#4318FF] print:text-gray-700">{receiptData.months}</span></p></td><td className="py-5 px-4 text-right font-bold text-gray-900 text-lg">₹{receiptData.amount}</td></tr></tbody>
                <tfoot><tr className="border-b-2 border-gray-300 print:border-gray-800 bg-gray-50 print:bg-transparent"><td className="py-4 px-4 text-right font-black uppercase text-gray-600 text-sm">Grand Total</td><td className="py-4 px-4 text-right font-black text-2xl text-[#4318FF] print:text-gray-900">₹{receiptData.amount}</td></tr></tfoot>
              </table>
              <div className="flex justify-between items-end mt-16 pt-8">
                <div className="text-center"><div className="w-40 border-b-2 border-gray-400 print:border-gray-800 mb-2"></div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cashier / Clerk</p></div>
                <div className="text-center"><div className="w-40 border-b-2 border-gray-400 print:border-gray-800 mb-2"></div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parent's Signature</p></div>
              </div>
              <div className="mt-10 text-center border-t border-gray-200 pt-4"><p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">This is a computer-generated receipt. Fees once paid is non-refundable.</p></div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-end gap-3 print:hidden shrink-0">
              <button onClick={() => setReceiptData(null)} className="px-6 py-2.5 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Close</button>
              <button onClick={handleWhatsAppReceipt} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all"><MessageCircle size={18} /> WhatsApp</button>
              <button onClick={handlePrintAndReset} className="px-6 py-2.5 bg-[#4318FF] text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"><Printer size={18} /> Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
