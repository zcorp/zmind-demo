import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#007c91', dark: '#005e6e', light: '#ddf5f8' },
    secondary: { main: '#b77945' },
    background: { default: '#f7f8f5', paper: '#ffffff' },
    text: { primary: '#252a22', secondary: '#72796e' },
    divider: '#e7eae3',
    success: { main: '#4d8053' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.045em' },
    h2: { fontWeight: 700, letterSpacing: '-0.035em' },
    h3: { fontWeight: 650, letterSpacing: '-0.025em' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40, boxShadow: 'none' },
        contained: { boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { backgroundImage: 'none' },
      },
    },
  },
});
