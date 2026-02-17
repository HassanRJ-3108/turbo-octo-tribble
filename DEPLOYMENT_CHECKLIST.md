# Deployment Checklist

Complete this checklist before deploying Foodar to production.

## Pre-Deployment Testing

### Frontend Testing
- [ ] Landing page loads without errors
- [ ] All navigation links work
- [ ] Landing page is responsive (mobile + desktop)
- [ ] Sign up creates new account via Clerk
- [ ] Sign in works for existing account
- [ ] Logout clears session
- [ ] Onboarding form submits successfully
- [ ] API calls show correct URLs in Network tab
- [ ] Error messages display properly
- [ ] 404 page works
- [ ] No console errors (F12)
- [ ] No TypeScript compilation errors

### Authentication Testing
- [ ] Clerk keys are correct
- [ ] JWT tokens are sent with API requests
- [ ] Protected routes redirect to sign-in
- [ ] After sign-in redirects to correct page
- [ ] Clerk user profile dropdown works
- [ ] Sign out clears auth state

### Onboarding Testing
- [ ] Step 1 form validates required fields
- [ ] Step 2 document uploads work
- [ ] Step 3 photo uploads work
- [ ] Can navigate between steps
- [ ] Submit redirects to pending page
- [ ] Form data persists if page refreshed

### Dashboard Testing
- [ ] Dashboard loads after approval
- [ ] Sidebar navigation works
- [ ] Mobile sidebar toggle works
- [ ] Trial countdown displays correctly
- [ ] Quick action buttons link correctly
- [ ] Stats cards show correct data
- [ ] Responsive layout on all screen sizes

### 3D Models Testing
- [ ] Can upload .glb/.gltf/.usdz files
- [ ] Model list displays uploaded files
- [ ] Can delete models
- [ ] Dimension inputs accept numbers
- [ ] Error messages show for failed uploads

### Products Testing
- [ ] Can create new products
- [ ] Product list shows all items
- [ ] Can edit product details
- [ ] Can toggle active/inactive
- [ ] Can toggle show in menu
- [ ] Can delete products
- [ ] Price formatting is correct (PKR)
- [ ] Dietary tags save correctly
- [ ] Ingredients save as array

### Subscription Testing
- [ ] Subscription page loads
- [ ] Trial countdown shows correct days
- [ ] "Subscribe Now" button works
- [ ] Redirects to Lemon Squeezy checkout
- [ ] After payment, subscription status updates

### Public Menu Testing
- [ ] Public menu page loads for valid slug
- [ ] Products display in grid
- [ ] Product cards show images
- [ ] Product modal opens on click
- [ ] Dietary tags display correctly
- [ ] Pricing shows in PKR
- [ ] Wildcard subdomain routing works
- [ ] 3D viewer loads in modal
- [ ] "View in AR" works on mobile
- [ ] Mobile layout is responsive

### API Integration Testing
- [ ] Backend is running and accessible
- [ ] API URLs are correct in .env
- [ ] CORS headers are configured
- [ ] Clerk tokens reach backend
- [ ] Restaurant endpoints work
- [ ] Product endpoints work
- [ ] Subscription endpoints work
- [ ] Public menu endpoint works
- [ ] Error responses display to user

## Backend Verification

### Database
- [ ] PostgreSQL database is created
- [ ] All tables exist and have correct schema
- [ ] Foreign key relationships are set up
- [ ] Indexes are created for performance
- [ ] Admin user account exists

### Environment Variables
- [ ] CLERK_SECRET_KEY is set
- [ ] DATABASE_URL is correct
- [ ] SUPABASE_URL is set
- [ ] SUPABASE_KEY is set
- [ ] LEMON_SQUEEZY_API_KEY is set
- [ ] LEMON_SQUEEZY_STORE_ID is set
- [ ] JWT_SECRET is configured
- [ ] CORS_ORIGINS includes frontend URL

### API Endpoints
- [ ] GET /api/v1/health returns 200
- [ ] POST /api/v1/auth/register works
- [ ] GET /api/v1/restaurants requires auth
- [ ] POST /api/v1/restaurants works
- [ ] GET/POST /api/v1/products works
- [ ] GET /api/v1/menu/{slug} works (no auth)
- [ ] Error handling returns proper status codes

### External Services
- [ ] Clerk is connected and working
- [ ] Supabase storage is accessible
- [ ] Lemon Squeezy account is configured
- [ ] Email notifications configured (if applicable)

## Vercel Deployment (Frontend)

### Repository Setup
- [ ] Code is pushed to GitHub
- [ ] .env.local is NOT committed
- [ ] .gitignore includes .env.local
- [ ] No API keys in committed files

### Vercel Configuration
- [ ] Project is connected to Vercel
- [ ] Deployment environment is selected
- [ ] Build command is correct: `next build`
- [ ] Start command is correct: `next start`
- [ ] Install command is correct: `npm install`

### Environment Variables (Vercel)
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set
- [ ] CLERK_SECRET_KEY is set
- [ ] NEXT_PUBLIC_API_URL points to production backend
- [ ] All other .env variables are set

### Production Build
- [ ] `npm run build` completes without errors
- [ ] No console warnings during build
- [ ] Bundle size is reasonable
- [ ] All static files are generated
- [ ] Images are optimized

### Vercel Preview
- [ ] Preview deployment works
- [ ] Preview URL is accessible
- [ ] All pages load correctly
- [ ] API calls use correct production URLs
- [ ] No 404 errors for assets

### Vercel Production
- [ ] Production domain is configured
- [ ] SSL certificate is active
- [ ] All routes are accessible
- [ ] Redirects are working (www, etc)
- [ ] Performance is acceptable

## Domain Configuration

### Wildcard Subdomains (Production)
- [ ] DNS A record points to Vercel IP
- [ ] Wildcard record exists: *.timeinx.store
- [ ] Propagation is complete (24-48 hours)
- [ ] Test: nslookup test.timeinx.store

### Production Domain
- [ ] Domain is registered
- [ ] Nameservers point to Vercel
- [ ] HTTPS/SSL is enabled
- [ ] Auto-renewal is enabled

### Redirect Rules
- [ ] www → non-www redirect (or vice versa)
- [ ] HTTP → HTTPS redirect
- [ ] Old domain → new domain (if migrating)

## Clerk Configuration (Production)

### Sign In/Sign Up URLs
- [ ] NEXT_PUBLIC_CLERK_SIGN_IN_URL is correct
- [ ] NEXT_PUBLIC_CLERK_SIGN_UP_URL is correct
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL redirects correctly
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL redirects correctly

### OAuth Apps (Optional)
- [ ] Google OAuth is configured (if enabled)
- [ ] GitHub OAuth is configured (if enabled)
- [ ] Redirect URIs are correct

### Email (Optional)
- [ ] Email verification is configured
- [ ] Custom email templates are set (if needed)
- [ ] Email provider is connected

## Performance & Security

### Performance
- [ ] First Contentful Paint is < 2 seconds
- [ ] Largest Contentful Paint is < 3 seconds
- [ ] Core Web Vitals are in "good" range
- [ ] Images are optimized (WebP, lazy loading)
- [ ] Bundle size is < 500KB (gzipped)
- [ ] No render-blocking resources
- [ ] Caching headers are set correctly

### Security
- [ ] No API keys exposed in frontend code
- [ ] HTTPS is enforced everywhere
- [ ] CSP headers are configured
- [ ] CORS is restrictive (not "*")
- [ ] Rate limiting is enabled
- [ ] Input validation works
- [ ] XSS protection is enabled
- [ ] CSRF protection is configured

### SEO
- [ ] Meta tags are correct
- [ ] OG tags are set for sharing
- [ ] robots.txt exists
- [ ] sitemap.xml is generated
- [ ] h1 tags are used correctly
- [ ] Alt text on all images
- [ ] Mobile viewport is configured

## Monitoring & Analytics

### Error Tracking
- [ ] Sentry (or similar) is configured
- [ ] Error emails are sent to team
- [ ] Error dashboard is monitored

### Performance Monitoring
- [ ] Web Vitals are monitored
- [ ] API response times are tracked
- [ ] Database query performance is monitored

### Analytics
- [ ] Google Analytics is configured
- [ ] User signup/onboarding is tracked
- [ ] Product creation is tracked
- [ ] Public menu views are tracked

### Logging
- [ ] Frontend errors are logged
- [ ] API errors are logged
- [ ] Database errors are logged
- [ ] Logs are centralized and searchable

## Post-Deployment

### Verification
- [ ] Production site is live at your domain
- [ ] Sign up flow works end-to-end
- [ ] Onboarding works end-to-end
- [ ] Dashboard is accessible
- [ ] Public menus are live
- [ ] Email notifications are sent
- [ ] Payments work (test transaction)

### Rollback Plan
- [ ] Previous version is tagged
- [ ] Can revert to previous version
- [ ] Database backups exist
- [ ] Have rollback procedure documented

### Customer Communication
- [ ] Launch announcement is sent
- [ ] FAQ is updated
- [ ] Support email is monitored
- [ ] Status page is setup

### First Week Monitoring
- [ ] Monitor error rates closely
- [ ] Check server logs regularly
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Check user feedback
- [ ] Have support team ready

## Document Template

Save these for your records:

### Pre-Launch Checklist
- Date: ____________________
- Team: ____________________
- Lead: ____________________

### Incidents Found
- [ ] None
- [ ] Minor (to fix next release)
- [ ] Major (blocks launch)

Description: _____________________________

### Sign-Off
- Tested by: ____________________
- Approved by: ____________________
- Launch date: ____________________

---

## Testing Checklist Template

Copy this for each test run:

```markdown
## Test Run: [DATE] - [TESTER NAME]

### Frontend ✅/❌
- [ ] Landing page
- [ ] Auth flow
- [ ] Onboarding
- [ ] Dashboard
- [ ] Models
- [ ] Products
- [ ] Subscription
- [ ] Public menu

### Backend ✅/❌
- [ ] API endpoints
- [ ] Database
- [ ] Auth
- [ ] Payments

### Issues Found
1. ...
2. ...

### Status
[ ] Ready to deploy
[ ] Need fixes
[ ] Blocked

Notes: _______________________________
```

---

## Success! 🎉

If you've checked all boxes, your deployment should be smooth!

**Before clicking "Deploy":**
- Backup production database
- Have rollback plan ready
- Notify team
- Monitor closely for first hour

**After deployment:**
- Test all critical flows
- Monitor error rates
- Check analytics
- Gather user feedback
- Plan next improvements

---

**Remember**: You can always rollback if needed. Test thoroughly before deploying to production!
