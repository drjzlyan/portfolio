import { useRef } from 'react';
import { Download, Github, Linkedin, Mail, Pen } from 'lucide-react';
import { Magnetic } from '@/components/Magnetic';
import { profile } from '@/data/profile';
import { DEFAULT_ACCENT } from '@/features/log/model';
import { useAccentOnVisible } from '@/features/log/useAccent';

const socials = [
  { label: 'GitHub', href: profile.links.github, Icon: Github },
  { label: 'LinkedIn', href: profile.links.linkedin, Icon: Linkedin },
  { label: 'Blog', href: profile.links.blog, Icon: Pen },
  { label: 'Email', href: profile.links.email, Icon: Mail },
];

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useAccentOnVisible(ref, DEFAULT_ACCENT);

  return (
    <section
      ref={ref}
      id="contact"
      aria-labelledby="contact-title"
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-center px-5 pb-32 pt-24 md:px-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">Contact</p>
      <h2 id="contact-title" className="mt-2 font-display text-[clamp(3rem,15vw,9rem)] italic leading-[0.92]">
        Next ship?
      </h2>
      <p className="mt-4 max-w-md text-lg text-paper/80">
        Hiring, collaborating, or just curious what I’m building next. Say hi.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Magnetic>
          <a className="btn-accent" href={profile.links.email}>
            <Mail className="h-4 w-4" aria-hidden="true" /> Email me
          </a>
        </Magnetic>
        <a className="btn-ghost" href={profile.links.resume} download>
          <Download className="h-4 w-4" aria-hidden="true" /> Resume
        </a>
      </div>

      <ul className="mt-8 flex gap-3" aria-label="Social links">
        {socials.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              aria-label={label}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/15 text-paper/80 transition-colors hover:border-[var(--accent)] hover:text-paper"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-16 font-mono text-[11px] tracking-wider text-mute">Built by {profile.name.split(' ')[0]} · 2026</p>
    </section>
  );
}
