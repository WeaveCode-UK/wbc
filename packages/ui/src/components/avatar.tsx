import { cn } from '../lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  classification?: 'A' | 'B' | 'C';
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-caption',
  md: 'h-9 w-9 text-body-small',
  lg: 'h-12 w-12 text-body',
};

const classColors: Record<string, string> = {
  A: 'var(--color-abc-a)',
  B: 'var(--color-abc-b)',
  C: 'var(--color-abc-c)',
};

export function Avatar({ name, src, size = 'md', classification, className }: AvatarProps) {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const bgColor = classification ? classColors[classification] : 'var(--color-primary)';

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizeStyles[size], className)} />;
  }

  return (
    <div
      className={cn('flex items-center justify-center rounded-full text-white font-medium', sizeStyles[size], className)}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
