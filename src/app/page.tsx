'use client';

import { redirect } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    redirect('/rooms');
  } else {
    redirect('/login');
  }
}
