import Observation from './Observation.interface';

interface FredResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: 'json' | 'xml';
  order_by: string;
  sort_order: 'asc' | 'desc';
  count: number;
  offset: number;
  limit: number;
  observations: Observation[];
}

export default FredResponse;
