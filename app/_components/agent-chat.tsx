"use client";

import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import {
  AlertCircleIcon,
  BrainIcon,
  BugIcon,
  FileSearchIcon,
  ImageIcon,
  KeyRoundIcon,
  PlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationTopFade,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import { useLanguage } from "./i18n";
import { DEFAULT_MODEL_ID, getModelById, MODEL_STORAGE_KEY } from "./models";
import { SettingsDialog } from "./settings-dialog";

const AGENT_NAME = "Aegis";

const SUGGESTION_ICONS = [ShieldCheckIcon, FileSearchIcon, KeyRoundIcon, BugIcon] as const;

export function AgentChat({
  sessionId,
  sessionless = false,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const { t, dir } = useLanguage();
  const [cancellationError, setCancellationError] = useState<string>();
  const [hasInputText, setHasInputText] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored) {
      setModelId(getModelById(stored).id);
    }
  }, []);

  const changeModel = (id: string) => {
    setModelId(id);
    window.localStorage.setItem(MODEL_STORAGE_KEY, id);
  };

  const agent = useEveAgent({
    initialSession:
      sessionId === undefined
        ? undefined
        : {
            sessionId,
            streamIndex: 0,
          },
    resume: sessionId !== undefined,
    onSessionChange(session) {
      if (sessionId === undefined && session !== undefined) {
        // Next patches window.history to navigate, which would detach the active stream.
        History.prototype.replaceState.call(
          window.history,
          window.history.state,
          "",
          `/s/${encodeURIComponent(session.sessionId)}`,
        );
      }
    },
  });

  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isResuming = agent.status === "resuming";
  const isEmpty = agent.data.messages.length === 0;
  const lastMessage = agent.data.messages.at(-1);
  const isPendingAssistantShell =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.every((part) => part.type === "step-start");
  const showPendingThinking =
    isBusy &&
    (agent.status === "submitted" || lastMessage?.role !== "assistant" || isPendingAssistantShell);
  const turnFailure = isBusy || isResuming ? undefined : getLatestTurnFailure(agent.events);
  const errorMessage = cancellationError ?? agent.error?.message ?? turnFailure;
  const hasConversationContent = sessionless || !isEmpty || errorMessage !== undefined;
  const showConversationLayout = isResuming || hasConversationContent;
  const activeSessionId = sessionId ?? agent.session?.sessionId;

  const requestCancellation = () => {
    setCancellationError(undefined);
    void agent.cancel().catch((error: unknown) => {
      setCancellationError(toErrorMessage(error));
    });
  };

  const sendSuggestion = (text: string) => {
    if (isResuming || isBusy) return;
    setCancellationError(undefined);
    void agent.send(text);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if ((text.length === 0 && message.files.length === 0) || isResuming) return;

    setHasInputText(false);
    setCancellationError(undefined);
    const options = isBusy ? { turnPolicy: "steer" as const } : undefined;

    if (message.files.length === 0) {
      await agent.send(text, options);
      return;
    }

    const parts: UserContent = [];
    if (text.length > 0) {
      parts.push({ text, type: "text" });
    }
    for (const file of message.files) {
      parts.push({
        data: file.url,
        filename: file.filename,
        mediaType: file.mediaType,
        type: "file",
      });
    }

    await agent.send(parts, options);
  };

  const composer = (
    <PromptInput accept="image/*" multiple onSubmit={handleSubmit}>
      <AttachmentPreview />
      <PromptInputTextarea
        disabled={isResuming}
        onChange={(event) => setHasInputText(event.currentTarget.value.trim().length > 0)}
        placeholder={t.sendPlaceholder}
      />
      <AttachImageButton isResuming={isResuming} label={t.attachImage} />
      <ComposerAction
        hasInputText={hasInputText}
        isBusy={isBusy}
        isResuming={isResuming}
        onCancel={requestCancellation}
        stopLabel={t.stop}
      />
    </PromptInput>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground" dir={dir}>
      <SettingsDialog
        modelId={modelId}
        onModelChange={changeModel}
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
      />
      {showConversationLayout ? (
        <ChatHeader
          canStartNewChat={activeSessionId !== undefined}
          newChatLabel={t.newChat}
          onOpenSettings={() => setSettingsOpen(true)}
          settingsLabel={t.settings}
        />
      ) : null}

      {showConversationLayout ? (
        <Conversation
          className="min-h-0 flex-1"
          initial={sessionId === undefined ? undefined : false}
          resize={activeSessionId === undefined ? "smooth" : "instant"}
          scrollRestorationKey={
            isEmpty || activeSessionId === undefined
              ? undefined
              : `eve:web-chat-scroll:${activeSessionId}`
          }
        >
          <ConversationTopFade className="top-14" />
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 pt-20 pb-36 sm:px-6">
            {agent.data.messages.map((message, index) =>
              showPendingThinking &&
              isPendingAssistantShell &&
              message.id === lastMessage.id ? null : (
                <AgentMessage
                  canRespond={!isBusy && !isResuming}
                  isStreaming={
                    agent.status === "streaming" && index === agent.data.messages.length - 1
                  }
                  key={message.id}
                  message={message}
                  onInputResponses={(inputResponses) => {
                    setCancellationError(undefined);
                    return agent.respond(inputResponses);
                  }}
                />
              ),
            )}
            {showPendingThinking ? <PendingThinking /> : null}
            {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      ) : null}

      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          showConversationLayout
            ? "fixed bottom-0 left-1/2 z-20 max-w-3xl -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6"
            : "flex max-w-xl flex-1 flex-col items-center justify-center gap-8 pb-[10vh]",
        )}
      >
        {showConversationLayout ? null : (
          <HeroIntro modelName={getModelById(modelId).name} onSuggestion={sendSuggestion} />
        )}
        <div className="w-full">{composer}</div>
      </div>
    </main>
  );
}

function HeroIntro({
  onSuggestion,
  modelName,
}: {
  readonly onSuggestion: (text: string) => void;
  readonly modelName: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_40px_-8px_var(--color-primary)]">
          <ShieldIcon className="size-8" />
        </span>
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-semibold text-5xl tracking-tighter">{AGENT_NAME}</h1>
          <p className="text-balance text-muted-foreground">{t.tagline}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-muted-foreground text-xs backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
          {t.secureSession}
          <span aria-hidden="true" className="text-border">
            /
          </span>
          {modelName}
        </span>
      </div>
      <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
        {t.suggestions.map(({ label, prompt }, index) => {
          const Icon = SUGGESTION_ICONS[index] ?? ShieldCheckIcon;
          return (
          <button
            className="group flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-start transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            key={label}
            onClick={() => onSuggestion(prompt)}
            type="button"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Icon className="size-4" />
            </span>
            <span className="font-medium text-foreground text-sm">{label}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function ComposerAction({
  hasInputText,
  isBusy,
  isResuming,
  onCancel,
  stopLabel,
}: {
  readonly hasInputText: boolean;
  readonly isBusy: boolean;
  readonly isResuming: boolean;
  readonly onCancel: () => void;
  readonly stopLabel: string;
}) {
  const attachments = usePromptInputAttachments();
  const canSubmit = hasInputText || attachments.files.length > 0;

  if (!isBusy || canSubmit) {
    return <PromptInputSubmit className="absolute end-2.5 bottom-2.5" disabled={isResuming} />;
  }

  return (
    <PromptInputButton
      aria-label={stopLabel}
      className="absolute end-2.5 bottom-2.5"
      onClick={onCancel}
      variant="outline"
    >
      <SquareIcon className="size-3 fill-current" />
    </PromptInputButton>
  );
}

function AttachImageButton({
  isResuming,
  label,
}: {
  readonly isResuming: boolean;
  readonly label: string;
}) {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      aria-label={label}
      className="absolute start-2.5 bottom-2.5"
      disabled={isResuming}
      onClick={() => attachments.openFileDialog()}
      type="button"
      variant="ghost"
    >
      <ImageIcon className="size-4" />
    </PromptInputButton>
  );
}

function AttachmentPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {attachments.files.map((file) => (
        <div
          className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted"
          key={file.id}
        >
          {file.mediaType?.startsWith("image/") && file.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={file.filename ?? "attachment"}
              className="size-full object-cover"
              src={file.url}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <button
            aria-label="Remove attachment"
            className="absolute end-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => attachments.remove(file.id)}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { readonly message: string }) {
  const { t } = useLanguage();
  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent>
        <div
          className="flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">{t.requestFailed}</p>
            <p className="mt-0.5 text-muted-foreground">{message}</p>
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

function ChatHeader({
  canStartNewChat,
  onOpenSettings,
  newChatLabel,
  settingsLabel,
}: {
  readonly canStartNewChat: boolean;
  readonly onOpenSettings: () => void;
  readonly newChatLabel: string;
  readonly settingsLabel: string;
}) {
  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-20 h-14">
      <div className="relative mx-auto flex h-full w-full max-w-3xl items-center justify-center bg-gradient-to-b from-background via-background to-transparent px-24">
        <span className="inline-flex items-center gap-2 truncate text-sm">
          <ShieldCheckIcon className="size-4 text-primary" />
          <span className="font-medium text-foreground">{AGENT_NAME}</span>
        </span>
        <div className="pointer-events-auto fixed top-3 end-6 flex items-center gap-1">
          {canStartNewChat ? (
            <Button
              aria-label={newChatLabel}
              onClick={() => window.location.assign("/s")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
              <span className="hidden font-normal text-sm sm:inline">{newChatLabel}</span>
            </Button>
          ) : null}
          <Button
            aria-label={settingsLabel}
            onClick={onOpenSettings}
            size="icon"
            type="button"
            variant="ghost"
          >
            <SettingsIcon className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function PendingThinking() {
  return (
    <Message aria-live="polite" from="assistant">
      <MessageContent>
        <div className="mb-4 flex w-full items-center gap-2 text-muted-foreground text-sm">
          <BrainIcon className="size-4" />
          <Shimmer duration={1}>Thinking</Shimmer>
        </div>
      </MessageContent>
    </Message>
  );
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to cancel the response.";
}

function getLatestTurnFailure(
  events: ReturnType<typeof useEveAgent>["events"],
): string | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event.type === "turn.failed") {
      return event.data.code === "MODEL_CALL_FAILED"
        ? "The model is temporarily unavailable. Please try again."
        : event.data.message;
    }

    if (event.type === "turn.completed" || event.type === "turn.cancelled") {
      return undefined;
    }

    if (event.type === "message.received") {
      return undefined;
    }
  }

  return undefined;
}
