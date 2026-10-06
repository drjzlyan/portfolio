import type { Project } from '@/features/log/model';

/**
 * The Ship Log. Newest first: to add a product, put a new entry at the TOP.
 * Chapters, dock dots, theme shifts and ship numbers are all derived from this array.
 * - tier 'flagship' = full-screen chapter; 'lab' = card in the shared Lab row.
 * - accent = #rgb or #rrggbb colour the whole page takes on in that chapter.
 */
export const projects: Project[] = [
  {
    slug: 'rydd',
    name: 'rydd.club',
    tagline: 'Plan a group ride. Share one link. See everyone live.',
    description:
      'Group ride coordination: one shareable link and live locations for everyone on the ride.',
    status: 'live',
    tier: 'flagship',
    accent: '#facc15',
    url: 'https://rydd.club',
    stack: [],
  },
  {
    slug: 'inspyry',
    name: 'inspyry.com',
    tagline: 'Type an idea. Get a cut-ready SVG.',
    description:
      'AI SVG generator on Cloudflare. Single-pass raster → vector pipeline with VTracer WASM. Flat colours, closed paths, transparent background. Production SaaS with a REST API and MCP server.',
    status: 'live',
    tier: 'flagship',
    accent: '#7c5cff',
    url: 'https://inspyry.com',
    stack: ['Cloudflare', 'VTracer WASM'],
  },
  {
    slug: 'guhio',
    name: 'guhio',
    tagline: 'A password vault for humans and agents.',
    description:
      'Local encrypted password vault for agent workflows: humans store credentials outside the agent context, and agents use them by name without ever seeing the plaintext. CLI, web dashboard and an agent skill. On PyPI.',
    status: 'open-source',
    tier: 'lab',
    accent: '#f59e0b',
    url: 'https://github.com/drjzlyan/guhio',
    stack: ['Python', 'PyPI'],
  },
  {
    slug: 'buffer-api-skill',
    name: 'buffer-api-skill',
    tagline: 'Post, schedule and manage Buffer from an agent.',
    description:
      'OpenClaw-compatible agent skill for Buffer’s GraphQL API: post, schedule, delete, channels. MIT.',
    status: 'open-source',
    tier: 'lab',
    accent: '#2ebe9c',
    url: 'https://github.com/drjzlyan/buffer-api-skill',
    stack: ['Python', 'GraphQL'],
  },
  {
    slug: 'openclaw-nvidia-speech',
    name: 'openclaw-nvidia-speech',
    tagline: 'NVIDIA text-to-speech and speech-to-text for OpenClaw.',
    description:
      'OpenClaw plugin for NVIDIA TTS (Magpie) and STT (Parakeet). Zero dependencies, published to npm.',
    status: 'open-source',
    tier: 'lab',
    accent: '#22d3ee',
    url: 'https://github.com/drjzlyan/openclaw-nvidia-speech',
    stack: ['npm', 'Magpie', 'Parakeet'],
  },
  {
    slug: 'inspyry-vector-generator-skill',
    name: 'inspyry-vector-generator-skill',
    tagline: 'Logos, icons and mascots as vectors, from an agent.',
    description:
      'Agent skill for creating vector images: logos, icons, mascots, illustrations. MIT licensed.',
    status: 'open-source',
    tier: 'lab',
    accent: '#f472b6',
    url: 'https://github.com/drjzlyan/inspyry-vector-generator-skill',
    stack: ['Agent skill', 'SVG'],
  },
];
