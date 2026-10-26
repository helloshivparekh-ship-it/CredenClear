import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  title: string;
  subtitle: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, title, subtitle }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
