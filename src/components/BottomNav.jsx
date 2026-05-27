import { NavLink } from 'react-router-dom'

export default function BottomNav({ remaining, voted }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)]"
      style={{
        background: 'rgba(10,10,10,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="max-w-[430px] mx-auto grid grid-cols-2">
        <Tab to="/" label="Swipe" icon="🃏" badge={remaining} />
        <Tab to="/results" label="Résultats" icon="📊" badge={voted} />
      </div>
    </nav>
  )
}

function Tab({ to, label, icon, badge }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center py-2.5 text-xs gap-0.5 transition-colors ${
          isActive ? 'text-[var(--color-gold-light)]' : 'text-[var(--color-text-muted)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="text-lg leading-none">{icon}</span>
          <span className="uppercase tracking-wider text-[10px]">{label}</span>
          {badge > 0 && (
            <span
              className="absolute top-1 right-[35%] min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-semibold"
              style={{
                background: isActive ? 'var(--color-gold)' : 'var(--color-surface-2)',
                color: isActive ? '#0a0a0a' : 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }}
            >
              {badge}
            </span>
          )}
          {isActive && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full"
              style={{ background: 'var(--color-gold)' }}
            />
          )}
        </>
      )}
    </NavLink>
  )
}
