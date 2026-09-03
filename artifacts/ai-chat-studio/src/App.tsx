import { forwardRef, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Archive,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  FileText,
  Menu,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Role = 'user' | 'assistant';
type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = 'ai-chat-studio-conversations';
const SETTINGS_KEY = 'ai-chat-studio-settings';

const starterConversations: Conversation[] = [
  {
    id: 'field-notes',
    title: 'A better way to think about rest',
    updatedAt: Date.now() - 1000 * 60 * 36,
    messages: [
      {
        id: 'field-user',
        role: 'user',
        content: 'Can you help me think about rest as something more than stopping?',
        createdAt: Date.now() - 1000 * 60 * 38,
      },
      {
        id: 'field-assistant',
        role: 'assistant',
        content:
          'Rest can be an active return to yourself, not simply an absence of work. It can look like attention without an output: a walk with no podcast, cooking without optimizing the recipe, or leaving a question open overnight.\n\nA useful distinction is recovery versus replenishment. Recovery gets you back to baseline. Replenishment gives you more of yourself to bring forward.',
        createdAt: Date.now() - 1000 * 60 * 36,
      },
    ],
  },
  {
    id: 'morning-ritual',
    title: 'Designing a gentler morning',
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    messages: [
      {
        id: 'ritual-user',
        role: 'user',
        content: 'What would a gentler morning routine look like for a creative person?',
        createdAt: Date.now() - 1000 * 60 * 60 * 21,
      },
      {
        id: 'ritual-assistant',
        role: 'assistant',
        content:
          'Start with a small pocket of unclaimed time. Before you consume anything, make one mark of your own: a sentence, a sketch, a list of three observations.\n\nThen add the practical pieces around it. Water, light, movement, and a clear first task are enough. The ritual should make the day feel available, not already behind.',
        createdAt: Date.now() - 1000 * 60 * 60 * 20,
      },
    ],
  },
];

const suggestedPrompts = [
  { label: 'Think something through', prompt: 'Help me think through a decision I have been avoiding.' },
  { label: 'Shape an idea', prompt: 'I have a half-formed idea. Help me find the shape inside it.' },
  { label: 'Make a plan', prompt: 'Help me make a simple, realistic plan for this week.' },
  { label: 'Learn clearly', prompt: 'Explain a complex idea to me with clarity and a useful example.' },
];

const demoResponses = [
  'Let’s take this one piece at a time. What feels most important about it right now — the practical choice, the feeling underneath it, or the story you are telling yourself about what it means?',
  'There is a useful thread here. I would start by separating what you know from what you are guessing, then decide which small experiment could give you better information without demanding a final answer today.',
  'Here is a grounded way to begin: choose the smallest version that would still count, give it a home in your calendar, and leave a little room for the plan to become more honest as you move through it.',
];

const providerModelMap: Record<string, string> = {
  clarity: 'gpt-4o-mini',
  spark: 'gpt-4o-mini',
  depth: 'gpt-4o',
};

async function requestAssistantReply(messages: { role: Role; content: string }[], model: string) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  const providerModel = providerModelMap[model] ?? 'gpt-4o-mini';

  const response = await fetch(`${apiBaseUrl}/api/proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: providerModel,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? 'The assistant request failed.');
  }

  const payload = (await response.json()) as { message?: { content?: string } };
  return payload.message?.content ?? 'I could not generate a response.';
}

function readStorageJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted environments.
  }
}

function readConversations(): Conversation[] {
  const saved = readStorageJSON<Conversation[] | null>(STORAGE_KEY, null);
  if (!Array.isArray(saved) || saved.length === 0) {
    return starterConversations;
  }

  return saved;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatRelativeTime(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function LogoMark() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]" aria-hidden="true">
      <span className="absolute h-3 w-3 rounded-full border-[1.5px] border-current" />
      <span className="absolute h-1.5 w-1.5 translate-x-2 translate-y-2 rounded-full bg-current" />
    </div>
  );
}

function Sidebar({
  conversations,
  activeId,
  search,
  onSearch,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onSettings,
  isOpen,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {isOpen && <button data-testid="button-close-sidebar-overlay" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-[2px] md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[286px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:relative md:z-0 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} data-testid="sidebar-navigation">
        <div className="flex h-[76px] items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em]">Sora</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground)/.52)]">Private AI companion</p>
            </div>
          </div>
          <button data-testid="button-close-sidebar" aria-label="Close sidebar" onClick={onClose} className="rounded-md p-1.5 text-[hsl(var(--sidebar-foreground)/.56)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] md:hidden"><X size={17} /></button>
        </div>

        <div className="px-4 pb-5">
          <button data-testid="button-new-conversation" onClick={onNew} className="group flex w-full items-center justify-between rounded-[10px] bg-[hsl(var(--sidebar-primary))] px-3.5 py-3 text-left text-[13px] font-semibold text-[hsl(var(--sidebar-primary-foreground))] shadow-sm transition-transform hover:-translate-y-0.5">
            <span className="flex items-center gap-2.5"><Plus size={16} strokeWidth={2.5} /> New conversation</span>
            <span className="font-mono text-[10px] opacity-55">⌘ K</span>
          </button>
        </div>

        <div className="px-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--sidebar-foreground)/.42)]" />
            <input data-testid="input-search-conversations" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search conversations" className="h-9 w-full rounded-[9px] border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.62)] pl-9 pr-3 text-[12px] text-[hsl(var(--sidebar-foreground))] outline-none placeholder:text-[hsl(var(--sidebar-foreground)/.42)] focus:border-[hsl(var(--sidebar-primary)/.7)]" />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 pb-2 pt-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--sidebar-foreground)/.43)]">Your thoughts</p>
          <span className="font-mono text-[10px] text-[hsl(var(--sidebar-foreground)/.36)]">{conversations.length}</span>
        </div>
        <div className="chat-scroll flex-1 overflow-y-auto px-3">
          {conversations.length === 0 ? (
            <div data-testid="empty-conversation-history" className="mx-2 mt-4 rounded-lg border border-dashed border-[hsl(var(--sidebar-border))] px-3 py-4 text-center">
              <Archive size={16} className="mx-auto mb-2 text-[hsl(var(--sidebar-foreground)/.4)]" />
              <p className="text-[11px] leading-4 text-[hsl(var(--sidebar-foreground)/.52)]">No conversations match that search.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div key={conversation.id} className={`group relative flex items-center rounded-[9px] transition-colors ${activeId === conversation.id ? 'bg-[hsl(var(--sidebar-accent))]' : 'hover:bg-[hsl(var(--sidebar-accent)/.7)]'}`}>
                  <button data-testid={`button-select-conversation-${conversation.id}`} onClick={() => { onSelect(conversation.id); onClose(); }} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                    <p data-testid={`text-conversation-title-${conversation.id}`} className="truncate pr-5 text-[12px] font-medium">{conversation.title}</p>
                    <p className="mt-1 font-mono text-[10px] text-[hsl(var(--sidebar-foreground)/.4)]">{formatRelativeTime(conversation.updatedAt)} ago</p>
                  </button>
                  <div className="absolute right-2 hidden items-center gap-0.5 rounded-md bg-[hsl(var(--sidebar-accent))] pl-1 group-hover:flex">
                    <button data-testid={`button-rename-conversation-${conversation.id}`} aria-label={`Rename ${conversation.title}`} title="Rename conversation" onClick={() => onRename(conversation)} className="rounded p-1 text-[hsl(var(--sidebar-foreground)/.5)] hover:text-[hsl(var(--sidebar-primary))]"><Pencil size={13} /></button>
                    <button data-testid={`button-delete-conversation-${conversation.id}`} aria-label={`Delete ${conversation.title}`} title="Delete conversation" onClick={() => onDelete(conversation.id)} className="rounded p-1 text-[hsl(var(--sidebar-foreground)/.5)] hover:text-[hsl(var(--accent))]"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-[hsl(var(--sidebar-border))] p-3">
          <button data-testid="button-open-settings" onClick={onSettings} className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[12px] text-[hsl(var(--sidebar-foreground)/.72)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]">
            <Settings size={16} /><span>Settings</span><ChevronRight size={14} className="ml-auto opacity-45" />
          </button>
          <div className="mt-2 flex items-center gap-2.5 rounded-[9px] bg-[hsl(var(--sidebar-accent)/.55)] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[11px] font-bold text-[hsl(var(--accent-foreground))]">M</div>
            <div className="min-w-0"><p className="truncate text-[11px] font-medium">Sora workspace</p><p className="font-mono text-[9px] text-[hsl(var(--sidebar-foreground)/.42)]">On this device</p></div>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" title="Saved locally" />
          </div>
        </div>
      </aside>
    </>
  );
}

function ModelMenu({ model, onChange }: { model: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const models = [
    { id: 'clarity', name: 'Clarity', note: 'Balanced & thoughtful' },
    { id: 'spark', name: 'Spark', note: 'Fast & exploratory' },
    { id: 'depth', name: 'Depth', note: 'Patient & nuanced' },
  ];
  const selected = models.find((item) => item.id === model) ?? models[0];
  return (
    <div className="relative">
      <button data-testid="button-model-selector" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" /> {selected.name} <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div data-testid="menu-model-options" className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border bg-[hsl(var(--popover))] p-1.5 shadow-[var(--shadow-soft)]">
          {models.map((item) => (
            <button data-testid={`button-model-${item.id}`} key={item.id} onClick={() => { onChange(item.id); setOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-[hsl(var(--muted))]">
              <span><span className="block text-[12px] font-semibold">{item.name}</span><span className="block pt-0.5 text-[10px] text-muted-foreground">{item.note}</span></span>
              {selected.id === item.id && <Check size={15} className="text-[hsl(var(--primary))]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsModal({ open, onClose, demoMode, onDemoMode, model, onModel, darkMode, onTheme }: { open: boolean; onClose: () => void; demoMode: boolean; onDemoMode: (value: boolean) => void; model: string; onModel: (value: string) => void; darkMode: boolean; onTheme: () => void }) {
  if (!open) return null;
  return (
    <div data-testid="settings-dialog" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <button data-testid="button-close-settings-backdrop" onClick={onClose} className="absolute inset-0 cursor-default" aria-label="Close settings" />
      <section className="relative w-full max-w-lg rounded-t-2xl border bg-[hsl(var(--card))] p-6 shadow-[var(--shadow-soft)] sm:rounded-2xl" aria-label="Settings">
        <div className="mb-7 flex items-start justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--primary))]">Workspace preferences</p><h2 className="mt-1 font-serif text-3xl">Settings</h2></div>
          <button data-testid="button-close-settings" onClick={onClose} aria-label="Close settings" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b pb-5">
            <div><p className="text-[13px] font-semibold">Local responses</p><p className="mt-1 max-w-[290px] text-[11px] leading-4 text-muted-foreground">Responses are generated on this device. Nothing leaves this browser.</p></div>
            <button data-testid="button-toggle-demo-mode" role="switch" aria-checked={demoMode} onClick={() => onDemoMode(!demoMode)} className={`relative h-6 w-11 rounded-full transition-colors ${demoMode ? 'bg-[hsl(var(--primary))]' : 'bg-muted'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform ${demoMode ? 'translate-x-6' : 'translate-x-1'}`} /></button>
          </div>
          <div className="border-b pb-5">
            <p className="text-[13px] font-semibold">Default model</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['clarity', 'spark', 'depth'].map((item) => <button data-testid={`button-settings-model-${item}`} key={item} onClick={() => onModel(item)} className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium capitalize transition-colors ${model === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.09)] text-[hsl(var(--primary))]' : 'hover:bg-muted'}`}>{item}</button>)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-[13px] font-semibold">Appearance</p><p className="mt-1 text-[11px] text-muted-foreground">{darkMode ? 'Dark canvas' : 'Light canvas'}</p></div>
            <button data-testid="button-toggle-theme-settings" onClick={onTheme} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium hover:bg-muted">{darkMode ? <Moon size={14} /> : <Sun size={14} />}{darkMode ? 'Dark' : 'Light'}</button>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between rounded-lg bg-[hsl(var(--muted)/.68)] px-3.5 py-3"><span className="flex items-center gap-2 text-[11px] text-muted-foreground"><FileText size={14} /> Your chats are stored on this device</span><span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--primary))]">Local</span></div>
      </section>
    </div>
  );
}

function TypingIndicator() {
  return <div data-testid="status-assistant-typing" className="flex items-center gap-3 animate-rise-in"><div className="flex h-8 w-8 items-center justify-center rounded-[10px] border bg-[hsl(var(--card))] text-[hsl(var(--primary))]"><Sparkles size={15} /></div><div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border bg-[hsl(var(--card))] px-4 py-3"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse-dot" /><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse-dot [animation-delay:160ms]" /><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse-dot [animation-delay:320ms]" /></div></div>;
}

function AssistantMessage({ message, copied, onCopy }: { message: Message; copied: boolean; onCopy: () => void }) {
  return (
    <div className="group flex gap-3.5 animate-rise-in">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border bg-[hsl(var(--card))] text-[hsl(var(--primary))]"><Sparkles size={15} /></div>
      <div className="min-w-0 max-w-[680px]">
        <div data-testid={`message-assistant-${message.id}`} className="whitespace-pre-line text-[14px] leading-7 text-foreground/85">{message.content}</div>
        <div className="mt-2 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button data-testid={`button-copy-message-${message.id}`} onClick={onCopy} aria-label="Copy assistant response" title="Copy response" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">{copied ? <Check size={14} className="text-[hsl(var(--primary))]" /> : <Clipboard size={14} />}</button>
          <span className="text-[10px] text-muted-foreground">{copied ? 'Copied' : 'Assistant'}</span>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Message }) {
  return <div className="flex justify-end animate-rise-in"><div data-testid={`message-user-${message.id}`} className="max-w-[min(680px,86%)] rounded-2xl rounded-br-md bg-[hsl(var(--primary))] px-4 py-3 text-[14px] leading-6 text-[hsl(var(--primary-foreground))] shadow-sm">{message.content}</div></div>;
}

function EmptyChat({ onPrompt, demoMode }: { onPrompt: (prompt: string) => void; demoMode: boolean }) {
  return (
    <div data-testid="empty-chat-state" className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 pb-10 pt-12 sm:px-8">
      <div className="mb-9">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] border border-[hsl(var(--primary)/.22)] bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]"><Sparkles size={21} /></div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--primary))]">A quieter place to think</p>
        <h1 data-testid="text-welcome-heading" className="mt-2 max-w-xl font-serif text-[clamp(2.8rem,7vw,5.25rem)] leading-[.92] tracking-[-.045em]">Good evening,<br /><em className="text-[hsl(var(--accent))]">friend.</em></h1>
        <p className="mt-5 max-w-md text-[14px] leading-6 text-muted-foreground">Bring a question, a rough idea, or a blank page. We’ll make a little room for it.</p>
      </div>
      <div className="grid max-w-2xl gap-2 sm:grid-cols-2">
        {suggestedPrompts.map((item, index) => <button data-testid={`button-suggested-prompt-${index}`} key={item.label} onClick={() => onPrompt(item.prompt)} className="group flex items-center justify-between rounded-xl border bg-[hsl(var(--card)/.68)] px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/.4)] hover:shadow-[var(--shadow-soft)]"><span><span className="block text-[12px] font-semibold">{item.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{item.prompt}</span></span><ArrowUp size={15} className="-rotate-45 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[hsl(var(--primary))]" /></button>)}
      </div>
      <div data-testid="status-demo-mode" className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${demoMode ? 'bg-[hsl(var(--primary))]' : 'bg-muted-foreground'}`} /> Local responses are {demoMode ? 'on' : 'off'} <span className="mx-1 h-3 w-px bg-border" /> Conversations stay on this device</div>
    </div>
  );
}

function ChatWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>(readConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseError, setResponseError] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => readStorageJSON<string | null>('ai-chat-studio-theme', null) === 'dark');
  const [demoMode, setDemoMode] = useState(() => {
    const settings = readStorageJSON<{ demoMode?: boolean; model?: string } | null>(SETTINGS_KEY, null);
    return settings?.demoMode ?? true;
  });
  const [model, setModel] = useState(() => {
    const settings = readStorageJSON<{ demoMode?: boolean; model?: string } | null>(SETTINGS_KEY, null);
    return settings?.model ?? 'clarity';
  });
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const streamTimer = useRef<number | null>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((item) => item.title.toLowerCase().includes(term) || item.messages.some((message) => message.content.toLowerCase().includes(term)));
  }, [conversations, search]);

  useEffect(() => {
    writeStorageJSON(STORAGE_KEY, conversations);
  }, [conversations]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    writeStorageJSON('ai-chat-studio-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  useEffect(() => {
    writeStorageJSON(SETTINGS_KEY, { demoMode, model });
  }, [demoMode, model]);
  useEffect(() => {
    if (activeId && !conversations.some((conversation) => conversation.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, conversations]);
  useEffect(() => () => { if (streamTimer.current) window.clearTimeout(streamTimer.current); }, []);

  const startNew = () => {
    if (streamTimer.current) window.clearTimeout(streamTimer.current);
    setActiveId(null); setDraft(''); setIsStreaming(false); setResponseError(false); setSidebarOpen(false);
    window.setTimeout(() => composerRef.current?.focus(), 50);
  };

  const respondTo = async (
    conversationId: string,
    userText: string,
    removeMessageId?: string,
    explicitHistory?: { role: Role; content: string }[],
  ) => {
    if (streamTimer.current) {
      window.clearTimeout(streamTimer.current);
      streamTimer.current = null;
    }

    setIsStreaming(true);
    setResponseError(false);

    if (!demoMode) {
      const targetConversation = conversations.find((item) => item.id === conversationId);
      const history = explicitHistory ?? targetConversation?.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })) ?? [];

      if ((!targetConversation && !explicitHistory) || history.length === 0) {
        setIsStreaming(false);
        setResponseError(true);
        return;
      }

      try {
        const response = await requestAssistantReply(history, model);
        setConversations((items) => items.map((item) => {
          if (item.id !== conversationId) return item;
          const messages = removeMessageId ? item.messages.filter((message) => message.id !== removeMessageId) : item.messages;
          return {
            ...item,
            messages: [...messages, { id: makeId('assistant'), role: 'assistant', content: response, createdAt: Date.now() }],
            updatedAt: Date.now(),
          };
        }));
      } catch {
        setResponseError(true);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
    streamTimer.current = window.setTimeout(() => {
      setConversations((items) => items.map((item) => {
        if (item.id !== conversationId) return item;
        const messages = removeMessageId ? item.messages.filter((message) => message.id !== removeMessageId) : item.messages;
        return {
          ...item,
          messages: [...messages, { id: makeId('assistant'), role: 'assistant', content: response, createdAt: Date.now() }],
          updatedAt: Date.now(),
        };
      }));
      streamTimer.current = null;
      setIsStreaming(false);
    }, 1100);
    void userText;
  };

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || isStreaming) return;

    let conversationId = activeId;
    let history: { role: Role; content: string }[] = [];

    if (!conversationId) {
      conversationId = makeId('conversation');
      const title = text.length > 43 ? `${text.slice(0, 43).trim()}…` : text;
      const userMessage = { id: makeId('user'), role: 'user' as const, content: text, createdAt: Date.now() };
      history = [{ role: userMessage.role, content: userMessage.content }];
      setConversations((items) => [{ id: conversationId as string, title, messages: [userMessage], updatedAt: Date.now() }, ...items]);
      setActiveId(conversationId);
    } else {
      const currentMessages = conversations.find((item) => item.id === conversationId)?.messages ?? [];
      const userMessage = { id: makeId('user'), role: 'user' as const, content: text, createdAt: Date.now() };
      history = [...currentMessages.map((message) => ({ role: message.role, content: message.content })), { role: userMessage.role, content: userMessage.content }];
      setConversations((items) => items.map((item) => item.id === conversationId ? { ...item, messages: [...item.messages, userMessage], updatedAt: Date.now() } : item));
    }

    setDraft('');
    void respondTo(conversationId, text, undefined, history);
  };

  const regenerate = () => {
    if (!activeConversation || isStreaming) return;
    const lastAssistant = [...activeConversation.messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) return;
    const history = activeConversation.messages
      .filter((message) => message.id !== lastAssistant.id)
      .map((message) => ({ role: message.role, content: message.content }));
    void respondTo(activeConversation.id, '', lastAssistant.id, history);
  };

  const renameConversation = (conversation: Conversation) => {
    const nextTitle = window.prompt('Rename conversation', conversation.title)?.trim();
    if (nextTitle) setConversations((items) => items.map((item) => item.id === conversation.id ? { ...item, title: nextTitle } : item));
  };
  const deleteConversation = (id: string) => {
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation || !window.confirm(`Delete “${conversation.title}”?`)) return;
    setConversations((items) => items.filter((item) => item.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const copyResponse = async (message: Message) => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(message.content);
      }
    } catch {
      // Clipboard can be unavailable in some browsers or restricted contexts.
    }
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };
  const handlePrompt = (prompt: string) => { setDraft(prompt); window.setTimeout(() => composerRef.current?.focus(), 50); };

  return (
    <div className="grain flex min-h-[100dvh] bg-background">
      <Sidebar conversations={filteredConversations} activeId={activeId} search={search} onSearch={setSearch} onSelect={setActiveId} onNew={startNew} onRename={renameConversation} onDelete={deleteConversation} onSettings={() => setSettingsOpen(true)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="relative flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button data-testid="button-open-sidebar" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={19} /></button>
            <div className="min-w-0">{activeConversation ? <><p className="truncate text-[13px] font-semibold">{activeConversation.title}</p><p data-testid="status-conversation-saved" className="mt-0.5 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" /> Saved locally</p></> : <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">New conversation</p>}</div>
          </div>
          <div className="flex items-center gap-1">
            {activeConversation && <button data-testid="button-regenerate-response" onClick={regenerate} disabled={isStreaming} title="Regenerate last response" className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:flex"><RotateCcw size={14} /> Regenerate</button>}
            <ModelMenu model={model} onChange={setModel} />
            <button data-testid="button-toggle-theme" aria-label="Toggle color theme" onClick={() => setDarkMode(!darkMode)} title="Toggle theme" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">{darkMode ? <Moon size={17} /> : <Sun size={17} />}</button>
            <button data-testid="button-header-settings" aria-label="Open settings" onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Settings size={17} /></button>
          </div>
        </header>

        {activeConversation ? (
          <>
            <div className="chat-scroll flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pb-8 pt-9 sm:px-8">
                <div className="flex items-center gap-3 pb-2 text-[10px] text-muted-foreground"><span className="h-px flex-1 bg-border" /><span className="font-mono uppercase tracking-[0.15em]">Today</span><span className="h-px flex-1 bg-border" /></div>
                {activeConversation.messages.map((message) => message.role === 'user' ? <UserMessage key={message.id} message={message} /> : <AssistantMessage key={message.id} message={message} copied={copiedId === message.id} onCopy={() => copyResponse(message)} />)}
                {isStreaming && <TypingIndicator />}
                {responseError && <div data-testid="status-response-error" className="flex items-center justify-between rounded-xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.07)] px-4 py-3 text-[12px] text-[hsl(var(--destructive))]"><span>{demoMode ? 'That response did not finish.' : 'Local responses are off, so no response was generated.'}</span>{demoMode && <button data-testid="button-retry-response" onClick={() => void respondTo(activeConversation.id, 'retry')} className="font-semibold underline">Try again</button>}</div>}
              </div>
            </div>
            <div className="mx-auto w-full max-w-3xl px-5 pb-5 pt-2 sm:px-8 sm:pb-8">
              <Composer ref={composerRef} draft={draft} setDraft={setDraft} onSubmit={sendMessage} disabled={isStreaming} />
              <p data-testid="status-composer-mode" className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/65">{demoMode ? 'Local responses · Generated on this device' : 'Local responses off · Turn them on to reply'}</p>
            </div>
          </>
        ) : (
          <>
            <EmptyChat onPrompt={handlePrompt} demoMode={demoMode} />
            <div className="mx-auto w-full max-w-3xl px-5 pb-5 sm:px-8 sm:pb-8">
              <Composer ref={composerRef} draft={draft} setDraft={setDraft} onSubmit={sendMessage} disabled={isStreaming} />
              <p data-testid="status-composer-mode" className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/65">{demoMode ? 'Local responses · Generated on this device' : 'Local responses off · Turn them on to reply'}</p>
            </div>
          </>
        )}
      </main>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} demoMode={demoMode} onDemoMode={setDemoMode} model={model} onModel={setModel} darkMode={darkMode} onTheme={() => setDarkMode(!darkMode)} />
    </div>
  );
}

const Composer = forwardRef<HTMLTextAreaElement, { draft: string; setDraft: (value: string) => void; onSubmit: (event?: FormEvent) => void; disabled: boolean }>(({ draft, setDraft, onSubmit, disabled }, ref) => {
  const resize = (element: HTMLTextAreaElement) => { element.style.height = 'auto'; element.style.height = `${Math.min(element.scrollHeight, 150)}px`; };
  return (
    <form data-testid="form-message-composer" onSubmit={onSubmit} className="relative rounded-2xl border bg-[hsl(var(--card))] p-2 shadow-[0_10px_30px_hsl(var(--foreground)/.05)] transition-shadow focus-within:border-[hsl(var(--primary)/.55)] focus-within:shadow-[0_12px_34px_hsl(var(--primary)/.1)]">
      <textarea data-testid="input-message-composer" ref={ref} value={draft} onChange={(event) => { setDraft(event.target.value); resize(event.currentTarget); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSubmit(); } }} rows={1} disabled={disabled} placeholder="What’s on your mind?" className="chat-scroll max-h-[150px] min-h-[52px] w-full resize-none bg-transparent px-3 py-2.5 pr-14 text-[14px] leading-6 outline-none placeholder:text-muted-foreground/70 disabled:opacity-60" />
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><MessageCircle size={13} /> Shift + Enter for a new line</span>
        <button data-testid="button-send-message" type="submit" disabled={!draft.trim() || disabled} aria-label="Send message" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"><Send size={15} /></button>
      </div>
    </form>
  );
});
Composer.displayName = 'Composer';

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={ChatWorkspace} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;