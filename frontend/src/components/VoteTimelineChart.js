import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import styles from '../styles/VoteTimelineChart.module.css';

// Pre-defined colors for candidate lines
const LINE_COLORS = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#7f7f7f', // gray
  '#bcbd22', // olive
  '#17becf'  // teal
];

export default function VoteTimelineChart({ data, candidates }) {
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    if (!data || data.length === 0 || !candidates || candidates.length === 0) {
      setChartData([]);
      return;
    }
    
    // Prepare the data for the chart
    // We're expecting data points with timestamp and vote counts for each candidate
    setChartData(data);
  }, [data, candidates]);
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className={styles.noData}>
        <p>No vote data available for timeline chart.</p>
      </div>
    );
  }
  
  // Format time for display
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label * 1000);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();
      
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipTime}>{formattedDate} {formattedTime}</p>
          <div className={styles.tooltipItems}>
            {payload.map((entry, index) => {
              // Extract candidate name from the data point
              const candidateNameKey = `${entry.dataKey}Name`;
              const candidateName = payload[0].payload[candidateNameKey] || 'Unknown';
              
              return (
                <div key={`item-${index}`} className={styles.tooltipItem}>
                  <span className={styles.tooltipColor} style={{ backgroundColor: entry.color }}></span>
                  <span className={styles.tooltipLabel}>{candidateName}: </span>
                  <span className={styles.tooltipValue}>{entry.value} votes</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            name="Time" 
            tickFormatter={formatXAxis}
            domain={['dataMin', 'dataMax']}
            type="number"
            scale="time"
            label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }}
          />
          <YAxis 
            name="Votes" 
            allowDecimals={false}
            label={{ value: 'Cumulative Votes', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {candidates.map((candidate, index) => (
            <Line
              key={candidate.id}
              type="monotone"
              dataKey={`candidate${candidate.id}`}
              name={candidate.name}
              stroke={LINE_COLORS[index % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}