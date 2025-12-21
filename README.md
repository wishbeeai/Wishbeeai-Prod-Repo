# Wishbee.ai - Gift Together. Give Better.

A modern group gifting platform that makes pooling money for the perfect shared gift effortless. Built with Next.js 16, React 19.2, TypeScript, and Tailwind CSS v4.

## 🎯 Project Overview

Wishbee.ai is a comprehensive group gifting solution that enables users to:
- Clip and auto-tag gift ideas from any online store
- Share gift collections with friends via social media or group chats
- Collect funds and contributions from multiple people
- Track gifting progress and manage group contributions
- Complete secure checkout for the final gift purchase

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19.2
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 with custom design system
- **UI Components:** Radix UI + shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)
- **Analytics:** Vercel Analytics

## 📁 Project Structure

### Core Application Files

#### `app/page.tsx`
Main landing page that orchestrates all homepage components:
- Header with navigation and authentication
- Hero section with call-to-action
- Steps/How it works section
- Group Gifting Hub (interactive demo)
- Share Widget
- Track & Manage features
- Footer with social links

#### `app/layout.tsx`
Root layout with:
- Font configuration (Geist Sans, Geist Mono, Shadows Into Light, Kalam, Dancing Script)
- Theme provider setup
- Global metadata and viewport settings
- Analytics integration

#### `app/globals.css`
Global styles with:
- Tailwind CSS v4 configuration
- Custom design tokens (colors, fonts, radius)
- Base styles and animations
- Honeycomb background pattern styles

#### `app/ai-features/page.tsx`
Dedicated page showcasing all AI-powered features:
- AI Clip Extension
- AI Wishlist Creator
- AI Title Suggestions
- AI Greeting Generator
- AI Contribution Suggestions
- AI Goal Optimizer
- AI Track Dashboard

#### `app/wishlist/page.tsx`
Product wishlist page with:
- Grid layout of products
- Add to collection functionality
- Product cards with images and details

#### `app/api/group-gifting/products/route.ts`
API route handler for:
- Product data retrieval
- Mock product database for demo purposes

### Component Files

#### Header & Navigation

**`components/header.tsx`**
Main navigation header with:
- Wishbee.ai logo with "Gift Together" signature tagline
- Responsive mobile menu
- Log In / Sign Up buttons (unauthenticated)
- User profile dropdown (authenticated)
- State management for auth status

**`components/hero.tsx`**
Hero section featuring:
- "Big Gifts Become Reality" headline
- "Gift Together. Give Better." tagline
- "Make gifting effortless" subtitle
- "Install Extension" CTA button
- "See How it Works" secondary button with video modal trigger
- Responsive typography and layout
- Honeycomb background pattern

#### How It Works

**`components/steps.tsx`**
Three-step process section with:
1. **Clip & Auto-Tag:** Browser extension functionality
2. **Share & Fund:** Group contribution system
3. **Buy & Celebrate:** Secure checkout process
- Custom icons for each step
- Responsive grid layout
- Shadows Into Light font for headings
- Equal-height description containers on desktop

#### Group Gifting Hub

**`components/group-gifting-hub.tsx`**
Interactive tabbed interface with four main features:

1. **Clip & Auto-Tag Tab:**
   - URL input for product clipping
   - AI-powered banner extraction
   - Product title and price input
   - Image upload with AI optimization badge
   - Collections management

2. **Start Funding Tab:**
   - Collection selection
   - Goal amount setting
   - Start/end date pickers
   - AI banner auto-extraction
   - "Continue to Contribute" CTA

3. **Contribute/Greeting Tab:**
   - Payment amount input
   - Multiple payment methods (Card, PayPal, Apple Pay, Google Pay, Venmo, Cash App)
   - Credit card form with validation
   - Payment method-specific fields
   - Greeting message editor with formatting tools
   - GIF selector
   - Photo upload
   - "Complete Contribution" button

4. **Track & Manage Tab:**
   - Goal progress bar
   - Contributor list with avatars
   - Contribution history
   - Withdrawal options
   - User management tools

**Key Features:**
- Toast notifications for user feedback
- Form validation with error messages
- Responsive layout for all device sizes
- AI-generated content indicators
- Mock data for demo purposes

#### Share & Track

**`components/share-widget.tsx`**
Social sharing section with:
- "Share Instantly. Gift Together" heading
- Platform-specific share buttons (Facebook, Instagram, WhatsApp, Twitter, Email)
- Desktop and mobile view optimizations
- Toast notifications on share actions

**`components/track-manage.tsx`**
Management features showcase:
- Automatic Tracking card
- Withdrawals & Transfers card
- User Management card
- Three-column responsive grid
- Icon-based feature highlights

#### Authentication

**`components/login-modal.tsx`**
Welcome Back modal with:
- Email and password inputs
- Password visibility toggle
- Form validation
- "Log in" button with loading state
- Forgot password link
- Sign up redirect link
- Close button

**`components/signup-modal.tsx`**
Create Account modal with:
- Name, email, password fields
- Password confirmation
- Password visibility toggles
- Terms of service checkbox
- Form validation
- "Sign Up" button with loading state
- Log in redirect link
- Responsive sizing for mobile, tablet, desktop

#### AI Features

**`components/ai-clip-extension.tsx`**
AI-powered clipping demonstration with:
- Browser extension simulation
- Auto-tag functionality
- Real-time product detection

**`components/ai-wishlist-creator.tsx`**
Automated wishlist generation:
- AI-suggested products
- Category-based organization
- One-click wishlist creation

**`components/ai-title-suggestions.tsx`**
Smart title generation:
- Context-aware suggestions
- Multiple title options
- Copy-to-clipboard functionality

**`components/ai-greeting-generator.tsx`**
Personalized greeting creation:
- Occasion-based templates
- Tone customization
- Emoji integration

**`components/ai-contribution-suggestions.tsx`**
Intelligent contribution recommendations:
- Budget-based suggestions
- Group size analysis
- Fair share calculations

**`components/ai-goal-optimizer.tsx`**
Goal setting assistance:
- Historical data analysis
- Success probability metrics
- Timeline recommendations

**`components/ai-track-dashboard.tsx`**
Analytics and insights:
- Contribution patterns
- Goal progress tracking
- Predictive analytics

#### Utility Components

**`components/footer.tsx`**
Site footer with:
- Product, company, legal links
- Social media icons (Facebook, Instagram, X/Twitter, TikTok)
- Browser extension download buttons (Chrome, Safari, Firefox, Edge)
- Mobile app store badges (iOS, Google Play)
- Copyright information
- Dark honey gradient background
- Responsive layout

**`components/video-modal.tsx`**
Video player modal:
- "How it Works" video display
- Close button
- Responsive sizing
- Backdrop click to close

**`components/theme-provider.tsx`**
Theme management wrapper:
- Dark/light mode support
- System theme detection
- Theme persistence

### UI Component Library (`components/ui/`)

Pre-built shadcn/ui components for consistent design:

**Form Components:**
- `input.tsx` - Text input fields with variants
- `textarea.tsx` - Multi-line text input
- `checkbox.tsx` - Checkbox with label
- `radio-group.tsx` - Radio button groups
- `select.tsx` - Dropdown select menus
- `switch.tsx` - Toggle switches
- `slider.tsx` - Range sliders
- `calendar.tsx` - Date picker
- `input-otp.tsx` - OTP input fields
- `form.tsx` - Form wrapper with validation

**Feedback Components:**
- `alert.tsx` - Alert banners
- `alert-dialog.tsx` - Confirmation dialogs
- `toast.tsx` - Toast notification system
- `toaster.tsx` - Toast container
- `progress.tsx` - Progress bars
- `spinner.tsx` - Loading spinners
- `skeleton.tsx` - Loading placeholders

**Navigation Components:**
- `button.tsx` - Button component with variants
- `button-group.tsx` - Grouped button sets
- `dropdown-menu.tsx` - Context menus
- `navigation-menu.tsx` - Main navigation
- `tabs.tsx` - Tabbed interfaces
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Page navigation

**Layout Components:**
- `card.tsx` - Content cards
- `accordion.tsx` - Collapsible sections
- `collapsible.tsx` - Expandable content
- `dialog.tsx` - Modal dialogs
- `drawer.tsx` - Slide-out panels
- `sheet.tsx` - Side sheets
- `separator.tsx` - Visual dividers
- `scroll-area.tsx` - Custom scrollbars
- `resizable.tsx` - Resizable panels

**Data Display:**
- `avatar.tsx` - User avatars
- `badge.tsx` - Status badges
- `table.tsx` - Data tables
- `chart.tsx` - Recharts wrapper
- `carousel.tsx` - Image carousels
- `aspect-ratio.tsx` - Responsive media
- `hover-card.tsx` - Hover tooltips
- `tooltip.tsx` - Tooltips
- `popover.tsx` - Popovers

**Special Components:**
- `command.tsx` - Command palette
- `context-menu.tsx` - Right-click menus
- `menubar.tsx` - Menu bars
- `sidebar.tsx` - Application sidebars
- `toggle.tsx` - Toggle buttons
- `toggle-group.tsx` - Toggle groups
- `empty.tsx` - Empty states
- `field.tsx` - Form fields
- `input-group.tsx` - Input grouping
- `item.tsx` - List items
- `kbd.tsx` - Keyboard shortcuts

### Hooks

**`hooks/use-mobile.ts`**
Custom hook for:
- Mobile device detection
- Responsive breakpoint checking
- Window resize handling

**`hooks/use-toast.ts`**
Toast notification management:
- Toast state management
- Show/hide functionality
- Toast queue handling

### Utilities

**`lib/utils.ts`**
Helper functions:
- `cn()` - Tailwind class name merger
- Class variance authority utilities
- Common utility functions

### Configuration Files

**`next.config.mjs`**
Next.js configuration:
- Image optimization settings
- Build configuration
- Environment variables

**`tsconfig.json`**
TypeScript configuration:
- Compiler options
- Path aliases (@/* mapping)
- Type checking rules

**`postcss.config.mjs`**
PostCSS configuration:
- Tailwind CSS processing
- Autoprefixer setup

**`components.json`**
shadcn/ui configuration:
- Component style preferences
- Import paths
- Tailwind config location

## 🎨 Design System

### Color Palette
- **Background:** `#F5F1E8` (warm beige)
- **Primary:** Honey/golden tones (`#DAA520`, `#B8860B`)
- **Accent:** Brown shades (`#654321`, `#8B4513`)
- **Neutral:** Grays and whites

### Typography
- **Headings:** Geist Sans (bold)
- **Body:** Geist Sans (regular/light)
- **Code:** Geist Mono
- **Decorative:** Shadows Into Light, Kalam, Dancing Script

### Responsive Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

## 🚀 Key Features

### 1. Browser Extension Integration
- One-click product clipping from any online store
- Automatic product detail extraction
- Universal wishlist compatibility

### 2. Group Gifting System
- Create funding goals for shared gifts
- Multiple payment method support
- Real-time progress tracking
- Contributor management

### 3. Social Sharing
- Platform-specific share buttons
- Deep linking support
- QR code generation
- Email invitations

### 4. AI-Powered Features
- Auto-tagging of products
- Banner image extraction
- Title and greeting suggestions
- Contribution optimization
- Smart goal recommendations

### 5. Payment Processing
- Credit/debit card support
- Digital wallet integration (Apple Pay, Google Pay)
- Payment app support (PayPal, Venmo, Cash App)
- Secure checkout flow

### 6. User Management
- Authentication system (login/signup)
- User profiles
- Contribution history
- Collection management

### 7. Analytics & Tracking
- Goal progress visualization
- Contributor analytics
- Spending insights
- Success metrics

## 📱 Responsive Design

All components are fully responsive with:
- Mobile-first approach
- Touch-optimized interactions
- Adaptive layouts for tablet and desktop
- Optimized font sizes and spacing
- Mobile-specific navigation patterns

## 🔒 Security Features

- Form validation with Zod schemas
- Input sanitization
- Secure password handling
- Protected routes (planned)
- HTTPS enforcement (production)

## 🎯 User Flows

### New User Journey
1. Land on homepage
2. Watch "How it Works" video
3. Install browser extension
4. Create account
5. Clip first product
6. Create collection
7. Start funding campaign
8. Share with friends

### Contributor Journey
1. Receive share link
2. View collection details
3. Choose contribution amount
4. Select payment method
5. Add greeting message
6. Complete contribution
7. Track progress

### Gift Organizer Journey
1. Create funding goal
2. Set timeline
3. Share with group
4. Monitor contributions
5. Manage contributors
6. Complete purchase
7. Celebrate success

## 📦 Installation

\`\`\`bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## 🌐 Environment Variables

Required environment variables (add to `.env.local`):
\`\`\`
# Add any API keys or configuration here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## 🛠️ Development

### Adding New Components
\`\`\`bash
# Using shadcn/ui CLI
npx shadcn@latest add [component-name]
\`\`\`

### Code Structure Guidelines
- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Implement responsive design mobile-first
- Use Tailwind CSS utility classes
- Keep components modular and reusable
- Add proper error handling
- Include loading states

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contact the project owner for contribution guidelines.

## 📧 Support

For questions or support, contact: [your-email@example.com]

---

**Built with ❤️ by the Wishbee.ai Team**
