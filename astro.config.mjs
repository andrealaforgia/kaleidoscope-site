// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://kaleidoscope-site.vercel.app',
  markdown: {
    // Astro 6: extend the default markdown pipeline via a `unified` processor
    // rather than the deprecated top-level `remarkPlugins` option.
    processor: unified({ remarkPlugins: [remarkMermaid] }),
  },
  vite: {
    build: {
      // Mermaid is a legitimately large client dependency, lazily imported
      // only on pages with diagrams. Silence the expected size warning.
      chunkSizeWarningLimit: 1500,
    },
  },
  integrations: [
    starlight({
      title: 'Kaleidoscope',
      description:
        'An OpenTelemetry-compatible observability platform — logs, metrics, traces and profiles in one tool, structurally protected against vendor capture.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/andrealaforgia/kaleidoscope',
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/andrealaforgia/kaleidoscope-site/edit/main/',
      },
      lastUpdated: true,
      customCss: ['./src/styles/custom.css'],
      components: {
        Head: './src/components/Head.astro',
        // Always-on "work in progress" notice (Starlight's default Banner only
        // shows when a page sets `banner` frontmatter; we want it site-wide).
        Banner: './src/components/Banner.astro',
      },
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'What is Kaleidoscope', slug: 'start/what-is-kaleidoscope' },
            { label: 'Is it ready for you?', slug: 'start/status' },
            { label: 'Why it exists', slug: 'start/why' },
          ],
        },
        {
          label: 'Getting started',
          items: [
            { label: 'Run the whole stack', slug: 'getting-started/run-the-stack' },
            { label: 'Quick start (CLI)', slug: 'getting-started/quick-start' },
            { label: 'Run with Docker', slug: 'getting-started/docker' },
            { label: 'Run the gateway end to end', slug: 'getting-started/gateway' },
            { label: 'Query your telemetry', slug: 'getting-started/querying' },
            { label: 'See it in Prism', slug: 'getting-started/prism' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Architecture overview', slug: 'concepts/architecture' },
            { label: 'The two planes', slug: 'concepts/two-planes' },
            { label: 'The fifteen instruments', slug: 'concepts/instruments' },
            { label: 'Ports and adapters', slug: 'concepts/ports-and-adapters' },
            { label: 'OpenTelemetry everywhere', slug: 'concepts/otlp' },
            { label: 'Tenancy and identity', slug: 'concepts/tenancy' },
          ],
        },
        {
          label: 'The instruments',
          items: [
            {
              label: 'Integration plane',
              items: [
                { label: 'Spark — SDK', slug: 'components/spark' },
                { label: 'Aperture — ingest gateway', slug: 'components/aperture' },
                { label: 'Sieve — sampling', slug: 'components/sieve' },
                { label: 'Sluice — ingest buffer', slug: 'components/sluice' },
                { label: 'Codex — schema authority', slug: 'components/codex' },
                { label: 'Aegis — identity', slug: 'components/aegis' },
                { label: 'Prism — frontend', slug: 'components/prism' },
                { label: 'Beacon — alerting', slug: 'components/beacon' },
                { label: 'Loom — config as code', slug: 'components/loom' },
              ],
            },
            {
              label: 'Storage plane',
              items: [
                { label: 'Pulse — metrics', slug: 'components/pulse' },
                { label: 'Lumen — logs', slug: 'components/lumen' },
                { label: 'Ray — traces', slug: 'components/ray' },
                { label: 'Strata — profiles', slug: 'components/strata' },
                { label: 'Cinder — tiering', slug: 'components/cinder' },
              ],
            },
            {
              label: 'Cross-cutting analysis',
              items: [
                { label: 'Augur — anomaly detection', slug: 'components/augur' },
              ],
            },
          ],
        },
        {
          label: 'Operating Kaleidoscope',
          items: [
            { label: 'Durability and Earned Trust', slug: 'operating/durability' },
            { label: 'Read-side safety caps', slug: 'operating/read-caps' },
            { label: 'Alerting with Beacon', slug: 'operating/alerting' },
            { label: 'Config as code with Loom', slug: 'operating/config-as-code' },
            { label: 'Self-observability', slug: 'operating/self-observability' },
            { label: 'Honest limitations', slug: 'operating/limitations' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Component status', slug: 'reference/components' },
            { label: 'CLI reference', slug: 'reference/cli' },
            { label: 'Query API reference', slug: 'reference/query-api' },
            { label: 'Configuration reference', slug: 'reference/configuration' },
            { label: 'Roadmap and phasing', slug: 'reference/roadmap' },
          ],
        },
        {
          label: 'Background',
          items: [
            { label: 'How it is built (nWave)', slug: 'background/nwave' },
            { label: 'Build journal', slug: 'background/journal' },
            { label: 'Licensing', slug: 'background/licensing' },
          ],
        },
      ],
    }),
  ],
});
