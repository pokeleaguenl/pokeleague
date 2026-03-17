"use client";

import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({
  children,
  className = "",
}: ResponsiveContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
