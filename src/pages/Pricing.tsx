import React, { useEffect } from 'react';
import {
  AppBar, Box, Button, Card, CardContent,
  Container, Divider, Stack, Toolbar, Typography,
} from '@mui/material';
import { ArrowBackRounded, ArrowForwardRounded, CheckCircleOutlineRounded } from '@mui/icons-material';
import { BrandLockup } from '../components/BrandLockup';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../lib/router';
import { startCheckout } from '../lib/stripe';

export function Pricing() {
  const { user, session, signInDemo } = useAuth();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ''; };
  }, []);

  const plans = [
    {
      title: 'Gratuit',
      price: '0',
      suffix: 'pour toujours',
      description: 'Pour commencer et créer vos premières cartes.',
      action: signInDemo,
      cta: 'Créer une carte',
      perks: ['3 cartes', '50 nœuds par carte', 'Export PNG et Markdown'],
    },
    {
      title: 'Pro',
      price: '5',
      suffix: 'par mois',
      description: 'Pour développer vos idées sans limite.',
      action: () => session
        ? startCheckout('pro', session.user.email, session.access_token)
        : navigate('/auth'),
      cta: 'Choisir Pro',
      perks: ['Cartes et nœuds illimités', 'Tous les thèmes et modèles', 'Export PDF et SVG'],
    },
    {
      title: 'Équipe',
      price: '12',
      suffix: 'par personne / mois',
      description: 'Pour construire vos cartes à plusieurs.',
      action: () => { window.location.href = 'mailto:hello@minder.app'; },
      cta: 'Nous contacter',
      perks: ['Tout ce qui est inclus dans Pro', 'Espace de travail partagé', 'Gestion des membres'],
    },
  ];

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
          <Button color="inherit" onClick={() => navigate('/')}>Accueil</Button>
          {user ? (
            <Button variant="contained" onClick={() => navigate('/app')} endIcon={<ArrowForwardRounded />}>
              Ouvrir ZMIND
            </Button>
          ) : (
            <Button variant="contained" onClick={signInDemo} sx={{ whiteSpace: 'nowrap' }}>
              Essayer gratuitement
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box component="main" sx={{ py: { xs: 5, md: 8 } }}>
          <Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/')} sx={{ mb: 3, color: 'text.secondary' }}>
            Retour à l’accueil
          </Button>
          <Stack spacing={1} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 750, letterSpacing: '.12em' }}>
              TARIFS
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 44 }, lineHeight: 1.12 }}>
              Commencez gratuitement.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
              Créez vos cartes, explorez les modèles et choisissez une formule payante seulement si vous en avez besoin.
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2, alignItems: 'stretch' }}>
            {plans.map((plan, index) => (
              <Card
                key={plan.title}
                variant="outlined"
                sx={{
                  display: 'flex',
                  borderRadius: 3,
                  borderColor: index === 1 ? 'primary.main' : 'divider',
                  borderWidth: index === 1 ? 2 : 1,
                  boxShadow: index === 1 ? '0 16px 42px rgba(0,124,145,.10)' : 'none',
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', width: '100%', '&:last-child': { pb: 3 } }}>
                  <Typography variant="h6" fontWeight={750}>{plan.title}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ minHeight: 42, mt: .5 }}>
                    {plan.description}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={.75} sx={{ my: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: 38 }}>{plan.price} €</Typography>
                    <Typography variant="body2" color="text.secondary">{plan.suffix}</Typography>
                  </Stack>
                  <Button fullWidth variant={index === 1 ? 'contained' : 'outlined'} onClick={plan.action}>
                    {plan.cta}
                  </Button>
                  <Divider sx={{ my: 2.5 }} />
                  <Stack spacing={1.25}>
                    {plan.perks.map(perk => (
                      <Stack key={perk} direction="row" spacing={1} alignItems="center">
                        <CheckCircleOutlineRounded fontSize="small" color="success" />
                        <Typography variant="body2">{perk}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
            <BrandLockup compact />
            <Typography variant="body2" color="text.secondary">Comprendre les liens. Retenir l’essentiel.</Typography>
            <Button size="small" onClick={() => navigate('/auth')}>Connexion</Button>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} ZCOORE. Tous droits réservés.
            </Typography>
            <Typography
              component="a"
              href="mailto:contact@zmind.fr"
              variant="caption"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              contact@zmind.fr
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
