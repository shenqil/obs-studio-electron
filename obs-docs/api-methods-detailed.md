# OBS Studio Node.js API - Detailed Method Reference

## Table of Contents
1. [Core API Methods](#core-api-methods)
2. [Global Methods](#global-methods)
3. [Audio Methods](#audio-methods)
4. [Video Methods](#video-methods)
5. [Scene Methods](#scene-methods)
6. [Input Methods](#input-methods)
7. [Filter Methods](#filter-methods)
8. [Transition Methods](#transition-methods)
9. [Service Methods](#service-methods)
10. [Streaming Methods](#streaming-methods)
11. [Recording Methods](#recording-methods)
12. [Common Source Methods](#common-source-methods)

## Core API Methods

### `OBS_API_initAPI()`
**Description**: Initialize the OBS API
**Parameters**: None
**Returns**: `Napi::Value` - Success status
**Usage**: Must be called before any other OBS operations

### `OBS_API_destroyOBS_API()`
**Description**: Destroy the OBS API and clean up resources
**Parameters**: None
**Returns**: `Napi::Value` - Success status
**Usage**: Call when done with OBS operations

### `SetWorkingDirectory(path: string)`
**Description**: Set the working directory for OBS
**Parameters**: 
- `path` (string): Directory path
**Returns**: `Napi::Value` - Success status

### `InitShutdownSequence()`
**Description**: Initiate the OBS shutdown sequence
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `OBS_API_getPerformanceStatistics()`
**Description**: Get performance statistics
**Parameters**: None
**Returns**: `Napi::Value` - Object containing performance stats

### `GetLaggedFrames()`
**Description**: Get count of lagged frames
**Parameters**: None
**Returns**: `Napi::Value` - Number of lagged frames

### `GetTotalFrames()`
**Description**: Get total frames rendered
**Parameters**: None
**Returns**: `Napi::Value` - Total frame count

### `GetCPUPercentage()`
**Description**: Get CPU usage percentage
**Parameters**: None
**Returns**: `Napi::Value` - CPU percentage (0-100)

### `GetCurrentFrameRate()`
**Description**: Get current frame rate
**Parameters**: None
**Returns**: `Napi::Value` - Frame rate in FPS

### `GetAverageTimeToRenderFrame()`
**Description**: Get average time to render a frame
**Parameters**: None
**Returns**: `Napi::Value` - Time in milliseconds

### `GetDiskSpaceAvailable()`
**Description**: Get available disk space
**Parameters**: None
**Returns**: `Napi::Value` - Available space in bytes

### `GetMemoryUsage()`
**Description**: Get memory usage
**Parameters**: None
**Returns**: `Napi::Value` - Memory usage in bytes

### `OBS_API_QueryHotkeys()`
**Description**: Query registered hotkeys
**Parameters**: None
**Returns**: `Napi::Value` - Array of hotkey information

### `OBS_API_ProcessHotkeyStatus()`
**Description**: Process hotkey status updates
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `SetUsername(username: string)`
**Description**: Set username for OBS
**Parameters**:
- `username` (string): Username
**Returns**: `Napi::Value` - Success status

### `GetPermissionsStatus()`
**Description**: Get current permissions status
**Parameters**: None
**Returns**: `Napi::Value` - Permissions object

### `RequestPermissions(permissions: Permissions)`
**Description**: Request permissions from user
**Parameters**:
- `permissions` (Permissions object): Requested permissions
**Returns**: `Napi::Value` - Success status

## Global Methods

### `getOutputSource()`
**Description**: Get the current output source
**Parameters**: None
**Returns**: `Napi::Value` - Source ID

### `setOutputSource(sourceId: number)`
**Description**: Set the output source
**Parameters**:
- `sourceId` (uint64_t): Source ID
**Returns**: `Napi::Value` - Success status

### `addSceneToBackstage(sceneId: number)`
**Description**: Add scene to backstage
**Parameters**:
- `sceneId` (uint64_t): Scene ID
**Returns**: `Napi::Value` - Success status

### `removeSceneFromBackstage(sceneId: number)`
**Description**: Remove scene from backstage
**Parameters**:
- `sceneId` (uint64_t): Scene ID
**Returns**: `Napi::Value` - Success status

### `getOutputFlagsFromId(sourceId: number)`
**Description**: Get output flags from source ID
**Parameters**:
- `sourceId` (uint64_t): Source ID
**Returns**: `Napi::Value` - Output flags

### `getLocale()`
**Description**: Get current locale
**Parameters**: None
**Returns**: `Napi::Value` - Locale string

### `setLocale(locale: string)`
**Description**: Set locale
**Parameters**:
- `locale` (string): Locale code
**Returns**: `Napi::Value` - Success status

### `getMultipleRendering()`
**Description**: Get multiple rendering setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `setMultipleRendering(enabled: boolean)`
**Description**: Set multiple rendering
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

## Audio Methods

### `GetAudioContext()`
**Description**: Get audio context settings
**Parameters**: None
**Returns**: `Napi::Value` - Audio context object

### `SetAudioContext(context: object)`
**Description**: Set audio context
**Parameters**:
- `context` (object): Audio context settings
**Returns**: `Napi::Value` - Success status

### `GetMonitoringDevice()`
**Description**: Get current monitoring device
**Parameters**: None
**Returns**: `Napi::Value` - Device name

### `SetMonitoringDevice(device: string)`
**Description**: Set monitoring device
**Parameters**:
- `device` (string): Device name
**Returns**: `Napi::Value` - Success status

### `GetMonitoringDevices()`
**Description**: Get available monitoring devices
**Parameters**: None
**Returns**: `Napi::Value` - Array of device names

### `GetDisableAudioDucking()`
**Description**: Get audio ducking setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `SetDisableAudioDucking(enabled: boolean)`
**Description**: Set audio ducking
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

## Video Methods

### `Create()`
**Description**: Create video context
**Parameters**: None
**Returns**: `Napi::Value` - Video object

### `Destroy()`
**Description**: Destroy video context
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `GetSkippedFrames()`
**Description**: Get skipped frames count
**Parameters**: None
**Returns**: `Napi::Value` - Number of skipped frames

### `GetEncodedFrames()`
**Description**: Get encoded frames count
**Parameters**: None
**Returns**: `Napi::Value` - Number of encoded frames

### `get()`
**Description**: Get video settings
**Parameters**: None
**Returns**: `Napi::Value` - Video settings object

### `set(settings: object)`
**Description**: Set video settings
**Parameters**:
- `settings` (object): Video settings
**Returns**: `Napi::Value` - Success status

## Scene Methods

### `Create(name: string)`
**Description**: Create a new scene
**Parameters**:
- `name` (string): Scene name
**Returns**: `Napi::Value` - Scene object

### `CreatePrivate(name: string)`
**Description**: Create a private scene
**Parameters**:
- `name` (string): Scene name
**Returns**: `Napi::Value` - Scene object

### `FromName(name: string)`
**Description**: Get scene by name
**Parameters**:
- `name` (string): Scene name
**Returns**: `Napi::Value` - Scene object or null

### `Release()`
**Description**: Release scene resources
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Remove()`
**Description**: Remove scene
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `AsSource()`
**Description**: Get scene as source object
**Parameters**: None
**Returns**: `Napi::Value` - Source object

### `Duplicate(newName: string)`
**Description**: Duplicate scene
**Parameters**:
- `newName` (string): New scene name
**Returns**: `Napi::Value` - New scene object

### `AddSource(sourceId: number)`
**Description**: Add source to scene
**Parameters**:
- `sourceId` (uint64_t): Source ID
**Returns**: `Napi::Value` - Scene item ID

### `FindItem(position: number | name: string)`
**Description**: Find item in scene
**Parameters**:
- `position` (number): Item position (0-based)
- OR `name` (string): Item name
**Returns**: `Napi::Value` - Scene item object or null

### `MoveItem(itemId: number, newPosition: number)`
**Description**: Move item to new position
**Parameters**:
- `itemId` (uint64_t): Item ID
- `newPosition` (number): New position (0-based)
**Returns**: `Napi::Value` - Success status

### `OrderItems(order: number[])`
**Description**: Reorder scene items
**Parameters**:
- `order` (number[]): Array of item IDs in new order
**Returns**: `Napi::Value` - Success status

### `GetItemAtIndex(index: number)`
**Description**: Get item at specific index
**Parameters**:
- `index` (number): Index (0-based)
**Returns**: `Napi::Value` - Scene item object

### `GetItems()`
**Description**: Get all scene items
**Parameters**: None
**Returns**: `Napi::Value` - Array of scene items

### `GetItemsInRange(start: number, end: number)`
**Description**: Get items in range
**Parameters**:
- `start` (number): Start index (0-based)
- `end` (number): End index (0-based, exclusive)
**Returns**: `Napi::Value` - Array of scene items

## Input Methods

### `Types()`
**Description**: Get available input types
**Parameters**: None
**Returns**: `Napi::Value` - Array of input type names

### `Create(type: string, name: string, settings: object)`
**Description**: Create input source
**Parameters**:
- `type` (string): Input type
- `name` (string): Source name
- `settings` (object): Source settings
**Returns**: `Napi::Value` - Input object

### `CreatePrivate(type: string, name: string, settings: object)`
**Description**: Create private input source
**Parameters**: Same as `Create`
**Returns**: `Napi::Value` - Input object

### `FromName(name: string)`
**Description**: Get input by name
**Parameters**:
- `name` (string): Source name
**Returns**: `Napi::Value` - Input object or null

### `GetPublicSources()`
**Description**: Get public (non-private) sources
**Parameters**: None
**Returns**: `Napi::Value` - Array of source objects

### `Duplicate(newName: string)`
**Description**: Duplicate input source
**Parameters**:
- `newName` (string): New source name
**Returns**: `Napi::Value` - New input object

### `AddFilter(filterId: number)`
**Description**: Add filter to input
**Parameters**:
- `filterId` (uint64_t): Filter ID
**Returns**: `Napi::Value` - Success status

### `RemoveFilter(filterId: number)`
**Description**: Remove filter from input
**Parameters**:
- `filterId` (uint64_t): Filter ID
**Returns**: `Napi::Value` - Success status

### `SetFilterOrder(filterId: number, newPosition: number)`
**Description**: Change filter order
**Parameters**:
- `filterId` (uint64_t): Filter ID
- `newPosition` (number): New position (0-based)
**Returns**: `Napi::Value` - Success status

### `FindFilter(filterName: string)`
**Description**: Find filter by name
**Parameters**:
- `filterName` (string): Filter name
**Returns**: `Napi::Value` - Filter object or null

### `CopyFilters(sourceId: number)`
**Description**: Copy filters from another source
**Parameters**:
- `sourceId` (uint64_t): Source ID to copy from
**Returns**: `Napi::Value` - Success status

### `Active()`
**Description**: Check if input is active
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `Showing()`
**Description**: Check if input is showing
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `Width()`
**Description**: Get input width
**Parameters**: None
**Returns**: `Napi::Value` - Width in pixels

### `Height()`
**Description**: Get input height
**Parameters**: None
**Returns**: `Napi::Value` - Height in pixels

### `GetVolume()`
**Description**: Get volume level
**Parameters**: None
**Returns**: `Napi::Value` - Volume (0.0-1.0)

### `SetVolume(volume: number)`
**Description**: Set volume level
**Parameters**:
- `volume` (number): Volume (0.0-1.0)
**Returns**: `Napi::Value` - Success status

### `GetSyncOffset()`
**Description**: Get audio sync offset
**Parameters**: None
**Returns**: `Napi::Value` - Offset in milliseconds

### `SetSyncOffset(offset: number)`
**Description**: Set audio sync offset
**Parameters**:
- `offset` (number): Offset in milliseconds
**Returns**: `Napi::Value` - Success status

### `GetAudioMixers()`
**Description**: Get audio mixer settings
**Parameters**: None
**Returns**: `Napi::Value` - Mixer bitmask

### `SetAudioMixers(mixers: number)`
**Description**: Set audio mixer settings
**Parameters**:
- `mixers` (number): Mixer bitmask
**Returns**: `Napi::Value` - Success status

### `GetMonitoringType()`
**Description**: Get monitoring type
**Parameters**: None
**Returns**: `Napi::Value` - Monitoring type enum

### `SetMonitoringType(type: number)`
**Description**: Set monitoring type
**Parameters**:
- `type` (number): Monitoring type enum
**Returns**: `Napi::Value` - Success status

### `GetDeinterlaceFieldOrder()`
**Description**: Get deinterlace field order
**Parameters**: None
**Returns**: `Napi::Value` - Field order enum

### `SetDeinterlaceFieldOrder(order: number)`
**Description**: Set deinterlace field order
**Parameters**:
- `order` (number): Field order enum
**Returns**: `Napi::Value` - Success status

### `GetDeinterlaceMode()`
**Description**: Get deinterlace mode
**Parameters**: None
**Returns**: `Napi::Value` - Deinterlace mode enum

### `SetDeinterlaceMode(mode: number)`
**Description**: Set deinterlace mode
**Parameters**:
- `mode` (number): Deinterlace mode enum
**Returns**: `Napi::Value` - Success status

### `Filters()`
**Description**: Get input filters
**Parameters**: None
**Returns**: `Napi::Value` - Array of filter objects

### `GetDuration()`
**Description**: Get media duration (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Duration in milliseconds

### `GetTime()`
**Description**: Get current media time (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Current time in milliseconds

### `SetTime(time: number)`
**Description**: Set media time (media sources only)
**Parameters**:
- `time` (number): Time in milliseconds
**Returns**: `Napi::Value` - Success status

### `Play()`
**Description**: Play media (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Pause()`
**Description**: Pause media (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Restart()`
**Description**: Restart media (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Stop()`
**Description**: Stop media (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `GetMediaState()`
**Description**: Get media state (media sources only)
**Parameters**: None
**Returns**: `Napi::Value` - Media state enum

## Filter Methods

### `Types()`
**Description**: Get available filter types
**Parameters**: None
**Returns**: `Napi::Value` - Array of filter type names

### `Create(type: string, name: string, settings: object)`
**Description**: Create filter
**Parameters**:
- `type` (string): Filter type
- `name` (string): Filter name
- `settings` (object): Filter settings
**Returns**: `Napi::Value` - Filter object

## Transition Methods

### `Types()`
**Description**: Get available transition types
**Parameters**: None
**Returns**: `Napi::Value` - Array of transition type names

### `Create(type: string, name: string, settings: object)`
**Description**: Create transition
**Parameters**:
- `type` (string): Transition type
- `name` (string): Transition name
- `settings` (object): Transition settings
**Returns**: `Napi::Value` - Transition object

### `CreatePrivate(type: string, name: string, settings: object)`
**Description**: Create private transition
**Parameters**: Same as `Create`
**Returns**: `Napi::Value` - Transition object

### `FromName(name: string)`
**Description**: Get transition by name
**Parameters**:
- `name` (string): Transition name
**Returns**: `Napi::Value` - Transition object or null

### `GetActiveSource()`
**Description**: Get active source in transition
**Parameters**: None
**Returns**: `Napi::Value` - Source ID

### `Clear()`
**Description**: Clear transition
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Set(sourceId: number)`
**Description**: Set transition source
**Parameters**:
- `sourceId` (uint64_t): Source ID
**Returns**: `Napi::Value` - Success status

### `Start(duration: number)`
**Description**: Start transition
**Parameters**:
- `duration` (number): Transition duration in milliseconds
**Returns**: `Napi::Value` - Success status

## Service Methods

### `Types()`
**Description**: Get available service types
**Parameters**: None
**Returns**: `Napi::Value` - Array of service type names

### `Create(type: string, name: string, settings: object)`
**Description**: Create service
**Parameters**:
- `type` (string): Service type
- `name` (string): Service name
- `settings` (object): Service settings
**Returns**: `Napi::Value` - Service object

### `Destroy()`
**Description**: Destroy service
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `GetName()`
**Description**: Get service name
**Parameters**: None
**Returns**: `Napi::Value` - Service name

### `GetProperties()`
**Description**: Get service properties
**Parameters**: None
**Returns**: `Napi::Value` - Properties object

### `Update(settings: object)`
**Description**: Update service settings
**Parameters**:
- `settings` (object): New settings
**Returns**: `Napi::Value` - Success status

### `GetSettings()`
**Description**: Get service settings
**Parameters**: None
**Returns**: `Napi::Value` - Settings object

## Streaming Methods

### `GetService()`
**Description**: Get streaming service
**Parameters**: None
**Returns**: `Napi::Value` - Service object

### `SetService(service: object)`
**Description**: Set streaming service
**Parameters**:
- `service` (object): Service object
**Returns**: `Napi::Value` - Success status

### `GetCanvas()`
**Description**: Get canvas ID
**Parameters**: None
**Returns**: `Napi::Value` - Canvas ID

### `SetCanvas(canvasId: number)`
**Description**: Set canvas
**Parameters**:
- `canvasId` (uint64_t): Canvas ID
**Returns**: `Napi::Value` - Success status

### `GetVideoEncoder()`
**Description**: Get video encoder
**Parameters**: None
**Returns**: `Napi::Value` - Encoder object

### `SetVideoEncoder(encoder: object)`
**Description**: Set video encoder
**Parameters**:
- `encoder` (object): Encoder object
**Returns**: `Napi::Value` - Success status

### `GetEnforceServiceBirate()`
**Description**: Get enforce service bitrate setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `SetEnforceServiceBirate(enabled: boolean)`
**Description**: Set enforce service bitrate
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

### `GetEnableTwitchVOD()`
**Description**: Get Twitch VOD setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `SetEnableTwitchVOD(enabled: boolean)`
**Description**: Set Twitch VOD
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

### `GetDelay()`
**Description**: Get delay settings
**Parameters**: None
**Returns**: `Napi::Value` - Delay object

### `SetDelay(delay: object)`
**Description**: Set delay settings
**Parameters**:
- `delay` (object): Delay object
**Returns**: `Napi::Value` - Success status

### `GetReconnect()`
**Description**: Get reconnect settings
**Parameters**: None
**Returns**: `Napi::Value` - Reconnect object

### `SetReconnect(reconnect: object)`
**Description**: Set reconnect settings
**Parameters**:
- `reconnect` (object): Reconnect object
**Returns**: `Napi::Value` - Success status

### `GetNetwork()`
**Description**: Get network settings
**Parameters**: None
**Returns**: `Napi::Value` - Network object

### `SetNetwork(network: object)`
**Description**: Set network settings
**Parameters**:
- `network` (object): Network object
**Returns**: `Napi::Value` - Success status

### `GetSignalHandler()`
**Description**: Get signal handler
**Parameters**: None
**Returns**: `Napi::Value` - Function reference

### `SetSignalHandler(handler: function)`
**Description**: Set signal handler
**Parameters**:
- `handler` (function): Callback function
**Returns**: `Napi::Value` - Success status

### `GetDroppedFrames()`
**Description**: Get dropped frames count
**Parameters**: None
**Returns**: `Napi::Value` - Number of dropped frames

### `GetTotalFrames()`
**Description**: Get total frames count
**Parameters**: None
**Returns**: `Napi::Value` - Total frame count

### `GetKBitsPerSec()`
**Description**: Get kilobits per second
**Parameters**: None
**Returns**: `Napi::Value` - Bitrate in kbps

### `GetDataOutput()`
**Description**: Get data output statistics
**Parameters**: None
**Returns**: `Napi::Value` - Data output object

### `GetAvailableEncoders()`
**Description**: Get available encoders
**Parameters**: None
**Returns**: `Napi::Value` - Array of encoder names

### `Start()`
**Description**: Start streaming
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Stop()`
**Description**: Stop streaming
**Parameters**: None
**Returns**: `Napi::Value` - Success status

## Recording Methods

### `GetVideoEncoder()`
**Description**: Get video encoder
**Parameters**: None
**Returns**: `Napi::Value` - Encoder object

### `SetVideoEncoder(encoder: object)`
**Description**: Set video encoder
**Parameters**:
- `encoder` (object): Encoder object
**Returns**: `Napi::Value` - Success status

### `GetSignalHandler()`
**Description**: Get signal handler
**Parameters**: None
**Returns**: `Napi::Value` - Function reference

### `SetSignalHandler(handler: function)`
**Description**: Set signal handler
**Parameters**:
- `handler` (function): Callback function
**Returns**: `Napi::Value` - Success status

### `GetEnableFileSplit()`
**Description**: Get file split setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `SetEnableFileSplit(enabled: boolean)`
**Description**: Set file split
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

### `GetSplitType()`
**Description**: Get split type
**Parameters**: None
**Returns**: `Napi::Value` - Split type string

### `SetSplitType(type: string)`
**Description**: Set split type
**Parameters**:
- `type` (string): Split type
**Returns**: `Napi::Value` - Success status

### `GetSplitTime()`
**Description**: Get split time
**Parameters**: None
**Returns**: `Napi::Value` - Time in seconds

### `SetSplitTime(time: number)`
**Description**: Set split time
**Parameters**:
- `time` (number): Time in seconds
**Returns**: `Napi::Value` - Success status

### `GetSplitSize()`
**Description**: Get split size
**Parameters**: None
**Returns**: `Napi::Value` - Size in MB

### `SetSplitSize(size: number)`
**Description**: Set split size
**Parameters**:
- `size` (number): Size in MB
**Returns**: `Napi::Value` - Success status

### `GetFileResetTimestamps()`
**Description**: Get file reset timestamps setting
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `SetFileResetTimestamps(enabled: boolean)`
**Description**: Set file reset timestamps
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

### `GetAvailableEncoders()`
**Description**: Get available encoders
**Parameters**: None
**Returns**: `Napi::Value` - Array of encoder names

### `Start()`
**Description**: Start recording
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `Stop()`
**Description**: Stop recording
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `SplitFile()`
**Description**: Split recording file
**Parameters**: None
**Returns**: `Napi::Value` - Success status

## Common Source Methods

These methods are available on all source types (Scene, Input, Filter, Transition) through their `Call*` methods:

### `CallIsConfigurable()`
**Description**: Check if source is configurable
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `CallGetProperties()`
**Description**: Get source properties
**Parameters**: None
**Returns**: `Napi::Value` - Properties object

### `CallGetSettings()`
**Description**: Get source settings
**Parameters**: None
**Returns**: `Napi::Value` - Settings object

### `CallGetSlowUncachedSettings()`
**Description**: Get slow uncached settings
**Parameters**: None
**Returns**: `Napi::Value` - Settings object

### `CallGetType()`
**Description**: Get source type
**Parameters**: None
**Returns**: `Napi::Value` - Type string

### `CallGetName()`
**Description**: Get source name
**Parameters**: None
**Returns**: `Napi::Value` - Name string

### `CallSetName(name: string)`
**Description**: Set source name
**Parameters**:
- `name` (string): New name
**Returns**: `Napi::Value` - Success status

### `CallGetOutputFlags()`
**Description**: Get output flags
**Parameters**: None
**Returns**: `Napi::Value` - Output flags

### `CallGetFlags()`
**Description**: Get source flags
**Parameters**: None
**Returns**: `Napi::Value` - Source flags

### `CallSetFlags(flags: number)`
**Description**: Set source flags
**Parameters**:
- `flags` (number): New flags
**Returns**: `Napi::Value` - Success status

### `CallGetStatus()`
**Description**: Get source status
**Parameters**: None
**Returns**: `Napi::Value` - Status object

### `CallGetId()`
**Description**: Get source ID
**Parameters**: None
**Returns**: `Napi::Value` - Source ID

### `CallGetMuted()`
**Description**: Get muted status
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `CallSetMuted(muted: boolean)`
**Description**: Set muted status
**Parameters**:
- `muted` (boolean): Mute/unmute
**Returns**: `Napi::Value` - Success status

### `CallGetEnabled()`
**Description**: Get enabled status
**Parameters**: None
**Returns**: `Napi::Value` - Boolean

### `CallSetEnabled(enabled: boolean)`
**Description**: Set enabled status
**Parameters**:
- `enabled` (boolean): Enable/disable
**Returns**: `Napi::Value` - Success status

### `CallRelease()`
**Description**: Release source
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `CallRemove()`
**Description**: Remove source
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `CallUpdate()`
**Description**: Update source
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `CallLoad()`
**Description**: Load source settings
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `CallSave()`
**Description**: Save source settings
**Parameters**: None
**Returns**: `Napi::Value` - Success status

### `CallSendMessage(message: object)`
**Description**: Send message to source
**Parameters**:
- `message` (object): Message object
**Returns**: `Napi::Value` - Success status

### `CallSendMouseClick(x: number, y: number, button: number, mouseUp: boolean, clickCount: number, modifiers: number)`
**Description**: Send mouse click to source
**Parameters**:
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `button` (number): Mouse button
- `mouseUp` (boolean): True for mouse up, false for mouse down
- `clickCount` (number): Click count
- `modifiers` (number): Modifier keys
**Returns**: `Napi::Value` - Success status

### `CallSendMouseMove(x: number, y: number, modifiers: number)`
**Description**: Send mouse move to source
**Parameters**:
- `x` (number): X coordinate
- `y` (number): Y coordinate
- `modifiers` (number): Modifier keys
**Returns**: `Napi::Value` - Success status

### `CallSendMouseWheel(x: number, y: number, modifiers: number)`
**Description**: Send mouse wheel to source
**Parameters**:
- `x` (number): X delta
- `y` (number): Y delta
- `modifiers` (number): Modifier keys
**Returns**: `Napi::Value` - Success status

### `CallSendFocus(focus: boolean)`
**Description**: Send focus event to source
**Parameters**:
- `focus` (boolean): True for focus, false for blur
**Returns**: `Napi::Value` - Success status

### `CallSendKeyClick(key: object, keyUp: boolean, modifiers: number)`
**Description**: Send key click to source
**Parameters**:
- `key` (object): Key information
- `keyUp` (boolean): True for key up, false for key down
- `modifiers` (number): Modifier keys
**Returns**: `Napi::Value` - Success status

### `CallCallHandler()`
**Description**: Call source handler
**Parameters**: None
**Returns**: `Napi::Value` - Handler result