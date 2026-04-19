import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  useDomains, 
  useDeleteDomain, 
  useQuestions, 
  useCreateQuestion, 
  useUpdateQuestion, 
  useDeleteQuestion 
} from "@/hooks/useKnowledge";
import { 
  ArrowLeft, 
  Plus, 
  Pin, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Loader2,
  BookOpen,
  PinOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const domainId = id as string;

  const { data: domains } = useDomains();
  const domain = domains?.find(d => d.id === domainId);
  
  const { data: questions, isLoading } = useQuestions(domainId);
  const deleteDomain = useDeleteDomain();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const handleDeleteDomain = () => {
    if (confirm("确定要删除这个知识领域及其所有问题吗？")) {
      deleteDomain.mutate(domainId, {
        onSuccess: () => navigate("/knowledge"),
      });
    }
  };

  if (!domain && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg font-bold text-notion-gray-500">领域不存在</p>
        <Link to="/knowledge" className="mt-4 text-notion-blue hover:underline font-bold">返回知识库</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/knowledge")}
            className="p-2 hover:bg-notion-warm-white rounded-full text-notion-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{domain?.name}</h1>
              <div className="flex gap-2 ml-2">
                {domain?.tags_json?.map((tag, idx) => (
                  <span key={idx} className="notion-pill bg-notion-warm-white text-notion-gray-500 text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-notion-gray-300">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                专业知识领域 • {questions?.length || 0} 个问题
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDeleteDomain}
            className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-notion-gray-300 transition-all border border-transparent hover:border-red-100"
            title="删除领域"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsAddingQuestion(true)}
            className="notion-button-primary flex items-center gap-2 shadow-notion-card"
          >
            <Plus className="h-4 w-4" />
            新增问题
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-notion-warm-white/20 px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {isAddingQuestion && (
            <AddQuestionForm 
              domainId={domainId} 
              onCancel={() => setIsAddingQuestion(false)} 
            />
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : questions?.length === 0 && !isAddingQuestion ? (
            <div className="flex flex-col items-center justify-center py-20 notion-card border-dashed bg-white/50">
              <p className="text-lg font-bold text-notion-gray-500">暂无面试问题</p>
              <p className="text-sm font-medium text-notion-gray-300 mt-1">记录在这个领域中可能遇到的面试题及其标准回答</p>
              <button 
                onClick={() => setIsAddingQuestion(true)}
                className="mt-6 text-notion-blue font-bold text-sm hover:underline"
              >
                立即添加第一个问题
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions?.map((q) => (
                <QuestionAccordion key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionAccordion({ question }: { question: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [answer, setAnswer] = useState(question.answer_markdown || "");
  
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuestion.mutate({
      id: question.id,
      data: { is_pinned: !question.is_pinned }
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这个问题吗？")) {
      deleteQuestion.mutate({ id: question.id, domainId: question.domain_id });
    }
  };

  const handleSave = () => {
    updateQuestion.mutate({
      id: question.id,
      data: { answer_markdown: answer }
    }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  return (
    <div className={cn(
      "notion-card overflow-hidden transition-all duration-300 border",
      isExpanded ? "ring-2 ring-notion-blue/5 border-notion-blue/20" : "hover:border-notion-blue/20"
    )}>
      {/* Row Header */}
      <div 
        className={cn(
          "flex items-center gap-4 px-6 py-4 cursor-pointer select-none transition-colors",
          isExpanded ? "bg-notion-warm-white/30" : "bg-white hover:bg-notion-warm-white/10"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button 
          onClick={handleTogglePin}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            question.is_pinned ? "text-notion-blue bg-notion-blue/10" : "text-notion-gray-300 hover:bg-notion-warm-white"
          )}
        >
          {question.is_pinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}
        </button>
        
        <h4 className="flex-1 text-base font-bold text-foreground leading-snug">
          {question.question_text}
        </h4>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-notion-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-notion-gray-300" /> : <ChevronDown className="h-5 w-5 text-notion-gray-300" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-6 border-t border-border bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-notion-gray-300 uppercase tracking-widest">标准答案 (Markdown)</label>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-notion-blue hover:underline"
                >
                  编辑答案
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  autoFocus
                  className="w-full h-64 p-4 rounded-xl border border-border bg-notion-warm-white/20 text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all resize-none font-mono"
                  placeholder="使用 Markdown 编写你的回答..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAnswer(question.answer_markdown || "");
                    }}
                    className="notion-button-secondary py-1.5 px-4 text-xs"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateQuestion.isPending}
                    className="notion-button-primary py-1.5 px-6 text-xs flex items-center gap-2 shadow-notion-card"
                  >
                    {updateQuestion.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Save className="h-3 w-3" />
                    保存修改
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none min-h-[100px] p-4 rounded-xl bg-notion-warm-white/10 border border-border/50 text-notion-gray-700 cursor-text"
                onClick={() => setIsEditing(true)}
              >
                {answer ? (
                  <ReactMarkdown>{answer}</ReactMarkdown>
                ) : (
                  <span className="text-notion-gray-300 italic">暂无答案，点击添加...</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddQuestionForm({ domainId, onCancel }: { domainId: string, onCancel: () => void }) {
  const [text, setText] = useState("");
  const createQuestion = useCreateQuestion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    createQuestion.mutate({
      domainId,
      data: { question_text: text.trim() }
    }, {
      onSuccess: () => onCancel()
    });
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="notion-card p-6 bg-notion-blue/5 border-notion-blue/20 animate-in fade-in slide-in-from-top-4 duration-300 mb-6"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-notion-blue uppercase tracking-widest">新增面试问题</label>
          <textarea
            autoFocus
            className="w-full h-24 p-4 rounded-xl border border-notion-blue/20 bg-white text-base font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all resize-none placeholder:text-notion-gray-300"
            placeholder="输入在这个领域可能会被问到的问题..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="notion-button-secondary py-1.5 px-6"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!text.trim() || createQuestion.isPending}
            className="notion-button-primary py-1.5 px-8 flex items-center gap-2 shadow-notion-card"
          >
            {createQuestion.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            添加问题
          </button>
        </div>
      </div>
    </form>
  );
}
