import type { OrderChannel } from '@/types';
import { MessageCircle, Phone, Mail, Store } from 'lucide-react';

/* Channel chips — token-routed, icon-led. Color is a soft secondary cue;
   the icon carries the identity (orphan violet dropped). */
const map: Record<OrderChannel, { icon: any; cls: string; label: string }> = {
  WhatsApp:  { icon: MessageCircle, cls: 'bg-success-tint text-success-text', label: 'WhatsApp' },
  Phone:     { icon: Phone,         cls: 'bg-info-tint text-info-text',       label: 'Phone' },
  Email:     { icon: Mail,          cls: 'bg-muted text-muted-foreground',    label: 'Email' },
  'Walk-in': { icon: Store,         cls: 'bg-warning-tint text-warning-text', label: 'Walk-in' },
};

export function ChannelBadge({ channel, prefix }: { channel: OrderChannel; prefix?: boolean }) {
  const entry = map[channel];
  if (!entry) return null;
  const { icon: Icon, cls, label } = entry;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {prefix ? `via ${label}` : label}
    </span>
  );
}
