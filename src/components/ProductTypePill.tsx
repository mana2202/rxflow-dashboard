import type { ProductType } from '@/types';

export function ProductTypePill({ type }: { type: ProductType }) {
  const cls = type === 'Controlled' ? 'pill-controlled' : type === 'Device' ? 'pill-device' : 'pill-otc';
  return <span className={cls}>{type}</span>;
}
