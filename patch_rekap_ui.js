const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAkhir.tsx', 'utf8');

const target1 = `                            ) : res.status === "TUNTAS" ? (`;
const replace1 = `                            ) : res.status === "TUNTAS" || res.status === "TUNTAS (Remedial)" ? (`;

const target2 = `                            className={\`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${res.status === "TUNTAS" ? "bg-[#E8F5E9] text-[#34C759] border border-[#34C759]/20" : res.status === "BELUM TUNTAS" ? "bg-[#FFEBEE] text-[#FF3B30] border border-[#FF3B30]/20" : "bg-[#F5F5F7] text-[#8E8E93] border border-[#E5E5EA]"}\`}`;
const replace2 = `                            className={\`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider \${res.status === "TUNTAS" || res.status === "TUNTAS (Remedial)" ? "bg-[#E8F5E9] text-[#34C759] border border-[#34C759]/20" : res.status === "BELUM TUNTAS" ? "bg-[#FFEBEE] text-[#FF3B30] border border-[#FF3B30]/20" : "bg-[#F5F5F7] text-[#8E8E93] border border-[#E5E5EA]"}\`}`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
fs.writeFileSync('components/modules/RekapAkhir.tsx', code);
console.log('Patched UI strings');
