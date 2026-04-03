import { useState, useEffect, useCallback } from 'react';
import {
  getReportSummary, getTicketVolume,
  getCategoryBreakdown, getSLACompliance,
} from '../services/reportService';

export const useReports = (range = 'week') => {
  const [summary,           setSummary]           = useState(null);
  const [ticketVolume,      setTicketVolume]      = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [slaCompliance,     setSlaCompliance]     = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, vol, cats, sla] = await Promise.all([
        getReportSummary(),
        getTicketVolume({ range }),
        getCategoryBreakdown(),
        getSLACompliance(),
      ]);
      setSummary(sum);
      setTicketVolume(vol ?? []);
      setCategoryBreakdown(cats ?? []);
      setSlaCompliance(sla);
    } catch (err) {
      setError(err?.message ?? 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, ticketVolume, categoryBreakdown, slaCompliance, loading, error, refetch: fetch };
};
