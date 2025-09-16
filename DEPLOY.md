# Deployment Guide - Vercel Pro + Supabase Pro

## 📋 Pre-deployment Checklist

### 1. Environment Variables Required

Create these environment variables in your Vercel dashboard:

#### Supabase Configuration
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### JWT Configuration
```bash
JWT_SECRET=your-super-secure-jwt-secret-here
```

#### App Configuration
```bash
NODE_ENV=production
VITE_APP_URL=https://your-app-name.vercel.app
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Email Configuration (Optional - if using Resend)
```bash
RESEND_API_KEY=your-resend-api-key
```

### 2. Supabase Setup

1. **Create a new Supabase project**
   - Go to https://supabase.com/dashboard
   - Click "New project"
   - Choose your organization and region

2. **Run the database schema**
   ```sql
   -- Copy and paste the contents of supabase/schema.sql into the SQL editor
   ```

3. **Seed with sample data (optional)**
   ```sql
   -- Copy and paste the contents of supabase/seed.sql into the SQL editor
   ```

4. **Configure Authentication**
   - Go to Authentication > Settings
   - Enable Email authentication
   - Configure any additional providers as needed

5. **Set up RLS policies**
   - All tables have Row Level Security enabled
   - Policies are created in the schema.sql file

### 3. Vercel Deployment

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Deploy via GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### 4. Post-deployment Steps

1. **Test the deployment**
   - Visit your deployed URL
   - Test user registration and login
   - Verify API endpoints are working

2. **Configure domain (if using custom domain)**
   - Add your domain in Vercel dashboard
   - Update DNS records as instructed

3. **Monitor performance**
   - Check Vercel Analytics
   - Monitor Supabase usage

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Database Schema
- Location: `supabase/schema.sql`
- Includes all tables, indexes, RLS policies, and triggers
- Run this in your Supabase SQL editor

### API Routes
All API routes are in the `/api` directory and follow Vercel's serverless functions pattern:
- `/api/auth/login.ts` - User authentication
- `/api/auth/register.ts` - User registration
- `/api/patients/index.ts` - Patient management
- `/api/exercises/index.ts` - Exercise management

## 🚀 Performance Optimizations

1. **Build optimizations**
   - Vite build with code splitting
   - Tree shaking enabled
   - Production builds optimized

2. **Vercel Pro features**
   - Edge caching
   - Image optimization
   - Analytics

3. **Supabase Pro features**
   - Connection pooling
   - Point-in-time recovery
   - Advanced metrics

## 🔍 Troubleshooting

### Common Issues

1. **Build failures**
   - Ensure `npm install --legacy-peer-deps` is used
   - Check TypeScript errors
   - Verify all environment variables are set

2. **API errors**
   - Check Supabase connection
   - Verify JWT secret is set
   - Check function logs in Vercel dashboard

3. **Database connection issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure database is accessible

### Useful Commands

```bash
# Local development
npm run dev

# Build and preview locally
npm run build
npm run preview

# Lint code
npm run lint

# Check build works
npm run build
```

## 📊 Monitoring

### Vercel Dashboard
- Function execution logs
- Performance metrics
- Analytics data

### Supabase Dashboard
- Database metrics
- Authentication logs
- API usage

## 🔒 Security Notes

1. **Environment Variables**
   - Never commit secrets to git
   - Use different keys for development/production
   - Rotate keys periodically

2. **Database Security**
   - RLS policies are enforced
   - Service role key is for server-side only
   - Regular security updates

3. **API Security**
   - JWT authentication required
   - Input validation with Zod
   - Rate limiting (consider implementing)

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify environment variables
4. Review this deployment guide