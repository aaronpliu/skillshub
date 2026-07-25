"use client";

import { Building2, Users, FolderTree, UserPlus, Shield } from "lucide-react";

export default function OrgPage() {
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
          <div className="mt-2 text-2xl font-bold">2</div>
          <div className="text-xs text-muted-foreground">Business Units</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">3</div>
          <div className="text-xs text-muted-foreground">Departments</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">3</div>
          <div className="text-xs text-muted-foreground">Teams</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="mt-2 text-2xl font-bold">89</div>
          <div className="text-xs text-muted-foreground">Members</div>
        </div>
      </div>

      {/* Org Hierarchy */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Hierarchy</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Acme Corp</span>
            <span className="text-xs text-muted-foreground">(acme-corp)</span>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span>Cloud Division</span>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-green-500" />
                <span>Engineering</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Platform Team</span>
                  <span className="text-xs">(12 members)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Frontend Team</span>
                  <span className="text-xs">(8 members)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-green-500" />
                <span>Product</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span>Data & AI</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FolderTree className="h-4 w-4 text-green-500" />
                <span>Data Science</span>
              </div>
              <div className="ml-6 flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>AI Team</span>
                <span className="text-xs">(6 members)</span>
              </div>
            </div>
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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              { name: "Alice Chen", email: "alice@acme.com", role: "owner", team: "Platform Team", status: "active" },
              { name: "Bob Smith", email: "bob@acme.com", role: "admin", team: "AI Team", status: "active" },
              { name: "Carol Lee", email: "carol@acme.com", role: "member", team: "Platform Team", status: "active" },
              { name: "Dave Park", email: "dave@acme.com", role: "member", team: "Frontend Team", status: "active" },
              { name: "Eve Wang", email: "eve@acme.com", role: "viewer", team: "Product", status: "active" },
            ].map((member) => (
              <tr key={member.email} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    {member.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    <Shield className="h-3 w-3" /> {member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.team}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
