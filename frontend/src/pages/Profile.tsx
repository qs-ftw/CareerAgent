import { useState, useEffect } from "react";
import { useProfile, useProfileCompleteness, useUpsertProfile } from "@/hooks/useProfile";
import type { ProfileUpsertRequest, ProfileContact } from "@/types";

const EMPTY_CONTACT: ProfileContact = {
  email: "",
  phone: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
  location: "",
};

export function Profile() {
  const { data: profile, isLoading } = useProfile();
  const { data: completeness } = useProfileCompleteness();
  const upsert = useUpsertProfile();

  const [form, setForm] = useState<ProfileUpsertRequest>({
    headline: "",
    exit_story: "",
    superpowers: [],
    proof_points: [],
    compensation: {},
    location: {},
    preferences: {},
    constraints: {},
    contact: { ...EMPTY_CONTACT },
  });

  const [superInput, setSuperInput] = useState("");

  // Sync form when profile data loads
  useEffect(() => {
    if (profile) {
      setForm({
        headline: profile.headline ?? "",
        exit_story: profile.exit_story ?? "",
        superpowers: profile.superpowers ?? [],
        proof_points: profile.proof_points ?? [],
        compensation: profile.compensation ?? {},
        location: profile.location ?? {},
        preferences: profile.preferences ?? {},
        constraints: profile.constraints ?? {},
        contact: { ...EMPTY_CONTACT, ...(profile.contact ?? {}) },
      });
    }
  }, [profile]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }

  const handleSave = () => {
    upsert.mutate(form);
  };

  const updateContact = (field: keyof ProfileContact, value: string) => {
    setForm((prev) => ({
      ...prev,
      contact: { ...(prev.contact ?? EMPTY_CONTACT), [field]: value },
    }));
  };

  const addSuperpower = () => {
    const trimmed = superInput.trim();
    if (trimmed && !form.superpowers?.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        superpowers: [...(prev.superpowers ?? []), trimmed],
      }));
      setSuperInput("");
    }
  };

  const removeSuperpower = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      superpowers: (prev.superpowers ?? []).filter((_, i) => i !== idx),
    }));
  };

  const contactFields: { key: keyof ProfileContact; label: string; placeholder: string }[] = [
    { key: "email", label: "邮箱", placeholder: "you@example.com" },
    { key: "phone", label: "电话", placeholder: "+86 138-xxxx-xxxx" },
    { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
    { key: "github_url", label: "GitHub", placeholder: "https://github.com/..." },
    { key: "portfolio_url", label: "作品集", placeholder: "https://..." },
    { key: "location", label: "地区", placeholder: "北京" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">候选人画像</h2>
        {completeness && (
          <span className="text-sm text-muted-foreground">
            完善度: {completeness.completeness_pct}%
          </span>
        )}
      </div>

      {/* Completeness bar */}
      {completeness && completeness.completeness_pct < 100 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          <span className="font-medium">建议补充: </span>
          {completeness.missing_high_value.join("、")}
        </div>
      )}

      {/* Headline */}
      <div className="space-y-2">
        <label className="text-sm font-medium">职业标语</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.headline}
          onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
          placeholder="例如: Agent 开发工程师，专注于长期自动化系统"
        />
      </div>

      {/* Exit Story */}
      <div className="space-y-2">
        <label className="text-sm font-medium">求职动机</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          value={form.exit_story}
          onChange={(e) => setForm((prev) => ({ ...prev, exit_story: e.target.value }))}
          placeholder="为什么看新机会？"
        />
      </div>

      {/* Superpowers */}
      <div className="space-y-2">
        <label className="text-sm font-medium">核心优势</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            value={superInput}
            onChange={(e) => setSuperInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSuperpower())}
            placeholder="输入核心优势，按回车添加"
          />
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={addSuperpower}
          >
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.superpowers ?? []).map((sp, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium"
            >
              {sp}
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeSuperpower(idx)}
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        <label className="text-sm font-medium">联系方式</label>
        <p className="text-xs text-muted-foreground">保存后，生成简历时会自动填充联系方式</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {contactFields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-muted-foreground">{f.label}</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.contact?.[f.key] ?? ""}
                onChange={(e) => updateContact(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          onClick={handleSave}
          disabled={upsert.isPending}
        >
          {upsert.isPending ? "保存中..." : "保存"}
        </button>
      </div>

      {upsert.isSuccess && (
        <div className="text-sm text-green-600">保存成功</div>
      )}
    </div>
  );
}
