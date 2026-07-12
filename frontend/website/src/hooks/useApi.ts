'use client';

import { useMemo } from 'react';
import { createClientApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export function useApi() {
  return useMemo(() => createClientApi(getAccessToken), []);
}
