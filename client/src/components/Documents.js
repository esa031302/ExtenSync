import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Form, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Documents.css';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/documents');
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('document', selectedFile);

      await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Document uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await axios.delete(`/documents/${documentToDelete.id}`);
      setSuccess('Document deleted successfully');
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="documents-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Documents</h2>
        {isAdmin && (
          <Button 
            variant="primary" 
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-upload"></i>
            Upload Document
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Body>
          {documents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-text display-1 text-muted"></i>
              <p className="mt-3 text-muted">No documents available</p>
            </div>
          ) : (
            <Table responsive hover>
                             <thead>
                 <tr>
                   <th>Document Name</th>
                   <th>File Size</th>
                   <th>Uploaded By</th>
                   <th>Date Uploaded</th>
                   <th style={{ width: 120 }}>Actions</th>
                 </tr>
               </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-text text-primary"></i>
                        <span className="fw-medium">{doc.filename}</span>
                      </div>
                    </td>
                    <td>{formatFileSize(doc.file_size)}</td>
                    <td>{doc.uploaded_by}</td>
                    <td>{formatDate(doc.uploaded_at)}</td>
                                         <td>
                       <div className="d-flex gap-2">
                         <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-download-${doc.id}`}>Download</Tooltip>}>
                           <Button
                             onClick={() => handleDownload(doc)}
                             variant="link"
                             className="icon-only-btn icon-download"
                             aria-label="Download document"
                           >
                             <i className="bi bi-download"></i>
                           </Button>
                         </OverlayTrigger>
                         {isAdmin && (
                           <OverlayTrigger placement="bottom" overlay={<Tooltip id={`tt-delete-${doc.id}`}>Delete</Tooltip>}>
                             <Button
                               onClick={() => {
                                 setDocumentToDelete(doc);
                                 setShowDeleteModal(true);
                               }}
                               variant="link"
                               className="icon-only-btn icon-delete"
                               aria-label="Delete document"
                             >
                               <i className="bi bi-trash"></i>
                             </Button>
                           </OverlayTrigger>
                         )}
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              <Form.Text className="text-muted">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{documentToDelete?.original_filename}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Documents;
