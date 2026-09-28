import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading, signInAsDemoUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          The channel administration portal is strictly restricted to authenticated administrators. Please log in with your credentials.
        </p>

        <div className="pt-4 flex flex-col gap-2.5">
          <Link
            to="/admin/login"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Key className="w-4 h-4" /> Admin Login (/admin/login)
          </Link>
          <button
            onClick={() => signInAsDemoUser(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            Quick Sign In as Admin
          </button>
          <Link
            to="/"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Live TV Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
