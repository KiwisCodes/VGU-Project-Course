'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/context/ProjectContext';
import { 
  NoteTab, 
  LectureNoteDocument, 
  MAX_NOTE_CHARS_PER_TAB, 
  MAX_NOTE_TABS_PER_LECTURE,
  MAX_LECTURE_SESSION_BYTES,
  stripHtml
} from '@/types';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  RemoveFormatting,
  Save,
  Plus,
  X,
  Lock,
  Check,
  AlertTriangle,
  Loader2,
  Edit2,
  Copy,
  CheckCheck,
  Table as TableIcon,
  Network as DiagramIcon
} from 'lucide-react';
import { renderAllMermaidDiagrams, escapeHtml } from '@/lib/mermaid';

interface NoteTabEditorProps {
  memberId: string;
  memberName: string;
  lectureId: number;
  readOnly?: boolean;
  onSaveNotice?: () => void;
}

interface ActiveFormatsState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  code: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  heading: 'p' | 'h1' | 'h2' | 'h3';
}

export function NoteTabEditor({
  memberId,
  memberName,
  lectureId,
  readOnly = false,
  onSaveNotice
}: NoteTabEditorProps) {
  const { getMemberLectureNoteDoc, setMemberLectureNoteDoc } = useProject();

  // Active document state
  const [doc, setDoc] = useState<LectureNoteDocument>(() => 
    getMemberLectureNoteDoc(memberId, lectureId)
  );
  
  // UI interaction state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [tabPendingDelete, setTabPendingDelete] = useState<NoteTab | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [savedSelectionRange, setSavedSelectionRange] = useState<Range | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // Active toolbar formats state (reflects Bold, Italic, Underline, Lists, Headings under cursor)
  const [activeFormats, setActiveFormats] = useState<ActiveFormatsState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    code: false,
    unorderedList: false,
    orderedList: false,
    heading: 'p'
  });

  // Drag & drop tab reorder state
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Dynamic lecture session storage quota calculation (3.0 MB pool)
  const totalSessionBytes = React.useMemo(() => {
    let total = 0;
    for (const t of doc.tabs) {
      const content = (t.id === doc.activeTabId && editorRef.current)
        ? editorRef.current.innerHTML
        : (t.content || '');
      total += content.length;
    }
    return total;
  }, [doc.tabs, doc.activeTabId, charCount]);

  const sessionPercent = Math.min(100, Math.round((totalSessionBytes / MAX_LECTURE_SESSION_BYTES) * 100));
  const isSessionNearLimit = totalSessionBytes >= MAX_LECTURE_SESSION_BYTES * 0.85;
  const isSessionOverLimit = totalSessionBytes >= MAX_LECTURE_SESSION_BYTES;

  // Load document when memberId or lectureId changes
  useEffect(() => {
    const loadedDoc = getMemberLectureNoteDoc(memberId, lectureId);
    setDoc(loadedDoc);
  }, [memberId, lectureId, getMemberLectureNoteDoc]);

  // Find the currently active tab
  const activeTab = doc.tabs.find(t => t.id === doc.activeTabId) || doc.tabs[0] || {
    id: 'tab-1',
    title: 'Main Notes',
    content: ''
  };

  // Synchronize editor innerHTML with activeTab content when tab changes
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      editorRef.current.innerHTML = activeTab.content || '';
      updateMetrics();
      renderAllMermaidDiagrams(editorRef.current);
    }
    isInternalChangeRef.current = false;
  }, [doc.activeTabId, activeTab.id, lectureId, memberId]);

  // Synchronize Mermaid diagrams when switching light/dark theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          if (editorRef.current) {
            renderAllMermaidDiagrams(editorRef.current);
          }
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Calculate character and word count metrics
  const updateMetrics = useCallback(() => {
    if (!editorRef.current) return;
    const plain = stripHtml(editorRef.current.innerHTML);
    setCharCount(plain.length);
    setWordCount(plain ? plain.trim().split(/\s+/).filter(Boolean).length : 0);
  }, []);

  // Update active toolbar states based on cursor selection
  const updateActiveToolbarFormats = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editorRef.current) return;
    if (!editorRef.current.contains(sel.anchorNode)) return;

    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const strikeThrough = document.queryCommandState('strikeThrough');
      const unorderedList = document.queryCommandState('insertUnorderedList');
      const orderedList = document.queryCommandState('insertOrderedList');

      let node: Node | null = sel.anchorNode;
      let heading: 'p' | 'h1' | 'h2' | 'h3' = 'p';
      let isCode = false;

      while (node && node !== editorRef.current) {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
            heading = tag;
          }
          if (tag === 'code' && (el.classList.contains('inline-code') || el.parentElement?.tagName !== 'PRE')) {
            isCode = true;
          }
        }
        node = node.parentNode;
      }

      setActiveFormats({
        bold,
        italic,
        underline,
        strikeThrough,
        code: isCode,
        unorderedList,
        orderedList,
        heading
      });
    } catch {
      // Ignore queryCommandState errors in edge conditions
    }
  }, []);

  // Listen to selectionchange across the document
  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveToolbarFormats);
    return () => {
      document.removeEventListener('selectionchange', updateActiveToolbarFormats);
    };
  }, [updateActiveToolbarFormats]);

  // Save document to Supabase and context
  const handleSave = useCallback(async (customDoc?: LectureNoteDocument) => {
    if (readOnly) return;
    setIsSaving(true);
    setSaveStatus('saving');

    const targetDoc = customDoc || {
      ...doc,
      tabs: doc.tabs.map(t => 
        t.id === doc.activeTabId && editorRef.current
          ? { ...t, content: editorRef.current.innerHTML, updatedAt: new Date().toISOString() }
          : t
      )
    };

    try {
      await setMemberLectureNoteDoc(memberId, lectureId, targetDoc);
      setSaveStatus('saved');
      if (onSaveNotice) onSaveNotice();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to save lecture notes document:', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [doc, memberId, lectureId, readOnly, setMemberLectureNoteDoc, onSaveNotice]);

  // Handle user typing inside the editor
  const handleEditorInput = () => {
    if (readOnly || !editorRef.current) return;
    isInternalChangeRef.current = true;
    updateMetrics();
    updateActiveToolbarFormats();

    const currentHtml = editorRef.current.innerHTML;
    setDoc(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => 
        t.id === prev.activeTabId
          ? { ...t, content: currentHtml, updatedAt: new Date().toISOString() }
          : t
      )
    }));
  };

  // Syntax Tokenizer for Multi-Language Code Boxes
  const highlightSyntax = useCallback((code: string, lang = 'python'): string => {
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let escaped = escape(code);

    // 1. Comments
    escaped = escaped.replace(/(#.*|\/\/.*)/g, '<span class="token-comment">$1</span>');

    // 2. Strings
    escaped = escaped.replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="token-string">$1</span>');

    // 3. Numbers
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-number">$1</span>');

    // 4. Keywords per language
    const pyKeywords = /\b(import|from|def|return|class|if|else|elif|for|while|in|as|with|try|except|finally|raise|lambda|True|False|None|async|await)\b/g;
    const javaKeywords = /\b(public|private|protected|static|final|void|class|interface|package|import|new|return|if|else|for|while|try|catch|throws|throw|boolean|int|float|double|char|long|short|byte)\b/g;
    const jsKeywords = /\b(const|let|var|function|return|import|export|from|default|class|if|else|async|await|try|catch|new|true|false|null|undefined|typeof|instanceof)\b/g;
    const sqlKeywords = /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|DROP|ALTER|AND|OR|NOT|IN|AS)\b/gi;

    let kwRegex = pyKeywords;
    if (lang === 'java' || lang === 'cpp') kwRegex = javaKeywords;
    else if (lang === 'typescript' || lang === 'javascript') kwRegex = jsKeywords;
    else if (lang === 'sql') kwRegex = sqlKeywords;

    escaped = escaped.replace(kwRegex, '<span class="token-keyword">$1</span>');

    // 5. Types & Builtins
    const types = /\b(int|float|str|bool|String|System|List|Dict|Set|torch|AutoModelForCausalLM|console|Promise|Array|Object|Math)\b/g;
    escaped = escaped.replace(types, '<span class="token-type">$1</span>');

    return escaped;
  }, []);

  // Helper for inline markdown formatting
  const parseInlineMarkdown = useCallback((text: string): string => {
    let res = text;
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
    res = res.replace(/~~(.*?)~~/g, '<s>$1</s>');
    res = res.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline underline-offset-2">$1</a>');
    return res;
  }, []);

  // Markdown to Rich HTML Parser (Translates ChatGPT / Claude / Gemini snippets, Tables, Mermaid)
  const parseMarkdownToHtml = useCallback((md: string): string => {
    // Normalize line breaks
    let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Storage for block elements that must remain pristine (no markdown or paragraph replacement)
    const tokens: string[] = [];
    const pushToken = (blockHtml: string): string => {
      const idx = tokens.length;
      tokens.push(blockHtml);
      return `%%%BLOCK_TOKEN_${idx}%%%`;
    };

    // 1. Mermaid code fences (```mermaid\n...\n```)
    text = text.replace(/```mermaid\n([\s\S]*?)```/gi, (_match, code) => {
      const trimmed = code.trim();
      const escaped = escapeHtml(trimmed);
      return pushToken(`
        <div class="mermaid-container" contenteditable="false">
          <div class="mermaid-header">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono text-[10px] font-bold">MERMAID</span>
              <span class="text-slate-500">•</span>
              <span class="text-slate-400 text-[11px] font-mono">Diagram</span>
            </div>
            <div class="flex items-center gap-1">
              <button class="mermaid-toggle-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer">
                Code / Preview
              </button>
              <button class="copy-mermaid-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer flex items-center gap-1">
                <span>Copy</span>
              </button>
              <button class="delete-mermaid-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Remove Diagram">
                &times;
              </button>
            </div>
          </div>
          <div class="mermaid-preview">
            <div class="mermaid-loading">Rendering diagram...</div>
          </div>
          <pre class="mermaid-raw hidden-raw" contenteditable="true" spellcheck="false">${escaped}</pre>
        </div>
      `);
    });

    // 2. Multi-line code fences (```lang\n...\n```)
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const selectedLang = lang ? lang.toLowerCase() : 'text';
      const highlighted = selectedLang === 'text' 
        ? escapeHtml(code.trim())
        : highlightSyntax(code.trim(), selectedLang);

      return pushToken(`
        <div class="code-box-container" contenteditable="false">
          <div class="code-box-header">
            <div class="flex items-center gap-2">
              <select class="code-box-lang-select bg-white/10 text-purple-300 text-[10px] font-bold rounded px-1.5 py-0.5 border border-white/10 outline-none cursor-pointer">
                <option value="text" ${selectedLang === 'text' ? 'selected' : ''}>Plain Text</option>
                <option value="python" ${selectedLang === 'python' ? 'selected' : ''}>Python</option>
                <option value="java" ${selectedLang === 'java' ? 'selected' : ''}>Java</option>
                <option value="typescript" ${selectedLang === 'typescript' || selectedLang === 'js' || selectedLang === 'javascript' ? 'selected' : ''}>TypeScript</option>
                <option value="sql" ${selectedLang === 'sql' ? 'selected' : ''}>SQL</option>
                <option value="json" ${selectedLang === 'json' ? 'selected' : ''}>JSON</option>
                <option value="bash" ${selectedLang === 'bash' || selectedLang === 'sh' ? 'selected' : ''}>Bash</option>
                <option value="cpp" ${selectedLang === 'cpp' || selectedLang === 'c' ? 'selected' : ''}>C / C++</option>
              </select>
              <span class="text-[10px] text-slate-500">•</span>
              <span class="text-[11px] text-slate-400 font-mono">code_block</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="copy-code-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer flex items-center gap-1">
                <span>Copy Code</span>
              </button>
              <button class="delete-code-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Remove Code Block">
                &times;
              </button>
            </div>
          </div>
          <pre class="code-box-pre" contenteditable="true" spellcheck="false">${highlighted}</pre>
        </div>
      `);
    });

    // 3. Markdown Tables
    text = text.replace(/(?:^|\n)((?:[ \t]*\|[^\n]+\|[ \t]*\n)+)/g, (match, tableBlock) => {
      const lines = tableBlock.trim().split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length < 2) return match;
      const headerLine = lines[0];
      const sepLine = lines[1];
      if (!sepLine.includes('-') || !sepLine.includes('|')) return match;

      const parseCells = (line: string) => {
        const trimmed = line.replace(/^[ \t]*\|/, '').replace(/\|[ \t]*$/, '');
        return trimmed.split('|').map((c: string) => parseInlineMarkdown(c.trim()));
      };

      const headers = parseCells(headerLine);
      const dataRows = lines.slice(2).map(parseCells);

      return pushToken(`
        <div class="note-table-container" contenteditable="false">
          <div class="note-table-header">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">TABLE</span>
              <span class="text-slate-500">•</span>
              <span class="text-slate-400 text-[11px] font-mono">${headers.length} Columns</span>
            </div>
            <button class="delete-table-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Delete Table">
              &times;
            </button>
          </div>
          <div class="note-table-wrapper">
            <table class="note-table" contenteditable="true">
              <thead>
                <tr>
                  ${headers.map((h: string) => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${dataRows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `);
    });

    // 4. Horizontal Rules
    text = text.replace(/^---+$/gim, '<hr />');

    // 5. Headings (#, ##, ###)
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 6. Task checkboxes (- [ ] or - [x])
    text = text.replace(/^- \[ \] (.*$)/gim, '<div class="task-row"><input type="checkbox" class="task-checkbox" /><span>$1</span></div>');
    text = text.replace(/^- \[x\] (.*$)/gim, '<div class="task-row"><input type="checkbox" checked class="task-checkbox" /><span>$1</span></div>');

    // 7. Blockquotes (> ...)
    text = text.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 8. Bullet lists (including indented sub-bullets)
    text = text.replace(/^[ \t]{4,}[*-] (.*$)/gim, '<ul class="ml-4"><li>$1</li></ul>');
    text = text.replace(/^[ \t]{2,3}[*-] (.*$)/gim, '<ul class="ml-2"><li>$1</li></ul>');
    text = text.replace(/^[*-] (.*$)/gim, '<ul><li>$1</li></ul>');
    text = text.replace(/<\/ul>\s*<ul([^>]*)>/gim, '');

    // 9. Numbered lists (1. item)
    text = text.replace(/^\d+\.\s(.*$)/gim, '<ol><li>$1</li></ol>');
    text = text.replace(/<\/ol>\s*<ol>/gim, '');

    // 10. Inline styling (applied strictly to freeform markdown text)
    text = parseInlineMarkdown(text);

    // 11. Paragraph line breaks
    text = text.replace(/\n\n+/g, '<p></p>');

    // 12. Restore placeholders
    tokens.forEach((tokenHtml, idx) => {
      text = text.replace(`%%%BLOCK_TOKEN_${idx}%%%`, `${tokenHtml}<p></p>`);
    });

    return text;
  }, [highlightSyntax, parseInlineMarkdown]);

  // Intelligent AI Clipboard Paste Handler
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    if (readOnly) return;
    e.preventDefault();

    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    // Detect if pasted plain text contains Markdown syntax, Tables, or Mermaid
    const isMarkdown = /```|\|.*\|.*\||#{1,6}\s|\*\*|__|\*|- \[[ x]\]|\d+\.\s|>|---+/.test(textData);

    if (isMarkdown) {
      const convertedHtml = parseMarkdownToHtml(textData);
      document.execCommand('insertHTML', false, convertedHtml);
      setTimeout(() => {
        if (editorRef.current) renderAllMermaidDiagrams(editorRef.current);
      }, 50);
    } else if (htmlData) {
      // Clean unnecessary inline styles from ChatGPT/Claude while preserving structural tags
      const div = document.createElement('div');
      div.innerHTML = htmlData;
      div.querySelectorAll('p, h1, h2, h3, ul, ol, li, blockquote, pre, code, table, tr, th, td').forEach(el => {
        el.removeAttribute('style');
        if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') {
          el.className = 'inline-code';
        }
      });
      document.execCommand('insertHTML', false, div.innerHTML);
      setTimeout(() => {
        if (editorRef.current) renderAllMermaidDiagrams(editorRef.current);
      }, 50);
    } else {
      document.execCommand('insertText', false, textData);
    }

    handleEditorInput();
  };

  // Handle interactive clicks inside the editor (checkboxes, copy code, language switch)
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // 1. Task Checkboxes
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      if (readOnly) {
        e.preventDefault();
        return;
      }
      const checkbox = target as HTMLInputElement;
      if (checkbox.checked) {
        checkbox.setAttribute('checked', 'true');
      } else {
        checkbox.removeAttribute('checked');
      }
      handleEditorInput();
      handleSave();
      return;
    }

    // 2. Copy Code Button on Code Box
    const copyBtn = target.closest('.copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const container = copyBtn.closest('.code-box-container');
      const pre = container?.querySelector('.code-box-pre');
      if (pre) {
        const rawCode = (pre as HTMLElement).textContent || (pre as HTMLElement).innerText || '';
        navigator.clipboard.writeText(rawCode);
        const span = copyBtn.querySelector('span');
        if (span) {
          const originalText = span.textContent;
          span.textContent = 'Copied!';
          copyBtn.classList.add('text-emerald-400', 'bg-emerald-500/20');
          setTimeout(() => {
            span.textContent = originalText;
            copyBtn.classList.remove('text-emerald-400', 'bg-emerald-500/20');
          }, 2000);
        }
      }
      return;
    }

    // 3. Delete Code Block Button
    const deleteBtn = target.closest('.delete-code-btn') as HTMLButtonElement | null;
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (readOnly) return;
      const container = deleteBtn.closest('.code-box-container');
      if (container) {
        container.remove();
        handleEditorInput();
        handleSave();
      }
      return;
    }

    // 4. Language Selector on Code Box
    const langSelect = target.closest('.code-box-lang-select') as HTMLSelectElement | null;
    if (langSelect && target === langSelect) {
      langSelect.onchange = () => {
        const container = langSelect.closest('.code-box-container');
        const pre = container?.querySelector('.code-box-pre');
        if (pre) {
          const rawCode = (pre as HTMLElement).textContent || (pre as HTMLElement).innerText || '';
          const newLang = langSelect.value;
          pre.innerHTML = highlightSyntax(rawCode, newLang);
          handleEditorInput();
          handleSave();
        }
      };
    }

    // 5. Delete Table Button
    const deleteTableBtn = target.closest('.delete-table-btn') as HTMLButtonElement | null;
    if (deleteTableBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (readOnly) return;
      const container = deleteTableBtn.closest('.note-table-container');
      if (container) {
        container.remove();
        handleEditorInput();
        handleSave();
      }
      return;
    }

    // 6. Mermaid Toggle Button (Code / Preview)
    const mermaidToggleBtn = target.closest('.mermaid-toggle-btn') as HTMLButtonElement | null;
    if (mermaidToggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      const container = mermaidToggleBtn.closest('.mermaid-container');
      const rawPre = container?.querySelector('.mermaid-raw');
      const preview = container?.querySelector('.mermaid-preview');
      if (rawPre && preview) {
        const isHidden = rawPre.classList.contains('hidden-raw');
        if (isHidden) {
          // Show code
          rawPre.classList.remove('hidden-raw');
          preview.classList.add('hidden');
          mermaidToggleBtn.textContent = 'Preview';
          mermaidToggleBtn.classList.add('text-purple-400', 'bg-purple-500/20');
        } else {
          // Show preview and re-render
          rawPre.classList.add('hidden-raw');
          preview.classList.remove('hidden');
          mermaidToggleBtn.textContent = 'Code / Preview';
          mermaidToggleBtn.classList.remove('text-purple-400', 'bg-purple-500/20');
          renderAllMermaidDiagrams(container as HTMLElement);
          handleEditorInput();
          handleSave();
        }
      }
      return;
    }

    // 7. Copy Mermaid Button
    const copyMermaidBtn = target.closest('.copy-mermaid-btn') as HTMLButtonElement | null;
    if (copyMermaidBtn) {
      e.preventDefault();
      e.stopPropagation();
      const container = copyMermaidBtn.closest('.mermaid-container');
      const rawPre = container?.querySelector('.mermaid-raw');
      if (rawPre) {
        const rawCode = (rawPre as HTMLElement).textContent || (rawPre as HTMLElement).innerText || '';
        navigator.clipboard.writeText(rawCode);
        const span = copyMermaidBtn.querySelector('span') || copyMermaidBtn;
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        copyMermaidBtn.classList.add('text-emerald-400', 'bg-emerald-500/20');
        setTimeout(() => {
          span.textContent = originalText;
          copyMermaidBtn.classList.remove('text-emerald-400', 'bg-emerald-500/20');
        }, 2000);
      }
      return;
    }

    // 8. Delete Mermaid Diagram Button
    const deleteMermaidBtn = target.closest('.delete-mermaid-btn') as HTMLButtonElement | null;
    if (deleteMermaidBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (readOnly) return;
      const container = deleteMermaidBtn.closest('.mermaid-container');
      if (container) {
        container.remove();
        handleEditorInput();
        handleSave();
      }
      return;
    }
  };

  // Switch to another tab
  const handleSwitchTab = (tabId: string) => {
    if (tabId === doc.activeTabId) return;

    // Save current active tab content into doc state before switching
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : activeTab.content;
    const updatedTabs = doc.tabs.map(t => 
      t.id === doc.activeTabId
        ? { ...t, content: currentHtml, updatedAt: new Date().toISOString() }
        : t
    );

    const nextDoc: LectureNoteDocument = {
      ...doc,
      activeTabId: tabId,
      tabs: updatedTabs
    };

    setDoc(nextDoc);
    if (!readOnly) {
      handleSave(nextDoc);
    }
  };

  // Add a new tab (up to MAX_NOTE_TABS_PER_LECTURE, bounded by session quota)
  const handleAddTab = () => {
    if (readOnly) return;
    if (doc.tabs.length >= MAX_NOTE_TABS_PER_LECTURE) {
      alert(`Maximum of ${MAX_NOTE_TABS_PER_LECTURE} tabs reached per lecture to maintain optimal storage.`);
      return;
    }
    if (totalSessionBytes >= MAX_LECTURE_SESSION_BYTES) {
      alert(`Lecture session storage limit (${(MAX_LECTURE_SESSION_BYTES / (1024 * 1024)).toFixed(1)} MB) reached. Please delete unused content or tabs before adding more.`);
      return;
    }

    const currentHtml = editorRef.current ? editorRef.current.innerHTML : activeTab.content;
    const currentTabsWithSavedActive = doc.tabs.map(t => 
      t.id === doc.activeTabId
        ? { ...t, content: currentHtml, updatedAt: new Date().toISOString() }
        : t
    );

    const newIndex = doc.tabs.length + 1;
    const newTabId = 'tab-' + Date.now();
    const newTab: NoteTab = {
      id: newTabId,
      title: `Note ${newIndex}`,
      content: `<h2>Note ${newIndex}</h2><p>Document research insights, model benchmarks, or blockers...</p>`,
      updatedAt: new Date().toISOString()
    };

    const nextDoc: LectureNoteDocument = {
      ...doc,
      activeTabId: newTabId,
      tabs: [...currentTabsWithSavedActive, newTab]
    };

    setDoc(nextDoc);
    handleSave(nextDoc);

    setTimeout(() => {
      setEditingTabId(newTabId);
      setRenameValue(`Note ${newIndex}`);
    }, 60);
  };

  // Start inline renaming
  const handleStartRename = (tab: NoteTab, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    setEditingTabId(tab.id);
    setRenameValue(tab.title);
  };

  // Commit tab title rename
  const handleFinishRename = () => {
    if (!editingTabId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      const nextDoc: LectureNoteDocument = {
        ...doc,
        tabs: doc.tabs.map(t => t.id === editingTabId ? { ...t, title: trimmed } : t)
      };
      setDoc(nextDoc);
      handleSave(nextDoc);
    }
    setEditingTabId(null);
  };

  // Delete tab confirmation
  const handleOpenDeleteModal = (tab: NoteTab, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    setTabPendingDelete(tab);
  };

  const handleConfirmDelete = () => {
    if (!tabPendingDelete) return;
    const idToDelete = tabPendingDelete.id;
    const remainingTabs = doc.tabs.filter(t => t.id !== idToDelete);
    if (remainingTabs.length === 0) return;

    let nextActiveId = doc.activeTabId;
    if (doc.activeTabId === idToDelete) {
      const deletedIdx = doc.tabs.findIndex(t => t.id === idToDelete);
      nextActiveId = remainingTabs[Math.max(0, deletedIdx - 1)].id;
    }

    const nextDoc: LectureNoteDocument = {
      ...doc,
      activeTabId: nextActiveId,
      tabs: remainingTabs
    };

    setTabPendingDelete(null);
    setDoc(nextDoc);
    handleSave(nextDoc);
  };

  // Tab drag & drop reordering
  const handleDragStart = (tabId: string, e: React.DragEvent) => {
    if (readOnly) return;
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (tabId: string, e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    if (draggedTabId && draggedTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDrop = (targetTabId: string, e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setDragOverTabId(null);
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const fromIndex = doc.tabs.findIndex(t => t.id === draggedTabId);
    const toIndex = doc.tabs.findIndex(t => t.id === targetTabId);
    if (fromIndex < 0 || toIndex < 0) return;

    const newTabs = [...doc.tabs];
    const [moved] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, moved);

    const nextDoc: LectureNoteDocument = {
      ...doc,
      tabs: newTabs
    };

    setDoc(nextDoc);
    setDraggedTabId(null);
    handleSave(nextDoc);
  };

  // Google Docs formatting commands with Focus Preservation
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (readOnly || !editorRef.current) return;
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleEditorInput();
  };

  const handleHeadingChange = (val: string) => {
    if (!val || readOnly) return;
    executeCommand('formatBlock', `<${val}>`);
  };

  const handleInsertInlineCode = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const selectedText = sel.toString();
    const html = selectedText 
      ? `<code class="inline-code">${selectedText}</code>&nbsp;` 
      : `<code class="inline-code">code</code>&nbsp;`;
    executeCommand('insertHTML', html);
  };

  // Insert Multi-Language Code Box
  const handleInsertCodeBox = (lang = 'python') => {
    if (readOnly) return;

    const defaultCode = lang === 'python'
      ? `# Python Model Inference\nimport torch\n\nprint("Executing vision pipeline...")`
      : lang === 'java'
      ? `// Java Clinical Service\npublic class MedService {\n    public static void main(String[] args) {\n        System.out.println("Processing DICOM scans...");\n    }\n}`
      : `// JavaScript/TypeScript\nconsole.log("Evaluating model report...");`;

    const highlighted = highlightSyntax(defaultCode, lang);

    const html = `
      <div class="code-box-container" contenteditable="false">
        <div class="code-box-header">
          <div class="flex items-center gap-2">
            <select class="code-box-lang-select bg-white/10 text-purple-300 text-[10px] font-bold rounded px-1.5 py-0.5 border border-white/10 outline-none cursor-pointer">
              <option value="python" ${lang === 'python' ? 'selected' : ''}>Python</option>
              <option value="java" ${lang === 'java' ? 'selected' : ''}>Java</option>
              <option value="typescript" ${lang === 'typescript' ? 'selected' : ''}>TypeScript</option>
              <option value="sql" ${lang === 'sql' ? 'selected' : ''}>SQL</option>
              <option value="json" ${lang === 'json' ? 'selected' : ''}>JSON</option>
              <option value="bash" ${lang === 'bash' ? 'selected' : ''}>Bash</option>
              <option value="cpp" ${lang === 'cpp' ? 'selected' : ''}>C / C++</option>
            </select>
            <span class="text-[10px] text-slate-500">•</span>
            <span class="text-[11px] text-slate-400 font-mono">code_block</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="copy-code-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer flex items-center gap-1">
              <span>Copy Code</span>
            </button>
            <button class="delete-code-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Remove Code Block">
              &times;
            </button>
          </div>
        </div>
        <pre class="code-box-pre" contenteditable="true" spellcheck="false">${highlighted}</pre>
      </div>
      <p></p>
    `;

    executeCommand('insertHTML', html);
  };

  const handleInsertChecklist = () => {
    if (readOnly) return;
    const html = '<div class="task-row"><input type="checkbox" class="task-checkbox" /><span>New task item...</span></div><p></p>';
    executeCommand('insertHTML', html);
  };

  // Insert Clean Editable Table
  const handleInsertTable = () => {
    if (readOnly) return;
    const html = `
      <div class="note-table-container" contenteditable="false">
        <div class="note-table-header">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">TABLE</span>
            <span class="text-slate-500">•</span>
            <span class="text-slate-400 text-[11px] font-mono">3 Columns</span>
          </div>
          <button class="delete-table-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Delete Table">
            &times;
          </button>
        </div>
        <div class="note-table-wrapper">
          <table class="note-table" contenteditable="true">
            <thead>
              <tr>
                <th>Column 1</th>
                <th>Column 2</th>
                <th>Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data 1</td>
                <td>Data 2</td>
                <td>Data 3</td>
              </tr>
              <tr>
                <td>Data 4</td>
                <td>Data 5</td>
                <td>Data 6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p></p>
    `;
    executeCommand('insertHTML', html);
  };

  // Insert Starter Mermaid Diagram
  const handleInsertMermaid = () => {
    if (readOnly) return;
    const starterCode = `flowchart TD\n    A["Start Case Analysis"] --> B["Multidisciplinary Consultation"]\n    B --> C["Clinical Consensus"]\n    C --> D["Final Diagnosis"]`;
    const escaped = escapeHtml(starterCode);

    const html = `
      <div class="mermaid-container" contenteditable="false">
        <div class="mermaid-header">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono text-[10px] font-bold">MERMAID</span>
            <span class="text-slate-500">•</span>
            <span class="text-slate-400 text-[11px] font-mono">Diagram</span>
          </div>
          <div class="flex items-center gap-1">
            <button class="mermaid-toggle-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer">
              Code / Preview
            </button>
            <button class="copy-mermaid-btn px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer flex items-center gap-1">
              <span>Copy</span>
            </button>
            <button class="delete-mermaid-btn p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer" title="Remove Diagram">
              &times;
            </button>
          </div>
        </div>
        <div class="mermaid-preview">
          <div class="mermaid-loading">Rendering diagram...</div>
        </div>
        <pre class="mermaid-raw hidden-raw" contenteditable="true" spellcheck="false">${escaped}</pre>
      </div>
      <p></p>
    `;
    executeCommand('insertHTML', html);
    setTimeout(() => {
      if (editorRef.current) renderAllMermaidDiagrams(editorRef.current);
    }, 50);
  };

  // Accessible Link Modal
  const handleOpenLinkModal = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    let text = '';
    if (sel && sel.rangeCount > 0) {
      setSavedSelectionRange(sel.getRangeAt(0).cloneRange());
      text = sel.toString();
    } else {
      setSavedSelectionRange(null);
    }
    setLinkText(text);
    setLinkUrl('');
    setLinkNewTab(true);
    setIsLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const displayText = linkText.trim() || linkUrl.trim();
    const html = `<a href="${linkUrl.trim()}"${targetAttr} class="text-blue-500 underline underline-offset-2 hover:opacity-80">${displayText}</a>`;

    if (editorRef.current) {
      editorRef.current.focus();
      if (savedSelectionRange) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRange);
        }
      }
      document.execCommand('insertHTML', false, html);
      handleEditorInput();
    }

    setIsLinkModalOpen(false);
    setSavedSelectionRange(null);
  };

  // Global keyboard shortcuts within editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    // Handle Tab key inside Code Box
    if (e.key === 'Tab') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        let isInsideCodePre = false;
        while (node && node !== editorRef.current) {
          if (node.nodeType === 1 && (node as HTMLElement).classList.contains('code-box-pre')) {
            isInsideCodePre = true;
            break;
          }
          node = node.parentNode;
        }

        if (isInsideCodePre) {
          e.preventDefault();
          document.execCommand('insertText', false, '    ');
          return;
        }
      }
    }

    if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      handleOpenLinkModal();
    } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const isNearLimit = charCount >= MAX_NOTE_CHARS_PER_TAB * 0.85;
  const isOverLimit = charCount >= MAX_NOTE_CHARS_PER_TAB;
  const charPercent = Math.min(100, Math.round((charCount / MAX_NOTE_CHARS_PER_TAB) * 100));

  // Helper for active button classes
  const getBtnClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition cursor-pointer ${
      isActive
        ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 font-bold shadow-xs'
        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
    }`;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
      
      {/* 1. Draggable & Renamable Tab Bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between px-3 pt-2 gap-2 select-none">
        
        {/* Horizontal Tab Strip */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 pb-1 scrollbar-thin">
          {doc.tabs.map((tab) => {
            const isActive = tab.id === doc.activeTabId;
            const isEditing = editingTabId === tab.id;
            const isDragTarget = dragOverTabId === tab.id;

            return (
              <div
                key={tab.id}
                draggable={!readOnly && !isEditing}
                onDragStart={(e) => handleDragStart(tab.id, e)}
                onDragEnd={() => {
                  setDraggedTabId(null);
                  setDragOverTabId(null);
                }}
                onDragOver={(e) => handleDragOver(tab.id, e)}
                onDragLeave={() => setDragOverTabId(null)}
                onDrop={(e) => handleDrop(tab.id, e)}
                onClick={() => handleSwitchTab(tab.id)}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all border-t border-x cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-subtle)] border-b-[var(--bg-surface)] shadow-xs -mb-[1px] z-10'
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-transparent'
                } ${isDragTarget ? 'border-l-2 border-l-purple-500' : ''}`}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={renameValue}
                    autoFocus
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-28 px-1.5 py-0.5 rounded text-xs font-bold border border-purple-500 bg-[var(--bg-surface)] text-[var(--text-main)] outline-none"
                  />
                ) : (
                  <span 
                    onDoubleClick={(e) => handleStartRename(tab, e)}
                    className="truncate max-w-[130px]"
                    title="Double-click to rename"
                  >
                    {tab.title}
                  </span>
                )}

                {/* Close tab button */}
                {!readOnly && doc.tabs.length > 1 && !isEditing && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenDeleteModal(tab, e)}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 transition cursor-pointer"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab Count Indicator & Add Tab Button */}
        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0 pb-1">
            <span 
              className="text-[10px] font-mono text-[var(--text-faint)] hidden sm:inline"
              title={`Dynamic session capacity: up to ${MAX_NOTE_TABS_PER_LECTURE} tabs bounded by 3.0 MB pool`}
            >
              {doc.tabs.length}/{MAX_NOTE_TABS_PER_LECTURE} tabs
            </span>
            <button
              type="button"
              onClick={handleAddTab}
              disabled={doc.tabs.length >= MAX_NOTE_TABS_PER_LECTURE || isSessionOverLimit}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-purple)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer shadow-xs ${
                doc.tabs.length >= MAX_NOTE_TABS_PER_LECTURE || isSessionOverLimit ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title={
                doc.tabs.length >= MAX_NOTE_TABS_PER_LECTURE 
                  ? `Maximum ${MAX_NOTE_TABS_PER_LECTURE} tabs reached` 
                  : isSessionOverLimit 
                  ? '3.0 MB session pool quota reached' 
                  : 'Add new tab'
              }
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Enhanced Google Docs Toolbar with Active Button Indicators */}
      {!readOnly ? (
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center gap-1 text-xs">
          
          {/* Group 1: Undo & Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--border-subtle)]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('undo')}
              title="Undo (Ctrl/Cmd+Z)"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('redo')}
              title="Redo (Ctrl/Cmd+Y)"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group 2: Text Style Dropdown (Automatically reflects active block) */}
          <div className="pr-2 border-r border-[var(--border-subtle)]">
            <select
              value={activeFormats.heading}
              onChange={(e) => handleHeadingChange(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-main)] cursor-pointer focus:outline-none focus:border-purple-500"
            >
              <option value="p">Normal text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>

          {/* Group 3: Text Styling with Active State Indicators */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--border-subtle)]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('bold')}
              title="Bold (Ctrl/Cmd+B)"
              className={`px-2 py-1 rounded-lg font-black transition cursor-pointer ${
                activeFormats.bold 
                  ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('italic')}
              title="Italic (Ctrl/Cmd+I)"
              className={`px-2 py-1 rounded-lg italic font-serif transition cursor-pointer ${
                activeFormats.italic 
                  ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              I
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('underline')}
              title="Underline (Ctrl/Cmd+U)"
              className={`px-2 py-1 rounded-lg underline transition cursor-pointer ${
                activeFormats.underline 
                  ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              U
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('strikeThrough')}
              title="Strikethrough"
              className={`px-2 py-1 rounded-lg line-through transition cursor-pointer ${
                activeFormats.strikeThrough 
                  ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              S
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleInsertInlineCode}
              title="Inline Code"
              className={`px-1.5 py-1 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                activeFormats.code 
                  ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50 shadow-xs' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              &lt;/&gt;
            </button>
          </div>

          {/* Group 4: Lists & Task Checklists with Active Indicators */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--border-subtle)]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bulleted List"
              className={getBtnClass(activeFormats.unorderedList)}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className={getBtnClass(activeFormats.orderedList)}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleInsertChecklist}
              title="Insert Task Checkbox"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-emerald-500 hover:text-emerald-400 transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group 5: Blockquote, Divider, Code Box */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--border-subtle)]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              title="Blockquote"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('insertHorizontalRule')}
              title="Divider Line"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            
            {/* Multi-Language Code Box Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleInsertCodeBox('python')}
              title="Insert Multi-Language Code Box"
              className="px-2 py-1 rounded-lg font-mono text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>{'{ }'}</span>
              <span className="text-[10px]">Code Box</span>
            </button>

            {/* Table Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleInsertTable}
              title="Insert Clean Table"
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="text-[10px]">Table</span>
            </button>

            {/* Mermaid Diagram Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleInsertMermaid}
              title="Insert Mermaid Diagram"
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <DiagramIcon className="w-3.5 h-3.5" />
              <span className="text-[10px]">Diagram</span>
            </button>
          </div>

          {/* Group 6: Hyperlink & Clear Formatting */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--border-subtle)]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenLinkModal}
              title="Insert Link (Ctrl/Cmd+K)"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand('removeFormat')}
              title="Clear Formatting"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group 7: Cloud Sync Status & Save Button */}
          <div className="ml-auto flex items-center gap-3">
            <div 
              className="hidden sm:flex items-center gap-2 text-[10px] font-mono"
              title={`Dynamic Lecture Session Budget: 3.0 MB pool across up to 20 tabs (50 MB per member / 16 lectures). Used: ${(totalSessionBytes / 1024).toFixed(1)} KB`}
            >
              <span className={isSessionOverLimit ? 'text-rose-500 font-bold' : isSessionNearLimit ? 'text-amber-500 font-bold' : 'text-[var(--text-faint)]'}>
                Session: {(totalSessionBytes / 1024).toFixed(1)} KB / 3.0 MB ({sessionPercent}%)
              </span>
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isSessionOverLimit ? 'bg-rose-500' : isSessionNearLimit ? 'bg-amber-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${sessionPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span className="text-purple-400">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Cloud Synced</span>
                </>
              )}
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
              style={{ backgroundColor: 'var(--accent-purple)' }}
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>

        </div>
      ) : (
        /* Read-only toolbar indicator */
        <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-semibold">Read-Only View for {memberName} (Lecture {lectureId})</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-faint)]">
            {doc.tabs.length} Tabs published
          </span>
        </div>
      )}

      {/* 3. Active Tab Title & Word Count Sub-header */}
      <div className="px-6 py-2.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Active Tab:</span>
          <span className="text-xs font-extrabold text-[var(--text-main)]">
            {activeTab.title}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => handleStartRename(activeTab, e)}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline underline-offset-2 flex items-center gap-0.5"
            >
              <Edit2 className="w-2.5 h-2.5" />
              <span>Rename</span>
            </button>
          )}
        </div>
        <div className="text-[11px] font-mono text-[var(--text-faint)] flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>Tab: ~{(charCount / 1024).toFixed(1)} KB</span>
          <span>•</span>
          <span className={isSessionOverLimit ? 'text-rose-500 font-bold' : isSessionNearLimit ? 'text-amber-500 font-bold' : ''}>
            Session: ~{(totalSessionBytes / 1024).toFixed(1)} KB / 3.0 MB
          </span>
        </div>
      </div>

      {/* Session Quota Warning Banner */}
      {isSessionOverLimit && (
        <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Session storage quota of 3.0 MB reached. Please trim tab contents before saving or adding more tabs.</span>
        </div>
      )}

      {/* 4. The Contenteditable Rich Text Canvas with Smart AI Paste */}
      <div className="p-6 bg-[var(--bg-surface)] min-h-[260px]">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleEditorInput}
          onClick={handleEditorClick}
          onPaste={handleEditorPaste}
          onKeyDown={handleKeyDown}
          className={`editor-content leading-relaxed text-xs focus:outline-none ${
            readOnly ? 'cursor-default opacity-90' : ''
          }`}
          style={{ minHeight: '240px' }}
        />
      </div>

      {/* 5. Footer Status Bar */}
      <div className="px-6 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px]">
            {readOnly ? 'Read-only assessment view' : 'All changes saved automatically'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-faint)]">
          <span>{doc.tabs.length}/{MAX_NOTE_TABS_PER_LECTURE} {doc.tabs.length === 1 ? 'Tab' : 'Tabs'}</span>
          <span>•</span>
          <span>{(totalSessionBytes / 1024).toFixed(1)} KB of 3.0 MB pool used ({sessionPercent}%)</span>
        </div>
      </div>

      {/* Delete Tab Confirmation Modal */}
      {tabPendingDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Note Tab</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to delete tab <strong className="text-[var(--text-main)]">"{tabPendingDelete.title}"</strong>? Its content will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTabPendingDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Delete Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Hyperlink Insertion Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <span>Insert Hyperlink</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--text-muted)]">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. arXiv:2311.10537 (MedAgents)"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-main)] focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text-muted)]">Destination URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  autoFocus
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/2311.10537"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-main)] focus:outline-none focus:border-purple-500 text-xs font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyLink();
                  }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  id="modalLinkNewTab"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded cursor-pointer accent-purple-600"
                />
                <label htmlFor="modalLinkNewTab" className="cursor-pointer text-[11px]">
                  Open link in new tab
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
