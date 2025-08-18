import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 2v20" />
            <path d="M22 12h-4" />
            <path d="M6 12H2" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76-2.83 2.83" />
          </svg>
          <span className="ml-2 text-lg font-semibold">Cortex</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Sign Up
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Cortex: Your Unified AI Knowledge Engine
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Ask natural language questions and receive grounded, cited answers from your private documents and the web.
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 Cortex. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link 
            href="https://github.com/patrickmvla/Cortex" 
            className="text-xs hover:underline underline-offset-4" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </nav>
      </footer>
    </div>
  );
}
