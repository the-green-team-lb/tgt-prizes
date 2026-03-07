"use client";

import AdminPanel from "@/components/AdminPanel";
import AdminAuth from "@/components/AdminAuth";

export default function AdminPage() {
  return (
    <AdminAuth>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gradient-gold mb-8">Admin Control Panel</h1>
        <AdminPanel />
      </div>
    </AdminAuth>
  );
}
