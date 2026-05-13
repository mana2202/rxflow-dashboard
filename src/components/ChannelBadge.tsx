import type { OrderChannel } from '@/types';
import { MessageCircle, Phone, Mail, Network, Globe, PhoneCall } from 'lucide-react';

const map: Record<OrderChannel, { icon: any; cls: string; label: string }> = {
  WhatsApp: { icon: MessageCircle, cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', label: 'WhatsApp' },
  Call:     { icon: PhoneCall,     cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', label: 'Call' },
  Phone:    { icon: Phone,         cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', label: 'Phone' },
  Email:    { icon: Mail,          cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20', label: 'Email' },
  EDI:      { icon: Network,       cls: 'bg-muted text-muted-foreground border-border', label: 'EDI' },
  Portal:   { icon: Globe,         cls: 'bg-muted text-muted-foreground border-border', label: 'Portal' },
};

export function ChannelBadge({ channel }: { channel: OrderChannel }) {
  const { icon: Icon, cls, label } = map[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
