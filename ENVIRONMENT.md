# Configuration locale

## Comptes de démonstration

Depuis la racine, exécuter `npm run seed` (ou la même commande dans `apps/api`).
Ce script crée ou met à jour les comptes suivants, avec des mots de passe hachés
au format Better Auth :

| Identifiant | Mot de passe | Espace     |
| ----------- | ------------ | ---------- |
| user        | user         | /feedback  |
| founder     | founder      | /dashboard |

Le formulaire de connexion est sur `/`. Ces identifiants correspondent aux emails
internes `user@foxhound.test` et `founder@foxhound.test`. Le seed réinitialise leurs
mots de passe et ferme leurs sessions existantes. Les inscriptions publiques sont
désactivées. Aucune migration supplémentaire n'est nécessaire.

Lancer `npm run dev` depuis la racine : API sur le port 3000, frontend sur
`http://localhost:3001`. Vite transmet `/api/auth` à l'API. Si `PORT` a été modifié,
adapter la cible du proxy dans `apps/web/vite.config.ts`. En production, configurer
également le reverse proxy pour transmettre `/api/auth` à NestJS.
`BETTER_AUTH_TRUSTED_ORIGINS` doit inclure l'origine du frontend.

La commande npm pour un script personnalisé est **`npm run seed`**, et non `npm seed`.

## Variables d'environnement

Créer ou compléter le fichier `.env` à la racine du monorepo (à côté du
`package.json` principal) avec ces variables :

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foxhound?schema=public
BETTER_AUTH_SECRET=<secret aléatoire de 32 caractères minimum>
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3001
PORT=3000
```

Adapter les identifiants PostgreSQL et l'origine du frontend. Plusieurs origines
peuvent être séparées par des virgules. Générer un secret avec
`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
Ne pas versionner le `.env`.

Depuis la racine :

```sh
npm install
npm run db:generate -w api
npm run db:migrate -w api -- --name init_auth
npm run start:dev -w api
```

PostgreSQL doit être démarré avant la migration. En déploiement, appliquer les
migrations versionnées avec `npm run db:deploy -w api`.

Better Auth expose `/api/auth/sign-up/email`, `/api/auth/sign-in/email`,
`/api/auth/sign-out`, `/api/auth/get-session` et `/api/auth/ok`.
Le frontend doit transmettre les cookies (`credentials: 'include'`).
Les autres routes Nest restent publiques ; utiliser `auth.api.getSession` dans
un guard pour protéger les futures routes privées.

Injecter `PrismaService` dans les services Nest et utiliser `prismaService.client`
pour accéder au client partagé avec Better Auth. Le client se déconnecte lors
de l'arrêt de Nest.

L'API et Prisma CLI chargent le même `.env` racine, quel que soit le répertoire
de lancement. Les variables déjà définies dans l'environnement sont prioritaires.
`DOTENV_CONFIG_PATH` permet de choisir un autre fichier, notamment pour les tests.
