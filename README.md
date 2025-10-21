# 🌾 AgriReach

**Connecting Rural Communities Through Sustainable Agriculture**

AgriReach is a comprehensive platform that empowers rural communities by connecting agricultural workers with opportunities, facilitating marketplace transactions, and building sustainable agricultural networks across the Philippines.

![AgriReach Logo](https://img.shields.io/badge/AgriReach-Connecting%20Rural%20Communities-green?style=for-the-badge&logo=leaf)

## 🎯 Mission

To bridge the gap between rural agricultural workers and opportunities, creating sustainable connections that benefit both farmers and employers while promoting eco-friendly agricultural practices.

## ✨ Key Features

### 👥 **Multi-Role Platform**
- **Workers**: Find agricultural jobs, showcase skills, track earnings
- **Employers**: Post job opportunities, manage hiring, connect with skilled workers
- **Traders**: Buy and sell agricultural products, manage marketplace listings

### 🛒 **Marketplace**
- **Product Listings**: Comprehensive agricultural product marketplace
- **Secure Payments**: PayMongo integration for safe transactions
- **Order Management**: Complete order tracking and delivery system
- **COD Support**: Cash on Delivery for accessible payments

### 💼 **Job Opportunities**
- **Job Posting**: Employers can post agricultural opportunities
- **Skill Matching**: Connect workers with relevant job requirements
- **Application Tracking**: Complete application management system
- **Rating System**: Build trust through reviews and ratings

### 🌱 **Community Features**
- **Forums**: Agricultural community discussions
- **Messaging**: Direct communication between users
- **Reviews**: Trust-building through user feedback
- **Notifications**: Real-time updates and alerts

### 📱 **Modern UX/UI**
- **Responsive Design**: Works seamlessly on all devices
- **Dark/Light Mode**: User preference support
- **Smooth Animations**: Framer Motion powered transitions
- **Accessibility**: WCAG compliant design

## 🚀 Tech Stack

### **Frontend**
- **Framework**: Next.js 15.5 with App Router
- **UI Library**: React 19, Tailwind CSS 4
- **Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **State Management**: React Hooks, Context API

### **Backend**
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, Google OAuth
- **Validation**: Zod schemas for type-safe validation

### **Integrations**
- **Payments**: PayMongo (Philippines payment gateway)
- **Media**: Cloudinary for image management
- **Maps**: Philippine address system integration
- **Notifications**: Real-time notification system

### **Development**
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel with MongoDB Atlas

## 🏗️ Project Structure

```
agrireach/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── auth/                # Authentication routes
│   │   ├── marketplace/         # Product & order APIs
│   │   ├── opportunities/       # Job posting APIs
│   │   └── community/           # Forum & messaging APIs
│   ├── dashboard/               # User dashboards
│   ├── marketplace/             # Product marketplace
│   ├── opportunities/           # Job listings
│   └── community/               # Forums & discussions
├── components/                  # React components
│   ├── ui/                      # Reusable UI components
│   ├── auth/                    # Authentication components
│   ├── marketplace/             # Marketplace components
│   ├── dashboard/               # Dashboard components
│   └── accessibility/           # A11y components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
├── server/                      # Backend logic
│   ├── models/                  # MongoDB schemas
│   ├── validators/              # Zod validation schemas
│   └── utils/                   # Server utilities
└── types/                       # TypeScript definitions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- PayMongo account (for payments)
- Cloudinary account (for media)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agrireach.git
   cd agrireach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Authentication
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Payments
   PAYMONGO_SECRET_KEY=your_paymongo_secret_key
   PAYMONGO_PUBLIC_KEY=your_paymongo_public_key
   
   # Media
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- **[Loading Guide](./LOADING_GUIDE.md)** - Loading states and animations
- **[Accessibility Guide](./ACCESSIBILITY.md)** - Accessibility features
- **[PayMongo Setup](./PAYMONGO_SETUP.md)** - Payment integration
- **[Cloudinary Integration](./CLOUDINARY_INTEGRATION.md)** - Media management

## 🎨 Design System

### Color Palette
- **Primary Green**: `#22c55e` - Agricultural theme
- **Secondary Wheat**: `#f59e0b` - Harvest colors
- **Neutral**: `#f8fafc` - Clean backgrounds
- **Dark Mode**: Forest green theme

### Typography
- **Headings**: Montserrat (modern, clean)
- **Body**: Open Sans (readable, friendly)
- **Code**: Geist Mono (technical clarity)

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🌟 Key Features in Detail

### **Smart Job Matching**
- AI-powered skill matching
- Location-based job recommendations
- Experience level filtering
- Urgency-based job prioritization

### **Secure Marketplace**
- Verified seller system
- Product quality assurance
- Secure payment processing
- Delivery tracking system

### **Community Building**
- Agricultural knowledge sharing
- Best practices discussions
- Success story sharing
- Mentorship programs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Team

- **Johannes Randhall De Jesus** - Backend Developer
- **Vincent David P. Ong** - Frontend Developer

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Philippine agricultural communities for inspiration
- Open source contributors
- PayMongo for payment solutions
- Cloudinary for media management
- Vercel for hosting platform

---

**Built with ❤️ for rural communities**

*Connecting Rural Communities Through Sustainable Agriculture*