import { visit } from 'unist-util-visit';

/**
 * Turn ```mermaid fenced code blocks into <pre class="mermaid"> elements that
 * the client-side Mermaid runtime (wired in src/components/Head.astro) renders
 * to SVG in the browser. Rendering client-side keeps the build free of any
 * headless-browser dependency, so it works on a plain static Vercel build.
 */
export default function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || node.lang !== 'mermaid') return;
      const escaped = node.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      parent.children[index] = {
        type: 'html',
        value: `<pre class="mermaid not-content">${escaped}</pre>`,
      };
    });
  };
}
