"use client";

import { useState } from "react";
import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, UserPlus, MoreVertical, Mail, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function MemberManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");

  // Query
  const { data, isPending, error } = trpc.org.listMembers.useQuery(
    { search: search || undefined, role: roleFilter || undefined },
    { placeholderData: keepPreviousData }
  );

  // Mutations
  const inviteMutation = trpc.org.inviteMember.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "listMembers"] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
    },
  });

  const updateRoleMutation = trpc.org.updateMemberRole.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "listMembers"] });
    },
  });

  const members = data?.members ?? [];
  const total = data?.total ?? 0;

  const handleInvite = () => {
    if (!inviteEmail || !inviteName) return;
    inviteMutation.mutate({
      email: inviteEmail,
      name: inviteName,
      role: inviteRole,
    });
  };

  const handleRoleChange = (memberId: string, newRole: "admin" | "bu_admin" | "dept_admin" | "team_admin" | "member" | "viewer") => {
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="viewer">Viewer</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {inviteMutation.isError && (
            <div className="text-sm text-red-600">Failed to send invitation: {inviteMutation.error.message}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteEmail || !inviteName}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Invitation
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
          <div className="mt-1 text-2xl font-bold">{isPending ? "..." : total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="mt-1 text-2xl font-bold">
            {isPending ? "..." : members.filter((m) => m.active).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="mt-1 text-2xl font-bold">
            {isPending ? "..." : members.filter((m) => m.role === "admin").length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Viewers</div>
          <div className="mt-1 text-2xl font-bold">
            {isPending ? "..." : members.filter((m) => m.role === "viewer").length}
          </div>
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
          <option value="bu_admin">BU Admin</option>
          <option value="dept_admin">Dept Admin</option>
          <option value="team_admin">Team Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border bg-card">
        {isPending && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-sm text-red-600">
            Failed to load members: {error.message}
          </div>
        )}

        {!isPending && !error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                          {member.user?.name
                            ? member.user.name.split(" ").map((n) => n[0]).join("")
                            : "?"}
                        </span>
                      </div>
                      <span className="font-medium">{member.user?.name ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.user?.email ?? "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as "admin" | "bu_admin" | "dept_admin" | "team_admin" | "member" | "viewer")}
                      disabled={updateRoleMutation.isPending}
                      className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="admin">Admin</option>
                      <option value="bu_admin">BU Admin</option>
                      <option value="dept_admin">Dept Admin</option>
                      <option value="team_admin">Team Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {member.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
