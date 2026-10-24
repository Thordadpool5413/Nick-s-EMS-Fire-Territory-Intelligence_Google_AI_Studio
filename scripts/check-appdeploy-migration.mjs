import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const paths=[];
function walk(dir){for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())walk(p);else if(/\.(tsx?|jsx?|json|html|css)$/.test(name))paths.push(p)}}
walk('src');walk('backend');paths.push('package.json','vite.config.ts','index.html');
const prohibited=[/from\s+['"](?:firebase(?:\/[^'"]+)?|@google\/genai)['"]/,/firebase\/app|firebase\/firestore|GEMINI_API_KEY|VITE_FIREBASE_/,/https?:\/\/(?:www\.)?(?:google\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|firebaseapp\.com)\//,/\/api\/gemini\//,/\b(?:useFirestoreAgencies|GeminiChatbotDrawer|CloudBackupResilienceView)\b/];
const failures=[];for(const file of paths){const s=readFileSync(file,'utf8');for(const re of prohibited){if(re.test(s))failures.push(file+': '+re)}}
const pkg=JSON.parse(readFileSync('package.json','utf8'));for(const dependency of ['firebase','@google/genai','@google/maps','@react-google-maps/api'])if(pkg.dependencies?.[dependency]||pkg.devDependencies?.[dependency])failures.push('Google dependency '+dependency);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log('PASS: '+paths.length+' files have no direct Google/Firebase/Gemini integrations.');
if(/posHash|isAfgAwarded/.test(readFileSync('src/services/nationalProviderDatabase.ts','utf8')))console.warn('EVIDENCE WARNING: Synthetic account data remains, and must never be presented as verified.');
