"use client";
import * as React from "react";
export function Card({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`rounded-xl border bg-emerald-900/50 ${className}`} />;
}
export function CardContent({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`p-6 ${className}`} />;
}