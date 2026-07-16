import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchingAnimation } from '@/components/loading';

/**
 * Legacy /results route used hardcoded mock flights/hotels.
 * Redirect into the real budget-first flow (Discover → live SerpAPI data).
 */
const Results = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/discover', { replace: true });
  }, [navigate]);

  return <SearchingAnimation />;
};

export default Results;
