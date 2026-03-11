import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line 
} from 'recharts';
import { getAnalytics, trackClick, saveFiltersToCookies, loadFiltersFromCookies } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const savedFilters = loadFiltersFromCookies();
  
  const [filters, setFilters] = useState({
    startDate: savedFilters?.startDate ? new Date(savedFilters.startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: savedFilters?.endDate ? new Date(savedFilters.endDate) : new Date(),
    ageGroup: savedFilters?.ageGroup || 'All',
    gender: savedFilters?.gender || 'All',
    selectedFeature: savedFilters?.selectedFeature || null
  });

  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({
    start: filters.startDate,
    end: filters.endDate
  });

  // Fetch analytics when filters change
  useEffect(() => {
    fetchAnalytics();
    saveFiltersToCookies(filters);
  }, [filters.startDate, filters.endDate, filters.ageGroup, filters.gender, filters.selectedFeature]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Format dates for API
      const startDateStr = filters.startDate instanceof Date 
        ? filters.startDate.toISOString().split('T')[0] 
        : new Date(filters.startDate).toISOString().split('T')[0];
      
      const endDateStr = filters.endDate instanceof Date 
        ? filters.endDate.toISOString().split('T')[0] 
        : new Date(filters.endDate).toISOString().split('T')[0];

      const data = await getAnalytics({
        startDate: startDateStr,
        endDate: endDateStr,
        ageGroup: filters.ageGroup !== 'All' ? filters.ageGroup : '',
        gender: filters.gender !== 'All' ? filters.gender : '',
        selectedFeature: filters.selectedFeature
      });
    
      const transformedBarData = (data.barChartData || []).map(item => ({
        ...item,
        display_name: item.feature_name.replace(/_/g, ' ')
      }));
      
      setBarChartData(transformedBarData);
      setLineChartData(data.lineChartData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const handleFilterChange = async (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    
    // Track the filter interaction
    let featureName = '';
    if (filterName === 'ageGroup') featureName = 'age_filter';
    else if (filterName === 'gender') featureName = 'gender_filter';
    else if (filterName === 'startDate' || filterName === 'endDate') featureName = 'date_filter';
    
    if (featureName) {
      await trackClick(featureName);
    }
  };

  const handleBarClick = async (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const featureName = data.activePayload[0].payload.feature_name;
      
      setFilters(prev => ({ ...prev, selectedFeature: featureName }));
      
      await trackClick('bar_chart_click');
      
      const startDateStr = filters.startDate instanceof Date 
        ? filters.startDate.toISOString().split('T')[0] 
        : new Date(filters.startDate).toISOString().split('T')[0];
      
      const endDateStr = filters.endDate instanceof Date 
        ? filters.endDate.toISOString().split('T')[0] 
        : new Date(filters.endDate).toISOString().split('T')[0];

      const data = await getAnalytics({
        startDate: startDateStr,
        endDate: endDateStr,
        ageGroup: filters.ageGroup !== 'All' ? filters.ageGroup : '',
        gender: filters.gender !== 'All' ? filters.gender : '',
        selectedFeature: featureName
      });
      
      setLineChartData(data.lineChartData || []);
    }
  };

  const setDatePreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let start, end;
    
    switch(preset) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(yesterday);
        end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7Days':
        start = new Date(last7Days);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(firstDayOfMonth);
        end = new Date(today);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        setShowCustomRange(true);
        return;
      default:
        return;
    }
    setFilters(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
    
    setTempDateRange({ start, end });
    setShowCustomRange(false);
    
    trackClick('date_filter');
  };

  const applyCustomRange = () => {
    if (tempDateRange.start && tempDateRange.end) {
      const endDate = new Date(tempDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      setFilters(prev => ({
        ...prev,
        startDate: tempDateRange.start,
        endDate: endDate
      }));
      
      setShowCustomRange(false);
      trackClick('date_filter');
    }
  };

  const cancelCustomRange = () => {
    setTempDateRange({
      start: filters.startDate,
      end: filters.endDate
    });
    setShowCustomRange(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
  };

  if (loading && barChartData.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Product Analytics Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>Welcome, {user?.username}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersSection}>
        {/* Calendar / Date Range */}
        <div style={styles.filterCard}>
          <h3 style={styles.filterCardTitle}>Calendar</h3>
          <div style={styles.presetButtons}>
            <button 
              onClick={() => setDatePreset('today')} 
              style={styles.presetButton}
            >
              Today
            </button>
            <button 
              onClick={() => setDatePreset('yesterday')} 
              style={styles.presetButton}
            >
              Yesterday
            </button>
            <button 
              onClick={() => setDatePreset('last7Days')} 
              style={styles.presetButton}
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => setDatePreset('thisMonth')} 
              style={styles.presetButton}
            >
              This Month
            </button>
            <button 
              onClick={() => setDatePreset('custom')} 
              style={styles.presetButton}
            >
              Custom Range
            </button>
          </div>
          
          {showCustomRange && (
            <div style={styles.customRangeContainer}>
              <h4 style={styles.customRangeTitle}>Date Range</h4>
              <div style={styles.datePickerWrapper}>
                <DatePicker
                  selected={tempDateRange.start}
                  onChange={(date) => setTempDateRange(prev => ({ ...prev, start: date }))}
                  selectsStart
                  startDate={tempDateRange.start}
                  endDate={tempDateRange.end}
                  placeholderText="Start Date"
                  dateFormat="yyyy-MM-dd"
                  style={styles.datePicker}
                />
                <span style={styles.dateSeparator}>-</span>
                <DatePicker
                  selected={tempDateRange.end}
                  onChange={(date) => setTempDateRange(prev => ({ ...prev, end: date }))}
                  selectsEnd
                  startDate={tempDateRange.start}
                  endDate={tempDateRange.end}
                  minDate={tempDateRange.start}
                  placeholderText="End Date"
                  dateFormat="yyyy-MM-dd"
                  style={styles.datePicker}
                />
              </div>
              <div style={styles.customRangeActions}>
                <button onClick={cancelCustomRange} style={styles.cancelButton}>Cancel</button>
                <button onClick={applyCustomRange} style={styles.applyButton}>Apply</button>
              </div>
            </div>
          )}
          
          {!showCustomRange && filters.startDate && filters.endDate && (
            <div style={styles.selectedRange}>
              <span style={styles.rangeText}>
                {formatDateForDisplay(filters.startDate)} 00:00:00 - {formatDateForDisplay(filters.endDate)} 23:59:00
              </span>
            </div>
          )}
        </div>

        {/* Age and Gender Filters */}
        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Age</label>
            <select
              value={filters.ageGroup}
              onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Ages</option>
              <option value="<18">&lt; 18</option>
              <option value="18-40">18-40</option>
              <option value=">40">&gt; 40</option>
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartsContainer}>
        {/* Bar Chart - Total Clicks */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Total Clicks</h3>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                onClick={handleBarClick}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="display_name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Total Click Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Bar 
                  dataKey="total_clicks" 
                  fill="#4CAF50" 
                  cursor="pointer"
                  name="Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyState}>
              <p>No data available for the selected filters</p>
              <p style={styles.emptyStateSubtext}>Try adjusting your filters or run the seed script to populate data</p>
            </div>
          )}
        </div>

        {/* Line Chart - Clicks Daily */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>
            {filters.selectedFeature 
              ? `Clicks Daily - ${filters.selectedFeature.replace(/_/g, ' ')}` 
              : 'Clicks Daily (Click a bar to see feature details)'}
          </h3>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={lineChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Click Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="click_count" 
                  stroke="#2196F3" 
                  activeDot={{ r: 8 }}
                  name="Clicks"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyState}>
              <p>
                {filters.selectedFeature 
                  ? `No daily data available for ${filters.selectedFeature.replace(/_/g, ' ')}` 
                  : 'Click on a bar in the Total Clicks chart to see daily trends'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#333',
    margin: 0,
    fontSize: '24px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  username: {
    color: '#666',
    fontSize: '16px'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#d32f2f'
    }
  },
  filtersSection: {
    marginBottom: '20px'
  },
  filterCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '10px'
  },
  filterCardTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#666',
    fontWeight: '600'
  },
  presetButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  presetButton: {
    padding: '8px 16px',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#d0d0d0'
    }
  },
  customRangeContainer: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  },
  customRangeTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#666'
  },
  datePickerWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  datePicker: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1
  },
  dateSeparator: {
    color: '#666'
  },
  customRangeActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#757575'
    }
  },
  applyButton: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#388E3C'
    }
  },
  selectedRange: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#e8f5e8',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #4CAF50'
  },
  rangeText: {
    color: '#2E7D32'
  },
  filterRow: {
    display: 'flex',
    gap: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  filterLabel: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '600',
    minWidth: '60px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '120px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  chartsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '20px'
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    color: '#333'
  },
  emptyState: {
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    color: '#666',
    textAlign: 'center',
    padding: '20px'
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: '14px',
    marginTop: '10px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4CAF50',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;
