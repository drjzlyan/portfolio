import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { pauseScroll, resumeScroll } from '@/lib/scroll';
import { StatusChip } from './StatusChip';
import type { Project } from './model';

interface Props {
  project: Project | null;
  onClose: () => void;
}

export default function DetailSheet({ project, onClose }: Props) {
  const controls = useDragControls();

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const opener = document.activeElement as HTMLElement | null;
    const behind = [document.getElementById('main'), document.querySelector('nav[aria-label="Chapters"]')];
    behind.forEach((el) => el?.setAttribute('inert', ''));
    pauseScroll();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      behind.forEach((el) => el?.removeAttribute('inert'));
      resumeScroll();
      opener?.focus?.();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[60] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            data-lenis-prevent
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-h-[85svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-800 p-6 pb-10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              onPointerDown={(e) => controls.start(e)}
              className="mx-auto mb-5 h-1.5 w-12 cursor-grab touch-none rounded-full bg-white/25"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <StatusChip status={project.status} />
                <h2 id="sheet-title" className="mt-3 font-display text-4xl italic leading-tight [overflow-wrap:anywhere]">
                  {project.name}
                </h2>
              </div>
              <button type="button" autoFocus onClick={onClose} className="btn-ghost shrink-0" aria-label="Close details">
                ✕
              </button>
            </div>
            <p className="mt-3 text-lg text-paper/90">{project.tagline}</p>
            <p className="mt-4 text-paper/70">{project.description}</p>
            {project.stack.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
                {project.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="btn-accent" href={project.url} target="_blank" rel="noopener noreferrer">
                Open project ↗
              </a>
              {project.links?.map((l) => (
                <a key={l.href} className="btn-ghost" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
