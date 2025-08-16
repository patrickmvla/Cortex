"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { token, clearToken } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  if (!token) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to the Dashboard</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You are successfully logged in.
      </p>
      <Button onClick={handleLogout} className="mt-8">
        Logout
      </Button>
    </div>
  );
}
