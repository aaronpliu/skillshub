"use client";

import { useState } from "react";
import { Shield, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

const MOCK_POLICIES = [
  {
    id: "1",
    name: "Allow Internal Skills",
    effect: "allow",
    priority: 100,
    description: "Allow all internal users to access internal-classified skills",
    conditions: [
      { attribute: "user.classification", operator: "equals", value: "internal" },
      { attribute: "skill.classification", operator: "equals", value: "internal" },
    ],
    status: "active",
  },
  {
    id: "2",
    name: "Restrict Confidential Skills",
    effect: "deny",
    priority: 200,
    description: "Deny access to confidential skills for non-engineering teams",
    conditions: [
      { attribute: "skill.classification", operator: "equals", value: "confidential" },
      { attribute: "user.department", operator: "not_equals", value: "engineering" },
    ],
    status: "active",
  },
  {
    id: "3",
    name: "Team Visibility",
    effect: "allow",
    priority: 150,
    description: "Allow team members to access team-scoped skills",
    conditions: [
      { attribute: "user.team", operator: "equals", value: "skill.team" },
      { attribute: "skill.visibility", operator: "equals", value: "team" },
    ],
    status: "active",
  },
  {
    id: "4",
    name: "Block External Sharing",
    effect: "deny",
    priority: 300,
    description: "Prevent sharing of restricted skills outside organization",
    conditions: [
      { attribute: "skill.classification", operator: "equals", value: "restricted" },
      { attribute: "share.scope", operator: "equals", value: "external" },
    ],
    status: "active",
  },
];

export default function AccessPoliciesPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  const [policyName, setPolicyName] = useState("");
  const [policyEffect, setPolicyEffect] = useState("allow");
  const [policyPriority, setPolicyPriority] = useState("100");
  const [policyDescription, setPolicyDescription] = useState("");
  const [conditions, setConditions] = useState([
    { attribute: "", operator: "equals", value: "" },
  ]);

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyName(policy.name);
    setPolicyEffect(policy.effect);
    setPolicyPriority(policy.priority.toString());
    setPolicyDescription(policy.description);
    setConditions(policy.conditions);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPolicy(null);
    setPolicyName("");
    setPolicyEffect("allow");
    setPolicyPriority("100");
    setPolicyDescription("");
    setConditions([{ attribute: "", operator: "equals", value: "" }]);
    setShowEditor(true);
  };

  const addCondition = () => {
    setConditions([...conditions, { attribute: "", operator: "equals", value: "" }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Policies</h1>
          <p className="text-muted-foreground">Define attribute-based access control (ABAC) policies</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create Policy
        </button>
      </div>

      {/* Policy Editor */}
      {showEditor && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingPolicy ? "Edit Policy" : "Create New Policy"}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Policy Name</label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g., Allow Team Access"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <input
                type="number"
                value={policyPriority}
                onChange={(e) => setPolicyPriority(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Lower numbers = higher priority</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Effect</label>
            <select
              value={policyEffect}
              onChange={(e) => setPolicyEffect(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={policyDescription}
              onChange={(e) => setPolicyDescription(e.target.value)}
              placeholder="What does this policy do?"
              rows={2}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Conditions</label>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Condition
              </button>
            </div>
            {conditions.map((condition, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={condition.attribute}
                  onChange={(e) => updateCondition(index, "attribute", e.target.value)}
                  placeholder="Attribute (e.g., user.team)"
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, "operator", e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="in">in</option>
                </select>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <CheckCircle className="h-4 w-4" /> Save Policy
            </button>
            <button
              onClick={() => setShowEditor(false)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Policies List */}
      <div className="space-y-3">
        {MOCK_POLICIES.map((policy) => (
          <div key={policy.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  policy.effect === "allow" ? "bg-green-100" : "bg-red-100"
                }`}>
                  <Shield className={`h-5 w-5 ${
                    policy.effect === "allow" ? "text-green-700" : "text-red-700"
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{policy.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      policy.effect === "allow" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {policy.effect}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      priority: {policy.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{policy.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {policy.conditions.map((condition, idx) => (
                      <span key={idx} className="rounded bg-secondary px-2 py-0.5 text-xs">
                        {condition.attribute} {condition.operator} {condition.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(policy)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
