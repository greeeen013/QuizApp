# Quiz Maker - Mobile Design Guidelines

## Architecture Decisions

### Authentication
**No Authentication Required**
- This is a single-user, local-first utility app
- All data stored locally using AsyncStorage
- **Include Settings/Profile Screen** with:
  - User display name field (stored locally)
  - User-customizable avatar (generate 3 minimalist avatar presets: geometric shapes in primary color)
  - App preferences (theme, default shuffle)

### Navigation Structure
**Tab Navigation** (Bottom Tab Bar)
- **2 main tabs:**
  1. **Tests** (Library) - Home icon
  2. **History** - Clock/History icon
- **Floating Action Button (FAB)** for core "Create Test" action (positioned bottom-right, above tab bar)
- **Stack Navigation** for modal flows (Create/Edit Test, Quiz Run, Results)

### Information Architecture
```
Root (Tab Navigator)
├── Tests Library Tab
│   ├── Test List Screen
│   └── [Stack] Test Editor Screen → Question Editor
├── History Tab
│   ├── History List Screen
│   └── History Detail Screen
└── Settings Screen (Modal from Tests tab header)

Global Modals
├── Active Quiz Screen
├── Results Screen
└── Review Mistakes Screen
```

## Screen Specifications

### 1. Tests Library Screen (Default Tab)
**Purpose:** View all created tests, access creation flow

**Layout:**
- **Header:** Custom transparent header
  - Left: None
  - Center: "My Tests" title
  - Right: Settings icon button, Streak badge (🔥 + number)
  - Search bar: No
- **Content:** 
  - Root: FlatList (vertical scrollable)
  - Empty state: "No tests yet" with illustration + "Create your first test" CTA
  - Test cards: Title, description, question count, last edited date
  - Safe area insets: `top: headerHeight + Spacing.xl`, `bottom: tabBarHeight + fabHeight + Spacing.xl`
- **Floating Elements:**
  - FAB (Create Test): Circular button with plus icon
  - Position: `bottom: tabBarHeight + Spacing.lg`, `right: Spacing.lg`
  - Shadow: width: 0, height: 2, opacity: 0.10, radius: 2

### 2. Test Editor Screen
**Purpose:** Create/edit test metadata and manage questions

**Layout:**
- **Header:** Default navigation header (non-transparent)
  - Left: Back button with "Cancel" confirmation if unsaved changes
  - Center: "New Test" or "Edit Test"
  - Right: "Save" button (primary color, disabled if invalid)
  - Search bar: No
- **Content:**
  - Root: ScrollView with form
  - Fields: Test Title (required), Description (optional)
  - Section: "Questions" with drag-handle list
  - Add Question button below list
  - Safe area insets: `top: Spacing.xl`, `bottom: insets.bottom + Spacing.xl`
- **Interaction:**
  - Long-press drag to reorder questions
  - Swipe-to-delete with confirmation alert
  - Tap question card to edit

### 3. Question Editor Screen (Modal)
**Purpose:** Create/edit individual question and answers

**Layout:**
- **Header:** Default navigation header
  - Left: "Cancel"
  - Center: "Question"
  - Right: "Done" (saves and closes)
- **Content:**
  - Root: ScrollView form
  - Question text input (multiline)
  - Answer list (minimum 2, maximum 6)
  - Each answer: Text input + radio button (correct marker)
  - Add Answer button
  - Safe area insets: `top: Spacing.xl`, `bottom: insets.bottom + Spacing.xl`

### 4. Active Quiz Screen (Full-Screen Modal)
**Purpose:** Run the quiz with instant feedback

**Layout:**
- **Header:** Custom minimalist header (transparent)
  - Left: X close button with "Quit Quiz?" confirmation
  - Center: Progress indicator (e.g., "3/10")
  - Right: Timer (if enabled)
- **Content:**
  - Root: Fixed view (not scrollable)
  - Question text (large, centered)
  - Answer buttons list (vertical stack)
  - Safe area insets: `top: headerHeight + Spacing.xl`, `bottom: insets.bottom + Spacing.xl`
- **Interaction:**
  - Tap answer → Instant color change (green/red)
  - 800ms delay → Auto-advance to next question
  - Haptic feedback on correct/wrong

### 5. Results Screen (Modal)
**Purpose:** Display quiz completion summary

**Layout:**
- **Header:** Default navigation header
  - Left: None
  - Center: "Results"
  - Right: X close button
- **Content:**
  - Root: ScrollView
  - Score circle (large, animated)
  - Statistics cards (Correct, Wrong, Time if applicable)
  - Action buttons: "Review Mistakes", "Retry Mistakes", "Done"
  - Safe area insets: `top: Spacing.xl`, `bottom: insets.bottom + Spacing.xl`

### 6. History List Screen (Tab 2)
**Purpose:** View past quiz runs

**Layout:**
- **Header:** Custom transparent header
  - Left: None
  - Center: "History"
  - Right: Filter icon (select quiz to filter)
- **Content:**
  - Root: FlatList
  - Empty state: "No quiz history yet"
  - History cards: Quiz name, date, score badge, stats
  - Safe area insets: `top: headerHeight + Spacing.xl`, `bottom: tabBarHeight + Spacing.xl`

### 7. Settings Screen (Modal from header)
**Purpose:** Configure app preferences

**Layout:**
- **Header:** Default navigation header
  - Left: None
  - Center: "Settings"
  - Right: X close button
- **Content:**
  - Root: ScrollView with grouped sections
  - Profile section (avatar, display name)
  - Appearance (Theme toggle: System/Light/Dark)
  - Quiz defaults (Default Shuffle toggle)
  - Safe area insets: `top: Spacing.xl`, `bottom: insets.bottom + Spacing.xl`

## Design System

### Color Palette (Minimalist Approach)
**Light Mode:**
- Primary: `#4F46E5` (Indigo 600) - Actions, FAB, correct answers
- Success: `#10B981` (Emerald 500) - Correct feedback
- Error: `#EF4444` (Red 500) - Wrong feedback
- Background: `#FFFFFF`
- Surface: `#F9FAFB` (Gray 50) - Cards
- Text Primary: `#111827` (Gray 900)
- Text Secondary: `#6B7280` (Gray 500)
- Border: `#E5E7EB` (Gray 200)

**Dark Mode:**
- Primary: `#6366F1` (Indigo 500)
- Success: `#34D399` (Emerald 400)
- Error: `#F87171` (Red 400)
- Background: `#111827` (Gray 900)
- Surface: `#1F2937` (Gray 800)
- Text Primary: `#F9FAFB` (Gray 50)
- Text Secondary: `#9CA3AF` (Gray 400)
- Border: `#374151` (Gray 700)

### Typography
- **Title Large:** 28pt, Semi-bold (Results score)
- **Title:** 24pt, Semi-bold (Screen titles)
- **Headline:** 20pt, Semi-bold (Card headers)
- **Body:** 16pt, Regular (Default text)
- **Caption:** 14pt, Regular (Metadata, timestamps)
- **Small:** 12pt, Regular (Labels)

### Component Specifications

**Test Card:**
- Padding: Spacing.lg
- Background: Surface color
- Border radius: 12px
- Border: 1px solid Border color
- No shadow
- Press state: Opacity 0.7

**Answer Button (Quiz Mode):**
- Padding: Spacing.md vertical, Spacing.lg horizontal
- Border radius: 8px
- Border: 2px solid Border color
- Default background: Surface
- Press state: Border color → Primary
- Correct state: Background → Success, border → Success
- Wrong state: Background → Error/10% opacity, border → Error

**FAB:**
- Size: 56x56px
- Border radius: 28px (full circle)
- Background: Primary gradient
- Icon: Plus (white, 24px)
- Shadow: EXACT specs - offset (0, 2), opacity 0.10, radius 2
- Press state: Scale 0.95

**Streak Badge:**
- Padding: 6px 12px
- Background: Primary/10% opacity
- Border radius: 16px
- Text: 🔥 + number (Primary color)
- Tappable: Shows streak history modal

**Drag Handle (Question Reorder):**
- Icon: Three horizontal lines (Feather: menu)
- Color: Text Secondary
- Position: Right side of question card
- Active state: Primary color

### Interaction Design

**Reordering Questions:**
- Long-press (500ms) activates drag mode
- Visual feedback: Card lifts with shadow, slight scale increase
- Drop zones: 2px Primary border between cards
- Haptic feedback on pick up and drop

**Instant Feedback:**
- Answer tap → Immediate color change (no delay)
- Haptic: Light impact for correct, medium for wrong
- Visual: Brief pulse animation on button
- Auto-advance after 800ms

**Quiz Shuffle Toggle:**
- Appears on pre-quiz modal
- Toggle switch component (Material 3 style)
- Label: "Shuffle Questions"
- State persists as default if changed in Settings

### Accessibility

- All buttons have minimum 44x44pt touch target
- Color contrast ratio 4.5:1 minimum for text
- Success/Error states include icons (✓ / ✗) in addition to color
- Support Dynamic Type (iOS) / Font Scaling (Android)
- VoiceOver/TalkBack: Announce score changes, question numbers
- Reduce motion: Disable card animations if system preference set

### Critical Assets
1. **User Avatars (3 presets):** Minimalist geometric shapes (circle, square, triangle) in Primary color with white background
2. **Empty State Illustration:** Simple line-art test paper icon (single color)
3. **App Icon:** Minimalist checkmark or quiz card symbol in Primary color