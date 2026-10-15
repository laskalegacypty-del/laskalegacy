'use client';

import { useEffect, useRef, useState } from 'react';
import { FONT_FAMILIES, FONT_SIZES, bodyToSafeHtml, sanitizeHtml } from '@/lib/richtext';

const C = { teal: '#0097b2', tealLight: '#e6f6f9', grey: '#6b7280', line: '#e5e7eb', black: '#000', white: '#fff' };

const btn = (active) => ({
  minWidth: 34, height: 34, padding: '0 8px', borderRadius: 6, border: `1px solid ${active ? C.teal : 'transparent'}`,
  background: active ? C.tealLight : 'transparent', color: C.black, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});
const sel = { height: 34, borderRadius: 6, border: `1px solid ${C.line}`, background: C.white, fontSize: 13, padding: '0 6px', fontFamily: 'inherit', cursor: 'pointer' };
const sep = <span style={{ width: 1, alignSelf: 'stretch', background: C.line, margin: '2px 4px' }} />;

// A dependency free rich text editor (contentEditable + execCommand).
// value: HTML string (old plain text posts are converted on open). onChange: HTML string.
export default function RichTextEditor({ value, onChange, onUploadImage, showToast }) {
  const ref = useRef(null);
  const saved = useRef(null); // last selection inside the editor, restored when a toolbar control takes focus
  const lastEmitted = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [colors, setColors] = useState({ text: '#000000', mark: '#fff59d' });

  // Load the initial value, and any later change that did not come from typing here.
  useEffect(() => {
    if (!ref.current || value === lastEmitted.current) return;
    ref.current.innerHTML = bodyToSafeHtml(value);
    lastEmitted.current = value;
  }, [value]);

  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection();
      if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) saved.current = s.getRangeAt(0).cloneRange();
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  const emit = () => {
    const html = ref.current.innerHTML;
    const clean = html === '<br>' ? '' : html;
    lastEmitted.current = clean;
    onChange(clean);
  };

  const restore = () => {
    ref.current.focus();
    const s = window.getSelection();
    if (saved.current) { s.removeAllRanges(); s.addRange(saved.current); }
  };

  const exec = (cmd, arg = null) => {
    restore();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, arg);
    emit();
  };

  const setSize = (px) => {
    if (!px) return;
    restore();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize', false, '7'); // placeholder size, replaced with the real px below
    ref.current.querySelectorAll('font[size="7"], span[style*="xxx-large"]').forEach((el) => {
      el.removeAttribute('size');
      el.style.fontSize = `${px}px`;
    });
    emit();
  };

  const setBlock = (tag) => { if (tag) exec('formatBlock', tag); };

  const addLink = () => {
    restore();
    const url = window.prompt('Link address (https://...)');
    if (!url) return;
    exec('createLink', /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`);
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      exec('insertImage', url);
    } catch (err) {
      showToast?.(err?.message || 'Could not upload that image.');
    }
    setUploading(false);
  };

  const onPaste = (e) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return; // plain text pastes normally
    e.preventDefault();
    document.execCommand('insertHTML', false, sanitizeHtml(html));
    emit();
  };

  // Toolbar buttons must not steal the selection from the text.
  const keep = (e) => e.preventDefault();
  const B = ({ cmd, arg, title, children, style }) => (
    <button type="button" title={title} aria-label={title} onMouseDown={keep} onClick={() => exec(cmd, arg)} style={{ ...btn(false), ...style }}>{children}</button>
  );

  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, background: C.white, overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .rte-area:empty::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .rte-area { min-height: 320px; padding: 18px 20px; outline: none; font-size: 16px; line-height: 1.75; color: #374151; }
        .rte-area h1 { font-family: Montserrat, sans-serif; font-size: 30px; font-weight: 800; margin: 18px 0 10px; color: #000 }
        .rte-area h2 { font-family: Montserrat, sans-serif; font-size: 24px; font-weight: 800; margin: 18px 0 10px; color: #000 }
        .rte-area h3 { font-family: Montserrat, sans-serif; font-size: 19px; font-weight: 700; margin: 16px 0 8px; color: #000 }
        .rte-area p { margin: 0 0 14px }
        .rte-area blockquote { margin: 16px 0; padding: 6px 18px; border-left: 4px solid #0097b2; background: #f7f8fa; color: #4b5563; font-style: italic }
        .rte-area img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0 }
        .rte-area a { color: #0097b2; text-decoration: underline }
        .rte-area ul, .rte-area ol { padding-left: 26px; margin: 0 0 14px }
        .rte-area hr { border: none; border-top: 2px solid #e5e7eb; margin: 22px 0 }
        .rte-bar { position: sticky; top: 68px; z-index: 5 }
      ` }} />

      <div className="rte-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', padding: 8, background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
        <B cmd="undo" title="Undo">↶</B>
        <B cmd="redo" title="Redo">↷</B>
        {sep}
        <select aria-label="Paragraph style" style={sel} defaultValue="" onChange={(e) => { setBlock(e.target.value); e.target.value = ''; }}>
          <option value="">Style</option>
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <select aria-label="Font" style={{ ...sel, maxWidth: 140 }} defaultValue="" onChange={(e) => { if (e.target.value) exec('fontName', e.target.value); e.target.value = ''; }}>
          <option value="">Font</option>
          {FONT_FAMILIES.map(([label, v]) => <option key={v} value={v} style={{ fontFamily: v }}>{label}</option>)}
        </select>
        <select aria-label="Font size" style={{ ...sel, width: 76 }} defaultValue="" onChange={(e) => { setSize(e.target.value); e.target.value = ''; }}>
          <option value="">Size</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
        </select>
        {sep}
        <B cmd="bold" title="Bold" style={{ fontWeight: 800 }}>B</B>
        <B cmd="italic" title="Italic" style={{ fontStyle: 'italic' }}>I</B>
        <B cmd="underline" title="Underline" style={{ textDecoration: 'underline' }}>U</B>
        <B cmd="strikeThrough" title="Strikethrough" style={{ textDecoration: 'line-through' }}>S</B>
        {sep}
        <label title="Text colour" onMouseDown={keep} style={{ ...btn(false), gap: 4, cursor: 'pointer' }}>
          <span style={{ fontWeight: 800, borderBottom: `3px solid ${colors.text}`, lineHeight: 1 }}>A</span>
          <input type="color" aria-label="Text colour" value={colors.text} style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            onChange={(e) => { setColors((c) => ({ ...c, text: e.target.value })); exec('foreColor', e.target.value); }} />
        </label>
        <label title="Highlight colour" onMouseDown={keep} style={{ ...btn(false), gap: 4, cursor: 'pointer' }}>
          <span style={{ fontWeight: 800, background: colors.mark, padding: '0 4px', lineHeight: 1.3 }}>ab</span>
          <input type="color" aria-label="Highlight colour" value={colors.mark} style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            onChange={(e) => { setColors((c) => ({ ...c, mark: e.target.value })); exec('hiliteColor', e.target.value); }} />
        </label>
        {sep}
        <B cmd="justifyLeft" title="Align left">⇤</B>
        <B cmd="justifyCenter" title="Centre">↔</B>
        <B cmd="justifyRight" title="Align right">⇥</B>
        <B cmd="justifyFull" title="Justify">☰</B>
        {sep}
        <B cmd="insertUnorderedList" title="Bullet list">•≡</B>
        <B cmd="insertOrderedList" title="Numbered list">1.</B>
        {sep}
        <button type="button" title="Add link" onMouseDown={keep} onClick={addLink} style={btn(false)}>🔗</button>
        <B cmd="unlink" title="Remove link">⛓︎✕</B>
        <label title="Insert image" onMouseDown={keep} style={{ ...btn(false), cursor: uploading ? 'wait' : 'pointer' }}>
          {uploading ? '…' : '🖼'}
          <input type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} disabled={uploading} />
        </label>
        <B cmd="insertHorizontalRule" title="Divider line">―</B>
        <B cmd="removeFormat" title="Clear formatting">Tx</B>
      </div>

      <div ref={ref} className="rte-area" contentEditable suppressContentEditableWarning spellCheck
        data-placeholder="Start writing your post here..." onInput={emit} onBlur={emit} onPaste={onPaste} />
    </div>
  );
}
