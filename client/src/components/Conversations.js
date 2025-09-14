import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button, Badge, Modal, Alert } from 'react-bootstrap';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Conversations.css';

const Conversations = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [newConversationData, setNewConversationData] = useState({
    conversationName: '',
    conversationType: 'direct'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to conversation server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from conversation server');
      });

      newSocket.on('new_message', (message) => {
        // Normalize isOwn to be safe across message types
        const normalized = { ...message, isOwn: message.isOwn ?? (message.sender_id === user?.user_id) };
        setMessages(prev => [...prev, normalized]);
      });

      newSocket.on('message_sent', (message) => {
        const normalized = { ...message, isOwn: true };
        setMessages(prev => [...prev, normalized]);
      });

      newSocket.on('user_typing', (data) => {
        if (data.conversationId === selectedConversation?.conversation_id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId);
            return [...filtered, { userId: data.userId, userName: data.userName }];
          });
        }
      });

      newSocket.on('user_stop_typing', (data) => {
        if (data.conversationId === selectedConversation?.conversation_id) {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
      socket?.emit('join_conversation', selectedConversation.conversation_id);
      // Optimistically clear unread count locally when viewing
      setConversations(prev => prev.map(c => 
        c.conversation_id === selectedConversation.conversation_id
          ? { ...c, unread_count: 0 }
          : c
      ));
    }
  }, [selectedConversation, socket]);

  const loadConversations = async () => {
    try {
      const response = await axios.get('/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]);
      }
      setLoading(false);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/conversations/${conversationId}/messages`);
      // Ensure isOwn is set for all loaded messages (text/images)
      const normalized = response.data.map(m => ({
        ...m,
        isOwn: m.sender_id === user?.user_id
      }));
      setMessages(normalized);
      // Clear unread count locally once messages are fetched
      setConversations(prev => prev.map(c => 
        c.conversation_id === conversationId
          ? { ...c, unread_count: 0 }
          : c
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterDepartment) params.department = filterDepartment;
      
      const response = await axios.get('/conversations/users/available', { params });
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error loading available users:', error);
      setError('Failed to load available users');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedConversation && socket) {
      socket.emit('send_message', {
        conversationId: selectedConversation.conversation_id,
        content: newMessage.trim()
      });
      setNewMessage('');
      setIsTyping(false);
      socket.emit('typing_stop', selectedConversation.conversation_id);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      socket?.emit('typing_start', selectedConversation.conversation_id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing_stop', selectedConversation.conversation_id);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Removed auto-scroll helpers and jump button

  const createConversation = async () => {
    try {
      const response = await axios.post('/conversations', {
        ...newConversationData,
        participants: selectedUsers
      });
      setConversations(prev => [response.data, ...prev]);
      setSelectedConversation(response.data);
      setShowCreateConversation(false);
      setShowUserSelection(false);
      setNewConversationData({ conversationName: '', conversationType: 'direct' });
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation');
    }
  };

  const handleUserSelection = (user) => {
    if (selectedUsers.find(u => u.userId === user.user_id)) {
      setSelectedUsers(prev => prev.filter(u => u.userId !== user.user_id));
    } else {
      setSelectedUsers(prev => [...prev, { userId: user.user_id, role: 'member' }]);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationDisplayName = (conversation) => {
    if (conversation.conversation_name) {
      return conversation.conversation_name;
    }
    if (conversation.conversation_type === 'direct' && conversation.participants_names) {
      return conversation.participants_names;
    }
    return `Conversation ${conversation.conversation_id}`;
  };

  // Build absolute URL for user photos coming from API (which may be relative)
  const apiHost = (axios.defaults.baseURL && axios.defaults.baseURL.replace(/\/?api\/?$/, '')) || 'http://localhost:5000';
  const getPhotoUrl = (photoPath) => {
    // Use the same default fallback as the dashboard profile (bootstrap icon)
    // Here we return a tiny data URL transparent png so <img> renders, and we style it as a circle with an icon background via CSS if desired.
    if (!photoPath) return `${apiHost}/uploads/default-avatar.png`;
    // If already absolute
    if (/^https?:\/\//i.test(photoPath)) return photoPath;
    // Ensure leading slash
    const normalized = photoPath.startsWith('/') ? photoPath : `/uploads/${photoPath}`;
    return `${apiHost}${normalized}`;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        {/* Conversations Sidebar */}
        <Col md={3}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Conversations</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowCreateConversation(true)}
              >
                <i className="bi bi-plus"></i>
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {conversations.length > 0 ? (
                <ListGroup variant="flush">
                  {conversations.map(conversation => (
                    <ListGroup.Item
                      key={conversation.conversation_id}
                      action
                      active={selectedConversation?.conversation_id === conversation.conversation_id}
                      onClick={() => setSelectedConversation(conversation)}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div className="flex-grow-1 d-flex align-items-center">
                        <div className="me-2 d-flex">
                          {(() => {
                            const raw = (conversation.participants_photos ? conversation.participants_photos.split(',') : []).slice(0, 2);
                            const photos = raw.length > 0 ? raw : [''];
                            return photos.map((photo, idx) => (
                              photo ? (
                                <img
                                  key={`img-${idx}`}
                                  src={getPhotoUrl(photo)}
                                  alt="avatar"
                                  style={{ width: 24, height: 24, borderRadius: '50%', marginLeft: idx ? -8 : 0, objectFit: 'cover', border: '2px solid #fff' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <div
                                  key={`ph-${idx}`}
                                  style={{ width: 24, height: 24, borderRadius: '50%', marginLeft: idx ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9ecef', border: '2px solid #fff' }}
                                >
                                  <i className="bi bi-person-fill" style={{ fontSize: 16, color: '#6c757d' }}></i>
                                </div>
                              )
                            ));
                          })()}
                        </div>
                        <div className="w-100">
                          <div className="fw-bold d-flex justify-content-between">
                            <span>{getConversationDisplayName(conversation)}</span>
                            {conversation.last_message_created_at && (
                              <small className="text-muted ms-2">
                                {formatTime(conversation.last_message_created_at)}
                              </small>
                            )}
                          </div>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: '100%' }}>
                            {conversation.last_message_type === 'file' || conversation.last_message_type === 'image'
                              ? '[Attachment]'
                              : (conversation.last_message_content || 'No messages yet')}
                          </small>
                        </div>
                      </div>
                      {conversation.unread_count > 0 && (
                        <Badge bg="danger" className="ms-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-dots" style={{ fontSize: '2rem' }}></i>
                  <p className="mt-2 mb-0">No conversations yet</p>
                  <small>Click the + button to create your first conversation</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Messages */}
        <Col md={9}>
          <Card>
            <Card.Header>
              {selectedConversation ? (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{getConversationDisplayName(selectedConversation)}</h5>
                    <small className="text-muted">
                      {selectedConversation.conversation_type === 'direct' ? 'Direct Message' : 'Group Conversation'}
                    </small>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">
                      {selectedConversation.message_count} messages
                    </small>
                  </div>
                </div>
              ) : (
                <h5 className="mb-0">Select a conversation</h5>
              )}
            </Card.Header>
            
            {selectedConversation ? (
              <>
                <Card.Body className="conversation-messages" style={{ height: '400px', overflowY: 'auto' }}>
                  {messages.map((message, index) => (
                    <div key={message.message_id} className={`message ${message.isOwn ? 'own-message' : ''}`}>
                      <div className="message-header">
                        <span className="message-sender">{message.sender_name}</span>
                        <span className="message-time">{formatTime(message.created_at)}</span>
                      </div>
                      <div className="message-content">
                        {message.content}
                        {Boolean(message.is_edited) && (
                          <small className="text-muted ms-2">(edited)</small>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                      <em>{typingUsers.map(u => u.userName).join(', ')} is typing...</em>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </Card.Body>


                <Card.Footer>
                  <Form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        className="me-2"
                      />
                      <Button type="submit" variant="primary">
                        Send
                      </Button>
                    </div>
                  </Form>
                </Card.Footer>
              </>
            ) : (
              <Card.Body className="text-center text-muted">
                <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Select a conversation to start messaging</p>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create Conversation Modal */}
      <Modal show={showCreateConversation} onHide={() => setShowCreateConversation(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Conversation Name (optional for direct messages)</Form.Label>
              <Form.Control
                type="text"
                value={newConversationData.conversationName}
                onChange={(e) => setNewConversationData(prev => ({ ...prev, conversationName: e.target.value }))}
                placeholder="Enter conversation name"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Conversation Type</Form.Label>
              <Form.Select
                value={newConversationData.conversationType}
                onChange={(e) => setNewConversationData(prev => ({ ...prev, conversationType: e.target.value }))}
              >
                <option value="direct">Direct Message</option>
                <option value="group">Group Conversation</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Participants</Form.Label>
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  loadAvailableUsers();
                  setShowUserSelection(true);
                }}
                className="w-100"
              >
                {selectedUsers.length > 0 
                  ? `${selectedUsers.length} user(s) selected` 
                  : 'Click to select users'}
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateConversation(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={createConversation}
            disabled={selectedUsers.length === 0}
          >
            Create Conversation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Selection Modal */}
      <Modal show={showUserSelection} onHide={() => setShowUserSelection(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Role</Form.Label>
                <Form.Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Extension Coordinator">Extension Coordinator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Team Member">Team Member</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Department</Form.Label>
                <Form.Select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Button 
            variant="outline-primary" 
            onClick={loadAvailableUsers}
            className="mb-3"
          >
            Apply Filters
          </Button>

          <ListGroup>
            {availableUsers
              .filter(u => u.user_id !== user?.user_id) // Exclude current user
              .map(user => (
                <ListGroup.Item
                  key={user.user_id}
                  action
                  active={selectedUsers.find(u => u.userId === user.user_id)}
                  onClick={() => handleUserSelection(user)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-bold">{user.fullname}</div>
                    <small className="text-muted">
                      {user.role} • {user.department}
                    </small>
                  </div>
                  {selectedUsers.find(u => u.userId === user.user_id) && (
                    <i className="bi bi-check-circle-fill text-success"></i>
                  )}
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserSelection(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default Conversations;
