import { useState } from 'react';

/** No-op stubs — real-time socket support removed; pages use polling instead. */
export function useRealtime() {}

export function useMonitoringRoom() {}

export function useInstitutionRoom() {}

export function useStreamRoom() {}

export function useAttendanceFeed(onUpdate) {
  return [];
}

export default useRealtime;
