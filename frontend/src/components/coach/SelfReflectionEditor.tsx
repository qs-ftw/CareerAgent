import { useState } from "react";

export function SelfReflectionEditor({
  initialContent,
  onSave,
  isSaving,
}: {
  initialContent: string;
  onSave: (content: string) => void;
  isSaving: boolean;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">个人复盘 / 自省</div>
        <button
          className="rounded-md bg-notion-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          onClick={() => onSave(content)}
          disabled={isSaving || content === initialContent}
        >
          {isSaving ? "正在保存..." : "保存复盘"}
        </button>
      </div>
      <textarea
        className="h-48 w-full rounded-lg border-notion-border bg-notion-warm-white p-4 text-sm text-notion-gray-500 focus:border-notion-blue focus:outline-none"
        placeholder="在这里记录你的本周感悟、遇到的困难、或者对自己表现的反思..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
