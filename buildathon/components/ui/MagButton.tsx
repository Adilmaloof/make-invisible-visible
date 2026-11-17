'use client';
import { useRef, type ReactNode, type ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'cy' | 'vi' | 'em' | 'bio' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARS = {
  cy: 'text-cy border-cy/40 hover:bg-cy/5 hover:shadow-[0_0_28px_#22f2ff33]',
  vi: 'text-vi border-vi/40 hover:bg-vi/5 hover:shadow-[0_0_28px_#a855f733]',
  em: 'text-em border-em/40 hover:bg-em/5 hover:shadow-[0_0_28px_#ff7a1a33]',
  bio: 'text-bio border-bio/40 hover:bg-bio/5 hover:shadow-[0_0_28px_#3dffb533]',
  ghost: 'text-slate-400 border-white/10 hover:bg-white/5',
};
const SIZES = { sm: 'px-4 py-2 text-xs', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };

export function MagButton({ children, variant = 'cy', size = 'md', className = '', ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    ref.current.style.setProperty('--mx', x + '%');
    ref.current.style.setProperty('--my', y + '%');
    const dx = e.clientX - r.left - r.width / 2;
    const dy = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`mag-btn ${VARS[variant]} ${SIZES[size]} ${className}`}
      style={{ transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1), background 0.25s, box-shadow 0.25s' }}
      {...rest}
    >
      {children}
    </button>
  );
}
