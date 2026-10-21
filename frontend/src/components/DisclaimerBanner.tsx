import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200/90 flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Independent Prototype:</strong> This application is an independent developer demonstration utilizing the Model Context Protocol (MCP) and Supabase PostgreSQL. It is <em>not</em> an official Amazon product and is not affiliated with or endorsed by Amazon.com, Inc.
        </span>
      </div>
    </div>
  );
};
