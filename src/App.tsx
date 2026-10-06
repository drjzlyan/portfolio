import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Dock } from '@/components/Dock';
import { Loader } from '@/components/Loader';
import { projects } from '@/data/projects';
import { About } from '@/features/about/About';
import { Contact } from '@/features/contact/Contact';
import { Hero } from '@/features/hero/Hero';
import { Chapter } from '@/features/log/Chapter';
import { LabRow } from '@/features/log/LabRow';
import { buildSections, shipNumbers, sortProjects, splitTiers, type Project } from '@/features/log/model';
import { initScroll, ScrollTrigger } from '@/lib/scroll';

const DetailSheet = lazy(() => import('@/features/log/DetailSheet'));

// Derived once at module level: stable references, single source of truth
const ordered = sortProjects(projects);
const sections = buildSections(ordered);
const numbers = shipNumbers(ordered);
const { flagships, labs } = splitTiers(ordered);

export default function App() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  const openProject = useCallback((p: Project) => {
    setSheetMounted(true);
    setOpen(p);
  }, []);
  const onLoaderDone = useCallback(() => setReady(true), []);
  const closeSheet = useCallback(() => setOpen(null), []);

  useEffect(() => initScroll(), []);

  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden';
  }, [ready]);

  useEffect(() => {
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <Loader onDone={onLoaderDone} />
      <div className="grain" aria-hidden="true" />

      <main id="main">
        <Hero start={ready} latest={ordered[0]} />
        {flagships.map((p) => (
          <Chapter key={p.slug} project={p} number={numbers.get(p.slug) ?? 0} onOpen={openProject} />
        ))}
        {labs.length > 0 && <LabRow labs={labs} numbers={numbers} onOpen={openProject} />}
        <About projects={ordered} />
        <Contact />
      </main>

      {ready && <Dock sections={sections} />}
      <Suspense fallback={null}>{sheetMounted && <DetailSheet project={open} onClose={closeSheet} />}</Suspense>
    </>
  );
}
