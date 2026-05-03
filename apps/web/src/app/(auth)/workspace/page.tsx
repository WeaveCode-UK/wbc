"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@wbc/ui/components/button";
import { useTranslations } from "next-intl";

interface WorkspaceInfo {
  tenantId: string;
  tenantName: string;
  slug: string;
  role: string;
  plan: string;
  status: string;
}

export default function WorkspaceSelectorPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { update } = useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trpc/auth.listWorkspaces")
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data?.result?.data?.workspaces ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectWorkspace = async (tenantId: string) => {
    setSelecting(tenantId);
    try {
      await update({ tenantId });
      router.push("/");
      router.refresh();
    } catch {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-text-tertiary">{t("workspace.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">
          {t("workspace.title")}
        </h1>
        <p className="mt-2 text-text-tertiary">{t("workspace.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {workspaces.map((ws) => (
          <Button
            key={ws.tenantId}
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => selectWorkspace(ws.tenantId)}
            disabled={selecting !== null}
          >
            <div className="text-left">
              <p className="font-medium">{ws.tenantName}</p>
              <p className="text-xs text-text-tertiary">
                {ws.role} · {ws.plan}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
