"use client";

import { useEffect, useState } from "react";
import { Bot, X, Zap, Loader2, CheckCircle2, AlertCircle, Sparkles, Cpu, GitBranch, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { listAuditWorkflows, runAuditWorkflow, type AuditWorkflow, type AuditResult } from "@/lib/api";

export default function ClineAssistant() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [workflows, setWorkflows] = useState<AuditWorkflow[]>([]);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    listAuditWorkflows().then((d) => setWorkflows(d.workflows)).catch(() => {});
  }, []);

  const run = (key: string) => {
    setRunning(key);
    runAuditWorkflow(key)
      .then((r) => setResults((prev) => [r, ...prev]))
      .catch((e: Error) =>
        setResults((prev) => [{ workflow: key, status: "error", summary: e.message, details: [], timestamp: new Date().toISOString() }, ...prev]),
      )
      .finally(() => setRunning(null));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-brand-500 px-5 py-3 text-white shadow-xl transition-all hover:scale-105 active:scale-95 animate-fade-in"
        aria-label="Cline Health Engineer Assistant"
      >
        <Bot className="h-6 w-6" aria-hidden />
        <span className="text-base font-bold">{t("Cline", "Cline")}</span>
        <Zap className="h-5 w-5 text-yellow-300" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-7 w-7" aria-hidden />
                <div>
                  <h2 className="text-lg font-bold">{t("Cline In-App Assistant", "Cline इन-ऐप सहायक")}</h2>
                  <p className="text-xs text-orange-100">{t("Autonomous Engineering Copilot", "स्वायत्त इंजीनियरिंग कोपायलट")}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/20" aria-label={t("Close", "बंद करें")}>
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-5 rounded-2xl border border-orange-100 bg-brand-50 p-4">
                <h3 className="mb-2 flex items-center gap-1 text-base font-bold text-brand-700"><Cpu className="h-5 w-5" aria-hidden /> {t("Architecture", "आर्किटेक्चर")}</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden /> {t("Agentic loop: plan -> act -> observe -> verify", "एजेंट लूप: योजना -> कार्य -> अवलोकन -> सत्यापन")}</li>
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden /> {t("Autonomous file edits with diff-rollback safety", "अवशिष्ट-रोलबैक सुरक्षा के साथ स्वायत्त फ़ाइल संपादन")}</li>
                  <li className="flex items-start gap-2"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden /> {t("Live workflow execution on backend API", "बैकएंड API पर लाइव वर्कफ़्लो निष्पादन")}</li>
                </ul>
              </div>

              <h3 className="mb-2 flex items-center gap-1 text-base font-bold text-gray-700"><Sparkles className="h-5 w-5 text-brand-500" aria-hidden /> {t("Test Live Workflows", "लाइव वर्कफ़्लो टेस्ट करें")}</h3>
              <div className="grid grid-cols-1 gap-2">
                {workflows.map((w) => (
                  <button key={w.key} onClick={() => run(w.key)} disabled={running !== null}
                    className="flex items-start gap-2 rounded-2xl border-2 border-brand-200 bg-white p-3 text-left transition-colors hover:bg-brand-50 disabled:opacity-50">
                    {running === w.key ? <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand-500" aria-hidden /> : <Zap className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden />}
                    <div>
                      <p className="text-base font-bold text-gray-800">{w.label}</p>
                      <p className="text-xs text-gray-500">{w.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {results.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-base font-bold text-gray-700">{t("Workflow Results", "वर्कफ़्लो परिणाम")}</h3>
                  <div className="space-y-3">
                    {results.map((r, i) => (
                      <div key={i} className={`rounded-2xl border p-3 ${r.status === "error" ? "border-red-200 bg-red-50" : "border-sage-200 bg-sage-50"}`}>
                        <div className="flex items-center gap-2">
                          {r.status === "error" ? <AlertCircle className="h-5 w-5 text-red-600" aria-hidden /> : <CheckCircle2 className="h-5 w-5 text-sage-600" aria-hidden />}
                          <span className="text-sm font-bold text-gray-700">{r.workflow}</span>
                          <span className="ml-auto text-xs text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{r.summary}</p>
                        {r.details.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {r.details.map((d, j) => (<li key={j} className="flex items-start gap-1 text-xs text-gray-500"><span className="text-brand-500">•</span> {d}</li>))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}