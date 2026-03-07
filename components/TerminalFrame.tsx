"use client";

interface TerminalFrameProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function TerminalFrame({ title, children, className = "" }: TerminalFrameProps) {
  return (
    <div className={`terminal-frame ${className}`}>
      {title && (
        <div className="terminal-frame-header">
          {"[ "}{title}{" ]"}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
