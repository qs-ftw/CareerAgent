import { useState } from "react";
import { Link } from "react-router-dom";
import { useDomains, useCreateDomain } from "@/hooks/useKnowledge";
import { useListResumes } from "@/hooks/useResumes";
import { 
  Plus, 
  BookOpen, 
  Search,
  FileText,
  ChevronRight,
  Loader2,
  X,
  Database
} from "lucide-react";

export function KnowledgeBank() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: resumes } = useListResumes();
  const { data: domains, isLoading } = useDomains(selectedResumeId);

  const filteredDomains = domains?.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tags_json?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ) ?? [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-8 border-b border-border bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-notion-blue">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Knowledge Base</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tightest">专业知识库</h1>
          <p className="text-sm font-medium text-notion-gray-500">管理你的专业领域面试题库，建立深厚的技术护城河</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="notion-button-primary flex items-center gap-2 shadow-notion-card"
        >
          <Plus className="h-4 w-4" />
          新增知识领域
        </button>
      </div>

      <div className="px-8 py-6 space-y-8 flex-1 overflow-auto bg-notion-warm-white/20">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl border border-border/50 shadow-notion-card">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-notion-gray-300">
              <Search className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">搜索领域或标签</span>
            </div>
            <input 
              type="text"
              placeholder="搜索名称、技术栈..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-notion-warm-white/30 border border-border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-notion-blue/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 min-w-[240px]">
            <div className="flex items-center gap-2 text-notion-gray-300">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">按简历筛选</span>
            </div>
            <select 
              value={selectedResumeId || ""} 
              onChange={(e) => setSelectedResumeId(e.target.value || undefined)}
              className="w-full bg-notion-warm-white/30 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-notion-blue/20 outline-none appearance-none cursor-pointer"
            >
              <option value="">全部领域</option>
              {resumes?.map(r => (
                <option key={r.id} value={r.id}>{r.resume_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gallery */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 notion-card border-dashed bg-white/50">
            <div className="p-4 bg-notion-warm-white rounded-full mb-4">
              <Database className="h-10 w-10 text-notion-gray-300" />
            </div>
            <p className="text-lg font-bold text-notion-gray-500">暂无匹配的知识领域</p>
            <p className="text-sm font-medium text-notion-gray-300 mt-1">开始创建一个新领域，或者调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {filteredDomains.map((domain) => (
              <Link
                key={domain.id}
                to={`/knowledge/${domain.id}`}
                className="notion-card group p-6 flex flex-col hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {domain.tags_json?.map((tag, idx) => (
                    <span key={idx} className="notion-pill bg-notion-warm-white text-notion-gray-500">
                      {tag}
                    </span>
                  )) || (
                    <span className="notion-pill bg-notion-warm-white text-notion-gray-300">
                      无标签
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-foreground leading-tight tracking-tight mb-4 group-hover:text-notion-blue transition-colors">
                  {domain.name}
                </h3>

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-notion-gray-300 uppercase tracking-widest">问题数量</span>
                    <span className="text-sm font-extrabold text-notion-blue">
                      {domain.question_count || 0}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-notion-gray-300 group-hover:text-notion-blue transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateDomainModal 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function CreateDomainModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const createDomain = useCreateDomain();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput.split(/[,，\s]+/).filter(t => t.trim().length > 0);

    createDomain.mutate(
      { name: name.trim(), tags_json: tags },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm">
      <div className="w-full max-w-xl notion-card p-8 shadow-notion-deep animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight-sub">新增知识领域</h2>
            <p className="text-sm font-medium text-notion-gray-500">例如：React 核心原理、分布式系统、工程化</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-notion-warm-white rounded-full text-notion-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest">领域名称</label>
            <input
              autoFocus
              className="w-full p-4 rounded-xl border border-border bg-notion-warm-white/30 text-lg font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all placeholder:text-notion-gray-300"
              placeholder="输入领域名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-notion-gray-300 uppercase tracking-widest">标签 (可选，逗号或空格分隔)</label>
            <input
              className="w-full p-4 rounded-xl border border-border bg-notion-warm-white/30 text-base font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all placeholder:text-notion-gray-300"
              placeholder="例如：Frontend, React, TypeScript"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="notion-button-secondary py-2 px-6"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createDomain.isPending}
              className="notion-button-primary py-2 px-8 flex items-center gap-2 disabled:opacity-50 shadow-notion-card"
            >
              {createDomain.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              创建领域
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
