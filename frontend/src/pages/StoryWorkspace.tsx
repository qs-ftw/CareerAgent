import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { 
  useStory, 
  useUpdateStory, 
  useConsultStory, 
  useAutopilotStory 
} from "@/hooks/useStories";
import { useListResumes } from "@/hooks/useResumes";
import { Header } from "@/components/layout/Header";
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  Loader2, 
  Save, 
  MessageSquare,
  Trophy,
  Check,
  X,
  FileText,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// Notion-style diff viewer styles
const diffStyles = {
  variables: {
    light: {
      diffViewerBackground: 'transparent',
      diffViewerColor: '#37352f',
      addedBackground: '#e7f3ef',
      addedColor: '#0d7d55',
      removedBackground: '#fdebec',
      removedColor: '#eb5757',
      wordAddedBackground: '#c2e5da',
      wordRemovedBackground: '#f8d3d5',
      addedGutterBackground: '#e7f3ef',
      removedGutterBackground: '#fdebec',
      gutterColor: '#d3d1cb',
      codeFoldGutterBackground: '#f7f6f3',
      codeFoldBackground: '#f7f6f3',
      emptyLineBackground: '#f7f6f3',
      gutterFontSize: '11px',
    },
  },
  content: {
    fontSize: '15px',
    lineHeight: '1.6',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  lineNumber: {
    padding: '0 10px',
  }
};

export function StoryWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Resume context state
  const selectedResumeId = searchParams.get("resumeId") || undefined;
  const { data: resumes = [] } = useListResumes();

  const { data: story, isLoading } = useStory(id!, selectedResumeId);
  const updateStory = useUpdateStory();
  const consult = useConsultStory();
  const autopilot = useAutopilotStory();

  const [answer, setAnswer] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [viewMode, setViewMode] = useState<'EDITING' | 'DIFF'>('EDITING');
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);

  // Local temporary messages to show immediate feedback
  const [tempMessages, setLocalMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset local state whenever story data or context changes
    if (story) {
      setAnswer(story.answer_markdown || "");
      setLocalMessages([]);
    }
  }, [story, selectedResumeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [story?.analysis_chat, tempMessages, consult.isPending]);

  if (isLoading || !story) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-notion-blue" />
      </div>
    );
  }

  // Combine server messages with local temporary ones
  const allMessages = [...(story.analysis_chat || []), ...tempMessages];

  const handleSave = () => {
    updateStory.mutate({ 
      id: id!, 
      data: { answer_markdown: answer, status: "drafting", resume_id: selectedResumeId } 
    });
  };

  const handleResumeChange = (resumeId: string | undefined) => {
    if (resumeId) {
      setSearchParams({ resumeId });
    } else {
      setSearchParams({});
    }
    setViewMode('EDITING');
  };

  const handleEnterDiff = (suggestion: string) => {
    setPendingSuggestion(suggestion);
    setViewMode('DIFF');
  };

  const handleCancelDiff = () => {
    setPendingSuggestion(null);
    setViewMode('EDITING');
  };

  const handleConsult = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatMessage.trim();
    if (!msg) return;

    setLocalMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatMessage("");

    consult.mutate({ 
      id: id!, 
      user_message: msg,
      resumeId: selectedResumeId
    }, {
      onError: (err: any) => {
        const errMsg = err.response?.data?.detail || "发送失败，请重试";
        setLocalMessages(prev => [...prev, { role: "assistant", content: `❌ 错误: ${errMsg}` }]);
      }
    });
  };

  const handleAutopilot = () => {
    setLocalMessages(prev => [...prev, { role: "assistant", content: "✨ 正在根据当前简历内容生成故事，请稍候..." }]);
    
    autopilot.mutate({ id: id!, resumeId: selectedResumeId }, {
      onSuccess: (data) => {
        if (data.answer_markdown) {
          setAnswer(data.answer_markdown);
          setLocalMessages([]); 
        }
      },
      onError: (err: any) => {
        const errMsg = err.response?.data?.detail || "自动生成失败，请重试";
        setLocalMessages(prev => [...prev, { role: "assistant", content: `❌ 自动生成失败: ${errMsg}` }]);
      }
    });
  };

  const handleIgnoreSuggestion = (index: number) => {
    if (!story) return;
    
    const currentChat = story.analysis_chat || [];
    const newChat = currentChat.map((msg: any, i: number) => 
      i === index ? { ...msg, ignored: true } : msg
    );

    updateStory.mutate({
      id: id!,
      data: { analysis_chat: newChat, resume_id: selectedResumeId }
    });
  };

  const handleApplyChange = (suggestedText: string) => {
    setAnswer(suggestedText);
    updateStory.mutate({ 
      id: id!, 
      data: { answer_markdown: suggestedText, status: "drafting", resume_id: selectedResumeId } 
    });
  };

  const handleFinalize = () => {
    updateStory.mutate({ 
      id: id!, 
      data: { answer_markdown: answer, status: "finalized", resume_id: selectedResumeId } 
    }, {
      onSuccess: () => navigate("/stories")
    });
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header 
        title={
          <button 
            onClick={() => navigate("/stories")}
            className="flex items-center gap-2 hover:text-notion-blue transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 text-notion-gray-300 group-hover:text-notion-blue" />
            <span className="truncate max-w-md">{story.question_text}</span>
          </button>
        }
        description={`主题: ${story.theme} · 状态: ${story.status}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutopilot}
              disabled={autopilot.isPending}
              className="notion-button-secondary py-1.5 flex items-center gap-2"
            >
              {autopilot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-orange-500" />}
              AI 自动填充
            </button>
            <button
              onClick={handleSave}
              disabled={updateStory.isPending}
              className="notion-button-secondary py-1.5 flex items-center gap-2"
            >
              {updateStory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存草稿
            </button>
            <button
              onClick={handleFinalize}
              className="notion-button-primary py-1.5 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              完成定稿
            </button>
          </div>
        }
      />

      {/* Context Switcher Bar */}
      <div className="flex items-center gap-4 px-8 py-3 border-b border-border bg-notion-warm-white/20">
        <div className="flex items-center gap-2 text-notion-gray-400">
          <FileText className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">打磨上下文</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleResumeChange(undefined)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
              !selectedResumeId 
                ? "bg-white text-notion-blue shadow-sm border border-border ring-1 ring-black/5" 
                : "text-notion-gray-300 hover:text-foreground"
            )}
          >
            <Globe className="h-3 w-3" />
            全局通用版
          </button>
          {resumes.map(r => (
            <button
              key={r.id}
              onClick={() => handleResumeChange(r.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5",
                selectedResumeId === r.id 
                  ? "bg-white text-notion-blue shadow-sm border border-border ring-1 ring-black/5" 
                  : "text-notion-gray-300 hover:text-foreground"
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-notion-blue/40" />
              {r.resume_name}
            </button>
          ))}
        </div>
        {selectedResumeId && (
          <div className="ml-auto notion-pill bg-blue-50 text-notion-blue border border-blue-100 flex items-center gap-1.5 px-2 py-0.5 animate-in fade-in zoom-in duration-300">
            <Bot className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase">AI 已切换至简历沙盒模式</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Side */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-notion-warm-white/30 flex items-center justify-between">
            <span className="text-xs font-bold text-notion-gray-500 uppercase tracking-widest">
              {viewMode === 'DIFF' ? '版本对比' : '回答草稿 (Markdown)'}
            </span>
            <span className="text-[10px] text-notion-gray-300 font-medium">
              {viewMode === 'DIFF' ? '正在对比 AI 建议内容' : '支持标准 STAR 结构'}
            </span>
          </div>
          
          {viewMode === 'EDITING' ? (
            <div className="flex-1 flex flex-col relative group">
              <textarea
                className="flex-1 p-8 text-lg font-medium leading-relaxed text-foreground outline-none resize-none placeholder:text-notion-gray-300"
                placeholder={selectedResumeId ? "针对此简历的作答尚未开始。点击上方「AI 自动填充」开启沙盒训练..." : "在这里开始书写你的通用版故事..."}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              {selectedResumeId && !answer && !autopilot.isPending && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-4 p-8 bg-notion-warm-white/50 rounded-2xl border border-dashed border-border animate-in fade-in zoom-in duration-500">
                    <Sparkles className="h-8 w-8 text-notion-blue opacity-40" />
                    <p className="text-sm font-bold text-notion-gray-400">当前简历尚未针对此问题进行打磨</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-[#fbfbfa] p-4 relative group/diff animate-in fade-in duration-300">
              <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-24">
                <ReactDiffViewer
                  oldValue={answer}
                  newValue={pendingSuggestion || ""}
                  splitView={true}
                  styles={diffStyles}
                  leftTitle="当前草稿"
                  rightTitle="AI 建议修改"
                />
              </div>
              
              {/* Diff Toolbar - Glassmorphism */}
              <div className="fixed bottom-12 left-[calc(30rem)] right-[calc(26rem)] flex items-center justify-center z-50 pointer-events-none">
                <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border pointer-events-auto animate-in slide-in-from-bottom-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-notion-gray-400 uppercase tracking-widest">对比控制模式</span>
                    <span className="text-xs font-bold text-foreground">是否采纳 AI 的建议？</span>
                  </div>
                  <div className="h-8 w-px bg-border mx-2" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (pendingSuggestion) {
                          handleApplyChange(pendingSuggestion);
                          handleCancelDiff();
                        }
                      }}
                      className="bg-notion-blue text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-notion-blue/90 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      采纳并应用
                    </button>
                    <button
                      onClick={handleCancelDiff}
                      className="bg-white text-notion-gray-500 px-5 py-2 rounded-lg font-bold text-sm border border-border hover:bg-notion-warm-white active:scale-95 transition-all flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      放弃对比
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Consultant Side */}
        <div className="w-[400px] flex flex-col bg-notion-warm-white/20 overflow-hidden">
          <div className="p-4 border-b border-border bg-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-notion-blue" />
            <h3 className="text-sm font-bold tracking-tight">AI 面试顾问</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {allMessages.length > 0 ? (
              allMessages.map((msg: any, i: number) => {
                if (msg.ignored) return null;

                return (
                  <div 
                    key={i} 
                    className={cn(
                      "flex flex-col gap-2",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "max-w-[90%] p-3 rounded-xl text-sm shadow-sm border",
                        msg.role === "user" 
                          ? "bg-notion-blue text-white border-notion-blue" 
                          : "bg-white text-foreground border-border"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      
                      {msg.role === "assistant" && msg.suggested_text && (
                        <div className="mt-4 pt-3 border-t border-notion-warm-white space-y-3">
                          <div className="flex items-start gap-2 text-[11px] text-notion-gray-400 italic">
                            <Sparkles className="h-3 w-3 mt-0.5 text-orange-400 shrink-0" />
                            <span className="line-clamp-2">
                              AI 建议：{msg.suggestion_summary || "我对您的回答进行了优化，点击下方对比查看。"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEnterDiff(msg.suggested_text)}
                              className="flex-1 py-1.5 bg-notion-blue text-white rounded-md font-bold text-[11px] hover:bg-notion-blue/90 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              🔍 进入对比模式
                            </button>
                            <button
                              onClick={() => handleIgnoreSuggestion(i)}
                              className="px-3 py-1.5 bg-white text-notion-gray-400 border border-border rounded-md font-bold text-[11px] hover:bg-notion-gray-50 transition-all flex items-center gap-1 active:scale-95"
                            >
                              <X className="h-3 w-3" />
                              忽略
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {msg.role === "assistant" && msg.linked_achievements && msg.linked_achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.linked_achievements.map((ach: any, j: number) => (
                          <div key={j} className="notion-pill bg-white text-notion-gray-500 border border-border flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-orange-400" />
                            {ach.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="p-4 rounded-full bg-white shadow-notion-card mb-4">
                  <MessageSquare className="h-8 w-8 text-notion-gray-300" />
                </div>
                <p className="text-sm font-bold text-notion-gray-500">随时向我提问</p>
                <p className="mt-2 text-xs text-notion-gray-300 font-medium">
                  我可以根据你的过往成果，帮你打磨出最动人的面试故事。
                </p>
              </div>
            )}
            {consult.isPending && (
              <div className="flex items-start gap-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center">
                  <Bot className="h-4 w-4 text-notion-gray-300" />
                </div>
                <div className="bg-white border border-border p-3 rounded-xl">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-notion-gray-300 animate-bounce" />
                    <div className="h-1.5 w-1.5 rounded-full bg-notion-gray-300 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-notion-gray-300 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form 
            onSubmit={handleConsult}
            className="p-4 bg-white border-t border-border"
          >
            <div className="relative">
              <input
                className="w-full pl-4 pr-10 py-2 bg-notion-warm-white/50 border border-border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-notion-blue/20 focus:border-notion-blue/50 transition-all"
                placeholder="询问建议或引用成果..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!chatMessage.trim() || consult.isPending}
                className="absolute right-2 top-1.5 p-1 text-notion-blue hover:bg-notion-badge-bg rounded-md disabled:opacity-30 transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
