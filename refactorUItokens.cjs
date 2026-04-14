const fs = require('fs');
const path = require('path');

const UI_MAPPINGS = [
    // 1. Root Containers -> Dark Mode
    { regex: /\bbg-white\b/g, replacement: 'bg-slate-950' },
    { regex: /\bbg-slate-50\b/g, replacement: 'bg-slate-900' },
    { regex: /\bbg-slate-100\b/g, replacement: 'bg-slate-900' },
    { regex: /\bborder-slate-50\b/g, replacement: 'border-slate-800' },
    { regex: /\bborder-slate-100\b/g, replacement: 'border-slate-800' },
    { regex: /\bborder-slate-200\b/g, replacement: 'border-slate-700' },
    { regex: /\btext-slate-800\b/g, replacement: 'text-slate-200' },
    { regex: /\btext-slate-900\b/g, replacement: 'text-slate-100' },
    { regex: /\btext-slate-700\b/g, replacement: 'text-slate-300' },
    
    // 2. Eradicate Bubbles / Radii / Shadows
    { regex: /\brounded-xl\b/g, replacement: 'rounded-sm' },
    { regex: /\brounded-2xl\b/g, replacement: 'rounded-md' },
    { regex: /\brounded-3xl\b/g, replacement: 'rounded-md' },
    { regex: /\brounded-full\b/g, replacement: 'rounded-sm' },
    { regex: /\bshadow-lg\b/g, replacement: 'shadow-none' },
    { regex: /\bshadow-xl\b/g, replacement: 'shadow-none' },
    { regex: /\bshadow-2xl\b/g, replacement: 'shadow-none' },
    { regex: /\bshadow-sm\b/g, replacement: 'shadow-none' },
    
    // 3. Typography & Badges
    { regex: /\btext-2xl\b/g, replacement: 'text-lg font-mono' },
    { regex: /\btext-3xl\b/g, replacement: 'text-xl font-mono' },
    { regex: /\btext-4xl\b/g, replacement: 'text-2xl font-mono' },
    { regex: /\btext-5xl\b/g, replacement: 'text-3xl font-mono' },
    { regex: /\bfont-black\b/g, replacement: 'font-semibold' },
    { regex: /\bfont-display\b/g, replacement: 'font-mono' },
    
    // 4. Eradicate Gradient Backings
    { regex: /\bbg-gradient-to-(?:r|l|t|b|tr|tl|br|bl)\b/g, replacement: 'bg-slate-900' },
    { regex: /\bfrom-[a-z]+-[0-9]+\b/g, replacement: '' },
    { regex: /\bto-[a-z]+-[0-9]+\b/g, replacement: '' },
    { regex: /\bvia-[a-z]+-[0-9]+\b/g, replacement: '' },
    
    // 5. Mute AI Animations
    { regex: /\banimate-pulse\b/g, replacement: 'animate-none' },
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const { regex, replacement } of UI_MAPPINGS) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            }
            
            // Clean up multiple spaces inside className strings without breaking lines
            if (modified) {
                // Find all className="..." attributes and clean up double spaces inside them
                content = content.replace(/className="([^"]*)"/g, (match, classStr) => {
                    return `className="${classStr.replace(/\s+/g, ' ').trim()}"`;
                });
                
                // Do the same for dynamic classNames: className={`...`}
                content = content.replace(/className=\{`([^`]+)`\}/g, (match, classStr) => {
                    return `className={\`${classStr.replace(/ {2,}/g, ' ')}\`}`;
                });

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// Start processing the /src directory
const targetDir = path.resolve('./src');
if (fs.existsSync(targetDir)) {
    processDirectory(targetDir);
    console.log("Terminal UI Refactor complete!");
} else {
    console.log("Could not find src directory at: " + targetDir);
}
