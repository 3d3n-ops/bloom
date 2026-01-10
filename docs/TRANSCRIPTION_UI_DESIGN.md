# Transcription UI/UX Design

## Visual Design Specifications

This document outlines the user interface design for the real-time transcription feature integrated into the Bloom Notes editor.

## Recording Interface

### Location in Editor

The recording controls will be integrated into the Editor's MenuBar component, positioned on the right side of the formatting toolbar.

```
┌─────────────────────────────────────────────────────────┐
│ [B] [I] [U] [H1] [•] [1.] [Link] [Image] ... [🎤 Record] │
└─────────────────────────────────────────────────────────┘
```

### Recording Button States

#### 1. Idle State
```
┌─────────────┐
│  🎤 Record  │  (Pink background, white icon/text)
└─────────────┘
```
- **Color**: `bg-pink-500 text-white`
- **Hover**: `bg-pink-600`
- **Icon**: Mic icon from lucide-react
- **Tooltip**: "Start recording"

#### 2. Recording State
```
┌──────────────────────────────┐
│  ⏹️ Stop  🔴 Recording...   │
└──────────────────────────────┘
```
- **Stop Button**: Red background (`bg-red-500`)
- **Indicator**: Pulsing red dot animation
- **Text**: "Recording..." in gray
- **Visual**: Continuous pulsing animation

#### 3. Processing State
```
┌─────────────────────────────────────────────┐
│  ⏹️ Stop  🔄 Transcribing... [Layer 1/3]  │
└─────────────────────────────────────────────┘
```
- **Spinner**: Animated loading spinner
- **Progress**: "Layer 1/3", "Layer 2/3", "Layer 3/3"
- **Color**: Pink spinner matching brand

#### 4. Complete State
```
┌─────────────────────────────┐
│  ✅ Transcribed  🎤 Record  │
└─────────────────────────────┘
```
- **Success Icon**: Checkmark (briefly shown)
- **Returns to**: Idle state after 2 seconds

## Real-Time Text Display

### Progressive Text Updates

As each layer completes, the text in the editor updates with visual feedback:

#### Layer 1 Complete (Raw Transcription)
```
┌─────────────────────────────────────────┐
│  hello um this is a test of the system  │  (Gray, italic)
└─────────────────────────────────────────┘
```
- **Style**: `text-gray-400 italic`
- **Indicator**: Small badge showing "Transcribing..."

#### Layer 2 Complete (Refined Text)
```
┌─────────────────────────────────────────┐
│  Hello, this is a test of the system.   │  (Normal, black)
└─────────────────────────────────────────┘
```
- **Style**: `text-gray-900` (normal)
- **Indicator**: Badge updates to "Refining..."

#### Layer 3 Complete (Formatted Notes)
```
┌─────────────────────────────────────────┐
│  # Test Session                         │
│                                         │
│  This is a test of the system.          │
└─────────────────────────────────────────┘
```
- **Style**: Fully formatted with headings, bullets, etc.
- **Indicator**: Badge shows "Formatting..." then disappears

### Visual Feedback Animation

```typescript
// CSS Animation for text updates
@keyframes textAppear {
  0% {
    opacity: 0;
    transform: translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.transcribed-text {
  animation: textAppear 0.3s ease-out;
}
```

## Editor Integration Points

### Insertion Point

Transcribed text is inserted at the current cursor position in the editor:

```
┌─────────────────────────────────────────┐
│  Existing note content...               │
│                                         │
│  [Cursor Here]                          │
│  ↓                                      │
│  [Transcribed text appears here]        │
└─────────────────────────────────────────┘
```

### Visual Distinction (Optional)

Transcribed text can be visually distinguished from typed text:

- **Transcribed**: Light pink background (`bg-pink-50`)
- **Typed**: Normal background
- **Fade**: Background fades after 5 seconds

## Progress Indicator

### Detailed Progress View (Expandable)

When recording, users can expand a detailed view:

```
┌─────────────────────────────────────────┐
│  🔴 Recording - 00:45                   │
│  ─────────────────────────────────────  │
│  Layer 1: ✓ Complete (234ms)            │
│  Layer 2: ⏳ Processing... (156ms)      │
│  Layer 3: ⏸ Pending                    │
└─────────────────────────────────────────┘
```

### Compact Progress Indicator

```
┌─────────────────────────────┐
│  🔴 ●●●○○  [Layer 2/3]     │
└─────────────────────────────┘
```
- **Dots**: Filled = complete, Empty = pending
- **Current**: Highlighted in pink

## Error States

### Error Display

```
┌─────────────────────────────────────────┐
│  ⚠️ Transcription failed                │
│  [Retry] [Continue Recording]           │
└─────────────────────────────────────────┘
```

- **Color**: `text-red-500`
- **Actions**: Retry current chunk or continue

### Network Error

```
┌─────────────────────────────────────────┐
│  ⚠️ Connection lost. Retrying...        │
│  [Cancel]                                │
└─────────────────────────────────────────┘
```

## Settings & Preferences

### Recording Settings Panel

Accessible from editor settings or recording button dropdown:

```
┌─────────────────────────────────────────┐
│  Recording Settings                     │
│  ─────────────────────────────────────  │
│  Audio Quality: [High ▼]                │
│  Chunk Size: [2 seconds ▼]              │
│  Auto-format: [✓ Enabled]               │
│  Show raw transcription: [ ]            │
│  Language: [English (US) ▼]             │
└─────────────────────────────────────────┘
```

## Mobile Responsive Design

### Mobile Layout

On smaller screens, the recording button becomes a floating action button:

```
┌─────────────────────────┐
│  [Editor Content]        │
│                          │
│                          │
│                    ┌───┐ │
│                    │🎤 │ │  (Floating)
│                    └───┘ │
└─────────────────────────┘
```

- **Position**: Fixed bottom-right
- **Size**: 56x56px (Material Design FAB)
- **Shadow**: Elevated shadow for depth

## Accessibility

### Keyboard Shortcuts

- **Start Recording**: `Cmd/Ctrl + Shift + R`
- **Stop Recording**: `Cmd/Ctrl + Shift + S`
- **Cancel Recording**: `Esc`

### Screen Reader Support

```typescript
<button
  aria-label={isRecording ? "Stop recording" : "Start recording"}
  aria-live="polite"
  aria-busy={isProcessing}
>
  {isRecording ? <Square /> : <Mic />}
</button>
```

### Visual Indicators

- High contrast colors for states
- Clear iconography
- Text labels alongside icons
- Focus states for keyboard navigation

## Animation Specifications

### Recording Pulse

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.recording-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}
```

### Text Insertion

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-transcription {
  animation: slideIn 0.4s ease-out;
}
```

### Processing Spinner

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.processing-spinner {
  animation: spin 1s linear infinite;
}
```

## Color Palette

### Recording States

- **Idle**: `bg-pink-500` / `hover:bg-pink-600`
- **Recording**: `bg-red-500` / `hover:bg-red-600`
- **Processing**: `bg-pink-400` (lighter, disabled state)
- **Success**: `bg-green-500` (brief flash)

### Text States

- **Raw Transcription**: `text-gray-400 italic`
- **Refined Text**: `text-gray-900`
- **Formatted Notes**: Default editor styles
- **Error**: `text-red-500`

## Component Structure

```
Editor
├── MenuBar
│   ├── Formatting Tools
│   └── RecordingButton
│       ├── Mic Icon (idle)
│       ├── Stop Icon (recording)
│       ├── Spinner (processing)
│       └── Progress Indicator
├── EditorContent
│   └── TranscribedText (inserted at cursor)
│       ├── Layer1Text (gray, italic)
│       ├── Layer2Text (normal)
│       └── Layer3Text (formatted)
└── TranscriptionStatus (optional overlay)
    ├── Progress Bar
    ├── Layer Status
    └── Timing Info
```

## User Flow

### Happy Path

1. User clicks "Record" button
2. Browser requests microphone permission (if first time)
3. Recording starts, button changes to "Stop"
4. Every 2-3 seconds:
   - Audio chunk sent to API
   - Layer 1 completes → Raw text appears (gray)
   - Layer 2 completes → Text refined (normal)
   - Layer 3 completes → Text formatted (final)
5. User clicks "Stop" when done
6. Final chunks processed
7. All text formatted and inserted

### Error Handling Flow

1. If Layer 1 fails → Show error, allow retry
2. If Layer 2 fails → Use Layer 1 output, show warning
3. If Layer 3 fails → Use Layer 2 output, show warning
4. If network fails → Queue chunk, retry when online
5. If API rate limit → Show message, queue processing

## Performance Considerations

### Optimistic Updates

- Show raw transcription immediately (Layer 1)
- Update in-place as refinement completes
- Smooth transitions between states

### Debouncing

- Batch rapid updates
- Smooth scroll to new content
- Prevent editor flickering

### Memory Management

- Clear audio chunks after processing
- Limit transcription history
- Garbage collect old updates

## Future Enhancements

1. **Waveform Visualization**: Show audio waveform while recording
2. **Speaker Identification**: Different colors for different speakers
3. **Timestamp Display**: Show when each segment was transcribed
4. **Edit History**: Track changes from transcription to final format
5. **Export Options**: Export raw transcription, refined text, or formatted notes
6. **Multi-language**: Language selector in settings
7. **Voice Commands**: "New paragraph", "Bullet point", etc.

