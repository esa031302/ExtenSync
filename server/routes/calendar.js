const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const auth = require('../middleware/auth');
const { logSystemActivity } = require('../middleware/logger');
const promisePool = require('../config/database').promise;

// @route   GET /api/calendar/events
// @desc    Get calendar events (filtered by user role)
// @access  Private
router.get('/events', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    const { month, year } = req.query;
    
    console.log(`📅 Calendar API called by ${requester.role} (ID: ${requester.id}) for ${month}/${year}`);
    
    connection = await promisePool.getConnection();
    
    // Get approved, on-going, and completed projects and generate events for each day in the duration
    let baseQuery = `
      SELECT 
        p.project_id,
        p.title,
        p.location,
        p.start_date,
        p.end_date,
        p.start_time,
        p.end_time,
        p.initiative_type as event_type,
        p.status as project_status,
        p.date_submitted as created_at,
        p.title as project_title,
        p.coordinator_id,
        u.fullname as coordinator_name
      FROM projects p
      JOIN users u ON p.coordinator_id = u.user_id
      WHERE p.status IN ('Approved', 'On-Going', 'Completed') AND p.start_date IS NOT NULL
    `;
    
    const params = [];
    
    // Add conditions for role-based access and date filtering
    if (requester.role === 'Extension Coordinator') {
      baseQuery += ' AND p.coordinator_id = ?';
      params.push(requester.id);
    }
    
    if (month && year) {
      // Filter projects that overlap with the requested month
      // Get first and last day of the requested month
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-31`; // Using 31 to cover all possible last days
      
      baseQuery += ` AND (
        (p.start_date <= ? AND COALESCE(p.end_date, p.start_date) >= ?)
      )`;
      params.push(lastDay, firstDay);
      
      console.log(`📅 Filtering for month ${month}/${year}: ${firstDay} to ${lastDay}`);
    }
    
    console.log(`📅 Executing query: ${baseQuery}`);
    console.log(`📅 With params:`, params);
    
    const [projects] = await connection.execute(baseQuery, params);
    
    console.log(`📅 Found ${projects.length} approved projects:`, projects.map(p => ({
      id: p.project_id,
      title: p.title,
      start: p.start_date,
      end: p.end_date,
      status: p.status
    })));
    
    // Generate events for each day of each project's duration
    const events = [];
    
    projects.forEach(project => {
      try {
        // Convert date objects to YYYY-MM-DD strings (using local time, not UTC)
        const startDateStr = project.start_date instanceof Date 
          ? `${project.start_date.getFullYear()}-${String(project.start_date.getMonth() + 1).padStart(2, '0')}-${String(project.start_date.getDate()).padStart(2, '0')}`
          : project.start_date;
      const endDateStr = project.end_date 
        ? (project.end_date instanceof Date 
           ? `${project.end_date.getFullYear()}-${String(project.end_date.getMonth() + 1).padStart(2, '0')}-${String(project.end_date.getDate()).padStart(2, '0')}`
           : project.end_date)
        : startDateStr;
      
      // Convert to Date objects for comparison
      const startDate = new Date(startDateStr + 'T00:00:00');
      const endDate = new Date(endDateStr + 'T00:00:00');
      

      
          // Generate events only for start and end dates
    const totalTimeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(totalTimeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    // Create event for start date
    let startEventTitle = project.title;
    let startEventDescription = project.title;
    
    if (project.project_status === 'Approved') {
      // Approved projects - show as planned
      if (startDateStr !== endDateStr) {
        startEventTitle += ' (Planned Start)';
        startEventDescription += ` - Planned Project Start (${totalDays} days planned)`;
      } else {
        startEventTitle += ' (Planned)';
        startEventDescription += ' - Planned Project Event';
      }
    } else if (project.project_status === 'On-Going') {
      // On-going projects - show day counting
      if (startDateStr !== endDateStr) {
        startEventTitle += ' (Start)';
        startEventDescription += ` - Project Start (Day 1 of ${totalDays})`;
      } else {
        startEventDescription += ' - Project Event';
      }
    } else if (project.project_status === 'Completed') {
      // Completed projects - show as completed
      if (startDateStr !== endDateStr) {
        startEventTitle += ' (Started)';
        startEventDescription += ` - Project Started (Completed - ${totalDays} days)`;
      } else {
        startEventTitle += ' (Completed)';
        startEventDescription += ' - Project Event (Completed)';
      }
    }
    
            events.push({
        project_id: project.project_id,
        event_id: `${project.project_id}_${startDateStr}`,
        title: startEventTitle,
        location: project.location,
        start_date: startDateStr,
        end_date: project.end_date,
        start_time: project.start_time,
        end_time: project.end_time,
        description: startEventDescription,
        event_type: (project.event_type || 'Project').toLowerCase() + '_start',
        status: project.project_status,
        created_at: project.created_at,
        project_title: project.project_title,
        coordinator_id: project.coordinator_id,
        coordinator_name: project.coordinator_name
      });
    
    // Create event for end date (only if different from start date)
    if (startDateStr !== endDateStr) {
      let endEventTitle = project.title;
      let endEventDescription = project.title;
      
      if (project.project_status === 'Approved') {
        endEventTitle += ' (Planned End)';
        endEventDescription += ` - Planned Project End (${totalDays} days planned)`;
      } else if (project.project_status === 'On-Going') {
        endEventTitle += ' (End)';
        endEventDescription += ` - Project End (Day ${totalDays} of ${totalDays})`;
      } else if (project.project_status === 'Completed') {
        endEventTitle += ' (Completed)';
        endEventDescription += ` - Project Completed (${totalDays} days)`;
      }
      
              events.push({
        project_id: project.project_id,
        event_id: `${project.project_id}_${endDateStr}`,
        title: endEventTitle,
        location: project.location,
        start_date: endDateStr,
        end_date: project.end_date,
        start_time: project.start_time,
        end_time: project.end_time,
        description: endEventDescription,
        event_type: (project.event_type || 'Project').toLowerCase() + '_end',
        status: project.project_status,
        created_at: project.created_at,
        project_title: project.project_title,
        coordinator_id: project.coordinator_id,
        coordinator_name: project.coordinator_name
      });
    }
      
      } catch (error) {
        console.error(`❌ Error processing project "${project.title}":`, error);
      }
    });
    
    // Sort events by date
    events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    console.log(`📅 Generated ${events.length} events for ${projects.length} projects for ${month}/${year}`);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  } finally {
    if (connection) connection.release();
  }
});

// @route   GET /api/calendar/events/date/:date
// @desc    Get events for a specific date
// @access  Private
router.get('/events/date/:date', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    const { date } = req.params;
    
    console.log(`📅 Date-specific API called by ${requester.role} (ID: ${requester.id}) for date: ${date}`);
    
    connection = await promisePool.getConnection();
    
    // Get approved, on-going, and completed projects that include the specified date in their duration
    let baseQuery = `
      SELECT 
        p.project_id,
        p.title,
        p.location,
        p.start_date,
        p.end_date,
        p.start_time,
        p.end_time,
        p.initiative_type as event_type,
        p.status as project_status,
        p.title as project_title,
        p.coordinator_id,
        u.fullname as coordinator_name
      FROM projects p
      JOIN users u ON p.coordinator_id = u.user_id
      WHERE p.status IN ('Approved', 'On-Going', 'Completed') AND p.start_date IS NOT NULL 
        AND p.start_date <= ? AND COALESCE(p.end_date, p.start_date) >= ?
    `;
    
    const params = [date, date];
    
    // Add role-based filtering
    if (requester.role === 'Extension Coordinator') {
      baseQuery += ' AND p.coordinator_id = ?';
      params.push(requester.id);
    }
    
    const [projects] = await connection.execute(baseQuery, params);
    
    // Generate events for the specified date
    const events = [];
    
    projects.forEach(project => {
      // Convert date objects to YYYY-MM-DD strings (using local time, not UTC)
      const startDateStr = project.start_date instanceof Date 
        ? `${project.start_date.getFullYear()}-${String(project.start_date.getMonth() + 1).padStart(2, '0')}-${String(project.start_date.getDate()).padStart(2, '0')}`
        : project.start_date;
      const endDateStr = project.end_date 
        ? (project.end_date instanceof Date 
           ? `${project.end_date.getFullYear()}-${String(project.end_date.getMonth() + 1).padStart(2, '0')}-${String(project.end_date.getDate()).padStart(2, '0')}`
           : project.end_date)
        : startDateStr;
      
      const startDate = new Date(startDateStr + 'T00:00:00');
      const endDate = new Date(endDateStr + 'T00:00:00');
      const queryDate = new Date(date + 'T00:00:00');
      
      // Calculate project duration info
      const totalTimeDiff = endDate.getTime() - startDate.getTime();
      const totalDays = Math.floor(totalTimeDiff / (1000 * 60 * 60 * 24)) + 1;
      const isStartDate = date === startDateStr;
      const isEndDate = date === endDateStr;
      
      // Only create events for start and end dates
      if (isStartDate || isEndDate) {
        let eventTitle = project.title;
        let eventDescription = project.title;
        let eventType = (project.event_type || 'Project').toLowerCase();
        
        if (startDateStr !== endDateStr) {
          // Multi-day project
          if (isStartDate) {
            if (project.project_status === 'Approved') {
              eventTitle += ' (Planned Start)';
              eventDescription += ` - Planned Project Start (${totalDays} days planned)`;
            } else if (project.project_status === 'On-Going') {
              eventTitle += ' (Start)';
              eventDescription += ` - Project Start (Day 1 of ${totalDays})`;
            } else if (project.project_status === 'Completed') {
              eventTitle += ' (Started)';
              eventDescription += ` - Project Started (Completed - ${totalDays} days)`;
            }
            eventType += '_start';
          } else if (isEndDate) {
            if (project.project_status === 'Approved') {
              eventTitle += ' (Planned End)';
              eventDescription += ` - Planned Project End (${totalDays} days planned)`;
            } else if (project.project_status === 'On-Going') {
              eventTitle += ' (End)';
              eventDescription += ` - Project End (Day ${totalDays} of ${totalDays})`;
            } else if (project.project_status === 'Completed') {
              eventTitle += ' (Completed)';
              eventDescription += ` - Project Completed (${totalDays} days)`;
            }
            eventType += '_end';
          }
        } else {
          // Single day project
          if (project.project_status === 'Approved') {
            eventTitle += ' (Planned)';
            eventDescription += ' - Planned Project Event';
          } else if (project.project_status === 'On-Going') {
            eventDescription += ' - Project Event';
          } else if (project.project_status === 'Completed') {
            eventTitle += ' (Completed)';
            eventDescription += ' - Project Event (Completed)';
          }
          eventType += '_start';
        }
        
        events.push({
          project_id: project.project_id,
          event_id: `${project.project_id}_${date}`,
          title: eventTitle,
          location: project.location,
          start_date: date,
          end_date: project.end_date,
          start_time: project.start_time,
          end_time: project.end_time,
          description: eventDescription,
          event_type: eventType,
          status: project.project_status,
          project_title: project.project_title,
          coordinator_id: project.coordinator_id,
          coordinator_name: project.coordinator_name
        });
      }
    });
    
    // Sort by start time
    events.sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0;
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
    
    console.log(`📅 Found ${events.length} events for date ${date}:`, events);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for date' });
  } finally {
    if (connection) connection.release();
  }
});

// @route   POST /api/calendar/events
// @desc    Create a calendar event from an approved project
// @access  Private (System use only - called when projects are approved)
router.post('/events', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    const { 
      project_id, 
      title, 
      location, 
      start_date, 
      end_date, 
      start_time, 
      end_time, 
      description, 
      event_type 
    } = req.body;
    
    // Validate required fields
    if (!project_id || !title || !start_date) {
      return res.status(400).json({ error: 'Missing required fields: project_id, title, start_date' });
    }
    
    connection = await promisePool.getConnection();
    
    // Check if project exists and user has permission
    const [projects] = await connection.execute(
      'SELECT * FROM projects WHERE project_id = ?',
      [project_id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projects[0];
    
    // Extension Coordinators can only create events for their own projects
    if (requester.role === 'Extension Coordinator' && project.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied. You can only create events for your own projects.' });
    }
    
    // Only create events for approved projects
    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Can only create calendar events for approved projects' });
    }
    
    // Insert calendar event
    const [result] = await connection.execute(
      `INSERT INTO calendar_events 
       (project_id, title, location, start_date, end_date, start_time, end_time, description, event_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, title, location, start_date, end_date || null, start_time || null, end_time || null, description || '', event_type || 'Project']
    );
    
    // Get the created event
    const [newEvent] = await connection.execute(
      `SELECT 
        ce.event_id,
        ce.project_id,
        ce.title,
        ce.location,
        ce.start_date,
        ce.end_date,
        ce.start_time,
        ce.end_time,
        ce.description,
        ce.event_type,
        ce.status,
        ce.created_at,
        p.title as project_title,
        u.fullname as coordinator_name
      FROM calendar_events ce
      JOIN projects p ON ce.project_id = p.project_id
      JOIN users u ON p.coordinator_id = u.user_id
      WHERE ce.event_id = ?`,
      [result.insertId]
    );
    
    console.log(`Calendar event created: ${result.insertId} for project: ${project_id}`);
    res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  } finally {
    if (connection) connection.release();
  }
});

// @route   PUT /api/calendar/events/:id
// @desc    Update a calendar event
// @access  Private (Extension Coordinators can update their own project events)
router.put('/events/:id', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    const { id } = req.params;
    const { 
      title, 
      location, 
      start_date, 
      end_date, 
      start_time, 
      end_time, 
      description, 
      status 
    } = req.body;
    
    connection = await promisePool.getConnection();
    
    // Check if event exists and get project info
    const [events] = await connection.execute(
      `SELECT ce.*, p.coordinator_id 
       FROM calendar_events ce
       JOIN projects p ON ce.project_id = p.project_id
       WHERE ce.event_id = ?`,
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    
    const event = events[0];
    
    // Extension Coordinators can only update events for their own projects
    if (requester.role === 'Extension Coordinator' && event.coordinator_id !== requester.id) {
      return res.status(403).json({ error: 'Access denied. You can only update events for your own projects.' });
    }
    
    // Update event
    await connection.execute(
      `UPDATE calendar_events 
       SET title = ?, location = ?, start_date = ?, end_date = ?, 
           start_time = ?, end_time = ?, description = ?, status = ?
       WHERE event_id = ?`,
      [
        title || event.title,
        location || event.location,
        start_date || event.start_date,
        end_date,
        start_time,
        end_time,
        description || event.description,
        status || event.status,
        id
      ]
    );
    
    // Get updated event
    const [updatedEvent] = await connection.execute(
      `SELECT 
        ce.event_id,
        ce.project_id,
        ce.title,
        ce.location,
        ce.start_date,
        ce.end_date,
        ce.start_time,
        ce.end_time,
        ce.description,
        ce.event_type,
        ce.status,
        ce.created_at,
        p.title as project_title,
        u.fullname as coordinator_name
      FROM calendar_events ce
      JOIN projects p ON ce.project_id = p.project_id
      JOIN users u ON p.coordinator_id = u.user_id
      WHERE ce.event_id = ?`,
      [id]
    );
    
    console.log(`Calendar event updated: ${id} by user: ${requester.id}`);
    res.json(updatedEvent[0]);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  } finally {
    if (connection) connection.release();
  }
});

// @route   DELETE /api/calendar/events/:id
// @desc    Delete a calendar event
// @access  Private (Admin only)
router.delete('/events/:id', auth, async (req, res) => {
  let connection;
  try {
    const requester = req.user.user;
    const { id } = req.params;
    
    // Only admins can delete calendar events
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can delete calendar events' });
    }
    
    connection = await promisePool.getConnection();
    
    // Check if event exists
    const [events] = await connection.execute(
      'SELECT event_id FROM calendar_events WHERE event_id = ?',
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    
    // Delete event
    await connection.execute('DELETE FROM calendar_events WHERE event_id = ?', [id]);
    
    console.log(`Calendar event deleted: ${id} by admin: ${requester.id}`);
    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
