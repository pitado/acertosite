"use client";
import * as React from "react";
export function Button({ className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-md px-3 py-2 text-sm font-medium transition ${className}`} {...rest} />;
}