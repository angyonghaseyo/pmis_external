import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Schedule,
  ExpandMore,
  ExpandLess,
  InfoOutlined,
  LocalHospital,
  Pets,
  Security,
  Assessment,
  LocalShipping,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const getAgencyIcon = (agencyType) => {
  switch (agencyType) {
    case 'VETERINARY':
      return <LocalHospital />;
    case 'WELFARE':
      return <Pets />;
    case 'SECURITY':
      return <Security />;
    case 'CUSTOMS':
      return <Assessment />;
    case 'TRANSPORT':
      return <LocalShipping />;
    default:
      return <InfoOutlined />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    case 'IN_PROGRESS':
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle color="success" />;
    case 'REJECTED':
      return <Cancel color="error" />;
    case 'IN_PROGRESS':
      return <Schedule color="warning" />;
    default:
      return <Pending color="disabled" />;
  }
};

const DocumentStatus = ({ document, onExpand, expanded }) => {
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Not updated';
    
    // Handle different timestamp formats
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp._seconds !== undefined) {
      // Handle Firestore timestamp format
      date = new Date(timestamp._seconds * 1000);
    } else {
      return 'Invalid date';
    }

    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <ListItem
        button
        onClick={onExpand}
        sx={{
          borderLeft: 4,
          borderLeftColor: `${getStatusColor(document.status)}.main`,
        }}
      >
        <ListItemIcon>
          {getAgencyIcon(document.agencyType)}
        </ListItemIcon>
        <ListItemText
          primary={document.name}
          secondary={`Required by: ${document.agencyName}`}
        />
        <ListItemSecondaryAction>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              size="small"
              label={document.status}
              color={getStatusColor(document.status)}
              icon={getStatusIcon(document.status)}
            />
            <IconButton size="small" onClick={onExpand}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      <Collapse in={expanded} timeout="auto">
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                Last Updated: {getTimeAgo(document.lastUpdated)}
              </Typography>
            </Grid>
            {document.comments && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<InfoOutlined />}>
                  {document.comments}
                </Alert>
              </Grid>
            )}
            {document.documentUrl && (
              <Grid item xs={12}>
                <Typography variant="body2" color="primary">
                  Document URL: {document.documentUrl}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

const DocumentStatusTracker = ({ cargo }) => {
  const [expandedDoc, setExpandedDoc] = React.useState(null);

  const handleExpand = (docId) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

  if (!cargo?.documentStatus) {
    return (
      <Alert severity="info">
        No document status information available for this cargo.
      </Alert>
    );
  }

  const documentsArray = Object.entries(cargo.documentStatus).map(([id, doc]) => ({
    id,
    ...doc,
  }));

  const pendingDocs = documentsArray.filter(doc => doc.status === 'PENDING').length;
  const approvedDocs = documentsArray.filter(doc => doc.status === 'APPROVED').length;
  const rejectedDocs = documentsArray.filter(doc => doc.status === 'REJECTED').length;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Document Status Tracking
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="success.main">
              {approvedDocs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="warning.main">
              {pendingDocs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="error.main">
              {rejectedDocs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rejected
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <List>
        {documentsArray.map((doc) => (
          <DocumentStatus
            key={doc.id}
            document={doc}
            expanded={expandedDoc === doc.id}
            onExpand={() => handleExpand(doc.id)}
          />
        ))}
      </List>
    </Paper>
  );
};

export default DocumentStatusTracker;