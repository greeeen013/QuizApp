# Quiz Maker - Mobile Application

## Overview

Quiz Maker is a single-user, local-first mobile quiz application built with React Native and Expo. The app allows users to create custom tests/quizzes, run them with customizable settings (shuffle, timer), track their performance history, and maintain daily streaks. It features a minimalist design with Material Design 3 principles, tab-based navigation, and comprehensive quiz management capabilities including question reordering, answer validation, and mistake review/retry functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Platform**
- **React Native with Expo SDK 54**: Cross-platform mobile development (iOS, Android, Web)
- **New Architecture Enabled**: Leverages React Native's new architecture for improved performance
- **React 19**: Latest React version with concurrent features
- **Expo Router Alternative**: Custom navigation using React Navigation instead of file-based routing

**Navigation Structure**
- **Bottom Tab Navigator**: Two main tabs (Tests Library, History)
- **Stack Navigators**: Nested stack navigators for each tab's flow
- **Modal Presentations**: Settings, quiz editing, and quiz running screens presented as modals
- **Navigation Hierarchy**:
  - Main Tab Navigator (Tests, History)
  - Tests Stack (Library → Editor → Question Editor)
  - History Stack (List → Detail)
  - Global Modals (Settings, PreQuiz, ActiveQuiz, Results, ReviewMistakes)

**State Management**
- **React Context + Hooks**: Custom store implementation via `StoreProvider` and `useStore`
- **Local Storage**: AsyncStorage for persistent data (quizzes, runs, settings, streak data)
- **TanStack Query**: Client-side data fetching and caching (prepared for future server integration)
- **No Authentication**: Single-user application, all data stored locally

**UI/UX Design System**
- **Theme System**: Light/dark mode support via custom `useTheme` hook
- **Color Palette**: Tailwind-inspired color system with semantic naming
- **Animation**: React Native Reanimated for performant animations
- **Haptic Feedback**: Expo Haptics for tactile user interactions
- **Gesture Handling**: React Native Gesture Handler for smooth interactions
- **Blur Effects**: Platform-specific blur effects (iOS native, fallback for Android)

**Component Architecture**
- **Atomic Design Pattern**: Reusable components (Button, Card, FAB, ToggleSwitch, etc.)
- **Themed Components**: ThemedView, ThemedText for consistent styling
- **Animated Components**: Spring-based animations for interactive elements
- **Keyboard Management**: react-native-keyboard-controller for input handling

### Data Models

**Core Entities**
1. **Quiz**: Test container with title, description, timestamps, and questions array
2. **Question**: Individual question with text, orderIndex for manual sequencing, and answers
3. **Answer**: Answer option with text and isCorrect boolean flag
4. **QuizRun**: History record with score, timestamps, and detailed answer tracking
5. **Settings**: User preferences (display name, avatar preset, default shuffle)
6. **Streak**: Daily completion tracking (current streak, last completion date)

**Data Relationships**
- Quiz → hasMany Questions (ordered by orderIndex)
- Question → hasMany Answers (one marked as correct)
- QuizRun → belongsTo Quiz (stores quizId and quizTitle for orphaned run handling)
- QuizRun → tracks individual QuizRunAnswers (questionId, selectedAnswerId, isCorrect)

**Storage Strategy**
- **Local-First**: All data persisted via AsyncStorage in JSON format
- **No Server Dependency**: Fully functional offline application
- **Data Persistence Keys**: Separate storage keys for quizzes, runs, settings, and streak
- **Migration Ready**: Store structure allows future migration to server-based storage

### Key Features Implementation

**Quiz Creation & Management**
- Create/Edit/Delete quizzes with title and description
- Add/Edit/Delete questions with multiple answers
- Manual question reordering via drag-and-drop (orderIndex field)
- Answer validation (at least one correct answer per question)
- Auto-save on navigation/close

**Quiz Execution**
- Pre-quiz settings screen (shuffle toggle, future timer support)
- Instant answer feedback (green/red visual states)
- Question shuffling (respects orderIndex when disabled)
- Progress tracking during active quiz
- Haptic feedback for interactions

**Results & Analysis**
- Animated score circle with percentage display
- Detailed breakdown (correct/wrong counts)
- Review mistakes functionality
- Retry mistakes mode (mini-runs that don't save to history)
- History filtering by specific quiz

**Streak System**
- Calendar-day based streak tracking (00:00-23:59)
- Increments on first completion each day
- Resets to zero if a day is skipped
- Visual badge display with fire icon

**Settings & Personalization**
- User display name (stored locally)
- Avatar preset selection (3 geometric shapes with primary color)
- Default shuffle preference
- Theme preferences (automatic light/dark mode)

### Build & Development

**Development Scripts**
- `expo:dev`: Development server with Replit environment configuration
- `server:dev`: Express server for future API integration
- `all:dev`: Concurrent Expo and server development

**Build Process**
- Custom build script for static export
- Replit deployment with domain configuration
- Support for iOS, Android, and Web platforms
- Environment variable management for Replit domains

**Code Quality**
- TypeScript with strict mode
- ESLint with Expo and Prettier configurations
- Path aliases (@/ for client, @shared/ for shared code)
- Module resolution for React Native extensions

## External Dependencies

### Runtime Dependencies

**React Native & Expo**
- `expo ^54.0.23`: Core Expo SDK
- `react-native 0.81.5`: React Native framework
- `react 19.1.0`: React library
- `@react-navigation/*`: Navigation libraries (native, stack, bottom-tabs)

**UI & Animation**
- `react-native-reanimated ~4.1.1`: Performant animations
- `react-native-gesture-handler ~2.28.0`: Gesture recognition
- `expo-blur ^15.0.7`: Blur effects for iOS
- `expo-haptics ~15.0.7`: Haptic feedback
- `expo-symbols ~1.0.7`: SF Symbols support
- `react-native-svg ^15.15.1`: SVG rendering

**State & Data**
- `@tanstack/react-query ^5.90.7`: Data fetching and caching
- `drizzle-orm ^0.39.3`: SQL ORM (prepared for future database integration)
- `drizzle-zod ^0.7.0`: Zod schema integration
- `zod ^3.24.2`: Runtime type validation

**Utilities**
- `expo-constants ~18.0.9`: Environment constants
- `expo-linking ~8.0.8`: Deep linking support
- `react-native-keyboard-controller 1.18.5`: Keyboard management
- `react-native-safe-area-context ~5.6.0`: Safe area handling

### Server Dependencies (Prepared for Future Use)

**Backend Framework**
- `express ^4.21.2`: HTTP server
- `http-proxy-middleware ^3.0.5`: Proxy for development

**Database**
- `pg ^8.16.3`: PostgreSQL client (configured but not actively used)
- Drizzle configured for PostgreSQL with schema in `shared/schema.ts`

**Development Tools**
- `tsx ^4.20.6`: TypeScript execution
- `ws ^8.18.0`: WebSocket support
- `esbuild`: Bundling for server production build

### Database Configuration

**Current State**: Database is configured via `drizzle.config.ts` and schema is defined in `shared/schema.ts`, but the application currently operates entirely with local storage (AsyncStorage). The database setup is prepared for future migration to server-based architecture.

**Schema Defined**: User table with username/password fields (template for future authentication features)

**Migration Path**: The store architecture allows seamless transition from local storage to database-backed storage without major refactoring.