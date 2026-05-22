import { useEffect, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import { Tag, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// ===================================
// Custom Image blot — allows width + style + alt attributes to persist when
// Quill serializes / re-renders. Without this, resize + alt changes get
// stripped on the next value sync.
// ===================================
const QuillImage = Quill.import('formats/image');
const IMG_ATTRS = ['alt', 'height', 'width', 'style', 'class'];
class ResizableImage extends QuillImage {
  static formats(domNode) {
    return IMG_ATTRS.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name, value) {
    if (IMG_ATTRS.includes(name)) {
      if (value) this.domNode.setAttribute(name, value);
      else this.domNode.removeAttribute(name);
    } else {
      super.format(name, value);
    }
  }
}
Quill.register(ResizableImage, true);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ align: [] }],
    ['clean'],
  ],
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB cap on data-URL embeds

const SIZE_PRESETS = [
  { id: 'small',  label: 'S',    width: '25%' },
  { id: 'medium', label: 'M',    width: '50%' },
  { id: 'large',  label: 'L',    width: '75%' },
  { id: 'full',   label: 'Full', width: '100%' },
];

/**
 * Rich-text editor with native drag-and-drop image insertion, hover toolbar
 * for resize + alt-text + delete, and inline image dragging to reposition.
 *
 * Hover an image → toolbar appears above it (size presets + Alt + Delete).
 * Drag an image → drop elsewhere to reposition. Drag and toolbar coexist —
 * toolbar is anchored above the image but never intercepts dragstart on
 * the image itself.
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Write your content...' }) {
  const quillRef = useRef(null);
  const draggedImgRef = useRef(null);
  const wrapRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [activeImg, setActiveImg] = useState(null); // { img, top, left, width }
  const [altEditing, setAltEditing] = useState(false);
  const [altDraft, setAltDraft] = useState('');

  const positionToolbar = (img) => {
    const wrap = wrapRef.current;
    if (!wrap || !img) return null;
    const wrapRect = wrap.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    return {
      img,
      top: imgRect.top - wrapRect.top - 8,
      left: imgRect.left - wrapRect.left,
      width: imgRect.width,
    };
  };

  const showToolbarFor = (img) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const next = positionToolbar(img);
    if (next) setActiveImg(next);
  };

  const scheduleHide = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveImg(null);
      setAltEditing(false);
    }, 220);
  };

  const emitChange = () => {
    const quill = quillRef.current?.getEditor?.();
    if (quill) onChange?.(quill.root.innerHTML);
  };

  // ── Quill operations on the active image ──
  const applySize = (width) => {
    if (!activeImg?.img) return;
    activeImg.img.setAttribute('width', width);
    activeImg.img.style.width = width;
    emitChange();
    // Re-anchor toolbar after the resize completes (next paint)
    requestAnimationFrame(() => {
      const next = positionToolbar(activeImg.img);
      if (next) setActiveImg(next);
    });
  };

  const deleteImage = () => {
    if (!activeImg?.img) return;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    const blot = Quill.find(activeImg.img);
    if (!blot) return;
    const idx = quill.getIndex(blot);
    quill.deleteText(idx, 1, 'user');
    setActiveImg(null);
    setAltEditing(false);
  };

  const openAltEditor = () => {
    if (!activeImg?.img) return;
    setAltDraft(activeImg.img.getAttribute('alt') || '');
    setAltEditing(true);
  };
  const saveAlt = (val) => {
    if (!activeImg?.img) return;
    if (val) activeImg.img.setAttribute('alt', val);
    else activeImg.img.removeAttribute('alt');
    emitChange();
    toast.success(val ? 'Alt text saved' : 'Alt text cleared');
    setAltEditing(false);
  };

  const applyAlign = (mode) => {
    if (!activeImg?.img) return;
    const img = activeImg.img;
    // Reset existing alignment hints
    img.style.float = '';
    img.style.display = '';
    img.style.marginLeft = '';
    img.style.marginRight = '';
    if (mode === 'left')  { img.style.float = 'left';  img.style.marginRight = '12px'; }
    if (mode === 'right') { img.style.float = 'right'; img.style.marginLeft  = '12px'; }
    if (mode === 'center'){ img.style.display = 'block'; img.style.marginLeft = 'auto'; img.style.marginRight = 'auto'; }
    emitChange();
    requestAnimationFrame(() => {
      const next = positionToolbar(img);
      if (next) setActiveImg(next);
    });
  };

  // ── Wire native drop / paste / drag / hover handlers with ready-polling ──
  useEffect(() => {
    let cancelled = false;
    let root = null;
    let observer = null;
    const cleanups = [];

    // Mark existing + future images as draggable. Without explicit
    // draggable="true" on images that Quill placed inside contenteditable=false
    // wrappers, the browser swallows dragstart.
    const flagImage = (img) => {
      if (!img || img.tagName !== 'IMG') return;
      img.setAttribute('draggable', 'true');
    };
    const flagAll = (target) => {
      if (!target) return;
      target.querySelectorAll('img').forEach(flagImage);
    };

    const attach = () => {
      if (cancelled) return;
      const quill = quillRef.current?.getEditor?.();
      if (!quill || !quill.root) {
        // Quill not ready yet — retry next frame
        requestAnimationFrame(attach);
        return;
      }
      root = quill.root;
      flagAll(root);
      observer = new MutationObserver((muts) => {
        for (const m of muts) {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'IMG') flagImage(n);
            else flagAll(n);
          });
        }
      });
      observer.observe(root, { childList: true, subtree: true });

    const onDrop = (e) => {
      if (draggedImgRef.current) {
        e.preventDefault();
        const movedImg = draggedImgRef.current;
        draggedImgRef.current = null;
        // Hide the toolbar during the move; will re-appear on hover
        setActiveImg(null);
        const src = movedImg.getAttribute('src');
        const alt = movedImg.getAttribute('alt') || '';
        const width = movedImg.getAttribute('width') || movedImg.style.width || '';
        const dropIndex = positionFromEvent(quill, e);
        if (dropIndex == null) return;
        const blot = Quill.find(movedImg);
        if (blot) {
          const origIndex = quill.getIndex(blot);
          quill.deleteText(origIndex, 1, 'user');
          const insertAt = dropIndex > origIndex ? dropIndex - 1 : dropIndex;
          quill.insertEmbed(insertAt, 'image', src, 'user');
          // Re-apply alt + width on the newly-inserted node
          requestAnimationFrame(() => {
            const node = quill.getLeaf(insertAt + 1)?.[0]?.domNode;
            if (node && node.tagName === 'IMG') {
              if (alt) node.setAttribute('alt', alt);
              if (width) {
                node.setAttribute('width', width);
                node.style.width = width;
              }
              emitChange();
            }
          });
          quill.setSelection(insertAt + 1, 0, 'user');
        }
        return;
      }

      const files = [...(e.dataTransfer?.files || [])].filter((f) => /^image\//i.test(f.type));
      if (!files.length) return;
      e.preventDefault();
      const dropIndex = positionFromEvent(quill, e) ?? (quill.getLength() - 1);
      insertImagesAt(quill, files, dropIndex);
    };

    const onPaste = (e) => {
      const items = [...(e.clipboardData?.items || [])];
      const fileItems = items.filter((i) => /^image\//i.test(i.type));
      if (!fileItems.length) return;
      e.preventDefault();
      const files = fileItems.map((i) => i.getAsFile()).filter(Boolean);
      const sel = quill.getSelection(true);
      const idx = sel ? sel.index : quill.getLength() - 1;
      insertImagesAt(quill, files, idx);
    };

    const onDragStart = (e) => {
      const tgt = e.target;
      if (tgt && tgt.tagName === 'IMG' && root.contains(tgt)) {
        draggedImgRef.current = tgt;
        // Drop the toolbar so it doesn't obscure the drop target / ghost
        setActiveImg(null);
        try { e.dataTransfer.effectAllowed = 'move'; } catch { /* readonly */ }
      }
    };
    const onDragOver = (e) => {
      e.preventDefault();
      try { e.dataTransfer.dropEffect = draggedImgRef.current ? 'move' : 'copy'; } catch {}
    };

    // ===== Hover image → show toolbar =====
    const onMouseOver = (e) => {
      const tgt = e.target;
      if (tgt && tgt.tagName === 'IMG' && root.contains(tgt) && !draggedImgRef.current) {
        showToolbarFor(tgt);
      }
    };
    const onMouseOut = (e) => {
      // Only hide if pointer leaves the editor area entirely; the toolbar
      // itself handles its own mouseenter/leave to keep itself open.
      if (!e.relatedTarget || !root.contains(e.relatedTarget)) {
        scheduleHide();
      }
    };

    root.addEventListener('drop',      onDrop);
    root.addEventListener('paste',     onPaste);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover',  onDragOver);
    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mouseout',  onMouseOut);
    cleanups.push(() => {
      root.removeEventListener('drop',      onDrop);
      root.removeEventListener('paste',     onPaste);
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('dragover',  onDragOver);
      root.removeEventListener('mouseover', onMouseOver);
      root.removeEventListener('mouseout',  onMouseOut);
    });
    }; // close attach()

    attach();
    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      cleanups.forEach((fn) => { try { fn(); } catch {} });
    };
  }, []);

  // Hide toolbar when the editor scrolls (toolbar's absolute coords go stale)
  useEffect(() => {
    const onScroll = () => setActiveImg(null);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  return (
    <div ref={wrapRef} className="rich-editor relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 [&_.ql-editor]:min-h-[250px] [&_.ql-editor_img]:cursor-move [&_.ql-editor_img]:rounded-md"
      />

      {activeImg && (
        <ImageToolbar
          state={activeImg}
          altEditing={altEditing}
          altDraft={altDraft}
          onMouseEnter={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }}
          onMouseLeave={scheduleHide}
          onApplySize={applySize}
          onApplyAlign={applyAlign}
          onOpenAlt={openAltEditor}
          onChangeAltDraft={setAltDraft}
          onSaveAlt={saveAlt}
          onCancelAlt={() => setAltEditing(false)}
          onDelete={deleteImage}
        />
      )}
    </div>
  );
}

// ===================================
// Image hover toolbar
// ===================================
function ImageToolbar({
  state, altEditing, altDraft,
  onMouseEnter, onMouseLeave,
  onApplySize, onApplyAlign, onOpenAlt, onChangeAltDraft, onSaveAlt, onCancelAlt, onDelete,
}) {
  const top = Math.max(0, state.top - 44);
  return (
    <div
      className="absolute z-30"
      style={{ top, left: state.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="inline-flex items-center gap-1 rounded-lg border border-violet-500/50 bg-popover/95 backdrop-blur-xl shadow-[0_10px_24px_-10px_rgba(99,102,241,0.45)] p-1.5">
        {/* Size presets */}
        <div className="inline-flex items-center gap-0.5 mr-1 pr-1 border-r border-border/60">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplySize(p.width)}
              title={`Resize to ${p.width}`}
              className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Alignment */}
        <div className="inline-flex items-center gap-0.5 mr-1 pr-1 border-r border-border/60">
          <button
            type="button"
            onClick={() => onApplyAlign('left')}
            title="Align left"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <AlignLeft size={11} />
          </button>
          <button
            type="button"
            onClick={() => onApplyAlign('center')}
            title="Align center"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <AlignCenter size={11} />
          </button>
          <button
            type="button"
            onClick={() => onApplyAlign('right')}
            title="Align right"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <AlignRight size={11} />
          </button>
        </div>
        {/* Alt button */}
        <button
          type="button"
          onClick={onOpenAlt}
          title="Alt text"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
        >
          <Tag size={10} />
          Alt
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          title="Delete image"
          className="p-1.5 rounded-md text-rose-300 hover:bg-rose-500/15 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {altEditing && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/50 bg-popover/95 backdrop-blur-xl p-1.5 shadow-[0_10px_24px_-10px_rgba(99,102,241,0.45)]">
          <input
            type="text"
            autoFocus
            value={altDraft}
            onChange={(e) => onChangeAltDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveAlt(altDraft);
              else if (e.key === 'Escape') onCancelAlt();
            }}
            placeholder="Describe the image…"
            className="w-64 px-2 py-1 rounded-md bg-foreground/[0.04] border border-border/60 focus:border-violet-500/60 outline-none text-[11.5px]"
            maxLength={300}
          />
          <button
            type="button"
            onClick={() => onSaveAlt(altDraft)}
            className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] bg-violet-500 text-white hover:bg-violet-400 transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ===================================
// Helpers
// ===================================

function positionFromEvent(quill, e) {
  try {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        const idx = quill.getSelection(true)?.index;
        if (typeof idx === 'number') return idx;
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        const idx = quill.getSelection(true)?.index;
        if (typeof idx === 'number') return idx;
      }
    }
  } catch { /* fallthrough */ }
  const sel = quill.getSelection();
  return sel ? sel.index : quill.getLength() - 1;
}

function insertImagesAt(quill, files, startIndex) {
  let idx = startIndex;
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`${file.name || 'Image'} exceeds 5MB limit`);
      continue;
    }
    const reader = new FileReader();
    const insertAt = idx;
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      quill.insertEmbed(insertAt, 'image', dataUrl, 'user');
      quill.setSelection(insertAt + 1, 0, 'user');
    };
    reader.readAsDataURL(file);
    idx++;
  }
}
