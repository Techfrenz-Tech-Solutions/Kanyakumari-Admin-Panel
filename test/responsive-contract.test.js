import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const root = process.cwd();

describe('responsive layout contracts', () => {
  it('keeps dashboard date filters on the mobile chip scroller', () => {
    const dashboard = readFileSync(join(root, 'src/pages/Dashboard.jsx'), 'utf8');

    assert.match(dashboard, /className="chip-row"/);
    assert.match(dashboard, /Analytics period:/);
  });

  it('keeps toast entrance animation from increasing mobile page width', () => {
    const css = readFileSync(join(root, 'src/styles/index.css'), 'utf8');
    const toastAnimation = css.match(/@keyframes toast-in\s*\{[\s\S]*?\n\}/)?.[0] ?? '';

    assert.doesNotMatch(toastAnimation, /translateX/);
    assert.match(toastAnimation, /translateY/);
  });

  it('removes the closed mobile sidebar from layout flow', () => {
    const css = readFileSync(join(root, 'src/styles/index.css'), 'utf8');

    assert.match(css, /\.app-shell:not\(\.mobile-open\) \.sidebar\s*\{[^}]*display: none/);
  });

  it('keeps the add/edit two-column form inside the mobile viewport', () => {
    const css = readFileSync(join(root, 'src/styles/index.css'), 'utf8');

    assert.match(css, /\.two-col\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(css, /\.two-col > \*\s*\{[^}]*min-width: 0/);
  });

  it('renders a desktop sidebar collapse control wired to the layout callback', () => {
    const sidebar = readFileSync(join(root, 'src/components/layout/Sidebar.jsx'), 'utf8');

    assert.match(sidebar, /className="collapse-btn desktop-only"/);
    assert.match(sidebar, /onClick=\{onToggleCollapse\}/);
    assert.match(sidebar, /aria-label=\{collapsed \? 'Expand sidebar' : 'Collapse sidebar'\}/);
  });
});
