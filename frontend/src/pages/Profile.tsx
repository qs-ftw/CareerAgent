import { useState, useEffect, useCallback, useRef } from "react";
import { useProfile, useProfileCompleteness, useUpsertProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Upload,
  CheckCircle,
  Loader2,
  Pencil,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Save,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileUpsertRequest, ResumeImportResult } from "@/types";

export function Profile() {
  const { data: profile, isLoading } = useProfile();
  const { data: completeness } = useProfileCompleteness();
  const upsert = useUpsertProfile();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileUpsertRequest>({
    name: "",
    headline: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    github_url: "",
    location: "",
    professional_summary: "",
    skill_categories: {},
  });

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ResumeImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        headline: profile.headline ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        portfolio_url: profile.portfolio_url ?? "",
        github_url: profile.github_url ?? "",
        location: profile.location ?? "",
        professional_summary: profile.professional_summary ?? "",
        skill_categories: profile.skill_categories ?? {},
      });
    }
  }, [profile]);

  const handleImport = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setImportError("只支持 PDF 格式的简历文件");
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const resp = await profileApi.importResume(file);
      const result = resp.data as ResumeImportResult;
      setImportResult(result);
      if (result.profile) {
        setForm({
          name: result.profile.name ?? "",
          headline: result.profile.headline ?? "",
          email: result.profile.email ?? "",
          phone: result.profile.phone ?? "",
          linkedin_url: result.profile.linkedin_url ?? "",
          portfolio_url: result.profile.portfolio_url ?? "",
          github_url: result.profile.github_url ?? "",
          location: result.profile.location ?? "",
          professional_summary: result.profile.professional_summary ?? "",
          skill_categories: result.profile.skill_categories ?? {},
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["workExperiences"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "简历解析失败，请重试";
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  }, [queryClient]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImport(file);
    },
    [handleImport]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImport(file);
      e.target.value = "";
    },
    [handleImport]
  );

  const handleSave = () => {
    upsert.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        headline: profile.headline ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        portfolio_url: profile.portfolio_url ?? "",
        github_url: profile.github_url ?? "",
        location: profile.location ?? "",
        professional_summary: profile.professional_summary ?? "",
        skill_categories: profile.skill_categories ?? {},
      });
    }
    setEditing(false);
  };

  const weCount = importResult?.work_experiences?.length ?? 0;
  const projCount = importResult?.projects?.length ?? 0;
  const achCount = importResult?.achievements?.length ?? 0;

  const hasProfile = profile && (
    profile.name || 
    profile.headline || 
    profile.email || 
    profile.professional_summary || 
    (profile.skill_categories && Object.keys(profile.skill_categories).length > 0)
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <Header 
        title="个人画像" 
        description="管理你的核心职业属性与联系方式"
        actions={
          editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="notion-button-secondary py-1.5 flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={upsert.isPending}
                className="notion-button-primary py-1.5 flex items-center gap-1.5 disabled:opacity-50"
              >
                {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="notion-button-secondary py-1.5 flex items-center gap-1.5"
              >
                <Upload className="h-4 w-4" />
                导入简历
              </button>
              <button
                onClick={() => setEditing(true)}
                className="notion-button-primary py-1.5 flex items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                编辑画像
              </button>
            </div>
          )
        }
      />
      <PageContainer className="max-w-4xl space-y-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-notion-gray-500 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-notion-blue" />
            加载中...
          </div>
        ) : (
          <>
            {/* ── PDF Import Hidden Input ──────────────── */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* ── Import Status Overlay ───────────────── */}
            {importing && (
              <div className="notion-card p-6 border-notion-blue bg-notion-badge-bg animate-pulse">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-notion-blue" />
                  <span className="text-sm font-bold text-notion-blue">正在从简历中提取你的职业资产...</span>
                </div>
              </div>
            )}

            {importResult && !importing && (
              <div className="notion-pill bg-green-50 text-green-700 px-4 py-3 flex items-center gap-3 rounded-lg border border-green-100 shadow-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-bold">简历导入成功: 已提取 {weCount} 经历 / {projCount} 项目 / {achCount} 成果</span>
                <button onClick={() => setImportResult(null)} className="ml-auto hover:opacity-70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {importError && (
              <div className="notion-pill bg-red-50 text-red-700 px-4 py-3 flex items-center gap-3 rounded-lg border border-red-100 shadow-sm">
                <span className="font-bold">{importError}</span>
                <button onClick={() => setImportError(null)} className="ml-auto hover:opacity-70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Profile Content ─────────────────────── */}
            <div 
              className={cn("relative", editing && "notion-card p-8")}
              onDrop={handleDrop}
            >
              {editing ? (
                /* ========== EDIT MODE ========== */
                <div className="space-y-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">姓名</label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="张三"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">职业标语</label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.headline}
                        onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                        placeholder="5年经验后端工程师，专注于分布式系统"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">专业摘要</label>
                    <textarea
                      className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all resize-none"
                      rows={4}
                      value={form.professional_summary}
                      onChange={(e) => setForm((p) => ({ ...p, professional_summary: e.target.value }))}
                      placeholder="简要描述你的职业背景和核心优势..."
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">邮箱</label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">电话</label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+86 138-xxxx-xxxx"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">地区</label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.location}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="北京"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Github className="h-3 w-3" /> GitHub
                      </label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.github_url}
                        onChange={(e) => setForm((p) => ({ ...p, github_url: e.target.value }))}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </label>
                      <input
                        className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                        value={form.linkedin_url}
                        onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="h-3 w-3" /> 作品集 / 个人主页
                    </label>
                    <input
                      className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 transition-all"
                      value={form.portfolio_url}
                      onChange={(e) => setForm((p) => ({ ...p, portfolio_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : (
                /* ========== READ MODE ========== */
                <div className="space-y-12">
                  {hasProfile ? (
                    <>
                      {/* Name & Headline */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-8">
                        <div className="space-y-3">
                          <h1 className="text-5xl font-extrabold tracking-tightest text-foreground">
                            {profile?.name || "未填写姓名"}
                          </h1>
                          {profile?.headline && (
                            <p className="text-xl font-bold text-notion-gray-500 tracking-tight-body">
                              {profile.headline}
                            </p>
                          )}
                        </div>

                        {/* Integrated Completeness */}
                        {completeness && (
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest">画像完善度</span>
                              <span className={cn("text-xs font-bold notion-pill", 
                                completeness.completeness_pct >= 80 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                              )}>
                                {completeness.completeness_pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-32 rounded-full bg-notion-warm-white overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-700",
                                  completeness.completeness_pct >= 80 ? "bg-green-500" : "bg-orange-500"
                                )}
                                style={{ width: `${completeness.completeness_pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Professional Summary */}
                      {profile?.professional_summary && (
                        <section className="space-y-4">
                          <h3 className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <div className="h-px w-4 bg-notion-gray-300" />
                            专业摘要
                          </h3>
                          <p className="text-lg font-medium leading-relaxed text-foreground whitespace-pre-wrap max-w-2xl">
                            {profile.professional_summary}
                          </p>
                        </section>
                      )}

                      {/* Skills */}
                      {profile?.skill_categories && Object.keys(profile.skill_categories).length > 0 && (
                        <section className="space-y-4">
                          <h3 className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest flex items-center gap-2">
                             <div className="h-px w-4 bg-notion-gray-300" />
                             技能矩阵
                          </h3>
                          <div className="grid gap-6">
                            {Object.entries(profile.skill_categories).map(([category, skills]) => (
                              <div key={category} className="flex flex-col sm:flex-row sm:items-start gap-3">
                                <span className="text-sm font-bold text-notion-gray-500 w-28 shrink-0 sm:pt-1 uppercase tracking-wider">
                                  {category}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {(skills as string[]).map((skill) => (
                                    <span
                                      key={skill}
                                      className="notion-pill bg-notion-badge-bg text-notion-badge-text px-3 py-1 text-sm font-bold border border-notion-blue/5"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Contact Info */}
                      <section className="bg-notion-warm-white/50 p-8 rounded-2xl border border-border">
                        <h3 className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest mb-6">联系方式与社交网络</h3>
                        <div className="grid gap-y-6 gap-x-12 sm:grid-cols-2">
                          {profile?.email && (
                            <div className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <Mail className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{profile.email}</span>
                            </div>
                          )}
                          {profile?.phone && (
                            <div className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <Phone className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{profile.phone}</span>
                            </div>
                          )}
                          {profile?.location && (
                            <div className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <MapPin className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{profile.location}</span>
                            </div>
                          )}
                          {profile?.github_url && (
                            <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <Github className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-notion-blue hover:underline">{profile.github_url.replace("https://", "")}</span>
                            </a>
                          )}
                          {profile?.linkedin_url && (
                            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <Linkedin className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-notion-blue hover:underline">{profile.linkedin_url.replace("https://", "")}</span>
                            </a>
                          )}
                          {profile?.portfolio_url && (
                            <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 group">
                              <div className="p-2 rounded-md bg-white border border-border group-hover:border-notion-blue transition-colors">
                                <Globe className="h-4 w-4 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                              </div>
                              <span className="text-sm font-bold text-notion-blue hover:underline">{profile.portfolio_url.replace("https://", "")}</span>
                            </a>
                          )}
                        </div>
                      </section>
                    </>
                  ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 text-notion-gray-300">
                      <div className="p-6 rounded-3xl bg-notion-warm-white mb-6">
                        <UserCircle className="h-16 w-16 opacity-30" />
                      </div>
                      <p className="text-xl font-bold text-notion-gray-500">创建你的职业画像</p>
                      <p className="mt-2 text-sm font-medium max-w-xs text-center">
                        完善画像是获得精准岗位匹配和高质量简历的第一步
                      </p>
                      <div className="mt-8 flex gap-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="notion-button-secondary py-2 flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" /> 导入 PDF
                        </button>
                        <button 
                          onClick={() => setEditing(true)}
                          className="notion-button-primary py-2"
                        >
                          手动填写
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
