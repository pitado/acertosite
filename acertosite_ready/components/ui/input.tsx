"use client";
import * as React from "react";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border bg-transparent p-2 text-sm border-emerald-800/70 text-emerald-50 placeholder:text-emerald-200/70 focus:ring-1 focus:ring-emerald-400 ${props.className || ""}`}
    />
  );
}