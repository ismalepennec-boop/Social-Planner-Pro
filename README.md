# Social Planner Pro

Application professionnelle de planification et scheduling pour les réseaux sociaux.

## Fonctionnalités

- **Calendrier visuel** - Planifiez vos posts avec une vue calendrier interactive
- **Workflow Kanban** - Gérez vos contenus avec un tableau de bord drag & drop
- **Génération de vidéos IA** - Créez des vidéos courtes avec Freepik AI
- **Multi-plateformes** - Publiez sur LinkedIn, Instagram, Facebook
- **Aperçu en temps réel** - Visualisez vos posts comme ils apparaîtront
- **Analytics** - Suivez vos performances

## Stack Technique

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Calendar**: react-big-calendar
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts

## Installation

```bash
npm install
npm run dev
```

## Structure du projet

```
├── client/src/          # React frontend
│   ├── components/      # Composants réutilisables
│   ├── pages/           # Pages de l'application
│   ├── lib/             # Utilitaires et API client
│   └── hooks/           # Hooks React personnalisés
├── server/              # Backend Express
│   ├── routes.ts        # Routes API
│   ├── storage.ts       # Opérations base de données
│   └── db.ts            # Connexion base de données
├── shared/              # Code partagé client/serveur
│   └── schema.ts        # Schéma de données
```

## Licence

MIT