import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUp, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/http";
import { useModules } from "@/lib/modules";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface FoundPost {
  board: string;
  label: string;
  path: string;
  id: string;
  post: Record<string, unknown>;
}

type DraftFields = Record<string, string | number | boolean | null | undefined>;

interface Draft {
  board: string;
  label: string;
  path: string;
  fields: DraftFields;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  posts?: FoundPost[];
  drafts?: Draft[];
}

interface ChatResponse {
  reply: string;
  posts: FoundPost[];
  drafts: Draft[];
}

const NOTICE_KEY = "csb-assistant-notice-v1";

// Where each draft is posted: the same endpoints the board forms use.
const POST_TO: Record<string, string> = {
  lost_found: "/lost-found",
  marketplace: "/marketplace",
  complaints: "/complaints",
  animal_welfare: "/animal-welfare",
  faculty_suggestions: "/faculty-suggestions",
  lending: "/lend-borrow/items",
  notices: "/notices",
};

const CHOICES: Record<string, string[]> = {
  item_type: ["lost", "found"],
  urgency: ["low", "medium", "high"],
  "complaints.category": ["hall", "dining", "lab", "academic", "administration"],
  "notices.category": ["general", "academic", "event", "urgent"],
  itemCondition: ["Like new", "Good", "Fair"],
};

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  feedback: "Feedback",
  item_type: "Lost or found",
  location: "Where",
  price: "Price (৳)",
  category: "Category",
  urgency: "Urgency",
  faculty_name: "Teacher or course",
  subject: "Subject",
  rating: "Rating (1 to 5)",
  anonymous: "Post anonymously",
  itemCondition: "Condition",
  handoffLocation: "Hand-off place",
};

const prettify = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ");

/** Plain-text reply with "- " lines shown as a list. */
function ReplyText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length} className="ml-4 list-disc space-y-1">{list.map((l, i) => <li key={i}>{l}</li>)}</ul>);
    list = [];
  };
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) list.push(t.replace(/^[-*•]\s+/, "").replace(/\*\*/g, ""));
    else {
      flush();
      if (t) blocks.push(<p key={blocks.length}>{t.replace(/\*\*/g, "")}</p>);
    }
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

function PostCard({ found }: { found: FoundPost }) {
  const p = found.post;
  const title = String(p.title ?? p.brand ?? (p.name ? `${p.name} · ${p.blood_type}` : "Post"));
  const detail = [...new Set([p.item_type, p.status, p.category, p.location ?? p.handoff_location]
    .filter(Boolean).map((v) => prettify(String(v))))].join(" · ");
  const price = typeof p.price === "number" || typeof p.price === "string" ? `৳${Number(p.price).toLocaleString("en-BD")}` : null;
  return (
    <Link
      to={found.path}
      className="lift group block rounded-xl border border-foreground/10 bg-card/80 p-3.5 transition-colors hover:border-foreground/25"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{found.label}</span>
      <span className="mt-1 flex items-start justify-between gap-3">
        <span className="font-medium leading-snug">{title}</span>
        {price && <span className="shrink-0 font-display text-lg leading-none">{price}</span>}
      </span>
      {detail && <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>}
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
        Open {found.label.toLowerCase()} <ExternalLink aria-hidden="true" className="h-3 w-3" />
      </span>
    </Link>
  );
}

function DraftCard({ draft }: { draft: Draft }) {
  const [fields, setFields] = useState<DraftFields>(draft.fields);
  const [state, setState] = useState<"edit" | "posting" | "posted">("edit");
  const set = (k: string, v: DraftFields[string]) => setFields((f) => ({ ...f, [k]: v }));

  const post = async () => {
    setState("posting");
    try {
      await api(POST_TO[draft.board], { method: "POST", body: fields });
      setState("posted");
      toast.success(`Posted to ${draft.label}`);
    } catch (error) {
      setState("edit");
      toast.error(error instanceof Error ? error.message : "Could not post");
    }
  };

  if (state === "posted") {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm">
        Posted to {draft.label}. <Link to={draft.path} className="font-medium underline underline-offset-4">See it</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void post(); }}
      className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-3.5"
      aria-label={`Draft for ${draft.label}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Draft · {draft.label} · check before posting</p>
      {Object.entries(fields).map(([key, value]) => {
        const id = `draft-${draft.board}-${key}`;
        const choices = CHOICES[`${draft.board}.${key}`] ?? CHOICES[key];
        if (typeof value === "boolean") {
          return (
            <label key={key} htmlFor={id} className="flex items-center gap-2 text-sm">
              <input id={id} type="checkbox" checked={value} onChange={(e) => set(key, e.target.checked)} />
              {FIELD_LABELS[key] ?? prettify(key)}
            </label>
          );
        }
        return (
          <div key={key} className="space-y-1">
            <Label htmlFor={id} className="text-xs">{FIELD_LABELS[key] ?? prettify(key)}</Label>
            {choices ? (
              <select id={id} value={String(value ?? "")} onChange={(e) => set(key, e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                {choices.map((c) => <option key={c} value={c}>{prettify(c)}</option>)}
              </select>
            ) : key === "description" || key === "feedback" ? (
              <Textarea id={id} value={String(value ?? "")} onChange={(e) => set(key, e.target.value)} rows={3} />
            ) : (
              <Input
                id={id}
                type={typeof value === "number" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) => set(key, typeof value === "number" ? Number(e.target.value) : e.target.value)}
              />
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={state === "posting"}>
          {state === "posting" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Post
        </Button>
        <Link to={draft.path} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Use the full form instead</Link>
      </div>
    </form>
  );
}

/** The assistant button on every signed-in page, and its chat panel. */
export function AssistantPanel() {
  const { assistant } = useModules();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [noticeSeen, setNoticeSeen] = useState(() => {
    try { return localStorage.getItem(NOTICE_KEY) === "1"; } catch { return false; }
  });
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  if (!assistant || !user) return null;

  const isAdmin = user.role === "admin";
  const suggestions = [
    "Did anyone find a wallet near ECE?",
    "Any calculators for sale under ৳1500?",
    "Help me post: I lost my blue water bottle in the library",
    "How do I borrow something?",
    ...(isAdmin ? ["How was campus activity this month?"] : []),
  ];

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setInput("");
    setBusy(true);
    try {
      const res = await api<ChatResponse>("/assistant/chat", {
        method: "POST",
        body: { messages: next.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })) },
      });
      setTurns([...next, { role: "assistant", content: res.reply || "Done.", posts: res.posts, drafts: res.drafts }]);
    } catch (error) {
      setTurns([...next, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the campus assistant"
        className="animate-enter-scale fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_14px_40px_-10px_hsl(var(--glow)/0.7)] transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <Sparkles aria-hidden="true" className="h-5 w-5" />
        <span className="hidden sm:inline">Ask CSB</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-foreground/10 px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 font-display text-2xl font-normal">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" /> Campus assistant
            </SheetTitle>
            <SheetDescription>Finds posts on your campus, drafts posts for you and explains how CSB works.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
            {!noticeSeen && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                <p className="font-medium">Before you ask</p>
                <p className="mt-1 text-foreground/80">
                  Your questions, and posts that match them, are sent to Groq, an AI company in the United States, to write
                  the answers. Phone numbers and email addresses are never sent. Don't type anything private. AI answers
                  can be wrong; check the post before you act on it. <Link to="/privacy" className="underline underline-offset-4">Privacy notice</Link>
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setNoticeSeen(true);
                    try { localStorage.setItem(NOTICE_KEY, "1"); } catch { /* private mode */ }
                  }}
                >
                  Got it
                </Button>
              </div>
            )}

            {turns.length === 0 && noticeSeen && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => void send(s)} className="rounded-xl border border-foreground/10 px-3.5 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/[0.05]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className={cn("animate-enter", t.role === "user" ? "flex justify-end" : "space-y-3")}>
                {t.role === "user" ? (
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/15 px-3.5 py-2.5 text-sm">{t.content}</p>
                ) : (
                  <>
                    <div className="max-w-[95%] text-sm leading-6"><ReplyText text={t.content} /></div>
                    {t.posts && t.posts.length > 0 && (
                      <div className="grid gap-2">{t.posts.map((p) => <PostCard key={p.board + p.id} found={p} />)}</div>
                    )}
                    {t.drafts?.map((d, j) => <DraftCard key={j} draft={d} />)}
                  </>
                )}
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Thinking…
              </p>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-foreground/10 px-4 py-3">
            <Label htmlFor="assistant-input" className="sr-only">Ask the campus assistant</Label>
            <Textarea
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
              }}
              placeholder={noticeSeen ? "Ask about your campus…" : "Read the note above first"}
              disabled={!noticeSeen || busy}
              rows={1}
              maxLength={2000}
              className="max-h-32 min-h-[44px] resize-none"
            />
            <Button type="submit" size="icon" disabled={!noticeSeen || busy || !input.trim()} aria-label="Send">
              <ArrowUp aria-hidden="true" />
            </Button>
            {turns.length > 0 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setTurns([])} aria-label="Clear the conversation">
                <X aria-hidden="true" />
              </Button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
