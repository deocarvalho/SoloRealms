# SoloRealms

A modern web application for interactive adventure books.

## 🎮 Features

### Current MVP Features
- **Book Library**: Browse through multiple adventure books with previews and descriptions
- **Character Selection**: Choose from pre-generated characters with unique stats
- **Interactive Storytelling**: 
  - Dynamic story progression
  - Character stats sidebar
  - Choice-based narrative
  - Dice roll integration
  - Progress tracking
- **Save System**: Auto-save functionality with local storage

### Coming Soon
- Mobile applications (iOS and Android)
- User authentication
- Cloud sync
- Character creation
- Book store
- Combat interface
- Achievements & rewards
- Admin panel
- Export system

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/deocarvalho/SoloRealms.git
cd SoloRealms
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Data Storage**: Local Storage (MVP)
- **Book Format**: JSON-based structure

## 📚 Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── common/      # Reusable UI components
│   ├── features/    # Feature-specific components
│   ├── layout/      # Layout components
│   └── ui/          # Basic UI components
├── core/            # Core business logic
├── lib/             # Library code and utilities
├── services/        # Service layer (API clients, etc.)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

public/              # Static assets
books/              # Book content and resources
scripts/            # Build and utility scripts
```

## 📝 Development Guidelines

### Code Organization

1. **Components**
   - Each component should be in its own directory
   - Follow the feature-based organization pattern
   - Include proper TypeScript types and documentation
   - Keep components small and focused (Single Responsibility Principle)

2. **State Management**
   - Use React hooks for local state
   - Keep state as close as possible to where it's used
   - Use proper TypeScript types for state

3. **TypeScript**
   - Use strict type checking
   - Define interfaces for all props and state
   - Use proper type imports/exports

4. **Styling**
   - Use Tailwind CSS for styling
   - Follow consistent naming conventions
   - Keep styles modular and reusable

### Best Practices

1. **Clean Code**
   - Write self-documenting code
   - Use meaningful variable and function names
   - Keep functions small and focused
   - Follow SOLID principles

2. **Testing**
   - Write unit tests for components
   - Test business logic thoroughly
   - Use proper test organization

3. **Performance**
   - Optimize images and assets
   - Use proper loading strategies
   - Implement proper error boundaries

4. **Accessibility**
   - Use semantic HTML
   - Include proper ARIA attributes
   - Ensure keyboard navigation works
   - Test with screen readers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📫 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/deocarvalho/SoloRealms](https://github.com/deocarvalho/SoloRealms)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Inspired by classic solo adventure books and modern interactive fiction 