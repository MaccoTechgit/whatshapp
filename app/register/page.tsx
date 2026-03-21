// app/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (name.length < 3) return setError("Name must be at least 3 characters long.");
    if (phoneNumber.length !== 10) return setError("Please enter a valid 10-digit phone number.");
    if (password.length < 6) return setError("Password must be at least 6 characters long.");

    setIsLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phoneNumber: fullPhoneNumber, password }),
      });

      // HTML Error check
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API Route nahi mili. Folder structure: app/api/auth/register/route.ts hona chahiye.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => router.push('/login'), 2000);

    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-neutral-900">
      <div className="bg-white border border-neutral-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 md:p-12 shadow-sm w-full max-w-md sm:max-w-lg transition-all duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 tracking-tight">Create an account</h1>
          <p className="text-sm sm:text-base text-neutral-500">Enter your details to register for WhatsApp Clone.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-[#25D366] rounded-r-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all">
            <User className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="flex-grow text-base bg-transparent focus:outline-none placeholder-neutral-400 w-full" />
          </div>

          <div className="relative border border-neutral-300 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-7 h-5 flex-shrink-0 rounded-[2px] overflow-hidden shadow-[0_0_1px_rgba(0,0,0,0.5)]">
                <img src="https://flagcdn.com/w40/in.png" alt="India Flag" className="w-full h-full object-cover" />
              </div>
              <span className="text-base font-medium text-neutral-800">India</span>
            </div>
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          </div>

          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all">
            <span className="text-base pr-3 text-neutral-500 font-medium border-r border-neutral-300 mr-3">{countryCode}</span>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} required placeholder="Phone number" className="flex-grow text-base bg-transparent focus:outline-none placeholder-neutral-400 w-full" />
          </div>

          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all">
            <Lock className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Create Password" className="flex-grow text-base bg-transparent focus:outline-none placeholder-neutral-400 w-full" />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={isLoading} className={`w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold text-lg py-3.5 rounded-full shadow-md transition-all duration-200 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}>
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-500">
          Already have an account? <Link href="/login" className="text-[#128C7E] font-semibold hover:underline">Log In</Link>
        </div>
      </div>
    </main>
  );
}