import { useEffect, useState } from 'react';
import { getDeals } from '../services/dealService';

export default function useDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDeals()
      .then((res) => {
        if (!mounted) return;
        // backend could return { deals } or an array
        const list = Array.isArray(res) ? res : res?.deals || res?.data || [];
        setDeals(list);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to fetch deals');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { deals, loading, error };
}

