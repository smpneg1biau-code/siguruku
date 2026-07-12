const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

const search = `  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingData(false);
      return;
    } 
    
    setLoadingData(true);
    let unsubscribes: (() => void)[] = [];

    // Sync \`agmp_pengaturan\` doc`;

const replacement = `  useEffect(() => {
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
          isAuthorized: userIsAdmin, // admin is automatically authorized
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
        
        setIsAuthorized(userIsAdmin);
      } else {
        const data = docSnap.data();
        setIsAuthorized(userIsAdmin ? true : !!data?.isAuthorized);
      }
    });
    unsubscribes.push(unsubAuth);

    // Sync \`agmp_pengaturan\` doc`;

const updated = code.replace(search, replacement);
fs.writeFileSync('lib/store.tsx', updated);
console.log(code === updated ? "NO CHANGE" : "CHANGED");
