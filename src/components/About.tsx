import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import profile from '@/assets/profile.jpg';

export function About() {
  return (
    <Section id="about" gradient="gradient-mesh" dots>
      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-3xl mx-auto">
        {/* Photo */}
        <Reveal direction="right" className="shrink-0">
          <div className="relative">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/[0.08] bg-cosmic-800">
              <img
                src={profile}
                alt="Dhiraj Salian"
                className="w-full h-full object-cover grayscale-[15%]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div
              className="absolute -inset-2 rounded-full border border-accent-indigo/15 animate-glow"
              aria-hidden="true"
            />
          </div>
        </Reveal>

        {/* Text */}
        <div className="flex-1 text-center md:text-left">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-display italic mb-3 text-text-primary">
              About
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-text-secondary leading-relaxed text-[15px]">
              I'm a Senior Software Engineer based in Bengaluru with 8+ years
              building backend services and distributed systems across
              enterprise cloud platforms — most recently leading multi-cloud
              architecture at Omnissa (formerly VMware EUC).
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-3 text-text-secondary leading-relaxed text-[15px]">
              On the side I ship indie products —{' '}
              <span className="text-gradient-indigo">Inspyry</span> is live in
              production — and contribute to the OpenClaw ecosystem with
              plugins like{' '}
              <span className="text-gradient-cyan">openclaw-nvidia-speech</span>.
              I write about AI and ML at{' '}
              <a
                href="https://blogs.drjzlyan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-text-muted/40 underline-offset-2 hover:text-text-primary hover:decoration-text-secondary transition-colors"
              >
                blogs.drjzlyan.com
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
