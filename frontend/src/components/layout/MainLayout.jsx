import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Divider, Badge, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, School, People, Person, EventAvailable,
  Payment, Autorenew, Description, Gavel, Groups, Visibility, Fingerprint,
  Videocam, Notifications, History, Business, Assignment, Logout,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { logout } from '../../features/auth/authSlice';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

const DRAWER_WIDTH = 260;

const getNavItems = (role) => {
  const all = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/admin', roles: [ROLES.SUPER_ADMIN] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/institution', roles: [ROLES.INSTITUTION_ADMIN, ROLES.PRINCIPAL, ROLES.FACULTY] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/field-officer', roles: [ROLES.FIELD_OFFICER] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/council', roles: [ROLES.COUNCIL_MEMBER] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/committee', roles: [ROLES.COMMITTEE_MEMBER] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/finance', roles: [ROLES.FINANCE_OFFICER] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/monitoring', roles: [ROLES.MONITORING_OFFICER] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard/student', roles: [ROLES.STUDENT] },
    { label: 'Institutions', icon: <Business />, path: '/institutions', roles: [ROLES.SUPER_ADMIN, ROLES.COUNCIL_MEMBER, ROLES.FIELD_OFFICER] },
    { label: 'Applications', icon: <Assignment />, path: '/institution-applications', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COUNCIL_MEMBER, ROLES.COMMITTEE_MEMBER] },
    { label: 'Students', icon: <School />, path: '/students', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.PRINCIPAL, ROLES.FACULTY, ROLES.COMMITTEE_MEMBER] },
    { label: 'Faculty', icon: <People />, path: '/faculty', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.PRINCIPAL, ROLES.COUNCIL_MEMBER] },
    { label: 'Attendance', icon: <EventAvailable />, path: '/attendance', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.PRINCIPAL, ROLES.FACULTY, ROLES.STUDENT, ROLES.MONITORING_OFFICER] },
    { label: 'Inspections', icon: <Visibility />, path: '/inspections', roles: [ROLES.SUPER_ADMIN, ROLES.FIELD_OFFICER, ROLES.COMMITTEE_MEMBER] },
    { label: 'Affidavits', icon: <Description />, path: '/affidavits', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.COUNCIL_MEMBER, ROLES.COMMITTEE_MEMBER] },
    { label: 'Committees', icon: <Groups />, path: '/committees', roles: [ROLES.SUPER_ADMIN, ROLES.COMMITTEE_MEMBER] },
    { label: 'Council', icon: <Gavel />, path: '/council', roles: [ROLES.SUPER_ADMIN, ROLES.COUNCIL_MEMBER] },
    { label: 'Payments', icon: <Payment />, path: '/payments', roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_OFFICER, ROLES.STUDENT, ROLES.FACULTY, ROLES.INSTITUTION_ADMIN] },
    { label: 'Renewals', icon: <Autorenew />, path: '/renewals', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.STUDENT, ROLES.FACULTY, ROLES.FINANCE_OFFICER] },
    { label: 'Biometric', icon: <Fingerprint />, path: '/biometric', roles: [ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.MONITORING_OFFICER] },
    { label: 'Monitoring', icon: <Videocam />, path: '/monitoring', roles: [ROLES.SUPER_ADMIN, ROLES.MONITORING_OFFICER] },
    { label: 'Audit Logs', icon: <History />, path: '/audit-logs', roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_OFFICER] },
  ];
  return all.filter((item) => item.roles.includes(role));
};

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const [anchorEl, setAnchorEl] = useState(null);

  const navItems = getNavItems(user?.role);

  const drawer = (
    <Box sx={{ pt: 1 }}>
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>PN</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>PNMC</Typography>
          <Typography variant="caption" color="text.secondary">Management System</Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path + item.label}
            selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); if (isMobile) dispatch(toggleSidebar()); }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'primary.dark' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => dispatch(toggleSidebar())} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Pakistan Nursing & Midwifery Council
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={0} color="error"><Notifications /></Badge>
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{ROLE_LABELS[user?.role]}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { dispatch(logout()); navigate('/login'); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? sidebarOpen : true}
        onClose={() => dispatch(toggleSidebar())}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider' },
        }}
      >
        <Toolbar />
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: isMobile ? 0 : 0, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
