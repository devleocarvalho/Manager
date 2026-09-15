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

export interface SubscriptionInfo {
  status: "trial" | "active" | "expired" | "canceled";
  plan: "trial" | "starter" | "pro" | "enterprise";
  createdAt: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface TenantProfile {
  tenantId: string;
  businessName: string;
  ownerEmail: string;
  ownerUid: string;
  subscription: SubscriptionInfo;
}

interface AuthContextType {
  user: User | null;
  tenantId: string;
  tenantProfile: TenantProfile | null;
  subscription: SubscriptionInfo;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, businessName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

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

  // Calcula dias restantes da assinatura
  const calculateDaysRemaining = (expiresAt: string): number => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // Busca o perfil do tenant associado ao UID do usuário
          const tenantRef = doc(db, "tenants", currentUser.uid);
          const tenantSnap = await getDoc(tenantRef);

          if (tenantSnap.exists()) {
            const data = tenantSnap.data() as TenantProfile;
            const remaining = calculateDaysRemaining(data.subscription?.expiresAt || new Date().toISOString());
            const updatedStatus = remaining <= 0 && data.subscription?.status === "trial" 
              ? "expired" 
              : (data.subscription?.status || "trial");

            setTenantProfile({
              ...data,
              subscription: {
                ...data.subscription,
                status: updatedStatus,
                daysRemaining: remaining
              }
            });
          } else {
            // Novo registro inicial se o doc ainda não existir
            const initialProfile: TenantProfile = {
              tenantId: currentUser.uid,
              businessName: currentUser.displayName || "Meu Estabelecimento",
              ownerEmail: currentUser.email || "",
              ownerUid: currentUser.uid,
              subscription: DEFAULT_SUBSCRIPTION
            };
            await setDoc(tenantRef, initialProfile);
            setTenantProfile(initialProfile);
          }
        } catch (error) {
          console.warn("Aviso ao carregar perfil do assinante:", error);
          // Fallback resiliente
          setTenantProfile({
            tenantId: currentUser.uid,
            businessName: "Meu Estabelecimento",
            ownerEmail: currentUser.email || "",
            ownerUid: currentUser.uid,
            subscription: DEFAULT_SUBSCRIPTION
          });
        }
      } else {
        setTenantProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
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
        businessName: businessName.trim() || "Meu Estabelecimento",
        ownerEmail: email,
        ownerUid: cred.user.uid,
        subscription: {
          status: "trial",
          plan: "trial",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 7
        }
      };

      await setDoc(doc(db, "tenants", cred.user.uid), newTenant);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        businessName,
        tenantId: cred.user.uid,
        role: "owner",
        createdAt: new Date().toISOString()
      });

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

  // Se o usuário estiver autenticado, usa o seu UID como tenantId isolado.
  // Caso contrário em ambiente de demonstração local, usa tenant-demo.
  const activeTenantId = user ? user.uid : (tenantProfile?.tenantId || "tenant-demo");

  const currentSubscription: SubscriptionInfo = tenantProfile?.subscription || DEFAULT_SUBSCRIPTION;

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantId: activeTenantId,
        tenantProfile,
        subscription: currentSubscription,
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
