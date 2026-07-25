"use client";

import { Building2, Users, FolderTree, UserPlus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function OrgPage() {
  const { data: org, isPending, error } = trpc.org.getHierarchy.useQuery();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load organization: {error.message}
      </div>
    );
  }

  if (!org) return null;

  const businessUnits = org.businessUnits ?? [];
  const members = org.members ?? [];

  // Count totals from hierarchy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countDepartments = (bus: any[]): number => {
    let count = 0;
    for (const bu of bus) {
      count += (bu.departments?.length ?? 0);
      if (bu.children) {
        count += countDepartments(bu.children);
      }
    }
    return count;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countTeams = (bus: any[]): number => {
    let count = 0;
    for (const bu of bus) {
      for (const dept of bu.departments ?? []) {
        count += dept.teams?.length ?? 0;
      }
      if (bu.children) {
        count += countTeams(bu.children);
      }
    }
    return count;
  };

  const totalDepartments = countDepartments(businessUnits);
  const totalTeams = countTeams(businessUnits);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground">Manage your organization structure and members</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {/* Org Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">{businessUnits.length}</div>
          <div className="text-xs text-muted-foreground">Business Units</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">{totalDepartments}</div>
          <div className="text-xs text-muted-foreground">Departments</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">{totalTeams}</div>
          <div className="text-xs text-muted-foreground">Teams</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">{members.length}</div>
          <div className="text-xs text-muted-foreground">Members</div>
        </div>
      </div>

      {/* Org Hierarchy */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Hierarchy</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">{org.name}</span>
            <span className="text-xs text-muted-foreground">({org.slug})</span>
          </div>
          <div className="ml-6 space-y-2">
            {businessUnits.map((bu) => (
              <div key={bu.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>{bu.name}</span>
                  <span className="text-xs text-muted-foreground">({bu.slug})</span>
                </div>
                <div className="ml-6 space-y-2">
                  {(bu.departments ?? []).map((dept) => (
                    <div key={dept.id}>
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-green-500" />
                        <span>{dept.name}</span>
                        <span className="text-xs text-muted-foreground">({dept.slug})</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {(dept.teams ?? []).map((team) => (
                          <div key={team.id} className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{team.name}</span>
                            <span className="text-xs">({team.slug})</span>
                          </div>
                        ))}
                        {(!dept.teams || dept.teams.length === 0) && (
                          <div className="text-xs text-muted-foreground italic">No teams</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {bu.children?.map((child) => (
                    <div key={child.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-400" />
                        <span>{child.name}</span>
                        <span className="text-xs text-muted-foreground">({child.slug})</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {(child.departments ?? []).map((dept) => (
                          <div key={dept.id} className="flex items-center gap-2 text-muted-foreground">
                            <FolderTree className="h-3.5 w-3.5" />
                            <span>{dept.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {businessUnits.length === 0 && (
              <div className="text-sm text-muted-foreground italic">No business units configured yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Members</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {member.user?.name
                        ? member.user.name.split(" ").map((n) => n[0]).join("")
                        : "?"}
                    </div>
                    {member.user?.name ?? "Unknown"}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.user?.email ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> active
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
