import React, { useEffect, useMemo, useRef, useState } from "react";

const ICONS = {
  more: "⋯",
  plus: "+",
  trash: "⌫",
  edit: "✎",
  export: "⇩",
  import: "⇧",
  close: "×",
  save: "◆",
  link: "↔",
  stack: "▤",
  note: "◇",
};

const STORAGE_KEY = "synapsing.react.workspace.v1";
const THEME_KEY = "synapsing.react.theme.v1";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowISO = () => new Date().toISOString();
const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");
const parseTags = (value) =>
  Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
const cx = (...classes) => classes.filter(Boolean).join(" ");
const escapeText = (value) => String(value ?? "");
const safeName = (value) =>
  String(value || "synapsing")
    .normalize("NFKD")
    .replace(/[^\w\-.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const THEMES = {
  "street-ninja": {
    id: "street-ninja",
    name: "Street Ninja",
    description: "Dark suite default with signal green accents.",
    mode: "dark",
    accent: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.22)",
    page: "#111111",
    panel: "#141414",
    panel2: "#171717",
    input: "#101010",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    border: "#27272a",
    hover: "#27272a",
    menu: "#191919",
    overlay: "rgba(0, 0, 0, 0.70)",
    accentText: "#ffffff",
  },
  stark: {
    id: "stark",
    name: "Stark",
    description: "Cold dark suite theme with electric blue accents.",
    mode: "dark",
    accent: "#5AD7FF",
    accentSoft: "rgba(90, 215, 255, 0.22)",
    page: "#101216",
    panel: "#151922",
    panel2: "#181d27",
    input: "#0d1117",
    text: "#f4f8fb",
    muted: "#a8b3bd",
    border: "#2a313b",
    hover: "#222b37",
    menu: "#171d26",
    overlay: "rgba(0, 0, 0, 0.70)",
    accentText: "#071018",
  },
  "mossdeep-lab": {
    id: "mossdeep-lab",
    name: "Mossdeep Lab",
    description: "Bright coastal research-lab theme for calmer writing sessions.",
    mode: "light",
    accent: "#3aa6a1",
    accentSoft: "rgba(58, 166, 161, 0.18)",
    page: "#eef8f7",
    panel: "#fbfffd",
    panel2: "#dcefed",
    input: "#f8fffd",
    text: "#102426",
    muted: "#5c7375",
    border: "#b8d9d6",
    hover: "#d1ebe8",
    menu: "#fbfffd",
    overlay: "rgba(16, 36, 38, 0.24)",
    accentText: "#ffffff",
  },
  pencil: {
    id: "pencil",
    name: "Pencil",
    description: "Light notebook surface with graphite structure.",
    mode: "light",
    accent: "#2f2f2c",
    accentSoft: "rgba(47, 47, 44, 0.14)",
    page: "#f5f1e7",
    panel: "#fffdf6",
    panel2: "#eee7d8",
    input: "#fffaf0",
    text: "#191816",
    muted: "#6f6a60",
    border: "#d2c8b6",
    hover: "#e7decd",
    menu: "#fffdf6",
    overlay: "rgba(25, 24, 22, 0.24)",
    accentText: "#fffdf6",
  },
  "fallout-terminal": {
    id: "fallout-terminal",
    name: "Fallout Terminal",
    description: "Monochrome terminal theme for hard focus.",
    mode: "dark",
    accent: "#39ff14",
    accentSoft: "rgba(57, 255, 20, 0.14)",
    page: "#020602",
    panel: "#061006",
    panel2: "#0a180a",
    input: "#010401",
    text: "#d8ffd2",
    muted: "#78a672",
    border: "#1f3f1d",
    hover: "#102610",
    menu: "#071207",
    overlay: "rgba(0, 4, 0, 0.76)",
    accentText: "#020602",
  },
};

const getTheme = (themeId) => THEMES[themeId] || THEMES["street-ninja"];

const seedWorkspace = () => {
  const created = nowISO();
  const welcome = {
    id: uid(),
    title: "Welcome",
    content:
      "# Welcome\n\nSynaps.ing is a linked markdown notebook. Use [[wiki links]] for cross-note references and >>subnotes>> for child notes.\n\nThis React refactor keeps the stack/card structure, but moves it into the same dense suite language as Spiketrain.",
    created,
    modified: created,
    stack: "Inbox",
    tags: ["getting-started"],
    parentId: null,
    order: 1,
  };
  const firstIdea = {
    id: uid(),
    title: "First Idea",
    content: "# First Idea\n\nThis note is linked from [[Welcome]]. It can live anywhere without becoming a child.",
    created,
    modified: created,
    stack: "Inbox",
    tags: ["example"],
    parentId: null,
    order: 2,
  };
  const nextSteps = {
    id: uid(),
    title: "Next Steps",
    content: "# Next Steps\n\nTry creating stacks, dragging notes, exporting markdown, and using the search operators: tag:, title:, stack:, contains:, and id:.",
    created,
    modified: created,
    stack: "Inbox",
    tags: ["example", "subnote"],
    parentId: welcome.id,
    order: 1,
  };
  return {
    workspaceTitle: "Synaps.ing React Workspace",
    currentId: welcome.id,
    selectedStack: "Inbox",
    filterMode: false,
    stacks: ["Inbox", "Research", "Projects"],
    notes: [welcome, firstIdea, nextSteps],
  };
};

const safeReadWorkspace = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.notes) || !Array.isArray(data.stacks)) return null;
    return data;
  } catch {
    return null;
  }
};

const safeReadTheme = () => {
  if (typeof window === "undefined") return "street-ninja";
  try {
    return window.localStorage.getItem(THEME_KEY) || "street-ninja";
  } catch {
    return "street-ninja";
  }
};

const downloadFile = (filename, content, type = "application/json") => {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

function Button({ children, active, className = "", onClick, icon, disabled, title, type = "button" }) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "h-8 px-3 text-xs border transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed",
        "bg-[var(--panel2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--hover)]",
        active && "bg-[var(--accent)] border-[var(--accent)] text-[var(--accentText)] hover:opacity-90",
        className
      )}
    >
      {icon ? <span className="text-sm leading-none">{icon}</span> : null}
      {children}
    </button>
  );
}

function Menu({ label, items, disabled }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  return (
    <div className="relative h-full flex items-center" onMouseEnter={() => { cancelClose(); if (!disabled) setOpen(true); }} onMouseLeave={scheduleClose}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cx("h-full px-2 text-xs", disabled ? "opacity-40 cursor-not-allowed" : open ? "bg-[var(--hover)]" : "hover:bg-[var(--hover)]")}
      >
        {label}
      </button>
      {open && !disabled && (
        <div className="absolute top-full left-0 z-40 pt-2" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          <div className="min-w-[220px] border border-[var(--border)] bg-[var(--menu)] shadow-xl py-1">
            {items.map((item, index) =>
              item.divider ? (
                <div key={index} className="h-px bg-[var(--border)] my-1" />
              ) : (
                <button
                  key={index}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.action?.();
                  }}
                  className={cx("w-full h-8 px-3 text-left text-xs flex items-center justify-between gap-3", item.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[var(--hover)]")}
                >
                  <span>{item.label}</span>
                  {item.hint ? <span className="text-[var(--muted)]">{item.hint}</span> : null}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, width = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-center justify-center p-4">
      <div className={cx("w-full border border-[var(--border)] bg-[var(--panel)] shadow-2xl", width)}>
        <div className="h-10 px-3 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm text-[var(--text)]">{title}</h2>
          <button onClick={onClose} className="text-xl text-[var(--muted)] hover:text-[var(--text)]">{ICONS.close}</button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={cx("border border-[var(--border)] bg-[var(--panel)] min-h-0", className)}>
      <div className="h-9 px-3 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm truncate text-[var(--text)]">{title}</h3>
        {action || <span className="text-[var(--muted)] text-lg leading-none">{ICONS.more}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs text-[var(--muted)]">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder = "", textarea, className = "" }) {
  const Input = textarea ? "textarea" : "input";
  return (
    <Input
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full bg-[var(--input)] border border-[var(--border)] px-2 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]",
        textarea && "min-h-[90px] resize-none leading-6",
        className
      )}
    />
  );
}

function SelectInput({ value, onChange, children, className = "" }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={cx("w-full bg-[var(--input)] border border-[var(--border)] px-2 h-8 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]", className)}>
      {children}
    </select>
  );
}

function extractLinks(text) {
  const wiki = Array.from(String(text || "").matchAll(/\[\[([^\]]+?)\]\]/g)).map((m) => m[1].trim()).filter(Boolean);
  const subs = Array.from(String(text || "").matchAll(/>>\s*([^>]+?)\s*>>/g)).map((m) => m[1].trim()).filter(Boolean);
  return { wiki, subs };
}

function parseQuery(q) {
  const parts = String(q || "").trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const res = { tag: [], contains: [], title: [], stack: [], id: [], free: [] };
  parts.forEach((token) => {
    const t = token.replace(/^"|"$/g, "");
    const m = t.match(/^(tag|contains|title|stack|id):(.*)$/i);
    if (m) {
      const key = m[1].toLowerCase();
      const value = m[2].trim().toLowerCase();
      if (value) res[key].push(value);
    } else if (t) {
      res.free.push(t.toLowerCase());
    }
  });
  return res;
}

export default function App() {
  const initial = useMemo(() => safeReadWorkspace() || seedWorkspace(), []);
  const [themeId, setThemeId] = useState(safeReadTheme);
  const theme = getTheme(themeId);
  const [workspaceTitle, setWorkspaceTitle] = useState(initial.workspaceTitle || "Synaps.ing");
  const [notes, setNotes] = useState(initial.notes || []);
  const [stacks, setStacks] = useState(initial.stacks?.length ? initial.stacks : ["Inbox"]);
  const [currentId, setCurrentId] = useState(initial.currentId || initial.notes?.[0]?.id || null);
  const [selectedStack, setSelectedStack] = useState(initial.selectedStack || initial.stacks?.[0] || "Inbox");
  const [filterMode, setFilterMode] = useState(!!initial.filterMode);
  const [search, setSearch] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileOverride, setMobileOverride] = useState(false);
  const fileInputRef = useRef(null);

  const current = notes.find((note) => note.id === currentId) || notes[0] || null;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => root.style.setProperty(`--${key}`, value));
    root.style.setProperty("--font-body", theme.mode === "dark" ? "Inter, ui-sans-serif, system-ui" : "Georgia, 'Times New Roman', serif");
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, themeId);
  }, [theme, themeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = { workspaceTitle, currentId, selectedStack, filterMode, stacks, notes };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [workspaceTitle, currentId, selectedStack, filterMode, stacks, notes]);

  const listChildren = (parentId, source = notes) => source.filter((note) => note.parentId === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const listByStack = (stack, source = notes) => source.filter((note) => (note.stack || "Inbox") === stack).sort((a, b) => (a.order || 0) - (b.order || 0));
  const listTopLevel = (stack, source = notes) => source.filter((note) => (note.stack || "Inbox") === stack && !note.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const stackIndex = (stack) => Math.max(1, stacks.indexOf(stack) + 1);
  const nextOrderFor = (parentId, stack, source = notes) => {
    const pool = parentId ? source.filter((note) => note.parentId === parentId) : source.filter((note) => note.stack === stack && !note.parentId);
    return pool.reduce((max, note) => Math.max(max, note.order || 0), 0) + 1;
  };

  const hierarchicalId = (note, source = notes) => {
    if (!note) return "—";
    const parts = [stackIndex(note.stack)];
    const lineage = [];
    let cursor = note;
    while (cursor) {
      const siblings = cursor.parentId
        ? source.filter((n) => n.parentId === cursor.parentId).sort((a, b) => (a.order || 0) - (b.order || 0))
        : source.filter((n) => n.stack === cursor.stack && !n.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
      lineage.push(siblings.findIndex((n) => n.id === cursor.id) + 1);
      cursor = cursor.parentId ? source.find((n) => n.id === cursor.parentId) : null;
    }
    return parts.concat(lineage.reverse()).join(".");
  };

  const updateNote = (id, fields) => {
    setNotes((prev) => {
      let next = prev.map((note) => (note.id === id ? { ...note, ...fields, modified: nowISO() } : note));
      const updated = next.find((note) => note.id === id);
      if (updated?.stack && !stacks.includes(updated.stack)) setStacks((old) => Array.from(new Set([...old, updated.stack])));
      return next;
    });
  };

  const createNote = ({ title = "New Note", content = "", stack = selectedStack || "Inbox", tags = [], parentId = null } = {}) => {
    const created = nowISO();
    const note = {
      id: uid(),
      title,
      content,
      created,
      modified: created,
      stack,
      tags: parseTags(tags),
      parentId,
      order: nextOrderFor(parentId, stack),
    };
    setStacks((prev) => Array.from(new Set([...prev, stack])));
    setNotes((prev) => [...prev, note]);
    setSelectedStack(stack);
    setCurrentId(note.id);
    return note;
  };

  const collectDescendants = (rootId, source = notes) => {
    const ids = [rootId];
    const walk = (parentId) => {
      source.filter((n) => n.parentId === parentId).forEach((child) => {
        ids.push(child.id);
        walk(child.id);
      });
    };
    walk(rootId);
    return ids;
  };

  const duplicateCurrent = () => {
    if (!current) return;
    createNote({
      title: `${current.title} (copy)`,
      content: current.content,
      stack: current.stack,
      tags: [...(current.tags || [])],
      parentId: current.parentId || null,
    });
  };

  const deleteCurrent = () => {
    if (!current) return;
    const ids = collectDescendants(current.id);
    const remaining = notes.filter((note) => !ids.includes(note.id));
    setNotes(remaining);
    setCurrentId(remaining.find((note) => note.stack === current.stack)?.id || remaining[0]?.id || null);
  };

  const switchStack = (stack) => {
    setSelectedStack(stack);
    const first = listByStack(stack)[0];
    if (first) setCurrentId(first.id);
  };

  const addStack = () => {
    const name = window.prompt("New stack name:", "New Stack")?.trim();
    if (!name) return;
    if (stacks.includes(name)) return window.alert("A stack with that name already exists.");
    setStacks((prev) => [...prev, name]);
    setSelectedStack(name);
  };

  const renameStack = (oldName) => {
    const name = window.prompt("Rename stack:", oldName)?.trim();
    if (!name || name === oldName) return;
    if (stacks.includes(name)) return window.alert("A stack with that name already exists.");
    setStacks((prev) => prev.map((stack) => (stack === oldName ? name : stack)));
    setNotes((prev) => prev.map((note) => (note.stack === oldName ? { ...note, stack: name, modified: nowISO() } : note)));
    if (selectedStack === oldName) setSelectedStack(name);
  };

  const matchesQuery = (note) => {
    const q = parseQuery(search);
    if (!search.trim()) return true;
    const hay = `${note.title} ${(note.tags || []).join(" ")} ${note.content}`.toLowerCase();
    if (q.tag.length && !q.tag.every((t) => (note.tags || []).some((tag) => tag.toLowerCase().includes(t)))) return false;
    if (q.contains.length && !q.contains.every((t) => (note.content || "").toLowerCase().includes(t))) return false;
    if (q.title.length && !q.title.every((t) => (note.title || "").toLowerCase().includes(t))) return false;
    if (q.stack.length && !q.stack.every((t) => (note.stack || "").toLowerCase().includes(t))) return false;
    if (q.id.length && !q.id.every((t) => hierarchicalId(note).toLowerCase().startsWith(t))) return false;
    if (q.free.length && !q.free.every((t) => hay.includes(t))) return false;
    return true;
  };

  const matchingIds = useMemo(() => new Set(notes.filter(matchesQuery).map((note) => note.id)), [notes, search, stacks]);

  const hierarchy = useMemo(() => {
    if (!current) return { outWiki: [], outSubs: [], inbound: [], children: [] };
    const { wiki: outWiki, subs: outSubs } = extractLinks(current.content);
    const inbound = [];
    notes.forEach((note) => {
      if (note.id === current.id) return;
      const { wiki } = extractLinks(note.content || "");
      if (wiki.includes(current.title)) inbound.push(note);
    });
    const parent = current.parentId ? notes.find((note) => note.id === current.parentId) : null;
    if (parent && !inbound.some((note) => note.id === parent.id)) inbound.unshift(parent);
    return { outWiki, outSubs, inbound, children: listChildren(current.id) };
  }, [current, notes]);

  const moveNote = (noteId, targetStack, targetParentId = null, afterId = null) => {
    setNotes((prev) => {
      const moving = prev.find((note) => note.id === noteId);
      if (!moving) return prev;
      let order = nextOrderFor(targetParentId, targetStack, prev);
      if (afterId) {
        const after = prev.find((note) => note.id === afterId);
        if (after) order = (after.order || 0) + 0.5;
      }
      const rough = prev.map((note) => (note.id === noteId ? { ...note, stack: targetStack, parentId: targetParentId, order, modified: nowISO() } : note));
      const group = rough
        .filter((note) => note.stack === targetStack && (targetParentId ? note.parentId === targetParentId : !note.parentId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      return rough.map((note) => {
        const index = group.findIndex((item) => item.id === note.id);
        return index >= 0 ? { ...note, order: index + 1 } : note;
      });
    });
    setSelectedStack(targetStack);
    setCurrentId(noteId);
  };

  const createOrOpenByTitle = (title, asChild) => {
    if (!current || !title) return;
    const candidates = notes.filter((note) => note.title === title);
    if (candidates.length) {
      setCurrentId(candidates[0].id);
      setSelectedStack(candidates[0].stack);
      return;
    }
    createNote({ title, stack: current.stack, parentId: asChild ? current.id : null });
  };

  const exportWorkspace = (safe = false) => {
    const data = { version: 1, exportedAt: nowISO(), workspaceTitle, stacks, notes: safe ? notes.map(({ content, ...rest }) => rest) : notes };
    downloadFile(`${safeName(workspaceTitle)}.synapsing.json`, JSON.stringify(data, null, 2));
  };

  const exportNote = () => {
    if (!current) return;
    const md = `---\ntitle: ${current.title}\nstack: ${current.stack}\ntags: ${(current.tags || []).join(", ")}\nid: ${hierarchicalId(current)}\ncreated: ${current.created}\nmodified: ${current.modified}\n---\n\n${current.content || ""}\n`;
    downloadFile(`${safeName(current.stack)}__${safeName(current.title)}.md`, md, "text/markdown");
  };

  const importWorkspace = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.notes) || !Array.isArray(data.stacks)) throw new Error("Invalid workspace");
      setWorkspaceTitle(data.workspaceTitle || "Imported Synaps.ing Workspace");
      setNotes(data.notes);
      setStacks(data.stacks.length ? data.stacks : ["Inbox"]);
      setCurrentId(data.currentId || data.notes[0]?.id || null);
      setSelectedStack(data.selectedStack || data.stacks[0] || "Inbox");
    } catch {
      window.alert("Could not import that Synaps.ing workspace JSON.");
    }
    event.target.value = "";
  };

  const resetWorkspace = () => {
    if (!window.confirm("Create a new notebook? This replaces the browser-saved workspace unless you exported it.")) return;
    const seeded = seedWorkspace();
    setWorkspaceTitle("New Synaps.ing Workspace");
    setNotes(seeded.notes);
    setStacks(["Inbox"]);
    setCurrentId(seeded.notes[0]?.id || null);
    setSelectedStack("Inbox");
  };

  const viewState = {
    "--accent": theme.accent,
    "--accentSoft": theme.accentSoft,
    "--page": theme.page,
    "--panel": theme.panel,
    "--panel2": theme.panel2,
    "--input": theme.input,
    "--text": theme.text,
    "--muted": theme.muted,
    "--border": theme.border,
    "--hover": theme.hover,
    "--menu": theme.menu,
    "--overlay": theme.overlay,
    "--accentText": theme.accentText,
    fontFamily: "var(--font-body)",
  };

  const topMenus = [
    {
      label: "File",
      items: [
        { label: "New Notebook", hint: "Ctrl N", action: resetWorkspace },
        { label: "Import Workspace", action: () => fileInputRef.current?.click() },
        { label: "Export Workspace", hint: "Ctrl X", action: () => setExportOpen(true) },
        { divider: true },
        { label: "Export Current Note", hint: "Ctrl E", action: exportNote, disabled: !current },
      ],
    },
    {
      label: "Note",
      items: [
        { label: "New Sibling Note", hint: "Ctrl N", action: () => createNote({ stack: current?.stack || selectedStack, parentId: current?.parentId || null }) },
        { label: "New Child Note", hint: "⇧ Ctrl N", action: () => current && createNote({ title: "New Child Note", stack: current.stack, parentId: current.id }), disabled: !current },
        { label: "Duplicate Note", hint: "Ctrl D", action: duplicateCurrent, disabled: !current },
        { divider: true },
        { label: "Delete Note + Children", action: deleteCurrent, disabled: !current },
      ],
    },
    {
      label: "Stacks",
      items: [
        { label: "Add Stack", action: addStack },
        { label: "Rename Current Stack", action: () => renameStack(selectedStack), disabled: !selectedStack },
      ],
    },
    {
      label: "View",
      items: [
        { label: filterMode ? "Disable Search Filter" : "Enable Search Filter", hint: "⇧ Ctrl F", action: () => setFilterMode((v) => !v) },
        { label: "Themes", hint: "Ctrl P", action: () => setThemeOpen(true) },
      ],
    },
  ];

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (e.shiftKey && current) createNote({ title: "New Child Note", stack: current.stack, parentId: current.id });
        else createNote({ stack: current?.stack || selectedStack, parentId: current?.parentId || null });
      }
      if (e.key.toLowerCase() === "d") { e.preventDefault(); duplicateCurrent(); }
      if (e.key.toLowerCase() === "e") { e.preventDefault(); exportNote(); }
      if (e.key.toLowerCase() === "x") { e.preventDefault(); setExportOpen(true); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); document.getElementById("synapsing-search")?.focus(); }
      if (e.key.toLowerCase() === "p") { e.preventDefault(); setThemeOpen(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const currentParentOptions = current
    ? notes.filter((note) => note.stack === current.stack && note.id !== current.id && !collectDescendants(current.id).includes(note.id))
    : [];

  return (
    <div style={viewState} className="min-h-screen bg-[var(--page)] text-[var(--text)]">
      {!mobileOverride && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-[var(--page)] flex items-center justify-center p-5">
          <div className="max-w-md border border-[var(--border)] bg-[var(--panel)] p-5 text-center shadow-2xl">
            <h2 className="text-lg mb-2">Best on desktop</h2>
            <p className="text-sm text-[var(--muted)] leading-6">Synaps.ing is a dense linked-notebook workspace. The React suite layout is designed for laptop and desktop screens.</p>
            <Button className="mt-4 mx-auto" active onClick={() => setMobileOverride(true)}>Open anyway</Button>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importWorkspace} />

      <header className="h-10 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between sticky top-0 z-30">
        <div className="h-full flex items-center min-w-0">
          <div className="h-full px-3 flex items-center border-r border-[var(--border)] min-w-[220px]">
            {editingTitle ? (
              <input
                autoFocus
                value={workspaceTitle}
                onChange={(e) => setWorkspaceTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="w-full bg-[var(--input)] border border-[var(--accent)] h-7 px-2 text-sm outline-none"
              />
            ) : (
              <button onDoubleClick={() => setEditingTitle(true)} className="text-sm truncate hover:text-[var(--accent)]">
                <span className="font-semibold">Synaps</span><span className="text-[var(--accent)]">.ing</span>
                <span className="text-[var(--muted)]"> / {workspaceTitle}</span>
              </button>
            )}
          </div>
          {topMenus.map((menu) => <Menu key={menu.label} {...menu} />)}
        </div>

        <div className="h-full flex items-center gap-2 px-2 min-w-0">
          <select value={selectedStack} onChange={(e) => switchStack(e.target.value)} className="h-7 max-w-[160px] bg-[var(--input)] border border-[var(--border)] text-xs px-2 outline-none">
            {stacks.map((stack) => <option key={stack} value={stack}>{stack}</option>)}
          </select>
          <input id="synapsing-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search… title:, tag:, contains:, stack:, id:" className="h-7 w-[320px] max-w-[34vw] bg-[var(--input)] border border-[var(--border)] text-xs px-3 outline-none focus:border-[var(--accent)]" />
          <Button active={filterMode} onClick={() => setFilterMode((v) => !v)}>Filter</Button>
          <Button icon={ICONS.plus} onClick={() => createNote({ stack: current?.stack || selectedStack, parentId: current?.parentId || null })}>Note</Button>
        </div>
      </header>

      <main className="h-[calc(100vh-40px)] grid grid-rows-[1fr_226px] overflow-hidden">
        <div className="grid grid-cols-[280px_minmax(420px,1fr)_300px] gap-3 p-3 min-h-0 overflow-hidden">
          <Panel title="Note Front" className="flex flex-col overflow-hidden">
            {current ? (
              <div className="p-3 space-y-3 overflow-auto text-xs">
                <Field label="Title">
                  <TextInput value={current.title} onChange={(value) => updateNote(current.id, { title: value || "Untitled" })} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-[var(--border)] bg-[var(--panel2)] p-2">
                    <div className="text-[var(--muted)]">ID</div>
                    <div className="text-lg text-[var(--accent)]">{hierarchicalId(current)}</div>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--panel2)] p-2">
                    <div className="text-[var(--muted)]">Stack</div>
                    <div className="truncate">{current.stack}</div>
                  </div>
                </div>
                <Field label="Stack">
                  <SelectInput value={current.stack} onChange={(value) => updateNote(current.id, { stack: value, parentId: null, order: nextOrderFor(null, value) })}>
                    {stacks.map((stack) => <option key={stack} value={stack}>{stack}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Parent">
                  <SelectInput value={current.parentId || ""} onChange={(value) => updateNote(current.id, { parentId: value || null, order: nextOrderFor(value || null, current.stack) })}>
                    <option value="">Top level</option>
                    {currentParentOptions.map((note) => <option key={note.id} value={note.id}>{hierarchicalId(note)} — {note.title}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Tags">
                  <TextInput value={(current.tags || []).join(", ")} onChange={(value) => updateNote(current.id, { tags: parseTags(value) })} placeholder="tag, tag, tag" />
                </Field>
                <div className="flex flex-wrap gap-1">
                  {(current.tags || []).length ? current.tags.map((tag) => <span key={tag} className="px-2 py-1 rounded-full bg-[var(--accentSoft)] text-[var(--accent)] border border-[var(--border)]">#{tag}</span>) : <span className="text-[var(--muted)]">no tags</span>}
                </div>
                <div className="border-t border-[var(--border)] pt-3 text-[var(--muted)] leading-5">
                  <div>Created: {fmt(current.created)}</div>
                  <div>Modified: {fmt(current.modified)}</div>
                </div>
              </div>
            ) : <div className="p-3 text-sm text-[var(--muted)]">No note selected.</div>}
          </Panel>

          <Panel title="Markdown Back" action={<div className="flex gap-2"><Button onClick={duplicateCurrent} disabled={!current}>Duplicate</Button><Button onClick={exportNote} disabled={!current}>Export</Button><Button onClick={deleteCurrent} disabled={!current}>Delete</Button></div>} className="flex flex-col overflow-hidden">
            {current ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="h-10 border-b border-[var(--border)] bg-[var(--panel2)] flex items-center gap-2 px-3 text-xs text-[var(--muted)]">
                  <span>Use [[Title]] for cross-links.</span>
                  <span>Use &gt;&gt;Title&gt;&gt; for child-note intent.</span>
                  <span className="ml-auto">Ctrl E export note</span>
                </div>
                <textarea
                  value={current.content || ""}
                  onChange={(e) => updateNote(current.id, { content: e.target.value })}
                  className="flex-1 min-h-0 w-full resize-none bg-[var(--input)] text-[var(--text)] outline-none p-5 text-[15px] leading-7 font-serif"
                  spellCheck
                />
              </div>
            ) : <div className="p-5 text-sm text-[var(--muted)]">Create a note to begin.</div>}
          </Panel>

          <div className="grid grid-rows-[1fr_1fr] gap-3 min-h-0">
            <Panel title="Notebook Hierarchy" className="overflow-hidden flex flex-col">
              <div className="p-3 overflow-auto text-xs space-y-3">
                {current ? (
                  <>
                    <HierarchySection title="Links out" items={hierarchy.outWiki} onClick={(title) => createOrOpenByTitle(title, false)} empty="No wiki links." />
                    <HierarchySection title="Subnotes" items={hierarchy.outSubs} onClick={(title) => createOrOpenByTitle(title, true)} empty="No subnote tokens." accent />
                    <NoteListSection title="Links in / Parent" notes={hierarchy.inbound} onClick={(note) => { setCurrentId(note.id); setSelectedStack(note.stack); }} empty="No inbound links." hid={hierarchicalId} />
                    <NoteListSection title="Children" notes={hierarchy.children} onClick={(note) => { setCurrentId(note.id); setSelectedStack(note.stack); }} empty="No child notes." hid={hierarchicalId} />
                  </>
                ) : <div className="text-[var(--muted)]">No note selected.</div>}
              </div>
            </Panel>
            <Panel title="Workspace Signals" className="overflow-hidden">
              <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                <Metric label="Notes" value={notes.length} />
                <Metric label="Stacks" value={stacks.length} />
                <Metric label="Matches" value={matchingIds.size} />
                <Metric label="Children" value={current ? listChildren(current.id).length : 0} />
                <div className="col-span-2 border border-[var(--border)] bg-[var(--panel2)] p-2 leading-5 text-[var(--muted)]">
                  Synaps.ing stays notebook-first. Spiketrain overlap is limited to suite chrome, menu density, browser workspace persistence, search/filter behavior, theme handling, and export/import patterns.
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <section className="border-t border-[var(--border)] bg-[var(--panel)] min-h-0 overflow-hidden">
          <div className="h-10 px-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">Stacks</span>
              <Button icon={ICONS.plus} onClick={addStack}>Stack</Button>
            </div>
            <div className="text-xs text-[var(--muted)]">Drag chips between stacks. Double-click a stack title to rename it.</div>
          </div>
          <div className="h-[calc(100%-40px)] overflow-x-auto overflow-y-hidden p-3 whitespace-nowrap">
            {stacks.map((stack) => (
              <StackColumn
                key={stack}
                stack={stack}
                notes={notes}
                currentId={currentId}
                selected={stack === selectedStack}
                filterMode={filterMode}
                matchingIds={matchingIds}
                hierarchicalId={hierarchicalId}
                listChildren={listChildren}
                listTopLevel={listTopLevel}
                onSelect={(note) => { setCurrentId(note.id); setSelectedStack(note.stack); }}
                onDropNote={(noteId) => moveNote(noteId, stack, null)}
                onDropAfter={(noteId, after) => moveNote(noteId, after.stack, after.parentId || null, after.id)}
                onRename={() => renameStack(stack)}
              />
            ))}
          </div>
        </section>
      </main>

      {themeOpen && (
        <Modal title="Themes" onClose={() => setThemeOpen(false)} width="max-w-3xl">
          <div className="grid grid-cols-2 gap-3">
            {Object.values(THEMES).map((t) => (
              <button key={t.id} onClick={() => setThemeId(t.id)} className={cx("text-left border p-3 transition", themeId === t.id ? "border-[var(--accent)] bg-[var(--accentSoft)]" : "border-[var(--border)] bg-[var(--panel2)] hover:bg-[var(--hover)]")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">{t.name}</div>
                  <div className="h-4 w-4 rounded-full border border-[var(--border)]" style={{ background: t.accent }} />
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{t.description}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {exportOpen && (
        <Modal title="Export Workspace" onClose={() => setExportOpen(false)}>
          <div className="space-y-3 text-sm">
            <p className="text-[var(--muted)] leading-6">Export the full local workspace for backup or move a privacy-safe metadata-only version without note bodies.</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => { exportWorkspace(true); setExportOpen(false); }}>Metadata Only</Button>
              <Button active onClick={() => { exportWorkspace(false); setExportOpen(false); }}>Full Export</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HierarchySection({ title, items, onClick, empty, accent }) {
  return (
    <div>
      <h4 className="mb-1 text-[var(--text)]">{title}</h4>
      {items.length ? items.map((item) => (
        <button key={`${title}-${item}`} onClick={() => onClick(item)} className={cx("block w-full text-left px-2 py-1 border border-transparent hover:border-[var(--border)] hover:bg-[var(--hover)] truncate", accent ? "text-[var(--accent)]" : "text-[var(--text)]")}>
          {ICONS.link} {item}
        </button>
      )) : <div className="text-[var(--muted)]">{empty}</div>}
    </div>
  );
}

function NoteListSection({ title, notes, onClick, empty, hid }) {
  return (
    <div>
      <h4 className="mb-1 text-[var(--text)]">{title}</h4>
      {notes.length ? notes.map((note) => (
        <button key={note.id} onClick={() => onClick(note)} className="block w-full text-left px-2 py-1 border border-transparent hover:border-[var(--border)] hover:bg-[var(--hover)] truncate">
          <span className="text-[var(--accent)]">{hid(note)}</span> {note.title}
        </button>
      )) : <div className="text-[var(--muted)]">{empty}</div>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--panel2)] p-2">
      <div className="text-[var(--muted)]">{label}</div>
      <div className="text-xl text-[var(--accent)]">{value}</div>
    </div>
  );
}

function StackColumn({ stack, notes, currentId, selected, filterMode, matchingIds, hierarchicalId, listChildren, listTopLevel, onSelect, onDropNote, onDropAfter, onRename }) {
  const ordered = [];
  const dfs = (note, depth) => {
    ordered.push({ note, depth });
    listChildren(note.id).forEach((child) => dfs(child, depth + 1));
  };
  listTopLevel(stack).forEach((note) => dfs(note, 0));
  const visible = filterMode ? ordered.filter(({ note }) => matchingIds.has(note.id)) : ordered;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropNote(id);
      }}
      className={cx("inline-block align-top w-[260px] h-full mr-3 border bg-[var(--panel2)] overflow-hidden", selected ? "border-[var(--accent)]" : "border-[var(--border)]")}
    >
      <div className="h-9 px-3 border-b border-[var(--border)] flex items-center justify-between">
        <button onDoubleClick={onRename} className="text-sm truncate hover:text-[var(--accent)]">{stack}</button>
        <span className="text-xs text-[var(--muted)]">{ordered.length}</span>
      </div>
      <div className="h-[calc(100%-36px)] overflow-y-auto p-2 space-y-1">
        {visible.map(({ note, depth }) => {
          const matched = matchingIds.has(note.id);
          return (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", note.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = e.dataTransfer.getData("text/plain");
                if (id && id !== note.id) onDropAfter(id, note);
              }}
              onClick={() => onSelect(note)}
              style={{ marginLeft: Math.min(depth, 3) * 12 }}
              className={cx(
                "h-8 px-2 border text-xs flex items-center justify-between gap-2 cursor-pointer transition",
                note.id === currentId ? "border-[var(--accent)] bg-[var(--accentSoft)]" : "border-[var(--border)] bg-[var(--input)] hover:bg-[var(--hover)]",
                !filterMode && !matched && "opacity-35"
              )}
            >
              <span className="truncate">{note.title}</span>
              <span className="text-[var(--accent)] shrink-0">{hierarchicalId(note)}</span>
            </div>
          );
        })}
        {!visible.length && <div className="p-3 text-xs text-[var(--muted)]">No notes in this stack.</div>}
      </div>
    </div>
  );
}
