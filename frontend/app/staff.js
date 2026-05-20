"use client";
import React, { useState, useEffect } from 'react';
import { Briefcase, UserPlus, X, Loader2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null); // For edit functionality
  const [photoFile, setPhotoFile] = useState(null); // For handling photo upload
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null); // For displaying photo preview

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : []);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error(err);
      setStaffList([]);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  // Function to handle form submission for both add and edit
  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Indicate loading while submitting

    const form = e.target;
    const formData = new FormData();

    formData.append("first_name", form.first_name.value);
    formData.append("last_name", form.last_name.value);
    formData.append("designation", form.designation.value);
    formData.append("mobile_no", form.mobile_no.value);

    // Only append photo if a new one is selected
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    // Determine method and URL based on whether we are editing or adding
    const method = currentStaff ? "PUT" : "POST";
    const url = currentStaff ? `${API_BASE_URL}/staff/${currentStaff.id}/` : `${API_BASE_URL}/staff/`;

    try {
      const res = await fetch(url, {
        method: method,
        body: formData // FormData automatically sets 'Content-Type': 'multipart/form-data'
      });
      if (res.ok) {
        toast.success(`टीचर/स्टाफ सफलतापूर्वक ${currentStaff ? 'अपडेट' : 'जोड़' } कर दिया गया!`);
        setIsModalOpen(false);
        fetchStaff();
        // Reset form specific states
        setCurrentStaff(null);
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
      } else {
        const errorData = await res.json();
        console.error("Error submitting staff:", errorData);
        // Handle different types of errors (e.g., validation errors)
        if (errorData.detail) {
          alert("❌ Error: " + errorData.detail);
        } else if (errorData.non_field_errors) {
          alert("❌ Error: " + errorData.non_field_errors.join(", "));
        } else {
          alert("❌ Error: स्टाफ को " + (currentStaff ? "अपडेट" : "जोड़ने") + " में विफल रहा। कृपया पुनः प्रयास करें।");
        }
      }
    } catch (err) {
      console.error("Network or server error:", err);
      alert("❌ सर्वर से संपर्क विफल! कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।");
    }
    setIsLoading(false);
  };

  const handleEditStaff = (staff) => {
    // TODO: Implement edit functionality.
    // This would typically open the modal, pre-fill the form with staff data,
    // and change the form's submit action to an UPDATE request.
    alert(`Editing staff: ${staff.first_name} ${staff.last_name}`);
    setCurrentStaff(staff);
    // Set initial photo preview if staff has one
    if (staff.photo_url) {
      setPhotoPreviewUrl(staff.photo_url);
    } else {
      setPhotoPreviewUrl(null);
    }
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreviewUrl(currentStaff?.photo_url || null); // Revert to existing photo if any
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (confirm(`Are you sure you want to delete staff member with ID: ${staffId}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/staff/${staffId}/`, {
          method: 'DELETE'
        });
        if (res.ok) {
          toast.success('स्टाफ सदस्य को सफलतापूर्वक हटा दिया गया है।');
          fetchStaff(); // लिस्ट रिफ्रेश करें
        } else {
          const errorData = await res.json();
          toast.error('हटाने में विफल: ' + (errorData.detail || 'Server error'));
        }
      } catch (err) {
        toast.error('सर्वर से संपर्क विफल।');
      }
    }
  };

  // Effect to reset form states when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setCurrentStaff(null);
      setPhotoFile(null);
      setPhotoPreviewUrl(null);
    }
  }, [isModalOpen]);


  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1B2559] dark:text-white">Staff Management</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#4318FF] text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold">
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#4318FF]" size={40} /></div>
      ) : staffList.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-20 text-center border border-dashed border-gray-300">
          <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No staff members found. Add your first teacher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl shadow-sm border border-gray-50 dark:border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {staff.photo_url ? (
                  // Display staff photo if available
                    <img src={staff.photo_url} alt={`${staff.first_name} ${staff.last_name}`} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-slate-700" />
                ) : (
                  // Display initials if no photo
                  <div className="w-16 h-16 rounded-full bg-[#E9EDF7] dark:bg-slate-800 flex items-center justify-center text-[#4318FF] text-xl font-bold uppercase">
                    {staff.first_name?.[0]}{staff.last_name?.[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-heading dark:text-white leading-tight">{staff.first_name} {staff.last_name}</h3>
                  <p className="text-sm font-bold text-gray-400 mb-1">{staff.designation}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/> {staff.mobile_no}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => handleEditStaff(staff)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Edit</button>
                <button onClick={() => handleDeleteStaff(staff.id)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
              <h3 className="text-lg font-bold text-heading dark:text-white">{currentStaff ? "Edit Staff / Teacher" : "Register Staff / Teacher"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmitStaff} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1 uppercase text-gray-500">First Name</label><input name="first_name" required className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" defaultValue={currentStaff?.first_name} /></div>
                <div><label className="block text-xs font-bold mb-1 uppercase text-gray-500">Last Name</label><input name="last_name" required className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" defaultValue={currentStaff?.last_name} /></div>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID field removed as per user request to replace with buttons on card */}
                {/* For add form, if employee ID is still needed for backend, it can be kept.
                    However, the user explicitly said "id की जरुरत नहीं उसकी जगम buttons आ सकते हैं"
                    which I interpreted as removing it from display on the card and not needing it as input for registration if it's auto-generated.
                    If employee_id is still required for ADD/EDIT, it should be re-added here.
                    For now, based on "id की जरुरत नहीं", I'm removing it from the form as well.
                */}
                {/* <div><label className="block text-xs font-bold mb-1 uppercase text-gray-500">Employee ID</label><input name="employee_id" required placeholder="TCH-001" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" defaultValue={currentStaff?.employee_id} /></div> */}
                <div><label className="block text-xs font-bold mb-1 uppercase text-gray-500">Role/Designation</label>
                  <select name="designation" className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" defaultValue={currentStaff?.designation}>
                    <option value="Teacher">शिक्षक</option>
                    <option value="Principal">प्रधानाचार्य</option>
                    <option value="Accountant">लेखाकार</option>
                    <option value="Peon">चपरासी</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-bold mb-1 uppercase text-gray-500">Mobile No.</label><input name="mobile_no" required className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" defaultValue={currentStaff?.mobile_no} /></div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-500">Staff Photo</label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoPreviewUrl && (
                  <div className="mt-4 flex flex-col items-center">
                    <img
                      src={photoPreviewUrl}
                      alt="Staff Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-400 shadow-md"
                    />
                    <p className="text-xs text-gray-500 mt-2">Photo Preview</p>
                  </div>
                )}
                {/* If currentStaff has a photo_url but no new file is selected, show existing photo */} 
                {!photoPreviewUrl && currentStaff?.photo_url && (
                  <p className="text-xs text-gray-500 mt-2">No new photo selected. Existing photo will be used.</p>
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-[#4318FF] text-white rounded-2xl font-bold hover:bg-blue-700 mt-4" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin inline-block mr-2" size={20}/> : ''}{currentStaff ? "Update Staff" : "Save Staff"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}