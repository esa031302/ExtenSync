import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Dropdown, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Calendar.css';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState('all'); // Filter by event type

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get the first day of the month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to format time in 12-hour AM/PM format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      // Parse time string (HH:MM:SS or HH:MM format)
      const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
      
      // Create a date object for today with the specified time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      // Format to 12-hour AM/PM format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString; // Return original if formatting fails
    }
  };

  // Fetch events for current month
  useEffect(() => {
    fetchMonthEvents();
  }, [currentDate]);

  // Fetch events when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDateEvents();
    }
  }, [selectedDate]);

  const fetchMonthEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/calendar/events', {
        params: {
          month: currentMonth + 1, // API expects 1-based month
          year: currentYear
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateEvents = async () => {
    if (!selectedDate) return;
    
    try {
      // Use local date format to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const response = await axios.get(`/calendar/events/date/${dateString}`);
      setSelectedDateEvents(response.data);
    } catch (error) {
      console.error('Error fetching events for date:', error);
    }
  };

  // Check if a date has events (with filtering)
  const hasEvents = (day) => {
    // Use local date to avoid timezone issues
    const localDate = new Date(currentYear, currentMonth, day);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(localDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    const dayEvents = events.filter(event => event.start_date === dateString);
    

    
    if (eventFilter === 'all') return dayEvents.length > 0;
    return dayEvents.some(event => event.event_type.toLowerCase() === eventFilter);
  };

  // Get events for a specific day (with filtering)
  const getEventsForDay = (day) => {
    // Use local date to avoid timezone issues
    const localDate = new Date(currentYear, currentMonth, day);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(localDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    const dayEvents = events.filter(event => event.start_date === dateString);
    
    if (eventFilter === 'all') return dayEvents;
    return dayEvents.filter(event => event.event_type.toLowerCase() === eventFilter);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const goToSpecificMonth = (month, year) => {
    setCurrentDate(new Date(year, month, 1));
    setShowMonthPicker(false);
    setSelectedDate(null);
  };

  const goToSpecificYear = (year) => {
    setCurrentDate(new Date(year, currentMonth, 1));
    setShowYearPicker(false);
    setSelectedDate(null);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(clickedDate);
  };

  // Generate recent months for quick navigation
  const getRecentMonths = () => {
    const months = [];
    const today = new Date();
    
    // Add previous 6 months, current month, and next 6 months
    for (let i = -6; i <= 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: monthNames[date.getMonth()],
        isCurrent: date.getMonth() === currentMonth && date.getFullYear() === currentYear
      });
    }
    
    return months;
  };

  // Generate years for year picker
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 3; year <= currentYear + 3; year++) {
      years.push(year);
    }
    
    return years;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty">
          <div className="day-content"></div>
        </div>
      );
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      // Use local date comparison to avoid timezone issues
      const isToday = today.getFullYear() === currentYear && 
                     today.getMonth() === currentMonth && 
                     today.getDate() === day;
      
      // Use local date for selection comparison
      const year = dayDate.getFullYear();
      const month = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dayDate.getDate()).padStart(2, '0');
      const dayString = `${year}-${month}-${dayStr}`;
      
      const selectedDateString = selectedDate ? 
        `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : 
        null;
      const isSelected = selectedDate && dayString === selectedDateString;
      const dayHasEvents = hasEvents(day);
      const dayEvents = getEventsForDay(day);

      let dayClass = 'calendar-day';
      if (isToday) dayClass += ' today';
      if (isSelected) dayClass += ' selected';
      if (dayHasEvents) dayClass += ' has-events';

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(day)}
        >
          <div className="day-content">
            <span className="day-number">{day}</span>
            {dayEvents.length > 0 && (
              <div className="event-summaries">
                {dayEvents.slice(0, 2).map((event, index) => {
                  // Extract the base event type (remove _start/_end suffix)
                  const baseEventType = event.event_type.replace(/_start|_end/, '');
                  const isStart = event.event_type.includes('_start');
                  const isEnd = event.event_type.includes('_end');
                  
                  return (
                    <div
                      key={index}
                      className={`event-summary ${event.event_type.toLowerCase()}`}
                      title={`${event.title}${event.location ? ` at ${event.location}` : ''}`}
                    >
                      <div className="event-type-badge">
                        {baseEventType.charAt(0).toUpperCase() + baseEventType.slice(1)}
                        {isStart && ' (Start)'}
                        {isEnd && ' (End)'}
                      </div>
                      <div className="event-title-text">{event.title}</div>
                      {event.location && (
                        <div className="event-location-text">📍 {event.location}</div>
                      )}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="event-summary more-events">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <Container fluid>
        <Row>
          <Col>
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="text-dark mb-0">Project Calendar</h2>
                <p className="text-muted mb-0">Schedule and track project events and milestones</p>
              </div>
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    <i className="bi bi-funnel me-2"></i>
                    {eventFilter === 'all' ? 'All Events' : eventFilter.charAt(0).toUpperCase() + eventFilter.slice(1)}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setEventFilter('all')}>
                      All Events
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setEventFilter('project')}>
                      Projects Only
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setEventFilter('program')}>
                      Programs Only
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setEventFilter('activity')}>
                      Activities Only
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button variant="primary" size="sm" onClick={goToToday}>
                  <i className="bi bi-calendar-today me-2"></i>
                  Today
                </Button>
              </div>
            </div>

            {/* Calendar Card */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                {/* Calendar Header */}
                <div className="calendar-header">
                  <div className="calendar-navigation">
                    <Button 
                      variant="link" 
                      className="nav-button"
                      onClick={goToPreviousMonth}
                      title="Previous Month"
                    >
                      <i className="bi bi-chevron-left"></i>
                    </Button>
                    
                    <div className="date-selectors">
                      <Dropdown show={showMonthPicker} onToggle={setShowMonthPicker}>
                        <Dropdown.Toggle as={Button} variant="link" className="date-picker-button month-picker">
                          {monthNames[currentMonth]}
                          <i className="bi bi-chevron-down ms-2"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="month-picker-menu">
                          <Dropdown.Header>Select Month</Dropdown.Header>
                          <Dropdown.Divider />
                          {getRecentMonths().map((item, index) => (
                            <Dropdown.Item 
                              key={`${item.year}-${item.month}`}
                              onClick={() => goToSpecificMonth(item.month, item.year)}
                              className={item.isCurrent ? 'current-month' : ''}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{item.name} {item.year}</span>
                                {item.isCurrent && <Badge bg="primary" size="sm">Current</Badge>}
                              </div>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>

                      <Dropdown show={showYearPicker} onToggle={setShowYearPicker}>
                        <Dropdown.Toggle as={Button} variant="link" className="date-picker-button year-picker">
                          {currentYear}
                          <i className="bi bi-chevron-down ms-2"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="year-picker-menu">
                          <Dropdown.Header>Select Year</Dropdown.Header>
                          <Dropdown.Divider />
                          {getYearOptions().map((year) => (
                            <Dropdown.Item 
                              key={year}
                              onClick={() => goToSpecificYear(year)}
                              className={year === currentYear ? 'current-year' : ''}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>{year}</span>
                                {year === currentYear && <Badge bg="primary" size="sm">Current</Badge>}
                              </div>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    
                    <Button 
                      variant="link" 
                      className="nav-button"
                      onClick={goToNextMonth}
                      title="Next Month"
                    >
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-container">
                  {loading && (
                    <div className="calendar-loading">
                      <i className="bi bi-hourglass-split me-2"></i>
                      Loading events...
                    </div>
                  )}
                  
                  {/* Day headers */}
                  <div className="calendar-days-header">
                    {dayNamesShort.map(day => (
                      <div key={day} className="day-header">{day}</div>
                    ))}
                  </div>
                  
                  {/* Calendar days grid */}
                  <div className="calendar-grid">
                    {generateCalendarDays()}
                  </div>
                </div>

                {/* Selected Date Info */}
                {selectedDate && (
                  <div className="calendar-footer">
                    <div className="selected-date-info">
                      <h6>
                        <i className="bi bi-calendar-event me-2"></i>
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h6>
                      
                      {selectedDateEvents.length > 0 ? (
                        <div className="selected-date-events">
                          {selectedDateEvents.map((event) => (
                            <div key={event.event_id} className="event-item mb-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="event-title mb-1">{event.title}</h6>
                                  <div className="event-meta">
                                    <Badge bg="success" className="me-2">
                                      <i className="bi bi-diagram-3 me-1"></i>
                                      {event.event_type.replace(/_start|_end/g, '').charAt(0).toUpperCase() + event.event_type.replace(/_start|_end/g, '').slice(1)}
                                    </Badge>
                                    {event.location && (
                                      <span className="text-muted me-3">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        {event.location}
                                      </span>
                                    )}
                                    {event.start_time && (
                                      <span className="text-muted me-3">
                                        <i className="bi bi-clock me-1"></i>
                                        {formatTime(event.start_time)}
                                        {event.end_time && event.end_time !== event.start_time && ` - ${formatTime(event.end_time)}`}
                                      </span>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="event-description text-muted mt-1 mb-0">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.coordinator_name && (
                                    <small className="text-muted">
                                      <i className="bi bi-person me-1"></i>
                                      Coordinator: {event.coordinator_name}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-events text-muted text-center py-4">
                          <i className="bi bi-calendar-x display-6"></i>
                          <p className="mb-0 mt-2">No events scheduled for this date</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Calendar;
