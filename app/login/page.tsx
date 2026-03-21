// app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (phoneNumber.length !== 10) return setError("Please enter a valid 10-digit number.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // 🔴 NAYA: Browser me real user data save kar rahe hain
      localStorage.setItem('whatsapp_user', JSON.stringify(data.user));

      setSuccess("Login successful! Redirecting to chat...");
      setTimeout(() => router.push('/chat'), 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans text-neutral-900">
      <div className="bg-white border border-neutral-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 md:p-12 shadow-sm w-full max-w-md sm:max-w-lg transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 tracking-tight">Log in to WhatsApp</h1>
          <p className="text-sm sm:text-base text-neutral-500">Enter your phone number and password to continue.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 mt-0.5" /><p className="text-sm text-red-700 font-medium">{error}</p></div>}
        {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-[#25D366] rounded-r-lg flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#25D366] mt-0.5" /><p className="text-sm text-green-800 font-medium">{success}</p></div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-5 flex-shrink-0 rounded-[2px] overflow-hidden shadow-[0_0_1px_rgba(0,0,0,0.5)]"><img src="https://flagcdn.com/w40/in.png" alt="India Flag" className="w-full h-full object-cover" /></div>
                <span className="text-base font-medium text-neutral-800">India</span>
              </div>
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all">
            <span className="text-base pr-3 text-neutral-500 font-medium border-r border-neutral-300 mr-3">{countryCode}</span>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} required placeholder="Phone number" className="flex-grow text-base bg-transparent focus:outline-none placeholder-neutral-400 w-full" />
          </div>

          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-3 focus-within:border-[#128C7E] focus-within:ring-1 focus-within:ring-[#128C7E] transition-all">
            <Lock className="w-5 h-5 text-neutral-400 mr-3 flex-shrink-0" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Password" className="flex-grow text-base bg-transparent focus:outline-none placeholder-neutral-400 w-full" />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={isLoading} className={`w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold text-lg py-3.5 rounded-full shadow-md transition-all duration-200 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-500">
          Don't have an account? <Link href="/register" className="text-[#128C7E] font-semibold hover:underline">Register here</Link>
        </div>
      </div>
    </main>
  );
}