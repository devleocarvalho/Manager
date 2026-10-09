"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { TenantProfile, SubscriptionInfo, TenantSettings, CurrencyCode } from "../domain/types";

interface AuthContextType {
  user: User | null;
  tenantId: string;
  tenantProfile: TenantProfile | null;
  subscription: SubscriptionInfo;
  currency: CurrencyCode;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  register: (email: string, pass: string, businessName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const DEFAULT_SETTINGS: TenantSettings = {
  currency: "EUR",
  currencySymbol: "€",
  locale: "pt-PT",
  defaultVatRate: 23,
  businessCountry: "PT"
};

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  status: "active",
  plan: "pro",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  daysRemaining: 30
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenantId: "demo-tenant",
  tenantProfile: null,
  subscription: DEFAULT_SUBSCRIPTION,
  currency: "EUR",
  loading: true,
  isDemoMode: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  loginAsDemo: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Se estiver em modo demonstração local
    if (typeof window !== "undefined" && localStorage.getItem("meugerente_demo_mode") === "true") {
      setIsDemoMode(true);
      setTenantProfile({
        tenantId: "demo-tenant",
        businessName: "Restaurante Lisboa Demo",
        ownerEmail: "demo@meugerente.com",
        ownerUid: "demo-tenant",
        subscription: DEFAULT_SUBSCRIPTION,
        settings: DEFAULT_SETTINGS
      });
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);

      if (currUser) {
        setIsDemoMode(false);
        try {
          const tenantRef = doc(db, "tenants", currUser.uid);
          const snap = await getDoc(tenantRef);

          if (snap.exists()) {
            const data = snap.data() as TenantProfile;
            setTenantProfile(data);
          } else {
            const initial: TenantProfile = {
              tenantId: currUser.uid,
              businessName: currUser.displayName ? `${currUser.displayName}` : "Meu Estabelecimento",
              ownerEmail: currUser.email || "",
              ownerUid: currUser.uid,
              subscription: DEFAULT_SUBSCRIPTION,
              settings: DEFAULT_SETTINGS
            };
            await setDoc(tenantRef, initial);
            setTenantProfile(initial);
          }
        } catch (e) {
          console.warn("Tenant perfil fallback:", e);
        }
      } else {
        setTenantProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      localStorage.removeItem("meugerente_demo_mode");
      setIsDemoMode(false);
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("meugerente_demo_mode");
      setIsDemoMode(false);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const currUser = res.user;

      const tenantRef = doc(db, "tenants", currUser.uid);
      const snap = await getDoc(tenantRef);
      if (!snap.exists()) {
        const initial: TenantProfile = {
          tenantId: currUser.uid,
          businessName: currUser.displayName || "Meu Restaurante",
          ownerEmail: currUser.email || "",
          ownerUid: currUser.uid,
          subscription: DEFAULT_SUBSCRIPTION,
          settings: DEFAULT_SETTINGS
        };
        await setDoc(tenantRef, initial);
        setTenantProfile(initial);
      } else {
        setTenantProfile(snap.data() as TenantProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, "demo@meugerente.com", "demo123456");
      setIsDemoMode(false);
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          const cred = await createUserWithEmailAndPassword(auth, "demo@meugerente.com", "demo123456");
          const tenantRef = doc(db, "tenants", cred.user.uid);
          const initial: TenantProfile = {
            tenantId: cred.user.uid,
            businessName: "Restaurante Lisboa Demo",
            ownerEmail: "demo@meugerente.com",
            ownerUid: cred.user.uid,
            subscription: DEFAULT_SUBSCRIPTION,
            settings: DEFAULT_SETTINGS
          };
          await setDoc(tenantRef, initial);
          setTenantProfile(initial);
          setIsDemoMode(false);
          return;
        } catch (regErr) {
          console.warn("Falha ao registrar demo no Firebase:", regErr);
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("meugerente_demo_mode", "true");
      }
      setIsDemoMode(true);
      setTenantProfile({
        tenantId: "demo-tenant",
        businessName: "Restaurante Lisboa Demo",
        ownerEmail: "demo@meugerente.com",
        ownerUid: "demo-tenant",
        subscription: DEFAULT_SUBSCRIPTION,
        settings: DEFAULT_SETTINGS
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, businessName: string) => {
    setLoading(true);
    try {
      localStorage.removeItem("meugerente_demo_mode");
      setIsDemoMode(false);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newTenant: TenantProfile = {
        tenantId: cred.user.uid,
        businessName: businessName.trim() || "Meu Restaurante",
        ownerEmail: email,
        ownerUid: cred.user.uid,
        subscription: DEFAULT_SUBSCRIPTION,
        settings: DEFAULT_SETTINGS
      };
      await setDoc(doc(db, "tenants", cred.user.uid), newTenant);
      setTenantProfile(newTenant);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("meugerente_demo_mode");
    }
    setIsDemoMode(false);
    await firebaseSignOut(auth).catch(() => {});
    setUser(null);
    setTenantProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const activeTenantId = user ? user.uid : (isDemoMode ? "demo-tenant" : (tenantProfile?.tenantId || "demo-tenant"));
  const activeCurrency: CurrencyCode = tenantProfile?.settings?.currency || "EUR";

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantId: activeTenantId,
        tenantProfile,
        subscription: tenantProfile?.subscription || DEFAULT_SUBSCRIPTION,
        currency: activeCurrency,
        loading,
        isDemoMode,
        login,
        loginWithGoogle,
        loginAsDemo,
        register,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
