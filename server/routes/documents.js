const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/database');
const { logActions } = require('../middleware/logger');

// Create documents directory if it doesn't exist
const documentsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all documents
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        d.id,
        d.filename,
        d.original_filename,
        d.file_size,
        d.file_path,
        d.uploaded_at,
        u.fullname as uploaded_by
      FROM documents d
      JOIN users u ON d.uploaded_by = u.user_id
      ORDER BY d.uploaded_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching documents:', err);
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error in documents route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload a new document (Admin only)
router.post('/upload', auth, upload.single('document'), logActions.uploadDocument, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only administrators can upload documents.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, size, path: filePath } = req.file;

    const query = `
      INSERT INTO documents (filename, original_filename, file_size, file_path, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [filename, originalname, size, filename, req.user.user.id], (err, result) => {
      if (err) {
        console.error('Error saving document to database:', err);
        // Delete uploaded file if database save fails
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: 'Failed to save document' });
      }

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: {
          id: result.insertId,
          filename: originalname,
          file_size: size,
          uploaded_at: new Date()
        }
      });
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download a document
router.get('/:id/download', auth, async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('Download request for document ID:', documentId);
    console.log('User from token:', req.user?.user?.fullname, 'Role:', req.user?.user?.role);

    const query = 'SELECT * FROM documents WHERE id = ?';
    
    db.query(query, [documentId], (err, results) => {
      if (err) {
        console.error('Error fetching document:', err);
        return res.status(500).json({ error: 'Failed to fetch document' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = results[0];
      
      // Handle both old records (with full paths) and new records (with relative paths)
      let filePath;
      if (path.isAbsolute(document.file_path)) {
        // Old record with absolute path
        filePath = document.file_path;
      } else {
        // New record with relative path or just filename
        filePath = path.join(__dirname, '..', 'uploads', 'documents', document.filename);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('File not found at path:', filePath);
        console.error('Document file_path from DB:', document.file_path);
        console.error('Document filename from DB:', document.filename);
        return res.status(404).json({ error: 'File not found on server' });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
      res.setHeader('Content-Length', document.file_size);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (streamError) => {
        console.error('File stream error:', streamError);
        res.status(500).json({ error: 'File stream error' });
      });
      fileStream.pipe(res);
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a document (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only administrators can delete documents.' });
    }

    const documentId = req.params.id;

    // First, get the document details
    const getQuery = 'SELECT * FROM documents WHERE id = ?';
    
    db.query(getQuery, [documentId], (err, results) => {
      if (err) {
        console.error('Error fetching document for deletion:', err);
        return res.status(500).json({ error: 'Failed to fetch document' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const document = results[0];
      
      // Handle both old records (with full paths) and new records (with relative paths)
      let filePath;
      if (path.isAbsolute(document.file_path)) {
        // Old record with absolute path
        filePath = document.file_path;
      } else {
        // New record with relative path or just filename
        filePath = path.join(__dirname, '..', 'uploads', 'documents', document.filename);
      }

      // Delete from database
      const deleteQuery = 'DELETE FROM documents WHERE id = ?';
      
      db.query(deleteQuery, [documentId], (err, result) => {
        if (err) {
          console.error('Error deleting document from database:', err);
          return res.status(500).json({ error: 'Failed to delete document' });
        }

        // Delete file from filesystem
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.json({ message: 'Document deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
