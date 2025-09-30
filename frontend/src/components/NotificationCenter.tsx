import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Gavel,
  Assignment,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Clear,
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    clearNotifications,
    markNotificationAsRead,
    requestNotificationPermission,
  } = useWebSocket();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClearAll = () => {
    clearNotifications();
    handleClose();
  };

  const handleNotificationClick = (index: number) => {
    markNotificationAsRead(index);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BIDDING_PUBLISHED':
      case 'BIDDING_CLOSING_SOON':
      case 'bidding':
        return <Gavel color="primary" />;
      case 'PROPOSAL_SUBMITTED':
      case 'PROPOSAL_STATUS_CHANGED':
        return <Assignment color="secondary" />;
      case 'USER_VERIFIED':
        return <CheckCircle color="success" />;
      case 'SYSTEM_MAINTENANCE':
        return <Warning color="warning" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BIDDING_PUBLISHED':
      case 'bidding':
        return 'primary';
      case 'PROPOSAL_SUBMITTED':
      case 'PROPOSAL_STATUS_CHANGED':
        return 'secondary';
      case 'USER_VERIFIED':
        return 'success';
      case 'SYSTEM_MAINTENANCE':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d atrás`;
    } else if (hours > 0) {
      return `${hours}h atrás`;
    } else if (minutes > 0) {
      return `${minutes}m atrás`;
    } else {
      return 'Agora';
    }
  };

  React.useEffect(() => {
    // Solicitar permissão para notificações quando o componente monta
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notificações"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Notificações
            </Typography>
            {notifications.length > 0 && (
              <Button
                size="small"
                onClick={handleClearAll}
                startIcon={<Clear />}
              >
                Limpar Todas
              </Button>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleNotificationClick(index)}
                  sx={{
                    borderLeft: 4,
                    borderLeftColor: `${getNotificationColor(notification.type)}.main`,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Chip
                        label={notification.type}
                        size="small"
                        color={getNotificationColor(notification.type) as any}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  }
                />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length > 5 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button size="small" onClick={handleClose}>
                Ver Todas as Notificações
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
