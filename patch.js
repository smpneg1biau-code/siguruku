const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

const target = `    setState((prev) => {
      const list = prev[key] as any[];
      const nextList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
      return { ...prev, [key]: nextList };
    });

    const docRef = doc(db, 'users', user.uid, key as string, id);
    return setDoc(docRef, updates, { merge: true })`;

const replacement = `    let fullItem: any = null;

    setState((prev) => {
      const list = prev[key] as any[];
      const nextList = list.map((item) => {
        if (item.id === id) {
          fullItem = { ...item, ...updates };
          return fullItem;
        }
        return item;
      });
      return { ...prev, [key]: nextList };
    });

    const docRef = doc(db, 'users', user.uid, key as string, id);
    const payload = fullItem || updates;
    return setDoc(docRef, payload, { merge: true })`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('lib/store.tsx', code);
  console.log('Patched');
} else {
  console.log('Target not found');
}
