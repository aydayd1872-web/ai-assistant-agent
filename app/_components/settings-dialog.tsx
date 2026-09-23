"use client";

import { CheckIcon, LanguagesIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type Language, useLanguage } from "./i18n";
import { type AegisModel, MODELS } from "./models";

export function SettingsDialog({
  open,
  onOpenChange,
  modelId,
  onModelChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly modelId: string;
  readonly onModelChange: (id: string) => void;
}) {
  const { t, lang, dir, setLang } = useLanguage();

  const languages: ReadonlyArray<{ value: Language; label: string }> = [
    { label: t.languageEnglish, value: "en" },
    { label: t.languageArabic, value: "ar" },
  ];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5 text-primary" />
            {t.settings}
          </DialogTitle>
          <DialogDescription>{t.settingsDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <LanguagesIcon className="size-3.5" />
              {t.language}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((item) => (
                <button
                  aria-pressed={lang === item.value}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                    lang === item.value
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                  key={item.value}
                  onClick={() => setLang(item.value)}
                  type="button"
                >
                  <span className="font-medium">{item.label}</span>
                  {lang === item.value ? <CheckIcon className="size-4 text-primary" /> : null}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <SparklesIcon className="size-3.5" />
              {t.model}
            </div>
            <p className="-mt-1 text-muted-foreground text-xs">{t.modelDescription}</p>
            <div className="flex flex-col gap-2">
              {MODELS.map((model) => (
                <ModelRow
                  active={model.id === modelId}
                  key={model.id}
                  model={model}
                  onSelect={() => onModelChange(model.id)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/40 p-4">
            <p className="font-medium text-foreground text-sm">{t.aboutTitle}</p>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{t.aboutBody}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModelRow({
  model,
  active,
  onSelect,
}: {
  readonly model: AegisModel;
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
        active
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card/40 hover:border-primary/30",
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {active ? <CheckIcon className="size-3" /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">{model.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
            {model.vendor}
          </span>
        </span>
        <span className="mt-0.5 text-muted-foreground text-xs">{model.blurb}</span>
      </span>
    </button>
  );
}
