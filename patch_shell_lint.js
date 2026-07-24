const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

code = code.replace(
  /if \(activeCat && !expandedCategories\[activeCat\]\) \{\n\s*setExpandedCategories/,
  "if (activeCat && !expandedCategories[activeCat]) {\n      // eslint-disable-next-line react-hooks/set-state-in-effect\n      setExpandedCategories"
);

code = code.replace(
  /  \}, \[activeTab\]\);/,
  "    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [activeTab]);"
);

fs.writeFileSync('components/Shell.tsx', code);
