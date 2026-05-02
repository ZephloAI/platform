/**
 * Real Zephlo FAB. The `<zephlo-fab>` custom element self-positions
 * (position: fixed, bottom-right) and renders its full FAB UI once
 * `ZephloProvider` has initialized the SDK. Before hydration it is
 * an empty tag — takes no space, produces no layout shift.
 */
export default function FloatingChat() {
  return <zephlo-fab aria-label="Open chat" />;
}
