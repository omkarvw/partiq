"use client";

import { motion, useReducedMotion } from "motion/react";
import { Factory, Gauge, IndianRupee, Zap } from "lucide-react";

export function PulseLottie({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const nodes = [
    { icon: Factory, label: "Plant", className: "left-[8%] top-[10%]" },
    { icon: Zap, label: "Inputs", className: "right-[8%] top-[10%]" },
    { icon: Gauge, label: "MHR", className: "left-[8%] bottom-[10%]" },
    { icon: IndianRupee, label: "Profit", className: "right-[8%] bottom-[10%]" },
  ];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      aria-label="Plant decision graph"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 256 256"
        className="absolute inset-[12%] h-[76%] w-[76%] overflow-visible"
      >
        <defs>
          <linearGradient id="decision-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00685f" stopOpacity=".2" />
            <stop offset=".5" stopColor="#00685f" stopOpacity=".85" />
            <stop offset="1" stopColor="#515f74" stopOpacity=".25" />
          </linearGradient>
        </defs>
        <path
          d="M48 48 L128 128 L208 48"
          fill="none"
          stroke="url(#decision-line)"
          strokeWidth="2"
        />
        <path
          d="M48 208 L128 128 L208 208"
          fill="none"
          stroke="url(#decision-line)"
          strokeWidth="2"
        />
        {[0, 1, 2].map((ring) => (
          <motion.circle
            key={ring}
            cx="128"
            cy="128"
            r="28"
            fill="none"
            stroke="#00685f"
            strokeWidth="2"
            initial={{ opacity: 0.4, scale: 0.85 }}
            animate={
              reducedMotion
                ? { opacity: 0.2, scale: 1 }
                : { opacity: [0.5, 0], scale: [0.85, 1.55] }
            }
            transition={{
              duration: 2.4,
              repeat: reducedMotion ? 0 : Infinity,
              delay: ring * 0.7,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "128px 128px" }}
          />
        ))}
      </svg>

      <motion.div
        className="absolute left-1/2 top-1/2 z-10 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-primary/20 bg-white text-primary shadow-lg"
        animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-center">
          <span className="block font-mono text-sm font-bold">Cash</span>
          <span className="label-caps block text-[9px]">MHR</span>
        </span>
      </motion.div>

      {nodes.map(({ icon: Icon, label, className: pos }, index) => (
        <motion.div
          key={label}
          className={`absolute z-10 flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-white/80 bg-white/95 text-primary shadow-md ${pos}`}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, delay: 0.1 + index * 0.06 }}
        >
          <Icon className="h-4 w-4" />
          <span className="mt-0.5 text-[10px] font-semibold text-on-surface">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
