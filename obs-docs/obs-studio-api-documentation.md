# OBS Studio Node.js API Documentation

## Overview

This document provides comprehensive documentation for the OBS Studio Node.js API (obs-studio-node). The API is organized into several namespaces and classes that provide access to OBS Studio functionality.

## Namespace Structure

- `api` - Core API functions
- `osn` - OBS Studio Node.js classes
  - `Global` - Global OBS settings and statistics
  - `Audio` - Audio configuration and monitoring
  - `Video` - Video configuration and canvas management
  - `Scene` - Scene management
  - `Input` - Input sources (media, capture devices, etc.)
  - `Filter` - Source filters
  - `Transition` - Scene transitions
  - `Service` - Streaming services
  - `Streaming` - Streaming functionality
  - `Recording` - Recording functionality
  - `ISource` - Base source interface

## Core API Functions (`api` namespace)

### Initialization and Control

```javascript
// Initialize the OBS API
OBS_API_initAPI()

// Destroy the OBS API
OBS_API_destroyOBS_API()

// Set working directory
SetWorkingDirectory(path: string)

// Initiate shutdown sequence
InitShutdownSequence()

// Force crash (for testing)
OBS_API_forceCrash()
```

### Performance and Statistics

```javascript
// Get performance statistics
OBS_API_getPerformanceStatistics()

// Get lagged frames count
GetLaggedFrames()

// Get total frames count
GetTotalFrames()

// Get CPU percentage
GetCPUPercentage()

// Get current frame rate
GetCurrentFrameRate()

// Get average time to render frame
GetAverageTimeToRenderFrame()

// Get disk space available
GetDiskSpaceAvailable()

// Get memory usage
GetMemoryUsage()
```

### Hotkey Management

```javascript
// Query hotkeys
OBS_API_QueryHotkeys()

// Process hotkey status
OBS_API_ProcessHotkeyStatus()
```

### User and Permissions

```javascript
// Set username
SetUsername(username: string)

// Get permissions status
GetPermissionsStatus()

// Request permissions
RequestPermissions(permissions: Permissions)
```

### Settings Management

```javascript
// Browser acceleration
GetBrowserAcceleration()
SetBrowserAcceleration(enabled: boolean)
GetBrowserAccelerationLegacy()

// Media file caching
GetMediaFileCaching()
SetMediaFileCaching(enabled: boolean)
GetMediaFileCachingLegacy()

// Process priority
GetProcessPriority()
SetProcessPriority(priority: string)
GetProcessPriorityLegacy()

// Force GPU rendering
GetForceGPURendering()
SetForceGPURendering(enabled: boolean)
GetForceGPURenderingLegacy()

// SDR/HDR settings
GetSdrWhiteLevel()
SetSdrWhiteLevel(level: number)
GetSdrWhiteLevelLegacy()

GetHdrNominalPeakLevel()
SetHdrNominalPeakLevel(level: number)
GetHdrNominalPeakLevelLegacy()

// Audio buffering
GetLowLatencyAudioBuffering()
SetLowLatencyAudioBuffering(enabled: boolean)
GetLowLatencyAudioBufferingLegacy()
```

## Global Class (`osn::Global`)

### Scene Management

```javascript
// Get output source
getOutputSource()

// Set output source
setOutputSource(sourceId: number)

// Add scene to backstage
addSceneToBackstage(sceneId: number)

// Remove scene from backstage
removeSceneFromBackstage(sceneId: number)

// Get output flags from ID
getOutputFlagsFromId(sourceId: number)
```

### Localization

```javascript
// Get locale
getLocale()

// Set locale
setLocale(locale: string)
```

### Rendering Settings

```javascript
// Get multiple rendering setting
getMultipleRendering()

// Set multiple rendering setting
setMultipleRendering(enabled: boolean)
```

## Audio Class (`osn::Audio`)

### Audio Context

```javascript
// Get audio context
GetAudioContext()

// Set audio context
SetAudioContext(context: object)
```

### Monitoring

```javascript
// Get monitoring device
GetMonitoringDevice()

// Set monitoring device
SetMonitoringDevice(device: string)

// Get monitoring device (legacy)
GetMonitoringDeviceLegacy()

// Get available monitoring devices
GetMonitoringDevices()
```

### Audio Settings

```javascript
// Get legacy settings
GetLegacySettings()

// Set legacy settings
SetLegacySettings(settings: object)

// Get disable audio ducking
GetDisableAudioDucking()

// Set disable audio ducking
SetDisableAudioDucking(enabled: boolean)

// Get disable audio ducking (legacy)
GetDisableAudioDuckingLegacy()
```

## Video Class (`osn::Video`)

### Video Management

```javascript
// Create video context
Create()

// Destroy video context
Destroy()
```

### Statistics

```javascript
// Get skipped frames
GetSkippedFrames()

// Get encoded frames
GetEncodedFrames()
```

### Settings

```javascript
// Get video settings
get()

// Set video settings
set(settings: object)

// Get legacy settings
GetLegacySettings()

// Set legacy settings
SetLegacySettings(settings: object)
```

## Scene Class (`osn::Scene`)

### Creation and Management

```javascript
// Create scene
Create(name: string)

// Create private scene
CreatePrivate(name: string)

// Get scene from name
FromName(name: string)

// Release scene
Release()

// Remove scene
Remove()

// Get as source
AsSource()

// Duplicate scene
Duplicate(newName: string)
```

### Scene Items Management

```javascript
// Add source to scene
AddSource(sourceId: number)

// Find item in scene
FindItem(position: number | name: string)

// Move item in scene
MoveItem(itemId: number, newPosition: number)

// Order items
OrderItems(order: number[])

// Get item at index
GetItemAtIndex(index: number)

// Get all items
GetItems()

// Get items in range
GetItemsInRange(start: number, end: number)
```

### Source Interface Methods

These methods are available on all source types (Scene, Input, Filter, Transition):

```javascript
// Check if configurable
CallIsConfigurable()

// Get properties
CallGetProperties()

// Get settings
CallGetSettings()

// Get slow uncached settings
CallGetSlowUncachedSettings()

// Get source type
CallGetType()

// Get source name
CallGetName()

// Set source name
CallSetName(name: string)

// Get output flags
CallGetOutputFlags()

// Get flags
CallGetFlags()

// Set flags
CallSetFlags(flags: number)

// Get status
CallGetStatus()

// Get source ID
CallGetId()

// Get muted status
CallGetMuted()

// Set muted status
CallSetMuted(muted: boolean)

// Get enabled status
CallGetEnabled()

// Set enabled status
CallSetEnabled(enabled: boolean)

// Release source
CallRelease()

// Remove source
CallRemove()

// Update source
CallUpdate()

// Load source settings
CallLoad()

// Save source settings
CallSave()

// Send message to source
CallSendMessage(message: object)

// Send mouse click to source
CallSendMouseClick(x: number, y: number, button: number, mouseUp: boolean, clickCount: number, modifiers: number)

// Send mouse move to source
CallSendMouseMove(x: number, y: number, modifiers: number)

// Send mouse wheel to source
CallSendMouseWheel(x: number, y: number, modifiers: number)

// Send focus to source
CallSendFocus(focus: boolean)

// Send key click to source
CallSendKeyClick(key: object, keyUp: boolean, modifiers: number)

// Call handler
CallCallHandler()
```

## Input Class (`osn::Input`)

### Creation and Management

```javascript
// Get input types
Types()

// Create input
Create(type: string, name: string, settings: object)

// Create private input
CreatePrivate(type: string, name: string, settings: object)

// Get input from name
FromName(name: string)

// Get public sources
GetPublicSources()

// Duplicate input
Duplicate(newName: string)
```

### Filter Management

```javascript
// Add filter to input
AddFilter(filterId: number)

// Remove filter from input
RemoveFilter(filterId: number)

// Set filter order
SetFilterOrder(filterId: number, newPosition: number)

// Find filter
FindFilter(filterName: string)

// Copy filters from another source
CopyFilters(sourceId: number)

// Get filters
Filters()
```

### Media Properties

```javascript
// Check if active
Active()

// Check if showing
Showing()

// Get width
Width()

// Get height
Height()

// Get volume
GetVolume()

// Set volume
SetVolume(volume: number)

// Get sync offset
GetSyncOffset()

// Set sync offset
SetSyncOffset(offset: number)

// Get audio mixers
GetAudioMixers()

// Set audio mixers
SetAudioMixers(mixers: number)

// Get monitoring type
GetMonitoringType()

// Set monitoring type
SetMonitoringType(type: number)

// Get deinterlace field order
GetDeinterlaceFieldOrder()

// Set deinterlace field order
SetDeinterlaceFieldOrder(order: number)

// Get deinterlace mode
GetDeinterlaceMode()

// Set deinterlace mode
SetDeinterlaceMode(mode: number)
```

### Media Control (for media sources)

```javascript
// Get duration
GetDuration()

// Get current time
GetTime()

// Set current time
SetTime(time: number)

// Play media
Play()

// Pause media
Pause()

// Restart media
Restart()

// Stop media
Stop()

// Get media state
GetMediaState()
```

## Filter Class (`osn::Filter`)

### Creation and Management

```javascript
// Get filter types
Types()

// Create filter
Create(type: string, name: string, settings: object)
```

## Transition Class (`osn::Transition`)

### Creation and Management

```javascript
// Get transition types
Types()

// Create transition
Create(type: string, name: string, settings: object)

// Create private transition
CreatePrivate(type: string, name: string, settings: object)

// Get transition from name
FromName(name: string)
```

### Transition Control

```javascript
// Get active source
GetActiveSource()

// Clear transition
Clear()

// Set transition
Set(sourceId: number)

// Start transition
Start(duration: number)
```

## Service Class (`osn::Service`)

### Creation and Management

```javascript
// Get service types
Types()

// Create service
Create(type: string, name: string, settings: object)

// Destroy service
Destroy()
```

### Service Properties

```javascript
// Get service name
GetName()

// Get service properties
GetProperties()

// Update service
Update(settings: object)

// Get service settings
GetSettings()

// Get legacy settings
GetLegacySettings()

// Set legacy settings
SetLegacySettings(settings: object)
```

## Streaming Class (`osn::Streaming`)

### Properties

```javascript
// Get service
GetService()

// Set service
SetService(service: object)

// Get canvas
GetCanvas()

// Set canvas
SetCanvas(canvasId: number)

// Get video encoder
GetVideoEncoder()

// Set video encoder
SetVideoEncoder(encoder: object)

// Get enforce service bitrate
GetEnforceServiceBirate()

// Set enforce service bitrate
SetEnforceServiceBirate(enabled: boolean)

// Get enable Twitch VOD
GetEnableTwitchVOD()

// Set enable Twitch VOD
SetEnableTwitchVOD(enabled: boolean)

// Get delay
GetDelay()

// Set delay
SetDelay(delay: object)

// Get reconnect settings
GetReconnect()

// Set reconnect settings
SetReconnect(reconnect: object)

// Get network settings
GetNetwork()

// Set network settings
SetNetwork(network: object)

// Get signal handler
GetSignalHandler()

// Set signal handler
SetSignalHandler(handler: function)
```

### Statistics

```javascript
// Get dropped frames
GetDroppedFrames()

// Get total frames
GetTotalFrames()

// Get kilobits per second
GetKBitsPerSec()

// Get data output
GetDataOutput()
```

### Streaming Control

```javascript
// Get available encoders
GetAvailableEncoders()

// Start streaming
Start()

// Stop streaming
Stop()
```

## Recording Class (`osn::Recording`)

### Properties

```javascript
// Get video encoder
GetVideoEncoder()

// Set video encoder
SetVideoEncoder(encoder: object)

// Get signal handler
GetSignalHandler()

// Set signal handler
SetSignalHandler(handler: function)

// Get enable file split
GetEnableFileSplit()

// Set enable file split
SetEnableFileSplit(enabled: boolean)

// Get split type
GetSplitType()

// Set split type
SetSplitType(type: string)

// Get split time
GetSplitTime()

// Set split time
SetSplitTime(time: number)

// Get split size
GetSplitSize()

// Set split size
SetSplitSize(size: number)

// Get file reset timestamps
GetFileResetTimestamps()

// Set file reset timestamps
SetFileResetTimestamps(enabled: boolean)
```

### Recording Control

```javascript
// Get available encoders
GetAvailableEncoders()

// Start recording
Start()

// Stop recording
Stop()

// Split recording file
SplitFile()
```

## Base Source Interface (`osn::ISource`)

The `ISource` interface provides common methods available on all source types (Scene, Input, Filter, Transition). These methods are exposed through the `Call*` methods in each class.

## Data Types

### Permissions Object

```typescript
interface Permissions {
  webcam: boolean
  mic: boolean
}
```

### Source Hotkey Info

```typescript
interface SourceHotkeyInfo {
  sourceName: string
  hotkeyName: string
  hotkeyDesc: string
  hotkeyId: number
}
```

## Error Handling

All methods return `Napi::Value` which can be:

- A value containing the result
- An error object if the operation failed
- `undefined` or `null` for void operations

## Usage Example

```javascript
// Initialize OBS API
const obs = require('obs-studio-node')

// Initialize API
obs.OBS_API_initAPI()

// Create a scene
const scene = obs.osn.Scene.Create('My Scene')

// Create a media source
const mediaSource = obs.osn.Input.Create('ffmpeg_source', 'My Media', { local_file: 'video.mp4' })

// Add source to scene
scene.AddSource(mediaSource.CallGetId())

// Start streaming
const streaming = new obs.osn.Streaming()
streaming.Start()

// Cleanup
obs.OBS_API_destroyOBS_API()
```

## Notes

1. All ID parameters are `uint64_t` (64-bit unsigned integers)
2. String parameters are UTF-8 encoded
3. Object parameters are JSON-serializable
4. Methods prefixed with `Call` are interface methods that delegate to the `ISource` implementation
5. Methods with `Legacy` suffix provide backward compatibility
6. Signal handlers are callback functions for event notifications

## Additional Classes

### Controller Class

The Controller class manages IPC connections to the OBS backend.

```javascript
// Get controller instance
Controller.GetInstance()

// Connect to OBS backend
connect(uri: string)

// Disconnect from OBS backend
disconnect()

// Get current connection
GetConnection()

// Get connection epoch (for stale connection detection)
GetConnectionEpoch()
```

### VideoEncoder Class (`osn::VideoEncoder`)

#### Creation and Management

```javascript
// Create video encoder
Create(type: string, name: string, settings: object)

// Get encoder types
GetTypes()

// Release encoder
Release()

// Finalize encoder (cleanup)
Finalize()
```

#### Properties

```javascript
// Get encoder name
GetName()

// Set encoder name
SetName(name: string)

// Get encoder type
GetType()

// Check if encoder is active
GetActive()

// Get encoder ID
GetId()

// Get last error
GetLastError()

// Get encoder properties
GetProperties()

// Get encoder settings
GetSettings()

// Update encoder settings
Update(settings: object)
```

### AudioEncoder Class (`osn::AudioEncoder`)

#### Creation and Management

```javascript
// Create audio encoder
Create(type: string, name: string, settings: object)

// Release encoder
Release()

// Finalize encoder (cleanup)
Finalize()
```

#### Properties

```javascript
// Get encoder name
GetName()

// Set encoder name
SetName(name: string)

// Get bitrate
GetBitrate()

// Set bitrate
SetBitrate(bitrate: number)
```

### SceneItem Class (`osn::SceneItem`)

#### Basic Properties

```javascript
// Get source of scene item
GetSource()

// Get scene containing this item
GetScene()

// Remove item from scene
Remove()

// Check if item is visible
IsVisible()

// Set item visibility
SetVisible(visible: boolean)

// Check if item is selected
IsSelected()

// Set item selection
SetSelected(selected: boolean)

// Check if item is visible in stream
IsStreamVisible()

// Set stream visibility
SetStreamVisible(visible: boolean)

// Check if item is visible in recording
IsRecordingVisible()

// Set recording visibility
SetRecordingVisible(visible: boolean)
```

#### Transform Properties

```javascript
// Get position
GetPosition()

// Set position
SetPosition(x: number, y: number)

// Get canvas
GetCanvas()

// Set canvas
SetCanvas(canvasId: number)

// Get rotation
GetRotation()

// Set rotation
SetRotation(angle: number)

// Get scale
GetScale()

// Set scale
SetScale(x: number, y: number)

// Get scale filter
GetScaleFilter()

// Set scale filter
SetScaleFilter(filter: string)

// Get alignment
GetAlignment()

// Set alignment
SetAlignment(alignment: number)

// Get bounds
GetBounds()

// Set bounds
SetBounds(width: number, height: number)

// Get bounds alignment
GetBoundsAlignment()

// Set bounds alignment
SetBoundsAlignment(alignment: number)

// Get bounds type
GetBoundsType()

// Set bounds type
SetBoundsType(type: number)

// Get crop settings
GetCrop()

// Set crop settings
SetCrop(left: number, right: number, top: number, bottom: number)

// Get transform info
GetTransformInfo()

// Set transform info
SetTransformInfo(info: object)
```

#### Item Management

```javascript
// Get item ID
GetId()

// Move item up
MoveUp()

// Move item down
MoveDown()

// Move item to top
MoveTop()

// Move item to bottom
MoveBottom()

// Move item to specific position
Move(position: number)

// Begin deferred update
DeferUpdateBegin()

// End deferred update
DeferUpdateEnd()

// Get blending method
GetBlendingMethod()

// Set blending method
SetBlendingMethod(method: number)

// Get blending mode
GetBlendingMode()

// Set blending mode
SetBlendingMode(mode: number)
```

### Fader Class (`osn::Fader`)

#### Creation and Management

```javascript
// Create fader
Create(type: string)

// Destroy fader
Destroy()

// Attach fader to source
Attach(sourceId: number)

// Detach fader from source
Detach()
```

#### Fader Properties

```javascript
// Get decibel level
GetDeziBel()

// Set decibel level
SetDezibel(db: number)

// Get deflection
GetDeflection()

// Set deflection
SetDeflection(deflection: number)

// Get multiplier
GetMultiplier()

// Set multiplier
SetMultiplier(multiplier: number)
```

### Volmeter Class (`osn::Volmeter`)

#### Creation and Management

```javascript
// Create volmeter
Create()

// Destroy volmeter
Destroy()

// Attach volmeter to source
Attach(sourceId: number)

// Detach volmeter from source
Detach()
```

#### Volmeter Data Structure

```typescript
interface VolmeterData {
  source_name: string
  magnitude: number[] // Array of magnitude values per channel
  peak: number[] // Array of peak values per channel
  input_peak: number[] // Array of input peak values per channel
}

interface VolmeterDataArray {
  items: VolmeterData[]
}
```

## Advanced Streaming Classes

### Advanced Streaming Classes

The API includes several advanced streaming classes that inherit from base classes:

1. **AdvancedStreaming** - Extends `Streaming` with additional features
2. **SimpleStreaming** - Simplified streaming interface
3. **AdvancedRecording** - Extended recording features
4. **SimpleRecording** - Simplified recording interface
5. **AdvancedReplayBuffer** - Advanced replay buffer functionality
6. **SimpleReplayBuffer** - Simplified replay buffer

These classes share the same basic methods as their parent classes with additional specialized functionality.

## Utility Classes

### Properties Class

Used for managing source properties dialogs and settings.

### CacheManager Class

Manages caching of source settings and properties for performance.

### CallbackManager Class

Manages callback registration and execution for various events.

## File Output Classes

### FileOutput Class

Base class for file-based output (recording, replay buffer).

### Enhanced Broadcasting Classes

Specialized classes for enhanced broadcasting features:

- `EnhancedBroadcastingAdvancedStreaming`
- `EnhancedBroadcastingSimpleStreaming`

## Network and Reconnection Classes

### Network Class

Manages network settings for streaming.

### Reconnect Class

Manages reconnection settings and logic for streaming interruptions.

### Delay Class

Manages stream delay settings.

## Complete Method Summary

| Category       | Key Methods                                  | Description            |
| -------------- | -------------------------------------------- | ---------------------- |
| **Core API**   | `OBS_API_initAPI`, `OBS_API_destroyOBS_API`  | Initialize and cleanup |
| **Global**     | `getOutputSource`, `setOutputSource`         | Global OBS settings    |
| **Audio**      | `GetAudioContext`, `SetAudioContext`         | Audio configuration    |
| **Video**      | `Create`, `Destroy`, `GetSkippedFrames`      | Video management       |
| **Scene**      | `Create`, `AddSource`, `GetItems`            | Scene operations       |
| **Input**      | `Create`, `GetVolume`, `SetVolume`           | Source management      |
| **Filter**     | `Create`, `Types`                            | Filter operations      |
| **Transition** | `Create`, `Start`, `Set`                     | Transition control     |
| **Service**    | `Create`, `GetProperties`, `Update`          | Service management     |
| **Streaming**  | `Start`, `Stop`, `GetDroppedFrames`          | Streaming control      |
| **Recording**  | `Start`, `Stop`, `SplitFile`                 | Recording control      |
| **Encoder**    | `VideoEncoder.Create`, `AudioEncoder.Create` | Encoder management     |
| **SceneItem**  | `SetVisible`, `SetPosition`, `Move`          | Scene item control     |
| **Fader**      | `Create`, `Attach`, `GetDeziBel`             | Audio fader control    |
| **Volmeter**   | `Create`, `Attach`, `Destroy`                | Volume meter control   |

## Signal Handling

Many classes support signal handlers for event notifications:

```javascript
// Set signal handler for streaming events
streaming.SetSignalHandler((signal, data) => {
  console.log(`Streaming signal: ${signal}`, data)
})

// Set signal handler for recording events
recording.SetSignalHandler((signal, data) => {
  console.log(`Recording signal: ${signal}`, data)
})
```

Common signals include:

- `start` - Operation started
- `stop` - Operation stopped
- `error` - Error occurred
- `stats` - Statistics update
- `file_changed` - File output changed

## Best Practices

1. **Always initialize and cleanup**: Call `OBS_API_initAPI()` first and `OBS_API_destroyOBS_API()` last
2. **Error handling**: Check return values and handle errors appropriately
3. **Resource management**: Release resources when no longer needed
4. **Signal handling**: Use signal handlers for asynchronous events
5. **Performance**: Use deferred updates for multiple scene item changes
6. **Memory**: Be mindful of object references and cleanup

## Common Patterns

### Creating a Basic Streaming Setup

```javascript
// 1. Initialize
obs.OBS_API_initAPI()

// 2. Create scene
const scene = obs.osn.Scene.Create('Main Scene')

// 3. Add sources
const webcam = obs.osn.Input.Create('video_capture', 'Webcam', {})
scene.AddSource(webcam.CallGetId())

// 4. Configure streaming
const service = obs.osn.Service.Create('rtmp_common', 'Twitch', {
  server: 'rtmp://live.twitch.tv/app/',
  key: 'stream_key'
})

const streaming = new obs.osn.Streaming()
streaming.SetService(service)
streaming.SetSignalHandler(handleStreamingEvents)

// 5. Start streaming
streaming.Start()

// 6. Cleanup
streaming.Stop()
obs.OBS_API_destroyOBS_API()
```

### Recording with Multiple Sources

```javascript
// Create scene with multiple sources
const scene = obs.osn.Scene.Create('Recording Scene')

// Add display capture
const display = obs.osn.Input.Create('display_capture', 'Display', {})
scene.AddSource(display.CallGetId())

// Add audio input
const microphone = obs.osn.Input.Create('wasapi_input_capture', 'Mic', {})
scene.AddSource(microphone.CallGetId())

// Configure recording
const recording = new obs.osn.Recording()
recording.SetSignalHandler(handleRecordingEvents)
recording.SetVideoEncoder(obs.osn.VideoEncoder.Create('obs_x264', 'Recording', {}))

// Start recording
recording.Start()
```

This completes the comprehensive documentation of the OBS Studio Node.js API.
