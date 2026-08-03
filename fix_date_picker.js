const fs = require('fs');
const path = 'components/modules/Formatif.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the container
content = content.replace(
  /<div key=\{anekdot\.id\} className="flex gap-2 items-center">/g,
  '<div key={anekdot.id} className="flex flex-col sm:flex-row gap-2 sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0">'
);

// Update date picker
content = content.replace(
  /<input\s+type="date"\s+className="text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white"\s+value=\{anekdot\.tanggal \|\| ''\}/g,
  `<input 
                              type="date"
                              className="text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white w-full sm:w-auto"
                              value={anekdot.tanggal || ''}`
);

// Update select
content = content.replace(
  /<select\s+className="text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white"\s+value=\{anekdot\.kategori\}/g,
  `<select 
                              className="text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white w-full sm:w-auto"
                              value={anekdot.kategori}`
);

// Update text input
content = content.replace(
  /<input\s+type="text"\s+placeholder="Ketik catatan\.\.\."\s+className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white"\s+value=\{anekdot\.teks\}/g,
  `<input 
                              type="text" 
                              placeholder="Ketik catatan..."
                              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white w-full" 
                              value={anekdot.teks}`
);

// Update button trash
content = content.replace(
  /<button onClick=\{\(\) => handleRemoveAnekdot\(s\.id, idx\)\} className="text-red-500 hover:bg-red-50 p-1\.5 rounded-lg transition-colors">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>/g,
  `<button onClick={() => handleRemoveAnekdot(s.id, idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors w-full sm:w-auto flex justify-center border border-red-100 sm:border-transparent mt-1 sm:mt-0">
                              <Trash2 className="w-4 h-4" />
                            </button>`
);

fs.writeFileSync(path, content);
console.log("Fixed date picker size");
