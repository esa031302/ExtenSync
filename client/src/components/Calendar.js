import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Dropdown, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Calendar.css';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

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
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const goToSpecificMonth = (month, year) => {
    setCurrentDate(new Date(year, month, 1));
    setShowMonthPicker(false);
  };

  const goToSpecificYear = (year) => {
    setCurrentDate(new Date(year, currentMonth, 1));
    setShowYearPicker(false);
  };

  // Generate recent months for quick navigation
  const getRecentMonths = () => {
    const recent = [];
    const today = new Date();
    
    // Add current month and 11 previous months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      recent.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: monthNames[date.getMonth()],
        isCurrent: i === 0
      });
    }
    
    return recent;
  };

  // Generate year options for quick navigation
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    // Add current year and 10 previous years
    for (let i = 0; i < 11; i++) {
      years.push(currentYear - i);
    }
    
    return years;
  };

  // Check if a date is today
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  // Check if a date is selected
  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentMonth === selectedDate.getMonth() && 
           currentYear === selectedDate.getFullYear();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayClasses = ['calendar-day'];
      
      if (isToday(day)) {
        dayClasses.push('today');
      }
      
      if (isSelected(day)) {
        dayClasses.push('selected');
      }
      
      days.push(
        <div 
          key={day} 
          className={dayClasses.join(' ')}
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
        >
          <span className="day-number">{day}</span>
        </div>
      );
    }
    
    return days;
  };

  // Format selected date for display
  const formatSelectedDate = () => {
    if (!selectedDate) return 'No date selected';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">Project Calendar</h3>
              <p className="text-muted mb-0">Schedule and track project events and milestones</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={goToToday}>
                <i className="bi bi-calendar-check me-2"></i>
                Today
              </Button>
              <Button variant="primary" disabled>
                <i className="bi bi-plus-lg me-2"></i>
                Add Event
              </Button>
            </div>
          </div>

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
                        <div className="year-picker-grid">
                          {getYearOptions().map(year => (
                            <Button
                              key={year}
                              variant="outline-secondary"
                              size="sm"
                              className="year-picker-btn"
                              onClick={() => goToSpecificYear(year)}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
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
              <div className="calendar-grid">
                {/* Day headers */}
                <div className="calendar-week-header">
                  {dayNames.map(day => (
                    <div key={day} className="calendar-day-header">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="calendar-days">
                  {generateCalendarDays()}
                </div>
              </div>

              {/* Selected Date Info */}
              {selectedDate && (
                <div className="calendar-footer">
                  <div className="selected-date-info">
                    <h6 className="mb-2">Selected Date</h6>
                    <p className="mb-2">{formatSelectedDate()}</p>
                    <div className="selected-date-actions">
                      <Button size="sm" variant="outline-secondary" disabled>
                        <i className="bi bi-plus me-1"></i>
                        Add Event
                      </Button>
                      <Button size="sm" variant="outline-secondary" disabled>
                        <i className="bi bi-list me-1"></i>
                        View Events
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Calendar;
