import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  MenuBook as NewBookRequestIcon,
  Dashboard as DashboardIcon,
  ExitToApp as CheckOutIcon,
  Login as CheckInIcon,
  Refresh as RenewalIcon,
  Book as BookIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Feedback as FeedbackIcon,
  Assessment as ReportIcon,
  Edit as AuthorIcon
} from '@mui/icons-material';
import { getUserRole } from '../utils/auth';
import { getPendingRenewalsCount } from '../api/queries';
import { NAVBAR_HEIGHT } from '../utils/constants';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [pendingRenewals, setPendingRenewals] = useState(0);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const userRole = getUserRole();
    setRole(userRole || '');
    
    const fetchPendingRenewalsCount = async () => {
      if (userRole === 'LIBRARIAN') {
          const n = await getPendingRenewalsCount();
          setPendingRenewals(n);
      }
    };
    
    fetchPendingRenewalsCount();
  }, [location.pathname]);

  const menuItems = [
    { path: '/staff', icon: <DashboardIcon />, label: 'Dashboard', roles: ['LIBRARIAN', 'ADMIN'] },
    { path: '/checkout', icon: <CheckOutIcon />, label: 'Check-out Book', roles: ['LIBRARIAN'] },
    { path: '/checkin', icon: <CheckInIcon />, label: 'Check-in Book', roles: ['LIBRARIAN'] },
    { path: '/renewals', icon: <RenewalIcon />, label: 'Renewal Requests', badge: pendingRenewals, roles: ['LIBRARIAN'] },
    { path: '/books', icon: <BookIcon />, label: 'Book Management', roles: ['LIBRARIAN', 'ADMIN'] },
    { path: '/authors', icon: <AuthorIcon />, label: 'Author Management', roles: ['LIBRARIAN', 'ADMIN'] },
    { path: '/members', icon: <PersonIcon />, label: 'Member Management', roles: ['LIBRARIAN', 'ADMIN'] },
    { path: '/newbookrequests', icon: <NewBookRequestIcon />, label: 'New Book Requests', roles: ['LIBRARIAN', 'ADMIN'] },
    { path: '/librarians', icon: <AdminIcon />, label: 'Librarian Management', roles: ['ADMIN'] },
    { path: '/feedback', icon: <FeedbackIcon />, label: 'Feedback', roles: ['ADMIN'] },
  ];

  return (
    <Box 
      sx={{ 
        width: 280, 
        bgcolor: '#ffffff', 
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, 
        borderRight: '1px solid #e2e8f0',
        position: 'fixed',
        top: NAVBAR_HEIGHT, 
        left: 0,
        zIndex: 1100,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' }
      }}
    >
      <List sx={{ py: 2 }}>
        {menuItems.map((item) => {
          if (!item.roles.includes(role)) return null;

          const isActive = location.pathname === item.path;
          
          return (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.path}
              sx={{
                mb: 0.5,
                mx: 1.5, 
                borderRadius: '8px',
                width: 'auto',
                backgroundColor: isActive ? '#eff6ff' : 'transparent', 
                color: isActive ? '#1d4ed8' : '#64748b',
                borderLeft: isActive ? '4px solid #1d4ed8' : '4px solid transparent',
                '&:hover': {
                  backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                  color: isActive ? '#1d4ed8' : '#1e293b',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit', 
                  minWidth: 40,
                  '& .MuiSvgIcon-root': { fontSize: 22 } 
                }}
              >
                {item.badge && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontSize: '0.875rem', 
                  fontWeight: isActive ? 600 : 500 
                }} 
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;