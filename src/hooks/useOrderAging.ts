import { useState, useEffect } from 'react';
import { getAgingInfo, type AgingInfo } from '@/utils/orderAging';

export function useOrderAging(orderDateISO: string, refreshMs = 60_000): AgingInfo {
  const [info, setInfo] = useState<AgingInfo>(() => getAgingInfo(orderDateISO));

  useEffect(() => {
    setInfo(getAgingInfo(orderDateISO));
    const id = setInterval(() => setInfo(getAgingInfo(orderDateISO)), refreshMs);
    return () => clearInterval(id);
  }, [orderDateISO, refreshMs]);

  return info;
}
