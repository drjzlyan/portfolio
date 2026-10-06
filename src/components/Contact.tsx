import { Github, Linkedin, Mail, Pen, Download } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/dhiraj-salian',
    icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/dhiraj-salian',
    icon: Linkedin,
  },
  {
    label: 'Email',
    href: 'mailto:dhirajsalian1996@gmail.com',
    icon: Mail,
  },
  {
    label: 'Blog',
    href: 'https://blogs.drjzlyan.com',
    icon: Pen,
  },
];

export function Contact() {
  return (
    <Section id="contact" gradient="gradient-mesh" className="pb-24 md:pb-32">
      <div className="max-w-2xl mx-auto text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-display italic mb-3 text-text-primary">
            Get in touch
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-text-secondary text-[15px] mb-10">
            Grab the resume below, or reach out directly.
          </p>
        </Reveal>

        {/* Direct download */}
        <Reveal delay={0.2}>
          <div className="flex items-center justify-center mb-12">
            <a
              href="/resume.pdf"
              download
              className="group inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-accent-indigo/40 text-text-primary font-mono text-sm tracking-wide transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download Resume
            </a>
          </div>
        </Reveal>

        {/* Socials */}
        <Reveal delay={0.3}>
          <nav aria-label="Social links" className="flex items-center justify-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('mailto') ? undefined : '_blank'}
                rel={social.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="group flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.06] bg-cosmic-800/40 text-text-secondary hover:text-text-primary hover:border-accent-indigo/30 transition-all duration-300"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
            ))}
          </nav>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="mt-12 text-text-muted font-mono text-[11px] tracking-wider">
            Built by Dhiraj · 2026
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
