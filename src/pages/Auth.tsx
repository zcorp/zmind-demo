import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Container, Divider,
  Stack, TextField, Typography,
} from '@mui/material';
import { AccountTreeRounded, ArrowBackRounded, ArrowForwardRounded, DownloadRounded } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../lib/router';
import { BrandLogo } from '../components/BrandLogo';
import { BrandLockup } from '../components/BrandLockup';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H9v2.96h4.28C12.66 13.16 11 14 9 14c-2.76 0-5-2.24-5-5s2.24-5 5-5c1.26 0 2.4.46 3.28 1.21L14.5 3A8 8 0 1 0 17 9c0-.34-.03-.67-.08-1h-.41z"/>
      <path fill="#34A853" d="M2.36 6.21A8 8 0 0 0 1 9c0 .98.19 1.91.52 2.77l2.97-2.3A4.97 4.97 0 0 1 4 9c0-.6.1-1.18.28-1.73L2.36 6.21z"/>
      <path fill="#FBBC05" d="M9 4c1.26 0 2.4.46 3.28 1.21L14.5 3A8 8 0 0 0 9 1a8 8 0 0 0-6.64 3.54l2.92 2.27A4.97 4.97 0 0 1 9 4z"/>
      <path fill="#EA4335" d="M9 18a8 8 0 0 0 5.54-2.22l-2.77-2.14A4.97 4.97 0 0 1 9 14c-2 0-3.66-.84-4.28-2.96L1.76 13.3A8 8 0 0 0 9 18z"/>
    </svg>
  );
}

export function Auth() {
  const { user, loading, error, signIn, signUp, signInGoogle, signInDemo, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate('/app');
  }, [user, loading]);

  useEffect(() => {
    if (success && error) setSuccess(false);
  }, [success, error]);

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setLocalError('');
    setSuccess(false);
    clearError();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setSuccess(false);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Renseignez votre e-mail et votre mot de passe.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setLocalError('Choisissez un mot de passe de 8 caractères minimum.');
        return;
      }
      if (password !== confirm) {
        setLocalError('Les mots de passe ne correspondent pas.');
        return;
      }
      await signUp(email.trim(), password);
      setSuccess(true);
      return;
    }

    await signIn(email.trim(), password);
  };

  const displayError = localError || error;
  const isSignup = mode === 'signup';

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      py: { xs: 3, md: 6 },
      background: 'radial-gradient(ellipse at 18% 18%, #ddf5f8 0%, #f8f9f6 42%, #f5f6f2 100%)',
    }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/')}
          sx={{ mb: { xs: 2, sm: 3 }, color: 'text.secondary' }}
        >
          Accueil
        </Button>

        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, .95fr) minmax(0, 1.05fr)' },
          gap: { xs: 3, lg: 7 }, alignItems: 'center', maxWidth: 1050, mx: 'auto',
        }}>
          <Stack spacing={2.5} sx={{ px: { lg: 2 }, display: { xs: 'none', lg: 'flex' } }}>
            <BrandLockup />
            <Typography variant="h2" sx={{ fontSize: { lg: 38, xl: 44 }, lineHeight: 1.1, maxWidth: 440 }}>
              Une carte pour voir l’ensemble.
            </Typography>
            <Typography color="text.secondary" lineHeight={1.65} sx={{ maxWidth: 420 }}>
              Ajoutez des idées, reliez les sujets et exportez votre carte.
            </Typography>
            <Stack direction="row" spacing={1.25} sx={{ pt: 1 }}>
              {[
                { label: 'Ajouter', icon: <AccountTreeRounded fontSize="small" /> },
                { label: 'Relier', icon: <ArrowForwardRounded fontSize="small" /> },
                { label: 'Exporter', icon: <DownloadRounded fontSize="small" /> },
              ].map(step => (
                <Stack key={step.label} spacing={1} alignItems="center" sx={{
                  flex: 1, py: 1.75, border: '1px solid', borderColor: 'divider',
                  borderRadius: 2.5, color: 'primary.main', bgcolor: 'rgba(255,255,255,.62)',
                }}>
                  {step.icon}
                  <Typography variant="caption" color="text.primary" fontWeight={650}>{step.label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Card variant="outlined" sx={{
            width: '100%', maxWidth: 520, justifySelf: 'center',
            borderRadius: 4, borderColor: 'rgba(52,58,64,.12)',
            boxShadow: '0 24px 70px rgba(32,45,50,.09)',
          }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
              <Stack spacing={2.25}>
                <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: .5 }}>
                  <BrandLogo height={34} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: 28 }}>
                    {isSignup ? 'Créer un compte' : 'Connexion'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: .75 }}>
                    {isSignup ? 'Retrouvez vos cartes sur vos appareils.' : 'Accédez à vos cartes.'}
                  </Typography>
                </Box>

                <Box>
                  <Button
                    fullWidth size="large" variant="contained"
                    onClick={signInDemo} endIcon={<ArrowForwardRounded />}
                    sx={{ justifyContent: 'space-between', px: 2, py: 1.25 }}
                  >
                    Essayer sans compte
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center"
                    sx={{ display: 'block', mt: .75 }}>
                    Démo gratuite · aucune inscription requise
                  </Typography>
                </Box>

                <Divider><Typography variant="caption" color="text.secondary">ou continuer avec</Typography></Divider>

                {success && (
                  <Alert severity="success">
                    Compte créé. Consultez votre e-mail pour confirmer l’inscription.
                  </Alert>
                )}
                {displayError && <Alert severity="error">{displayError}</Alert>}

                <Button
                  fullWidth variant="outlined" onClick={signInGoogle} disabled={loading}
                  startIcon={<GoogleMark />} sx={{ borderColor: 'divider', color: 'text.primary' }}
                >
                  Continuer avec Google
                </Button>

                <Divider><Typography variant="caption" color="text.secondary">ou par e-mail</Typography></Divider>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <TextField
                      label="Adresse e-mail" type="email" autoComplete="email" required
                      value={email} onChange={event => setEmail(event.target.value)}
                      placeholder="vous@exemple.fr" fullWidth
                    />
                    <TextField
                      label="Mot de passe" type="password"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={password} onChange={event => setPassword(event.target.value)}
                      helperText={isSignup ? '8 caractères minimum' : undefined}
                      required fullWidth
                    />
                    {isSignup && (
                      <TextField
                        label="Confirmer le mot de passe" type="password" autoComplete="new-password"
                        value={confirm} onChange={event => setConfirm(event.target.value)}
                        required fullWidth
                      />
                    )}
                    <Button type="submit" fullWidth size="large" variant="contained" disabled={loading}>
                      {loading ? 'Connexion…' : isSignup ? 'Créer mon compte' : 'Se connecter'}
                    </Button>
                  </Stack>
                </Box>

                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {isSignup ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
                  <Button
                    size="small" onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                    sx={{ minWidth: 0, verticalAlign: 'baseline', p: 0, ml: .25 }}
                  >
                    {isSignup ? 'Se connecter' : 'Créer un compte'}
                  </Button>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
