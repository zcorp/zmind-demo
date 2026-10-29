import React from 'react';
import { Box, Typography } from '@mui/material';
import { BrandLogo } from './BrandLogo';

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  const logoHeight = compact ? 30 : 40;

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <BrandLogo height={logoHeight} />
      <Typography
        variant="caption"
        sx={{
          ml: compact ? 4 : 4.7,
          mt: -0.15,
          color: 'text.secondary',
          fontSize: compact ? 9 : 10,
          fontWeight: 650,
          letterSpacing: '.045em',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        Créer · relier · illustrer
      </Typography>
    </Box>
  );
}
