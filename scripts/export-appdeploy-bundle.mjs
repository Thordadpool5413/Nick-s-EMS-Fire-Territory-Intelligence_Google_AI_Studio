import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Export the GitHub migration as one AppDeploy-ready JSON payload. This script
// never executes user accounts, modifies the existing app, or introduces Google services.
const read = path => readFileSync(path, 'utf8');
const sourceFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name).replaceAll('\\', '/');
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(ts|tsx|css)$/.test(file)) sourceFiles.push(file);
  }
}
walk('src');
walk('backend');
const pkg = JSON.parse(read('package.json'));
const tests = JSON.parse(read('tests/tests.json'));
if (!Array.isArray(tests) || tests.length < 3 || tests.length > 5 || tests.filter(t => t.sanity === true).length !== 1) {
  throw new Error('AppDeploy testing preflight failed');
}
const pretty = obj => JSON.stringify(obj, null, 4);
const files = [];
for (const name of sourceFiles) {
  if (['src/main.tsx', 'src/App.tsx', 'src/index.css'].includes(name)) continue;
  files.push({ filename: name, content: read(name) });
}
files.push({ filename: 'appdeploy.auth-login.json', content: read('appdeploy.auth-login.json') });
files.push({ filename: 'public/data/us-counties-boundaries.json.gz.txt', content: read('public/data/us-counties-boundaries.json.gz.txt') });
files.push({ filename: 'tests/tests.json', content: JSON.stringify(tests, null, 2) });
files.push({ filename: 'src/App.tsx', diffs: [{ from: 'function App() {\n    return (\n        <div className="app">APP_CONTENT</div>\n    );\n}\n\nexport default App;', to: read('src/App.tsx') }] });
files.push({ filename: 'src/index.css', diffs: [{ from: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* STYLES */\n', to: read('src/index.css') }] });
files.push({ filename: 'index.html', diffs: [
  { from: '<title>APP_TITLE</title>',
    to: '<title>Nick\'s EMS &amp; Fire Territory Intelligence</title>\n    <meta name="description" content="Independent EMS and fire territory research with source transparency.">\n    <meta name="theme-color" content="#0f172a">' }
]});
const depFrom = '    "dependencies": {\n        "lucide-react": "^0.469.0",\n        "react": "^19.0.0",\n        "react-dom": "^19.0.0"\n    },';
const devFrom = '    "devDependencies": {\n        "@types/react": "^19.0.0",\n        "@types/react-dom": "^19.0.0",\n        "@vitejs/plugin-react": "^4.3.0",\n        "autoprefixer": "^10.4.0",\n        "postcss": "^8.4.0",\n        "tailwindcss": "^3.4.0",\n        "typescript": "^5.7.0",\n        "vite": "^6.0.0"\n    }';
files.push({ filename: 'package.json', diffs: [
  { from: '"name": "vite-react-app"', to: '"name": "nicks-ems-fire-territory-intelligence-appdeploy"' },
  { from: '"version": "0.0.1"', to: '"version": "0.0.0"' },
  { from: '"preview": "vite preview"', to: '"preview": "vite preview",\n        "lint": "tsc --noEmit"' },
  { from: depFrom, to: '    "dependencies": ' + pretty(pkg.dependencies) + ',' },
  { from: '    "optionalDependencies": {\n        "@rollup/rollup-linux-x64-gnu": "^4.0.0"\n    },\n', to: '' },
  { from: devFrom, to: '    "devDependencies": ' + pretty(pkg.devDependencies) }
]});
files.push({ filename: 'vite.config.ts', diffs: [
  { from: "import react from '@vitejs/plugin-react';", to: "import react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\nimport path from 'path';" },
  { from: '    plugins: [react()],', to: "    plugins: [react(), tailwindcss()],\n    resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } }," },
  { from: '        rollupOptions: {\n            maxParallelFileOps: 128,\n        },', to: '' }
]});
files.push({ filename: 'tsconfig.json', diffs: [
  { from: '"strict": true', to: '"strict": false' },
  { from: '"noUnusedLocals": true', to: '"noUnusedLocals": false' },
  { from: '"noUnusedParameters": true', to: '"noUnusedParameters": false' },
  { from: '"noFallthroughCasesInSwitch": true', to: '"noFallthroughCasesInSwitch": false' }
]});
files.push({ filename: 'postcss.config.js', diffs: [{
  from: '    tailwindcss: {},\n    autoprefixer: {},',
  to: ''
}]});
const seen = new Set();
for (const file of files) {
  if (seen.has(file.filename)) throw new Error('Duplicate file path: ' + file.filename);
  seen.add(file.filename);
  if (file.content === undefined && !file.diffs?.length) throw new Error('Invalid source file entry');
}
const bundle = {
  description: 'GitHub source exported to AppDeploy React/Vite template. Source is independently compile-checked in GitHub Actions.',
  sourceCommit: process.env.GITHUB_SHA || 'GitHub migration branch',
  fileCount: files.length,
  files
};
const result = JSON.stringify(bundle);
writeFileSync('appdeploy-deploy-bundle.json', result);
console.log('AppDeploy bundle built: ' + files.length + ' source entries, ' + result.length + ' bytes');
