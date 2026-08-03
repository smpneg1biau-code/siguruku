const fs = require('fs');
const path = 'components/modules/Formatif.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<\/select>\s*<\/div>\s*<div className="flex bg-gray-100 p-1 rounded-xl">/,
  `</select>
        
        <div className="flex-1 sm:flex-none flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg bg-white min-w-[200px]">
          <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Tanggal:</label>
          <input 
            type="date"
            className="text-sm font-medium outline-none bg-transparent w-full text-gray-900 cursor-pointer"
            value={selectedTanggal}
            onChange={(e) => setSelectedTanggal(e.target.value)}
          />
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl">`
);

fs.writeFileSync(path, content);
console.log("Added main date picker to Formatif.tsx");
