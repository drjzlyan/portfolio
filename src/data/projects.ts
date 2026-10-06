export interface Project {
  title: string;
  description: string;
  url: string;
  color: string;
  colorLight: string;
  gradient: string;
  svgId: string;
}

export const projects: Project[] = [
  {
    title: 'Inspyry',
    description: 'AI SVG generator on Cloudflare. Single-pass raster → vector pipeline with VTracer WASM. Production SaaS.',
    url: 'https://inspyry.com',
    color: '#7c5cff',
    colorLight: '#a78bfa',
    gradient: 'from-accent-indigo/20 to-accent-cyan/10',
    svgId: 'inspyry',
  },
  {
    title: 'buffer-api-skill',
    description: 'OpenClaw-compatible agent skill for Buffer’s GraphQL API — post, schedule, delete, channels. Python, MIT.',
    url: 'https://github.com/dhiraj-salian/buffer-api-skill',
    color: '#2EBE9C',
    colorLight: '#5DD3B5',
    gradient: 'from-accent-emerald/20 to-accent-cyan/10',
    svgId: 'buffer',
  },
  {
    title: 'openclaw-nvidia-speech',
    description: 'OpenClaw plugin for NVIDIA TTS (Magpie) and STT (Parakeet). Zero deps, published to npm.',
    url: 'https://github.com/dhiraj-salian/openclaw-nvidia-speech',
    color: '#22d3ee',
    colorLight: '#67e8f9',
    gradient: 'from-accent-cyan/20 to-accent-sky/10',
    svgId: 'nvidia',
  },
  {
    title: 'inspyry-vector-generator-skill',
    description: 'Agent skill for creating vector images — logos, icons, mascots, illustrations. MIT licensed.',
    url: 'https://github.com/dhiraj-salian/inspyry-vector-generator-skill',
    color: '#a78bfa',
    colorLight: '#c4b5fd',
    gradient: 'from-accent-indigo/20 to-accent-rose/10',
    svgId: 'skill',
  },
];
