"use client";

import { useState } from "react";
import { Search, Plus, UserPlus, MoreVertical, Mail } from "lucide-react";

const MOCK_MEMBERS = [
  { id: "1", name: "Alice Chen", email: "alice@acme.com", role: "admin", team: "Data Platform", status: "active", joined: "2026-01-15" },
  { id: "2", name: "Bob Smith", email: "bob@acme.com", role: "reviewer", team: "Document Services", status: "active", joined: "2026-02-20" },
  { id: "3", name: "Carol Lee", email: "carol@acme.com", role: "developer", team: "Platform Engineering", status: "active", joined: "2026-03-10" },
  { id: "4", name: "Dave Park", email: "dave@acme.com", role: "developer", team: "Engineering Excellence", status: "active", joined: "2026-04-05" },
  { id: "5", name: "Eve Wang", email: "eve@acme.com", role: "viewer", team: "Business Intelligence", status: "inactive", joined: "2026-05-12" },
  { id: "6", name: "Frank Liu", email: "frank@acme.com", role: "developer", team: "Communications", status: "pending", joined: "2026-07-20" },
];

export default function MemberManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");

  const filtered = MOCK_MEMBERS.filter((member) => {
    const matchesSearch = !search || member.name.includes(search) || member.email.includes(search);
    const matchesRole = !roleFilter || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>
        <button
          onClick={() => setShowInviteDialog(!showInviteDialog)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invite New Member</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@acme.com"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Mail className="h-4 w-4" /> Send Invitation
            </button>
            <button
              onClick={() => setShowInviteDialog(false)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Members</div>
          <div className="mt-1 text-2xl font-bold">{MOCK_MEMBERS.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="mt-1 text-2xl font-bold">{MOCK_MEMBERS.filter((m) => m.status === "active").length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Pending Invites</div>
          <div className="mt-1 text-2xl font-bold">{MOCK_MEMBERS.filter((m) => m.status === "pending").length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="mt-1 text-2xl font-bold">{MOCK_MEMBERS.filter((m) => m.role === "admin").length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="reviewer">Reviewer</option>
          <option value="developer">Developer</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-medium text-primary">{member.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={member.role}
                    className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="developer">Developer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.team}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.status === "active" ? "bg-green-100 text-green-700" :
                    member.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.joined}</td>
                <td className="px-4 py-3">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
