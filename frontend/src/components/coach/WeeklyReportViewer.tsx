import ReactMarkdown from "react-markdown";

export function WeeklyReportViewer({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="rounded-xl border bg-notion-warm-white p-8 text-center text-sm text-notion-gray-500">
        经理周报尚未生成。
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 text-sm font-semibold text-foreground">经理周报 (已生成)</div>
      <div className="prose prose-sm max-w-none text-notion-gray-500 prose-headings:text-foreground prose-strong:text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
