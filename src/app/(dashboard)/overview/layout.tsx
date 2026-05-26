'use client';


export default function OverviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--mantine-spacing-xl) * 2)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
