import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-16 bg-background"></div>}>
        <Navbar />
      </Suspense>
      <section className="mx-auto w-full max-w-full overflow-x-hidden px-4 sm:max-w-xl 
      sm:px-6 md:max-w-2xl md:px-8 lg:max-w-4xl lg:px-10 xl:max-w-6xl xl:px-12 2xl:max-w-7xl 2xl:px-16">
        <HeroSection />
      </section>
    </main>
  );
}
