"use client";
import Link from "next/link";
import React, { useState, useRef } from "react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAdminPhoto(imageUrl);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          Super Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/super-admin" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Dashboard
          </Link>
          <Link href="/super-admin/schools" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Manage Schools
          </Link>
          <Link href="/super-admin/users" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Manage Users
          </Link>
          <Link href="/super-admin/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800">Vivekanand ERP - Super Admin Panel</h1>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <div className="flex items-center gap-3 pr-4 border-r border-gray-300">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-800">Super Admin</span>
                  <span className="text-xs text-gray-500">Administrator</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                />
                <div 
                  className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500 overflow-hidden cursor-pointer flex items-center justify-center text-sm font-bold text-blue-600 hover:opacity-80 transition shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Super Admin Photo"
                >
                  {adminPhoto ? (
                    <img src={adminPhoto} alt="Admin Profile" className="w-full h-full object-cover" />
                  ) : (
                    "SA"
                  )}
                </div>
              </div>
            )}
            
            {/* Login / Logout Toggle Switch */}
            <label className="flex items-center cursor-pointer group" title="Toggle Login Status">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isLoggedIn} 
                  onChange={() => setIsLoggedIn(!isLoggedIn)} 
                />
                <div className={`block w-12 h-7 rounded-full shadow-inner transition-colors ${isLoggedIn ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow ${isLoggedIn ? 'transform translate-x-5' : ''}`}></div>
              </div>
              <div className={`ml-3 text-sm font-semibold w-12 ${isLoggedIn ? 'text-red-500' : 'text-green-500'}`}>
                {isLoggedIn ? "Logout" : "Login"}
              </div>
            </label>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {isLoggedIn ? children : (
            <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
              <div className="text-gray-400 text-6xl">🔒</div>
              <h2 className="text-2xl font-bold text-gray-600">Access Denied</h2>
              <p className="text-gray-500">Please login to view the Super Admin Dashboard.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
