"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin#users" },
  { label: "Fishing Zones", href: "/admin#zones" },
  { label: "Safety", href: "/admin#safety" },
  { label: "Reports", href: "/admin#reports" },
  { label: "Settings", href: "/admin#settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    const check = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (!res.ok || String(data.user?.role ?? "").toLowerCase() !== "admin") {
          setState("denied");
          return;
        }
        setState("allowed");
      } catch {
        setState("denied");
      }
    };
    check();
  }, [isLogin, pathname]);

  if (isLogin) return <>{children}</>;

  if (state === "checking") {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Checking access…</p>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="text-slate-300 text-sm">
            This area is reserved for Smart Ocean administrators. Please sign in with an
            administrator account.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/admin/login" className="px-5 py-2 bg-white text-slate-900 rounded-lg font-semibold">
              Admin sign in
            </Link>
            <button onClick={() => router.push("/dashboard")} className="px-5 py-2 border border-slate-600 rounded-lg">
              Back to app
            </button>
          </div>
        </div>
      </main>
    );
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white">
        <div className="p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400">Smart Ocean</p>
          <h2 className="text-xl font-bold">Administration</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-lg text-slate-200 hover:bg-slate-800 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-1">
          <Link href="/dashboard" className="block px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm">
            Back to app
          </Link>
          <button onClick={logout} className="w-full text-left px-4 py-2 rounded-lg text-red-300 hover:bg-slate-800 text-sm font-medium">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
