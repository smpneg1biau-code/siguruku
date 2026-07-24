const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

code = code.replace(
  /isAdmin: boolean;\n  isAuthorized: boolean \| null;/,
  'isAdmin: boolean;\n  isKoordinator: boolean;\n  isAuthorized: boolean | null;'
);

code = code.replace(
  /const \[isAdmin, setIsAdmin\] = useState<boolean>\(false\);/,
  'const [isAdmin, setIsAdmin] = useState<boolean>(false);\n  const [isKoordinator, setIsKoordinator] = useState<boolean>(false);'
);

code = code.replace(
  /setIsAdmin\(false\);\n      return;/,
  'setIsAdmin(false);\n      setIsKoordinator(false);\n      return;'
);

code = code.replace(
  /setIsAuthorized\(userIsAdmin \? true : !!data\?\.isAuthorized\);\n      \}/,
  'setIsAuthorized(userIsAdmin ? true : !!data?.isAuthorized);\n        setIsKoordinator(!!data?.isKoordinator);\n      }'
);

code = code.replace(
  /setIsAuthorized\(userIsAdmin\);\n      \} else \{/,
  'setIsAuthorized(userIsAdmin);\n        setIsKoordinator(false);\n      } else {'
);

code = code.replace(
  /isAdmin,\n    isAuthorized,/,
  'isAdmin,\n    isKoordinator,\n    isAuthorized,'
);

fs.writeFileSync('lib/store.tsx', code);
