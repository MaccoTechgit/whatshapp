import { redirect } from 'next/navigation';

export default function Home() {
  // Jab koi app open kare, usko seedha Login Page par bhej do
  redirect('/login');
}