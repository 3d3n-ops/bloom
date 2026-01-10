# Three-Layer Transcription System - System Design

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Audio Capture│→ │ Chunking     │→ │ API Client   │ │
│  │ (MediaRecorder│  │ (2-3s chunks)│  │ (Fetch/SSE)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)                │
│  ┌──────────────────────────────────────────────────┐ │
│  │  /api/transcribe/stream                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │ │
│  │  │ Layer 1      │→ │ Layer 2      │→ │ Layer 3 │ │ │
│  │  │ Parakeet-TDT │  │ Groq/DeepSeek│  │ Claude/  │ │ │
│  │  │ (200-500ms)  │  │ (100-400ms)  │  │ Gemini  │ │ │
│  │  └──────────────┘  └──────────────┘  │(300-800)│ │ │
│  │                                         └─────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Editor (Client)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ SSE Handler  │→ │ Text Updater │→ │ Editor       │ │
│  │ (Real-time)  │  │ (Progressive)│  │ (Tiptap)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Layer Specifications

### Layer 1: Initial Transcription

**Purpose**: Convert audio to text with high speed and accuracy

**Technology**:
- **Primary**: NVIDIA Parakeet-TDT-0.6B-V2
- **Integration**: Hugging Face Inference API or NVIDIA NeMo
- **Fallback**: Web Speech API (browser-based)

**Input**: 
- Audio chunk (2-3 seconds)
- Format: WebM/Opus or WAV/PCM
- Sample rate: 16kHz mono

**Output**:
- Raw transcription text
- Confidence score
- Timestamps (optional)

**Performance**:
- Latency: 200-500ms
- Accuracy: ~98% WER
- Throughput: 60 minutes/second

### Layer 2: Text Refinement

**Purpose**: Clean up transcription errors and improve readability

**Technology**:
- **Primary**: Groq API with Gemini 2.0 Flash or DeepSeek R1
- **Alternative**: DeepSeek API
- **Fallback**: Return raw text if refinement fails

**Input**:
- Raw transcription from Layer 1
- Previous context (optional)
- Session metadata

**Output**:
- Refined text (corrected, punctuated)
- List of improvements made
- Confidence in corrections

**Performance**:
- Latency: 100-400ms
- Improvement rate: ~5-10% error reduction

**Refinement Tasks**:
- Fix transcription errors
- Add punctuation
- Correct capitalization
- Remove filler words ("um", "uh", "like")
- Fix grammar issues
- Maintain original meaning

### Layer 3: Note Formatting

**Purpose**: Structure text into well-formatted notes

**Technology**:
- **Primary**: Claude Opus (Anthropic API)
- **Alternative**: Gemini 2.0 (Google AI or Groq)
- **Fallback**: Basic HTML formatting

**Input**:
- Refined text from Layer 2
- Previous notes context (optional)
- Formatting preferences

**Output**:
- HTML-formatted notes
- Structured with headings, bullets, lists
- Properly emphasized content

**Performance**:
- Latency: 300-800ms
- Quality: High-quality structured output

**Formatting Tasks**:
- Add headings for topics
- Create bullet points for key ideas
- Format dates and numbers
- Organize content logically
- Add emphasis where appropriate
- Maintain semantic structure

## Data Flow

### Request Flow

```
1. User clicks "Record"
   ↓
2. Browser requests microphone access
   ↓
3. MediaRecorder starts capturing audio
   ↓
4. Every 2-3 seconds:
   a. Audio chunk available
   b. Convert to appropriate format
   c. Send to /api/transcribe/stream
   ↓
5. Server processes through layers:
   a. Layer 1 → Raw text (SSE update)
   b. Layer 2 → Refined text (SSE update)
   c. Layer 3 → Formatted notes (SSE update)
   ↓
6. Client receives updates and updates editor
   ↓
7. User sees progressive text updates
```

### Response Flow (SSE)

```
Server sends:
  data: {"layer": 1, "status": "processing", "chunkId": "chunk-1"}
  data: {"layer": 1, "result": {"text": "hello um test"}, "chunkId": "chunk-1"}
  data: {"layer": 2, "status": "processing", "chunkId": "chunk-1"}
  data: {"layer": 2, "result": {"refinedText": "Hello, test."}, "chunkId": "chunk-1"}
  data: {"layer": 3, "status": "processing", "chunkId": "chunk-1"}
  data: {"layer": 3, "result": {"formattedNotes": "<h2>Test</h2><p>Hello, test.</p>"}, "chunkId": "chunk-1", "complete": true}
```

## API Design

### Endpoint: POST /api/transcribe/stream

**Request**:
```typescript
FormData {
  audio: File,           // Audio chunk (WebM/WAV)
  chunkId: string,       // Unique chunk identifier
  sessionId: string,     // Session identifier
  previousText?: string, // Context for Layer 2
  previousNotes?: string // Context for Layer 3
}
```

**Response** (Server-Sent Events):
```typescript
// Layer 1 processing
{ layer: 1, status: "processing", chunkId: string }

// Layer 1 complete
{ 
  layer: 1, 
  result: { 
    text: string, 
    confidence: number 
  }, 
  chunkId: string 
}

// Layer 2 processing
{ layer: 2, status: "processing", chunkId: string }

// Layer 2 complete
{ 
  layer: 2, 
  result: { 
    refinedText: string, 
    improvements: string[] 
  }, 
  chunkId: string 
}

// Layer 3 processing
{ layer: 3, status: "processing", chunkId: string }

// Layer 3 complete
{ 
  layer: 3, 
  result: { 
    formattedNotes: string // HTML
  }, 
  chunkId: string,
  complete: true 
}

// Error
{ error: string, chunkId: string }
```

## Performance Targets

### Latency Goals

| Metric | Target | Measurement |
|--------|--------|-------------|
| Layer 1 | < 500ms | 90th percentile |
| Layer 2 | < 400ms | 90th percentile |
| Layer 3 | < 800ms | 90th percentile |
| **Total** | **< 2000ms** | **90th percentile** |

### Throughput Goals

- Process chunks faster than recording rate
- Support continuous recording without queuing
- Handle burst scenarios gracefully

### Quality Goals

- Transcription accuracy: > 95% WER
- Refinement improvement: > 5% error reduction
- Formatting quality: User satisfaction > 80%

## Error Handling Strategy

### Layer Failures

1. **Layer 1 Failure**:
   - Show error to user
   - Allow retry
   - Skip chunk if retry fails

2. **Layer 2 Failure**:
   - Use Layer 1 output
   - Show warning indicator
   - Continue with Layer 3

3. **Layer 3 Failure**:
   - Use Layer 2 output
   - Apply basic HTML formatting
   - Show warning indicator

### Network Failures

- Queue chunks for retry
- Show connection status
- Resume when connection restored
- Limit queue size to prevent memory issues

### API Rate Limits

- Implement exponential backoff
- Queue requests when rate limited
- Show rate limit status to user
- Consider upgrading API tier if needed

## Security Considerations

### Data Privacy

- Audio chunks processed immediately
- No persistent storage of raw audio
- Transcriptions stored per user (RLS)
- Encryption in transit (HTTPS)

### API Key Security

- Keys stored in environment variables
- Never exposed to client
- Rotate keys regularly
- Monitor usage for anomalies

### User Data

- Respect user privacy settings
- Allow deletion of transcriptions
- Clear audio data after processing
- Comply with data protection regulations

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- Can scale Next.js instances
- Use external API services (no model hosting)

### Caching Strategy

- Cache similar transcriptions
- Store common patterns
- Reduce API calls for repeated content

### Rate Limiting

- Per-user rate limits
- Per-session limits
- Global API rate limits
- Queue management

## Monitoring & Observability

### Metrics to Track

- Latency per layer
- Success/failure rates
- API costs per session
- User satisfaction scores
- Error types and frequencies

### Logging

- Request/response logs
- Error logs with context
- Performance metrics
- User actions (anonymized)

### Alerts

- High error rates
- Latency spikes
- API failures
- Cost thresholds

## Future Enhancements

### Short-term

- Offline mode with Web Speech API
- Custom formatting templates
- Multi-language support
- Speaker diarization

### Long-term

- On-device processing option
- Custom model fine-tuning
- Advanced formatting AI
- Integration with other tools

## Technology Alternatives

### Layer 1 Alternatives

- **Whisper (OpenAI)**: Higher accuracy, slower
- **AssemblyAI**: Commercial API, good quality
- **Deepgram**: Fast commercial API
- **Web Speech API**: Browser-based, free, lower quality

### Layer 2 Alternatives

- **OpenAI GPT-4o-mini**: Fast, good quality
- **Anthropic Claude Haiku**: Fast, cost-effective
- **Local LLM**: Privacy-focused, requires infrastructure

### Layer 3 Alternatives

- **GPT-4**: High quality, slower
- **Gemini Pro**: Good balance
- **Local LLM**: Privacy, requires GPU infrastructure

## Cost Optimization

### Strategies

1. **Use fastest/cheapest for Layer 2**: Groq is ideal
2. **Cache common patterns**: Reduce redundant API calls
3. **Batch processing**: When possible
4. **Smart fallbacks**: Use cheaper options when appropriate
5. **User limits**: Prevent abuse

### Cost Estimates

See [TRANSCRIPTION_SUMMARY.md](./TRANSCRIPTION_SUMMARY.md) for detailed cost breakdown.

## Implementation Priority

1. **Phase 1**: Basic recording and Layer 1
2. **Phase 2**: Add Layer 2 refinement
3. **Phase 3**: Add Layer 3 formatting
4. **Phase 4**: Real-time streaming updates
5. **Phase 5**: Error handling and polish
6. **Phase 6**: Performance optimization

## Conclusion

This three-layer architecture provides a balance between speed, quality, and cost. The modular design allows for easy swapping of providers and gradual implementation. The streaming architecture ensures users see results in real-time, creating a responsive and engaging experience.

