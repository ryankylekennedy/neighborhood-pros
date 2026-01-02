# Neighborhood Pros

A local professionals directory app where neighbors can discover, save, and recommend trusted service providers in their community.

## Features

- 🔍 **Search & Filter** - Find professionals by name, category, or service type
- ⭐ **Favorites** - Save professionals to your personal list
- 💬 **Recommendations** - Recommend professionals to your neighbors
- 🏆 **Neighborhood Favorites** - See which professionals are popular in your area
- 🔐 **Authentication** - Secure sign-up and sign-in with Supabase Auth
- 📱 **Responsive Design** - Works great on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project (already set up!)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   The `.env` file is already configured with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://uaokzqcdhqawjhggnzmd.supabase.co
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Visit `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Card, etc.)
│   ├── Header.jsx      # Navigation header
│   ├── ProfessionalCard.jsx
│   ├── SearchBar.jsx
│   └── CategoryFilter.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.jsx     # Authentication context & functions
│   ├── useProfessionals.js  # Data fetching for professionals
│   ├── useFavorites.js # Favorites management
│   └── useRecommendations.js
├── lib/
│   ├── supabase.js     # Supabase client configuration
│   └── utils.js        # Utility functions
├── pages/              # Page components
│   ├── HomePage.jsx
│   ├── ProfessionalDetailPage.jsx
│   ├── FavoritesPage.jsx
│   └── ProfilePage.jsx
├── App.jsx             # Main app with routing
├── main.jsx            # Entry point
└── index.css           # Global styles & theme
```

## Database Schema

Your Supabase database includes these tables:

- `neighborhoods` - Geographic areas
- `categories` - Service categories (Home Services, etc.)
- `subcategories` - Specific services (Plumbing, Electrical, etc.)
- `professionals` - Service provider listings
- `professional_subcategories` - Links professionals to their services
- `professional_neighborhoods` - Preferred service areas
- `profiles` - User profiles (extends Supabase Auth)
- `favorites` - User's saved professionals
- `recommendations` - User recommendations

## Customization

### Adding More Categories/Professionals

Use the Supabase Dashboard Table Editor or run SQL:

```sql
-- Add a new category
INSERT INTO categories (name, emoji) VALUES ('Childcare', '👶');

-- Add a professional
INSERT INTO professionals (name, emoji, category_id, description)
SELECT 'Amazing Nanny Service', '🍼', id, 'Experienced childcare provider'
FROM categories WHERE name = 'Childcare';
```

### Changing the Color Theme

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: 152 57% 42%;  /* Green - change hue/saturation/lightness */
  --accent: 32 95% 55%;    /* Orange accent */
}
```

### Enabling Email Confirmation

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Under "Email Auth", configure email templates
3. Enable "Confirm email" if desired

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

## Next Steps

Here are some features you might want to add:

- [ ] Photo uploads for professionals
- [ ] Reviews/ratings system
- [ ] Contact form / messaging
- [ ] Admin dashboard for managing listings
- [ ] Email notifications for new recommendations
- [ ] Social login (Google, Facebook)

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/guide/)

---

Built with ❤️ for local communities
