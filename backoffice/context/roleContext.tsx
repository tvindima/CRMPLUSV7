'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getSession } from "@/src/services/auth";

type Role = "guest" | "agent" | "leader" | "admin" | "staff";

type RoleContextValue = {
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  setRole: (r: Role) => void;
  permissions: {
    canEditAllProperties: boolean;
    canEditTeamOnly: boolean;
    canViewReports: boolean;
    canManageAutomation: boolean;
  };
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const session = await getSession();
        const r = session?.role === "staff" ? "admin" : (session?.role as Role) || "guest";
        setRole(r);
      } catch {
        setRole("guest");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const permissions = useMemo(() => {
    if (role === "admin") {
      return { canEditAllProperties: true, canEditTeamOnly: true, canViewReports: true, canManageAutomation: true };
    }
    if (role === "leader") {
      return { canEditAllProperties: false, canEditTeamOnly: true, canViewReports: true, canManageAutomation: true };
    }
    if (role === "agent" || role === "staff") {
      return { canEditAllProperties: false, canEditTeamOnly: true, canViewReports: false, canManageAutomation: false };
    }
    return { canEditAllProperties: false, canEditTeamOnly: false, canViewReports: false, canManageAutomation: false };
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, permissions, isAuthenticated: role !== "guest", loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole deve ser usado dentro de RoleProvider");
  return ctx;
}
