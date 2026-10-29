import React, { useState } from 'react';
import {
  Avatar, Chip, Divider, ListItemIcon, ListItemText, Menu, MenuItem,
  Tooltip, IconButton, Typography,
} from '@mui/material';
import {
  LogoutRounded, ManageAccountsRounded, WorkspacePremiumRounded,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../lib/router';
import { openCustomerPortal } from '../lib/stripe';

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Gratuit', color: '#66705e', bg: '#edf0e9' },
  pro: { label: 'Pro', color: '#4f6c91', bg: '#eaf0f8' },
  team: { label: 'Équipe', color: '#795b91', bg: '#f1ebf7' },
};

export const UserMenu: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { user, session, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const plan = user.plan ?? 'free';
  const badge = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const initials = (user.email[0] ?? 'U').toUpperCase();
  const closeMenu = () => setAnchorEl(null);
  const textColor = darkMode ? '#e5e7f2' : '#30372b';

  return (
    <>
      <Tooltip title="Compte">
        <IconButton
          aria-label="Ouvrir le menu du compte"
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          onClick={event => setAnchorEl(event.currentTarget)}
          sx={{ p: .25 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: .75, minWidth: 250, borderRadius: 2.5,
              bgcolor: darkMode ? '#202239' : '#fff',
              color: textColor,
            },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important', cursor: 'default', alignItems: 'flex-start', py: 1.25 }}>
          <ListItemText
            primary={<Typography noWrap variant="body2" fontWeight={650} color={textColor}>{user.email}</Typography>}
            secondary={
              <Chip
                size="small" label={badge.label}
                sx={{ mt: .75, height: 22, bgcolor: badge.bg, color: badge.color, fontSize: 11, fontWeight: 650 }}
              />
            }
          />
        </MenuItem>
        <Divider />
        {plan === 'free' ? (
          <MenuItem onClick={() => { closeMenu(); navigate('/pricing'); }}>
            <ListItemIcon><WorkspacePremiumRounded fontSize="small" /></ListItemIcon>
            <ListItemText primary="Voir les offres" />
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            closeMenu();
            if (session) void openCustomerPortal(session.access_token);
          }}>
            <ListItemIcon><ManageAccountsRounded fontSize="small" /></ListItemIcon>
            <ListItemText primary="Gérer l’abonnement" />
          </MenuItem>
        )}
        <MenuItem onClick={async () => {
          closeMenu();
          await signOut();
          navigate('/');
        }}>
          <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>
          <ListItemText primary="Se déconnecter" />
        </MenuItem>
      </Menu>
    </>
  );
};
