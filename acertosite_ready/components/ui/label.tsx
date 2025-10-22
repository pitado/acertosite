"use client";
import * as React from "react";
export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`block mb-1 text-sm ${props.className || ""}`} />;
}