/**
 * Clerk `appearance` prop, shared by both frontends' <ClerkProvider>.
 * Plain object (no @clerk/clerk-react dependency here) so this package stays
 * framework-light — matches the ink/bone/ochre brand instead of Clerk's default theme.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#b87333',
    colorText: '#1c1b18',
    colorTextSecondary: '#8b857a',
    colorBackground: '#f5f1e9',
    colorInputBackground: '#f5f1e9',
    colorInputText: '#1c1b18',
    fontFamily: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0px',
  },
  elements: {
    card: 'shadow-none border border-ink/15 bg-bone-dim',
    headerTitle: 'font-serif',
    formButtonPrimary:
      'bg-ink hover:bg-ochre-dark text-bone normal-case font-mono text-xs tracking-[0.15em] uppercase',
    footerActionLink: 'text-ochre-dark hover:text-ink',
  },
}
