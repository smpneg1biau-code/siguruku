const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

// Modify StoreContextType
code = code.replace(
  /type StoreContextType = \{/,
  `type StoreContextType = {\n  isAdmin: boolean;\n  isAuthorized: boolean | null;`
);

// Modify Provider value
code = code.replace(
  /<StoreContext\.Provider value=\{\{ state, updateData, addItem, updateItem, deleteItem, clearAllData, restoreAllData, showToast, logout \}\}>/,
  `<StoreContext.Provider value={{ state, updateData, addItem, updateItem, deleteItem, clearAllData, restoreAllData, showToast, logout, isAdmin, isAuthorized }}>`
);

// Add state for isAdmin
code = code.replace(
  /const \[isAuthorized, setIsAuthorized\] = useState<boolean \| null>\(true\);/,
  `const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);\n  const [isAdmin, setIsAdmin] = useState<boolean>(false);`
);

// Change the useEffect to handle authorization
const useEffectAuthStr = `
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingData(false);
      setIsAuthorized(null);
      setIsAdmin(false);
      return;
    } 

    const adminEmail = "smpneg1biau@gmail.com";
    const userIsAdmin = user.email === adminEmail;
    setIsAdmin(userIsAdmin);
    
    setLoadingData(true);
    let unsubscribes: (() => void)[] = [];

    // Authorization check
    const appUserRef = doc(db, 'app_users', user.uid);
    const unsubAuth = onSnapshot(appUserRef, (docSnap) => {
      if (!docSnap.exists()) {
        // Register new user
        setDoc(appUserRef, {
          email: user.email,
          name: user.displayName || user.email,
          isAuthorized: userIsAdmin,
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
        
        if (!userIsAdmin) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } else {
        const data = docSnap.data();
        setIsAuthorized(userIsAdmin ? true : !!data?.isAuthorized);
      }
    });
    unsubscribes.push(unsubAuth);

    // Sync \`agmp_pengaturan\` doc
`;

code = code.replace(
  /useEffect\(\(\) => \{\n    if \(\!user\) \{\n      \/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setLoadingData\(false\);\n      return;\n    \}\n    \n    setLoadingData\(true\);\n    let unsubscribes: \(\(\) => void\)\[\] = \[\];\n\n    \/\/ Sync `agmp_pengaturan` doc/,
  useEffectAuthStr
);

fs.writeFileSync('lib/store.tsx', code);
