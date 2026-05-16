'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from './types';
import { defaultState } from './defaults';
import { auth, db, handleFirestoreError, OperationType, signOut } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import LoginScreen from '@/components/LoginScreen';

type StoreContextType = {
  state: AppState;
  updateData: <K extends keyof AppState>(key: K, data: AppState[K], silent?: boolean) => void;
  addItem: <K extends keyof AppState>(key: K, item: AppState[K] extends (infer U)[] ? U : never, silent?: boolean) => void;
  updateItem: <K extends keyof AppState>(
    key: K,
    id: string,
    updates: Partial<AppState[K] extends (infer U)[] ? U : never>,
    silent?: boolean
  ) => void;
  deleteItem: <K extends keyof AppState>(key: K, id: string, silent?: boolean) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  logout: () => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const logout = async () => {
    await signOut();
    setState(defaultState);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        setLoadingAuth(true);
        try {
          // Check if user email is authorized
          const authDocRef = doc(db, 'authorized_users', currentUser.email.toLowerCase());
          const authDoc = await getDoc(authDocRef);
          
          if (authDoc.exists() && authDoc.data().authorized === true) {
            setIsAuthorized(true);
          } else {
            // First user or explicitly unauthorized
            // We can also check if any authorized users exist. If not, the first one becomes admin?
            // But let's stick to the request: authorized by Firebase (Admin manually adds them)
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error("Error checking authorization:", error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(null);
      }
      
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingData(false);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingData(true);
    let unsubscribes: (() => void)[] = [];

    // Sync `agmp_pengaturan` doc
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.agmp_pengaturan) {
          setState(prev => ({ ...prev, agmp_pengaturan: data.agmp_pengaturan }));
        }
      } else {
        // Init default settings if not exists
        setDoc(userDocRef, { agmp_pengaturan: defaultState.agmp_pengaturan }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    unsubscribes.push(unsubUser);

    // Sync Array Collections
    const listKeys: (keyof AppState)[] = [
      'agmp_tahun_ajaran', 'agmp_kelas', 'agmp_siswa', 'agmp_tp',
      'agmp_kktp', 'agmp_rubrik', 'agmp_jurnal', 'agmp_absensi',
      'agmp_formatif', 'agmp_sumatif', 'agmp_remedial', 'agmp_rapor', 'agmp_anekdot'
    ];

    listKeys.forEach((key) => {
      const colRef = collection(db, 'users', user.uid, key);
      const unsub = onSnapshot(colRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data() }));
        setState(prev => ({ ...prev, [key]: items }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/${key}`);
      });
      unsubscribes.push(unsub);
    });

    setLoadingData(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]); // Run when user changes

  const updateData = <K extends keyof AppState>(key: K, data: AppState[K], silent = false) => {
    if (!user) return;
    
    // Optimistic update
    setState((prev) => ({ ...prev, [key]: data }));

    if (key === 'agmp_pengaturan') {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { agmp_pengaturan: data }, { merge: true })
        .then(() => { if (!silent) showToast("Pengaturan berhasil diupdate", "success"); })
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          if (!silent) showToast("Gagal menyimpan", "error");
        });
    }
  };

  const addItem = <K extends keyof AppState>(
    key: K,
    item: AppState[K] extends (infer U)[] ? U : never,
    silent = false
  ) => {
    if (!user) return;
    
    // We assume items have an `id` field.
    const itemData = item as any;
    if (!itemData.id) {
      console.error("Item requires an ID");
      return;
    }

    // Optimistic UI
    setState((prev) => {
      const list = prev[key] as any[];
      return { ...prev, [key]: [...list, item] };
    });

    const docRef = doc(db, 'users', user.uid, key as string, itemData.id);
    setDoc(docRef, itemData)
      .then(() => { if (!silent) showToast("Data berhasil ditambahkan", "success"); })
      .catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/${key as string}/${itemData.id}`);
        if (!silent) showToast("Gagal menambahkan", "error");
      });
  };

  const updateItem = <K extends keyof AppState>(
    key: K,
    id: string,
    updates: Partial<AppState[K] extends (infer U)[] ? U : never>,
    silent = false
  ) => {
    if (!user) return;

    // Optimistic UI
    setState((prev) => {
      const list = prev[key] as any[];
      const nextList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
      return { ...prev, [key]: nextList };
    });

    const docRef = doc(db, 'users', user.uid, key as string, id);
    setDoc(docRef, updates, { merge: true })
      .then(() => { if (!silent) showToast("Data berhasil diupdate", "success"); })
      .catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/${key as string}/${id}`);
        if (!silent) showToast("Gagal update", "error");
      });
  };

  const deleteItem = <K extends keyof AppState>(key: K, id: string, silent = false) => {
    if (!user) return;

    // Optimistic UI
    setState((prev) => {
      const list = prev[key] as any[];
      const nextList = list.filter((item) => item.id !== id);
      return { ...prev, [key]: nextList };
    });

    const docRef = doc(db, 'users', user.uid, key as string, id);
    deleteDoc(docRef)
      .then(() => { if (!silent) showToast("Data berhasil dihapus", "success"); })
      .catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/${key as string}/${id}`);
        if (!silent) showToast("Gagal hapus", "error");
      });
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <div className="font-medium text-gray-500">Memuat data secara aman...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isAuthorized === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6 font-medium">
            Akun Anda ({user.email}) belum terotorisasi untuk menggunakan aplikasi ini. 
            Silakan hubungi Administrator (Pemilik Firebase) untuk memberikan akses.
          </p>
          <button 
            onClick={logout}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={{ state, updateData, addItem, updateItem, deleteItem, showToast, logout }}>
      {children}
      {toast && (
        <div className={`fixed bottom-20 right-4 md:bottom-4 md:right-4 px-6 py-3 rounded-lg shadow-lg font-bold text-sm z-50 animate-in slide-in-from-bottom ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.message}
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
