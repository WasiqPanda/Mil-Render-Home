import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React from 'react';

interface TacticalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const TacticalCard = ({ className, title, action, children, noPadding = false, ...props }: TacticalCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#18181b]/90 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-lg",
        className
      )}
      {...(props as any)}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          {title && (
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn("flex-1", !noPadding && "p-4")}>
        {children}
      </div>
      
      {/* Decorative corner markers for tactical feel */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-sm pointer-events-none" />
    </motion.div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-900/40 text-green-400 border-green-800/50',
    idle: 'bg-stone-800/40 text-stone-400 border-stone-700/50',
    offline: 'bg-stone-900/40 text-stone-600 border-stone-800/50',
    distress: 'bg-red-900/40 text-red-500 border-red-800/50 animate-pulse',
    engaged: 'bg-orange-900/40 text-orange-500 border-orange-800/50',
    open: 'bg-red-900/40 text-red-500 border-red-800/50',
    investigating: 'bg-orange-900/40 text-orange-500 border-orange-800/50',
    resolved: 'bg-green-900/40 text-green-400 border-green-800/50',
  };

  const defaultStyle = 'bg-stone-800/40 text-stone-400 border-stone-700/50';

  return (
    <span className={cn(
      "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm",
      styles[status] || defaultStyle
    )}>
      {status}
    </span>
  );
};
