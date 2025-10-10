This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# AgriReach

**Connecting Rural Workers with Opportunities**

A comprehensive platform empowering rural communities through sustainable agricultural connections and opportunities.

## Team Members

- **Johannes Randhall De Jesus** - Backend Developer
- **Vincent David P. Ong** - Frontend Developer

## Features

### 🎨 Loading & Animations
- **Framer Motion** animations for smooth page transitions
- **React Spinners** for beautiful loading indicators
- Multiple loading variants (spinner, pulse, bounce, dots)
- Skeleton loaders for content placeholders
- Global loading state management
- Route-level loading states

📚 **See [LOADING_GUIDE.md](./LOADING_GUIDE.md)** for complete loading documentation
🎯 **Visit `/demo/loading`** to test all loading components

### ♿ Accessibility
- Comprehensive accessibility features
- ARIA labels and semantic HTML
- Keyboard navigation support
- Screen reader optimized

📚 **See [ACCESSIBILITY.md](./ACCESSIBILITY.md)** for accessibility documentation

### 💳 Payment Integration
- PayMongo payment gateway integration
- Secure payment processing

📚 **See [PAYMONGO_SETUP.md](./PAYMONGO_SETUP.md)** for payment setup

### 🖼️ Media Management
- Cloudinary integration for image uploads
- Optimized image delivery

📚 **See [CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md)** for media setup

## Tech Stack

- **Framework:** Next.js 15.5
- **UI:** React 19, Tailwind CSS 4
- **Animations:** Framer Motion
- **Components:** Radix UI, shadcn/ui
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, Google OAuth
- **Payments:** PayMongo
- **Media:** Cloudinary
- **Deployment:** Vercel

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `config/env.example` to `.env.local`
   - Fill in your credentials

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Documentation

- [Loading Guide](./LOADING_GUIDE.md) - Loading states and animations
- [Loading Implementation](./LOADING_IMPLEMENTATION.md) - Implementation summary
- [Accessibility Guide](./ACCESSIBILITY.md) - Accessibility features
- [PayMongo Setup](./PAYMONGO_SETUP.md) - Payment integration
- [Cloudinary Integration](./CLOUDINARY_INTEGRATION.md) - Media management

## Project Structure

```
agrireach/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── marketplace/       # Marketplace features
│   ├── community/         # Community forums
│   └── ...
├── components/            # React components
│   ├── ui/               # UI components
│   ├── accessibility/    # Accessibility components
│   └── ...
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── lib/                  # Utility libraries
├── server/               # Backend logic
│   ├── models/          # Database models
│   ├── controllers/     # Route controllers
│   └── utils/           # Server utilities
└── types/               # TypeScript types
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
