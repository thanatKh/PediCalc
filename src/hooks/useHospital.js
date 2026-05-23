import { useState, useCallback } from 'react';
import { HOSPITALS, DEFAULT_HOSPITAL_ID } from '@/utils/hospitals';

const STORAGE_KEY = 'pedicale-hospital';

function readStored() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return HOSPITALS[id] ?? HOSPITALS[DEFAULT_HOSPITAL_ID];
  } catch {
    return HOSPITALS[DEFAULT_HOSPITAL_ID];
  }
}

export function useHospital() {
  const [hospital, setHospitalState] = useState(readStored);

  const setHospital = useCallback((id) => {
    const h = HOSPITALS[id];
    if (!h) return;
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
    setHospitalState(h);
  }, []);

  return { hospital, setHospital };
}
