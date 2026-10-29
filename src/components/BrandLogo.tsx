import React from 'react';
import { Box } from '@mui/material';

type BrandLogoProps = {
  variant?: 'horizontal' | 'mark';
  dark?: boolean;
  height?: number;
};

export function BrandLogo({ variant = 'horizontal', dark = false, height = 36 }: BrandLogoProps) {
  const asset = variant === 'mark'
    ? dark ? 'zmind-mark-dark.png' : 'zmind-icon.jpg'
    : dark ? 'zmind-horizontal-dark.png' : 'zmind-horizontal.jpg';

  return (
    <Box
      component="img"
      src={`${import.meta.env.BASE_URL}brand/${asset}`}
      alt="ZMIND"
      sx={{ display: 'block', height, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
    />
  );
}
