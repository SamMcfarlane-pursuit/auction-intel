#!/usr/bin/env node
// One-shot class migration: dark-terminal palette -> warm-paper + indigo accent.
// Processes every .jsx and .js under src/ (excluding this script).
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const ROOT = resolve(process.argv[2] || "src");
const EXTS = new Set([".jsx", ".js"]);
const files = [];

function walk(dir) {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const s = statSync(p);
        if (s.isDirectory()) walk(p);
        else if (EXTS.has(extname(p))) files.push(p);
    }
}
walk(ROOT);

// Replacement rules. ORDER MATTERS — more specific / longer patterns first.
// All patterns use regex with word-ish boundaries to avoid partial matches.
// We rely on [-a-z0-9/] context around each class.
const rules = [
    // --- hover states (must come before base bg-slate-900 etc.) ---
    [/\bhover:bg-slate-950\b/g, "hover:bg-slate-50"],
    [/\bhover:bg-slate-900\b/g, "hover:bg-slate-100"],
    [/\bhover:bg-slate-800\b/g, "hover:bg-slate-100"],
    [/\bhover:bg-slate-700\b/g, "hover:bg-slate-200"],
    [/\bhover:text-slate-300\b/g, "hover:text-slate-700"],
    [/\bhover:text-slate-200\b/g, "hover:text-slate-800"],
    [/\bhover:text-slate-600\b/g, "hover:text-slate-800"],
    [/\bhover:border-slate-700\b/g, "hover:border-slate-300"],
    [/\bhover:border-slate-400\b/g, "hover:border-slate-500"],
    [/\bgroup-hover:bg-slate-950\b/g, "group-hover:bg-slate-50"],
    [/\bgroup-hover:border-slate-600\b/g, "group-hover:border-slate-400"],

    // --- blue accent -> indigo ---
    [/\bhover:bg-blue-700\b/g, "hover:bg-indigo-700"],
    [/\bhover:bg-blue-600\b/g, "hover:bg-indigo-600"],
    [/\bhover:bg-blue-50\b/g, "hover:bg-indigo-50"],
    [/\bhover:text-blue-700\b/g, "hover:text-indigo-700"],
    [/\bhover:text-blue-600\b/g, "hover:text-indigo-600"],
    [/\bhover:text-blue-300\b/g, "hover:text-indigo-400"],
    [/\bhover:border-blue-500\b/g, "hover:border-indigo-500"],
    [/\bhover:border-blue-200\b/g, "hover:border-indigo-200"],
    [/\bfocus:ring-blue-500\b/g, "focus:ring-indigo-500"],
    [/\bfocus:border-blue-500\b/g, "focus:border-indigo-500"],
    [/\bgroup-hover:border-blue-500\b/g, "group-hover:border-indigo-500"],
    [/\bring-blue-500\b/g, "ring-indigo-500"],
    [/\bring-blue-400\b/g, "ring-indigo-400"],
    [/\bbg-blue-900\/50\b/g, "bg-indigo-100"],
    [/\bbg-blue-900\/20\b/g, "bg-indigo-50"],
    [/\bbg-blue-700\b/g, "bg-indigo-700"],
    [/\bbg-blue-600\b/g, "bg-indigo-600"],
    [/\bbg-blue-500\/20\b/g, "bg-indigo-500/20"],
    [/\bbg-blue-500\/10\b/g, "bg-indigo-500/10"],
    [/\bbg-blue-500\b/g, "bg-indigo-500"],
    [/\bbg-blue-200\b/g, "bg-indigo-200"],
    [/\bbg-blue-100\b/g, "bg-indigo-100"],
    [/\bbg-blue-50\/50\b/g, "bg-indigo-50/50"],
    [/\bbg-blue-50\b/g, "bg-indigo-50"],
    [/\btext-blue-900\b/g, "text-indigo-900"],
    [/\btext-blue-700\b/g, "text-indigo-700"],
    [/\btext-blue-600\b/g, "text-indigo-600"],
    [/\btext-blue-500\b/g, "text-indigo-500"],
    [/\btext-blue-400\b/g, "text-indigo-500"],
    [/\btext-blue-300\/60\b/g, "text-indigo-400/70"],
    [/\btext-blue-300\b/g, "text-indigo-400"],
    [/\btext-blue-200\b/g, "text-indigo-400"],
    [/\bborder-blue-900\/50\b/g, "border-indigo-200"],
    [/\bborder-blue-500\/50\b/g, "border-indigo-300"],
    [/\bborder-blue-500\b/g, "border-indigo-500"],
    [/\bborder-blue-200\b/g, "border-indigo-200"],
    [/\bborder-blue-100\b/g, "border-indigo-100"],

    // --- slate dark surfaces -> warm-paper light ---
    // Preserve explicit opacity suffixes (/5, /10, /20, /30, /40, /50, /70, /80)
    [/\bbg-slate-950\/80\b/g, "bg-white/85"],
    [/\bbg-slate-950\/20\b/g, "bg-slate-100/70"],
    [/\bbg-slate-950\/10\b/g, "bg-slate-100/60"],
    [/\bbg-slate-950\/5\b/g, "bg-slate-100/50"],
    [/\bbg-slate-900\/80\b/g, "bg-white/90"],
    [/\bbg-slate-900\/70\b/g, "bg-white/80"],
    [/\bbg-slate-900\/50\b/g, "bg-white/70"],
    [/\bbg-slate-900\/40\b/g, "bg-white/60"],
    [/\bbg-slate-900\/30\b/g, "bg-white/50"],
    [/\bbg-slate-800\/50\b/g, "bg-slate-100/70"],
    [/\bbg-slate-800\/40\b/g, "bg-slate-100/60"],
    [/\bbg-slate-700\/50\b/g, "bg-slate-200/70"],

    [/\bbg-slate-950\b/g, "bg-canvas"],
    [/\bbg-slate-900\b/g, "bg-surface"],
    [/\bbg-slate-800\b/g, "bg-panel"],
    [/\bbg-slate-700\b/g, "bg-panel-2"],
    [/\bbg-slate-600\b/g, "bg-slate-300"],
    [/\bbg-slate-500\b/g, "bg-slate-400"],

    // --- slate text: invert lightness tier ---
    [/\btext-slate-100\b/g, "text-slate-900"],
    [/\btext-slate-200\b/g, "text-slate-800"],
    [/\btext-slate-300\b/g, "text-slate-700"],
    [/\btext-slate-400\b/g, "text-slate-600"],
    // text-slate-500/600 already fine on light bg; leave
    [/\bplaceholder-slate-500\b/g, "placeholder-slate-400"],
    [/\bdivide-slate-50\b/g, "divide-slate-200"],

    // --- slate borders: dark -> light ---
    [/\bborder-slate-800\b/g, "border-slate-200"],
    [/\bborder-slate-900\b/g, "border-slate-200"],
    [/\bborder-slate-700\/50\b/g, "border-slate-300/60"],
    [/\bborder-slate-700\b/g, "border-slate-300"],
    [/\bborder-slate-600\b/g, "border-slate-400"],

    // --- gray-* (generic) -> slate for consistency ---
    [/\bbg-gray-900\b/g, "bg-surface"],
    [/\bbg-gray-800\b/g, "bg-panel"],
    [/\bbg-gray-700\b/g, "bg-panel-2"],
    [/\bhover:bg-gray-700\b/g, "hover:bg-slate-200"],
    [/\bhover:bg-gray-600\b/g, "hover:bg-slate-300"],
    [/\btext-gray-400\b/g, "text-slate-600"],
    [/\btext-gray-500\b/g, "text-slate-500"],
    [/\btext-gray-300\b/g, "text-slate-700"],

    // --- emerald / dark-bg-assuming tints ---
    [/\bbg-emerald-500\/20\b/g, "bg-emerald-100"],
    [/\bborder-emerald-900\/30\b/g, "border-emerald-200"],
    [/\bborder-emerald-500\/30\b/g, "border-emerald-300"],
    [/\btext-emerald-400\b/g, "text-emerald-600"],
    [/\btext-emerald-500\/60\b/g, "text-emerald-600/80"],
    [/\bbg-red-500\/20\b/g, "bg-rose-100"],
    [/\bbg-red-500\/10\b/g, "bg-rose-50"],
    [/\btext-red-400\b/g, "text-rose-600"],
    [/\btext-red-500\b/g, "text-rose-600"],
    [/\bbg-red-500\b/g, "bg-rose-500"],
    [/\btext-red-600\b/g, "text-rose-600"],
    [/\btext-red-300\b/g, "text-rose-500"],
    [/\bbg-amber-500\/20\b/g, "bg-amber-100"],

    // --- second-pass cleanups ---
    [/\bdivide-slate-800\b/g, "divide-slate-200"],
    [/\bdivide-slate-700\b/g, "divide-slate-200"],
    [/\bshadow-blue-500\/30\b/g, "shadow-indigo-500/20"],
    [/\bshadow-blue-500\/20\b/g, "shadow-indigo-500/15"],
    [/\bshadow-blue-500\/10\b/g, "shadow-indigo-500/10"],
    [/\bshadow-blue-500\/5\b/g, "shadow-indigo-500/5"],
    [/\bshadow-blue-600\/20\b/g, "shadow-indigo-600/20"],
    [/\bshadow-blue-200\b/g, "shadow-indigo-200"],
    [/\bshadow-purple-500\/20\b/g, "shadow-violet-500/20"],
    [/\bhover:shadow-blue-500\/30\b/g, "hover:shadow-indigo-500/25"],
    [/\bhover:shadow-blue-500\/5\b/g, "hover:shadow-indigo-500/10"],
    [/\bfocus:ring-blue-100\b/g, "focus:ring-indigo-200"],
    [/\bfocus:ring-blue-200\b/g, "focus:ring-indigo-200"],
];

let changed = 0;
for (const file of files) {
    const src = readFileSync(file, "utf8");
    let out = src;
    for (const [re, rep] of rules) out = out.replace(re, rep);
    if (out !== src) {
        writeFileSync(file, out);
        changed++;
        console.log("updated:", file);
    }
}
console.log(`\n${changed}/${files.length} files updated.`);
