"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface ParsedRow {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  notes?: string;
}

// F11.E07 part B: client-side xlsx/csv parsing keeps file format code out
// of the server. The first sheet is read; columns are matched by header
// using a small set of known aliases (Portuguese + English). Rows missing
// name or phone are dropped before the user even sees the preview, so
// the server-side validation only has to police edge cases.
const NAME_KEYS = ["name", "nome"];
const PHONE_KEYS = ["phone", "telefone", "celular", "whatsapp"];
const EMAIL_KEYS = ["email", "e-mail"];
const BIRTHDAY_KEYS = ["birthday", "aniversario", "aniversário", "nascimento"];
const NOTES_KEYS = ["notes", "notas", "observacao", "observação"];

function pick(
  row: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const direct = row[key];
    if (direct != null && String(direct).trim() !== "")
      return String(direct).trim();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === key) {
        const val = row[rowKey];
        if (val != null && String(val).trim() !== "") return String(val).trim();
      }
    }
  }
  return undefined;
}

export default function ClientsImportPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const importMutation = trpc.clients.importFromRows.useMutation();

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    importMutation.reset();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setParseError("empty_sheet");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        setParseError("empty_sheet");
        return;
      }
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const parsed: ParsedRow[] = [];
      for (const raw of json) {
        const name = pick(raw, NAME_KEYS);
        const phone = pick(raw, PHONE_KEYS);
        if (!name || !phone) continue;
        parsed.push({
          name,
          phone,
          email: pick(raw, EMAIL_KEYS),
          birthday: pick(raw, BIRTHDAY_KEYS),
          notes: pick(raw, NOTES_KEYS),
        });
      }
      setRows(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "parse_failed");
    }
  };

  const onCommit = () => {
    if (rows.length === 0) return;
    importMutation.mutate({ rows });
  };

  const report = importMutation.data;

  // F11 follow-up: a sample CSV the consultora can download, fill in
  // and re-upload. Generated client-side as a Blob so we don't carry a
  // static file in the repo.
  const downloadSample = () => {
    const csv =
      "nome,telefone,email,aniversario,notas\n" +
      'Ana Silva,+5511999990001,ana@example.com,1990-04-12,"VIP, alergia a fragrância"\n' +
      "Beatriz Santos,+5511999990002,bia@example.com,,\n" +
      "Carla Oliveira,+5511999990003,,1988-09-30,Lead via Instagram\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wbc-clientes-modelo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/clients"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("import_title")}
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {t("import_format_hint")}
        </p>
      </header>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={downloadSample}
        >
          {t("import_download_sample")}
        </Button>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          aria-label={t("import_title")}
          className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--wc-purple)] file:px-3 file:py-2 file:text-white file:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wc-purple)]"
        />
        {parseError && <Alert variant="danger">{parseError}</Alert>}
      </section>

      {rows.length > 0 && !report && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium text-[var(--wc-fg-1)]">
              {t(
                rows.length === 1
                  ? "import_preview_count_one"
                  : "import_preview_count_other",
                { count: rows.length },
              )}
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={onCommit}
              loading={importMutation.isPending}
              disabled={importMutation.isPending}
            >
              {tCommon("confirm")}
            </Button>
          </div>
          {importMutation.error && (
            <Alert variant="danger">{importMutation.error.message}</Alert>
          )}
          {importMutation.isPending && <ListSkeleton count={3} />}
          <div className="max-h-96 overflow-y-auto">
            {rows.slice(0, 50).map((row, idx) => (
              <ListItem
                key={`${row.phone}-${idx}`}
                title={row.name}
                subtitle={row.phone}
                right={
                  row.email ? (
                    <span className="text-[11px] text-[var(--wc-fg-3)]">
                      {row.email}
                    </span>
                  ) : null
                }
              />
            ))}
            {rows.length > 50 && (
              <p className="mt-2 text-[11px] text-[var(--wc-fg-3)]">
                {t("import_preview_more", { count: rows.length - 50 })}
              </p>
            )}
          </div>
        </section>
      )}

      {report && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-medium text-[var(--wc-fg-1)]">
              {t("import_done_title", {
                imported: report.imported,
                total: report.total,
              })}
            </h2>
            <Link href="/clients">
              <Button type="button" size="sm">
                {t("import_back_to_list")}
              </Button>
            </Link>
          </div>
          {report.skipped.length > 0 && (
            <>
              <p className="text-[11px] text-[var(--wc-fg-3)]">
                {t(
                  report.skipped.length === 1
                    ? "import_skipped_one"
                    : "import_skipped_other",
                  { count: report.skipped.length },
                )}
              </p>
              <div className="max-h-64 overflow-y-auto">
                {report.skipped.map((s) => (
                  <ListItem
                    key={`${s.row}-${s.phone ?? ""}`}
                    title={`#${s.row}${s.phone ? ` · ${s.phone}` : ""}`}
                    subtitle={s.reason}
                    right={<Badge variant="warning">{s.reason}</Badge>}
                  />
                ))}
              </div>
            </>
          )}
          {report.skipped.length === 0 && (
            <EmptyState
              icon={
                <CircleCheck
                  className="h-5 w-5 text-[var(--wc-success)]"
                  strokeWidth={1.75}
                />
              }
              title={t("import_success")}
            />
          )}
        </section>
      )}
    </div>
  );
}
