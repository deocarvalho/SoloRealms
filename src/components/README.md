# Components Directory Structure

This directory follows a feature-based organization pattern for better maintainability and scalability.

## Directory Structure

```
components/
├── common/           # Reusable UI components
│   ├── Button/
│   ├── Modal/
│   └── Input/
├── layout/          # Layout components
│   ├── Header/
│   ├── Footer/
│   └── Sidebar/
├── features/        # Feature-specific components
│   ├── adventure/
│   │   ├── AdventureReader/
│   │   └── AdventureControls/
│   └── character/
└── ui/             # Basic UI components
    ├── icons/
    └── typography/
```

## Component Guidelines

1. Each component should be in its own directory with the following structure:
   ```
   ComponentName/
   ├── index.tsx        # Main component file
   ├── ComponentName.tsx # Component implementation
   ├── ComponentName.test.tsx # Tests
   ├── ComponentName.styles.ts # Styles (if using styled-components)
   └── ComponentName.types.ts  # Type definitions
   ```

2. Follow these principles:
   - Single Responsibility Principle
   - Keep components small and focused
   - Use TypeScript for type safety
   - Include proper documentation
   - Write unit tests
   - Use proper prop types and interfaces 