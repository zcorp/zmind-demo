import React, { Suspense, useEffect, useState } from 'react';
import {
  AppBar, Box, Button, Card, CardContent, Container, Stack, Toolbar, Typography,
} from '@mui/material';
import {
  AccountTreeRounded, ArrowForwardRounded, AutoAwesomeRounded, CheckRounded,
  DownloadRounded, PaletteRounded,
} from '@mui/icons-material';
import { navigate } from '../lib/router';
import { useAuth } from '../hooks/useAuth';
import { BrandLockup } from '../components/BrandLockup';
import { BrandLogo } from '../components/BrandLogo';

const IllustratedShowcase = React.lazy(() => import('../components/IllustratedShowcase'));

const features = [
  { icon: <AccountTreeRounded />, title: 'Voyez les liens', text: 'Reliez les notions et gardez leur organisation sous les yeux.' },
  { icon: <AutoAwesomeRounded />, title: 'Retenez l’essentiel', text: 'Structurez un sujet pour mieux le comprendre et le mémoriser.' },
  { icon: <PaletteRounded />, title: 'Trouvez votre méthode', text: 'Partez d’un modèle, puis adaptez couleurs et disposition.' },
  { icon: <DownloadRounded />, title: 'Continuez ailleurs', text: 'Enregistrez ou partagez votre carte dans plusieurs formats.' },
];

export function Landing() {
  const { user, signInDemo } = useAuth();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ''; };
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fbfcf9', color: 'text.primary' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: 'rgba(251,252,249,.9)', backdropFilter: 'blur(16px)',
      }}>
        <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto', px: { xs: 1.5, sm: 3 }, gap: { xs: .5, sm: 1 } }}>
          <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
            <BrandLockup compact />
          </Box>
          <Box sx={{ flexShrink: 0, display: { xs: 'block', sm: 'none' } }}>
            <BrandLogo height={30} />
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" onClick={() => scrollTo('features')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            Découvrir
          </Button>
          <Button color="inherit" onClick={() => scrollTo('templates')} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
            Modèles
          </Button>
          <Button color="inherit" onClick={() => navigate('/pricing')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            Tarifs
          </Button>
          {user ? (
            <Button variant="contained" onClick={() => navigate('/app')} endIcon={<ArrowForwardRounded />}>
              Ouvrir ZMIND
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/auth')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                Connexion
              </Button>
              <Button variant="contained" onClick={signInDemo} sx={{ flexShrink: 0, whiteSpace: 'nowrap', px: { xs: 1.25, sm: 2 } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Essayer gratuitement</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Démo gratuite</Box>
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box component="main">
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, .92fr) minmax(0, 1.08fr)' },
            alignItems: 'center', gap: { xs: 4, md: 7 }, py: { xs: 6, md: 9 },
          }}>
            <Stack spacing={{ xs: 2.25, md: 2.75 }} sx={{ minWidth: 0, maxWidth: 500 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 750, letterSpacing: '.12em' }}>
                CARTES MENTALES
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: 40, sm: 50, md: 54 }, lineHeight: 1.04, maxWidth: 500, letterSpacing: '-.045em' }}>
                Donnez forme<br />
                <Box component="span" sx={{ color: 'primary.main' }}>à vos idées.</Box>
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, maxWidth: 430 }}>
                Reliez les notions, voyez leur place et retenez l’essentiel.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  size="large" variant="contained" onClick={signInDemo}
                  endIcon={<ArrowForwardRounded />}
                  sx={{ px: 2.5, py: 1.2, alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 48 }}
                >
                  Créer une carte
                </Button>
                <Button size="large" variant="outlined" onClick={() => scrollTo('templates')} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 48 }}>
                  Voir les modèles
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" sx={{ pt: .25 }}>
                <CheckRounded color="success" fontSize="small" />
                <Typography variant="body2">Commencez tout de suite · sans compte</Typography>
              </Stack>
            </Stack>
            <Suspense fallback={<Box sx={{ minHeight: 300, borderRadius: 5, bgcolor: 'rgba(0,124,145,.06)' }} />}>
              <IllustratedShowcase variant="featured" />
            </Suspense>
          </Box>

          <Box id="templates" sx={{ py: { xs: 5, md: 7 }, scrollMarginTop: 88 }}>
            <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} textAlign={{ xs: 'left', sm: 'center' }} sx={{ mb: 3 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 750, letterSpacing: '.12em' }}>
                APPRENDRE, EXPLORER, RACONTER
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 38 }, letterSpacing: '-.03em' }}>
                Une carte pour chaque idée.
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
                Explorez une frise historique ou le système solaire. Puis adaptez la carte à votre sujet.
              </Typography>
            </Stack>
            <Suspense fallback={<Box sx={{ minHeight: 220, borderRadius: 3, bgcolor: 'rgba(0,124,145,.04)' }} />}>
              <IllustratedShowcase variant="gallery" />
            </Suspense>
          </Box>

          <Box id="features" sx={{ py: { xs: 6, md: 9 }, scrollMarginTop: 88 }}>
            <Stack spacing={1} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '.12em' }}>
                LES OUTILS ESSENTIELS
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 30, md: 40 } }}>
                Tout pour structurer vos idées
              </Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'stretch' }}>
              {features.map(({ icon, title, text }) => (
                <Card key={title} variant="outlined" sx={{
                  borderColor: 'divider', borderRadius: 3, height: '100%',
                  transition: 'transform .18s ease, box-shadow .18s ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 30px rgba(32,45,50,.08)' },
                }}>
                  <CardContent sx={{ p: 3, height: '100%', '&:last-child': { pb: 3 } }}>
                    <Box sx={{
                      width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center',
                      color: 'primary.main', bgcolor: 'primary.light', mb: 2,
                    }}>{icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 650, mb: .75 }}>{title}</Typography>
                    <Typography color="text.secondary" lineHeight={1.65}>{text}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

        </Box>
      </Container>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
            <BrandLockup compact />
            <Typography variant="body2" color="text.secondary">Comprendre les liens. Retenir l’essentiel.</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => navigate('/pricing')}>Tarifs</Button>
              <Button size="small" onClick={() => navigate('/auth')}>Connexion</Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
