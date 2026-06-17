import type { ProductType } from '@/types';
import { ShieldAlert, Cpu, Pill } from 'lucide-react';

/* Product type — Controlled reads as REGULATED (ink), not as a red alarm.
   Device = info blue, OTC = neutral. Each carries an icon so the meaning
   survives colorblindness / grayscale. */
export function ProductTypePill({ type }: { type: ProductType }) {
  if (type === 'Controlled') {
    return (
      <span className="pill-controlled">
        <ShieldAlert className="h-3 w-3" /> Controlled
      </span>
    );
  }
  if (type === 'Device') {
    return (
      <span className="pill-device">
        <Cpu className="h-3 w-3" /> Device
      </span>
    );
  }
  return (
    <span className="pill-otc">
      <Pill className="h-3 w-3" /> OTC
    </span>
  );
}
