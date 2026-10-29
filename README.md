# ZMIND — Démo

Application de démonstration statique de ZMIND, maintenue dans le dépôt
indépendant `zcorp/zmind-demo`. Cette version ne contient pas les modèles
internes de présentation du projet.

La démo est publiée par GitHub Actions sur GitHub Pages. Elle ne constitue pas
la version de production : aucun backend, synchronisation cloud ou traitement
de paiement n’est fourni par ce site statique.

## Vérification locale

Le projet se lance et se vérifie dans Docker, pas avec Node.js/npm sur l’hôte :

```bash
./start.sh
./check.sh
```

Le premier script démarre le conteneur de démo sur `http://localhost:5173` et
le nettoie à l’arrêt. Le second exécute les tests, le typecheck et le build dans
un conteneur éphémère.

## Publication GitHub Pages

Le workflow `.github/workflows/pages.yml` s’exécute sur chaque push vers
`main` et peut aussi être lancé manuellement. Il installe les dépendances sur
le runner GitHub, exécute les tests et publie le dossier `dist`.

Lors de la première configuration du dépôt, choisir **Settings → Pages →
Build and deployment → GitHub Actions** et définir `www.zmind.fr` comme domaine
personnalisé. `public/CNAME` est copié dans le build Pages et le workflow
construit le site avec des chemins relatifs, compatibles avec GitHub Pages et
le domaine personnalisé.

Le DNS de `www.zmind.fr` doit contenir un CNAME vers `zcorp.github.io`. Une fois
le domaine validé par GitHub et le certificat TLS émis, activer **Enforce HTTPS**
dans les réglages Pages. La propagation DNS et l’émission du certificat peuvent
prendre du temps. Enregistrer le domaine dans GitHub Pages avant de créer ou
modifier son enregistrement DNS afin de réduire le risque de prise de contrôle
du sous-domaine.

Le dépôt GitHub est actuellement vide et public. Le rendre privé dans
**Settings → General → Danger Zone → Change repository visibility** avant le
premier push de code. Vérifier que l’offre GitHub du compte permet Pages avec
un dépôt source privé ; le site publié demeure public.

Ne jamais ajouter de secret ou de fichier `.env.local` à ce dépôt ou à l’artefact
Pages.

## Confidentialité du code source

Le dépôt source devrait être privé et le site Pages public. GitHub Actions peut
construire le site depuis le dépôt privé et déployer seulement le contenu
statique de `dist`. Le compte GitHub doit permettre GitHub Pages depuis un dépôt
privé ; la publication d’un site Pages privé, elle, est une fonction distincte
réservée à GitHub Enterprise Cloud.

Le JavaScript, les images et les autres fichiers livrés au navigateur restent
publics et peuvent être inspectés ou téléchargés. Cette séparation protège
l’historique et les fichiers sources non livrés, mais ne permet pas de cacher
le code exécuté côté navigateur. Ne jamais intégrer de clé secrète ou
d’autorisation sensible dans le frontend.
