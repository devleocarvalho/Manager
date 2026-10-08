"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
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
  login: (email: string, pass: string) => Promise<void>;
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
  status: "trial",
  plan: "trial",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  daysRemaining: 7
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenantId: "tenant-demo",
  tenantProfile: null,
  subscription: DEFAULT_SUBSCRIPTION,
  currency: "EUR",
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);

      if (currUser) {
        try {
          const tenantRef = doc(db, "tenants", currUser.uid);
          const snap = await getDoc(tenantRef);

          if (snap.exists()) {
            const data = snap.data() as TenantProfile;
            setTenantProfile(data);
          } else {
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
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, businessName: string) => {
    setLoading(true);
    try {
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
    await firebaseSignOut(auth);
    setUser(null);
    setTenantProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const activeTenantId = user ? user.uid : (tenantProfile?.tenantId || "tenant-demo");
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
        login,
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
