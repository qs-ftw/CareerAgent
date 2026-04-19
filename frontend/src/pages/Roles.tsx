import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  useRoles,
  useCreateRole,
  useDeleteRole,
  useUpdateRole,
  usePauseRole,
  useInitRoleAssets,
  useRole,
} from "@/hooks/useRoles";
import {
  Plus,
  Trash2,
  Loader2,
  Briefcase,
  X,
  AlertTriangle,
  Pause,
  Play,
  Pencil,
  Save,
  ChevronDown,
  FileSearch,
  Zap,
  FileText,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoleCreateRequest } from "@/types";
import { CreateRoleFromJD } from "@/components/CreateRoleFromJD";
import { CreateRoleQuick } from "@/components/CreateRoleQuick";

const ROLE_TYPES = [
  "全职",
  "兼职",
  "实习",
  "远程",
  "合同工",
  "自由职业",
];

export function Roles() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const pauseRole = usePauseRole();
  const initAssets = useInitRoleAssets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJDModal, setShowJDModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const roles = data?.items ?? [];

  const handlePause = (role: { id: string; status: string }) => {
    pauseRole.mutate({ id: role.id, pause: role.status === "active" });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <Header 
        title="岗位目标" 
        description="管理所有长期目标岗位"
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="notion-button-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新增岗位
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 notion-card overflow-hidden py-1">
                <button
                  onClick={() => { setShowDropdown(false); setShowCreateModal(true); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-notion-warm-white transition-colors"
                >
                  <Plus className="h-4 w-4 text-notion-gray-300" />
                  手动创建
                </button>
                <button
                  onClick={() => { setShowDropdown(false); setShowJDModal(true); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-notion-warm-white transition-colors"
                >
                  <FileSearch className="h-4 w-4 text-notion-gray-300" />
                  粘贴 JD 创建
                </button>
                <button
                  onClick={() => { setShowDropdown(false); setShowQuickModal(true); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-notion-warm-white transition-colors"
                >
                  <Zap className="h-4 w-4 text-notion-gray-300" />
                  快捷创建
                </button>
              </div>
            )}
          </div>
        }
      />
      <PageContainer>
        {/* Content */}
        <div>
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-notion-blue" />
            </div>
          )}

          {isError && (
            <div className="notion-card border-red-100 bg-red-50 p-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-4" />
              <p className="text-red-700 font-bold">加载失败，请重试</p>
            </div>
          )}

          {!isLoading && !isError && roles.length === 0 && (
            <div className="notion-card bg-notion-warm-white/50 border-dashed p-16 text-center">
              <Briefcase className="mx-auto h-16 w-16 text-notion-gray-300 mb-6" />
              <p className="text-notion-gray-500 font-bold text-lg tracking-tight">
                暂无岗位目标
              </p>
              <p className="text-sm text-notion-gray-300 mt-2 mb-8">
                开始添加你的第一个职业目标
              </p>
              <button onClick={() => setShowQuickModal(true)} className="notion-button-primary">
                快速开始
              </button>
            </div>
          )}

          {!isLoading && !isError && roles.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onView={() => navigate(`/roles/${role.id}`)}
                  onDelete={() => setDeleteConfirmId(role.id)}
                  onEdit={() => setEditRoleId(role.id)}
                  onPause={() => handlePause(role)}
                  onTailor={() => {
                    initAssets.mutate(role.id, {
                      onSuccess: (res: { resume_id?: string }) => {
                        const resumeId = res?.resume_id;
                        if (resumeId) {
                          navigate(`/resumes/${resumeId}`);
                        }
                      },
                    });
                  }}
                  tailoring={initAssets.isPending && initAssets.variables === role.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateRoleModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => {
              createRole.mutate(data, {
                onSuccess: () => {
                  setShowCreateModal(false);
                },
              });
            }}
            isSubmitting={createRole.isPending}
          />
        )}

        {/* Edit Modal */}
        {editRoleId && (
          <EditRoleInlineModal
            roleId={editRoleId}
            onClose={() => setEditRoleId(null)}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5backdrop-blur-sm">
            <div className="w-full max-w-sm notion-card p-6 shadow-notion-deep">
              <h3 className="text-lg font-bold tracking-tight-card">确认删除岗位</h3>
              <p className="mt-2 text-sm font-medium text-notion-gray-500">
                确定要删除该岗位吗？此操作不可撤销。
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="notion-button-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    deleteRole.mutate(deleteConfirmId, {
                      onSuccess: () => setDeleteConfirmId(null),
                    });
                  }}
                  disabled={deleteRole.isPending}
                  className="bg-red-500 text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  {deleteRole.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JD Paste Modal */}
        {showJDModal && (
          <CreateRoleFromJD onClose={() => setShowJDModal(false)} />
        )}

        {/* Quick Create Modal */}
        {showQuickModal && (
          <CreateRoleQuick onClose={() => setShowQuickModal(false)} />
        )}
      </PageContainer>
    </div>
  );
}

// ── RoleCard ──────────────────────────────────────────

function RoleCard({
  role,
  onView,
  onDelete,
  onEdit,
  onPause,
  onTailor,
  tailoring,
}: {
  role: {
    id: string;
    role_name: string;
    role_type: string;
    priority: number;
    status: string;
    required_skills: string[];
  };
  onView: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPause: () => void;
  onTailor: () => void;
  tailoring: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showActions]);

  return (
    <div 
      onClick={onView}
      className="notion-card group p-5 flex flex-col h-full hover:-translate-y-1 cursor-pointer transition-all active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-bold text-foreground group-hover:text-notion-blue transition-colors leading-tight tracking-tight">
            {role.role_name}
          </h4>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="notion-pill bg-notion-badge-bg text-notion-badge-text">
              {role.role_type}
            </span>
            <span
              className={cn("notion-pill", 
                role.status === "active" ? "bg-green-50 text-green-700" : "bg-notion-warm-white text-notion-gray-300"
              )}
            >
              {role.status === "active" ? "活跃" : "已暂停"}
            </span>
          </div>
        </div>
        <div className="relative ml-2" ref={actionRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 rounded-md hover:bg-notion-warm-white text-notion-gray-300 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 notion-card overflow-hidden py-1 shadow-notion-deep">
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onEdit(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-notion-warm-white transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                编辑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onPause(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold hover:bg-notion-warm-white transition-colors"
              >
                {role.status === "active" ? <><Pause className="h-3.5 w-3.5" /> 暂停</> : <><Play className="h-3.5 w-3.5" /> 恢复</>}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="flex-1 space-y-3">
        {role.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {role.required_skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="notion-pill bg-notion-warm-white text-notion-gray-500 font-bold"
              >
                {skill}
              </span>
            ))}
            {role.required_skills.length > 4 && (
              <span className="notion-pill bg-notion-warm-white text-notion-gray-300 font-bold">
                +{role.required_skills.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-notion-gray-300 uppercase tracking-widest">优先级 P{role.priority}</span>
            <div className="h-1 w-12 rounded-full bg-notion-warm-white overflow-hidden">
              <div 
                className="h-full bg-notion-blue" 
                style={{ width: `${role.priority * 10}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions - Keep prominent but clean */}
      <div className="mt-6 pt-4 border-t border-border flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTailor();
          }}
          disabled={tailoring}
          className="flex-1 flex items-center justify-center gap-2 notion-button-primary py-1.5 text-xs font-bold disabled:opacity-50"
        >
          {tailoring ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          定制简历
        </button>
        <div className="text-[10px] font-bold text-notion-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          点击查看
        </div>
      </div>
    </div>
  );
}

// ── EditRoleInlineModal ────────────────────────────────

function EditRoleInlineModal({
  roleId,
  onClose,
}: {
  roleId: string;
  onClose: () => void;
}) {
  const { data: role, isLoading } = useRole(roleId);
  const updateRole = useUpdateRole();
  const [form, setForm] = useState<RoleCreateRequest>({
    role_name: "",
    role_type: ROLE_TYPES[0],
    description: "",
    required_skills: [],
    bonus_skills: [],
    keywords: [],
    priority: 5,
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Sync form when role data loads
  if (role && !initialized) {
    setForm({
      role_name: role.role_name,
      role_type: role.role_type,
      description: role.description,
      required_skills: role.required_skills,
      bonus_skills: role.bonus_skills,
      keywords: role.keywords,
      priority: role.priority,
    });
    setSkillsInput(role.required_skills.join(", "));
    setKeywordsInput(role.keywords.join(", "));
    setInitialized(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateRole.mutate(
      {
        id: roleId,
        data: {
          ...form,
          required_skills: skillsInput
            ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          keywords: keywordsInput
            ? keywordsInput.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        },
      },
      { onSuccess: onClose }
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5backdrop-blur-sm">
        <Loader2 className="h-6 w-6 animate-spin text-notion-blue" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5backdrop-blur-sm">
      <div className="w-full max-w-lg notion-card p-8 shadow-notion-deep">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight-card">编辑岗位</h3>
          <button
            onClick={onClose}
            className="notion-button-secondary p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位名称</label>
              <input
                type="text"
                required
                value={form.role_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role_name: e.target.value }))
                }
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位类型</label>
              <select
                value={form.role_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role_type: e.target.value }))
                }
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              >
                {ROLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位描述</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">核心技能</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              placeholder="用逗号分隔"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">关键词</label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              placeholder="用逗号分隔"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider flex justify-between">
              优先级 <span>{form.priority ?? 5}</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={form.priority ?? 5}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: Number(e.target.value) }))
              }
              className="w-full accent-notion-blue"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="notion-button-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={updateRole.isPending}
              className="notion-button-primary flex items-center gap-2 disabled:opacity-50"
            >
              {updateRole.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Save className="h-4 w-4" />
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CreateRoleModal ───────────────────────────────────

function CreateRoleModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: RoleCreateRequest) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<RoleCreateRequest>({
    role_name: "",
    role_type: ROLE_TYPES[0],
    description: "",
    required_skills: [],
    bonus_skills: [],
    keywords: [],
    priority: 5,
    source_jd: "",
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      required_skills: skillsInput
        ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      keywords: keywordsInput
        ? keywordsInput.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5backdrop-blur-sm">
      <div className="w-full max-w-lg notion-card p-8 shadow-notion-deep">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight-card">新增岗位</h3>
          <button
            onClick={onClose}
            className="notion-button-secondary p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位名称</label>
              <input
                type="text"
                required
                value={form.role_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role_name: e.target.value }))
                }
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
                placeholder="例如：高级前端工程师"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位类型</label>
              <select
                value={form.role_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role_type: e.target.value }))
                }
                className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              >
                {ROLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">岗位描述</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 resize-none"
              placeholder="描述该岗位的主要职责和要求..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">核心技能</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              placeholder="用逗号分隔"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider">关键词</label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full rounded-sm border border-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20"
              placeholder="用逗号分隔"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-notion-gray-500 uppercase tracking-wider flex justify-between">
              优先级 <span>{form.priority ?? 5}</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={form.priority ?? 5}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: Number(e.target.value) }))
              }
              className="w-full accent-notion-blue"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="notion-button-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="notion-button-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              立即创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
