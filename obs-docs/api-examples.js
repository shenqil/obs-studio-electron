// OBS Studio Node.js API Examples
// This file shows common usage patterns for the OBS Studio Node.js API

// Note: This is example code showing the API structure
// Actual implementation may vary based on your build setup

// ============================================================================
// BASIC SETUP AND INITIALIZATION
// ============================================================================

/**
 * Example 1: Basic Initialization and Cleanup
 */
function exampleBasicSetup() {
  // 1. Initialize OBS API (MUST be called first)
  obs.OBS_API_initAPI();
  
  // 2. Set working directory (optional)
  obs.SetWorkingDirectory("C:/obs-studio");
  
  // 3. Do your OBS operations here...
  
  // 4. Clean up (MUST be called when done)
  obs.OBS_API_destroyOBS_API();
}

/**
 * Example 2: Creating a Simple Scene with Sources
 */
function exampleCreateScene() {
  obs.OBS_API_initAPI();
  
  try {
    // Create a scene
    const mainScene = obs.osn.Scene.Create("Main Scene");
    const sceneId = mainScene.CallGetId();
    
    // Create a display capture source
    const displaySettings = {
      monitor: 0,  // Primary monitor
      capture_cursor: true
    };
    const displaySource = obs.osn.Input.Create("display_capture", "Display", displaySettings);
    const displayId = displaySource.CallGetId();
    
    // Add display to scene
    mainScene.AddSource(displayId);
    
    // Create a webcam source
    const webcamSettings = {
      device_id: "default",
      resolution: "1920x1080"
    };
    const webcamSource = obs.osn.Input.Create("video_capture", "Webcam", webcamSettings);
    const webcamId = webcamSource.CallGetId();
    
    // Add webcam to scene
    mainScene.AddSource(webcamId);
    
    // Get all items in the scene
    const sceneItems = mainScene.GetItems();
    console.log(`Scene has ${sceneItems.length} items`);
    
    // Clean up
    displaySource.CallRelease();
    webcamSource.CallRelease();
    mainScene.CallRelease();
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

// ============================================================================
// STREAMING EXAMPLES
// ============================================================================

/**
 * Example 3: Basic Streaming Setup
 */
function exampleStreaming() {
  obs.OBS_API_initAPI();
  
  try {
    // Create a scene
    const streamScene = obs.osn.Scene.Create("Stream Scene");
    
    // Add a source to the scene
    const gameCapture = obs.osn.Input.Create("game_capture", "Game", {
      capture_mode: "any_fullscreen",
      allow_transparency: false
    });
    streamScene.AddSource(gameCapture.CallGetId());
    
    // Create streaming service (Twitch example)
    const twitchService = obs.osn.Service.Create("rtmp_common", "Twitch", {
      service: "Twitch",
      server: "auto",
      key: "YOUR_STREAM_KEY_HERE"
    });
    
    // Create streaming instance
    const streaming = new obs.osn.Streaming();
    
    // Configure streaming
    streaming.SetService(twitchService);
    streaming.SetCanvas(streamScene.CallGetId());
    
    // Set up signal handler for streaming events
    streaming.SetSignalHandler((signal, data) => {
      console.log(`Streaming signal: ${signal}`, data);
      
      switch(signal) {
        case "start":
          console.log("Streaming started successfully");
          break;
        case "stop":
          console.log("Streaming stopped");
          break;
        case "error":
          console.error("Streaming error:", data);
          break;
        case "stats":
          console.log("Stream stats:", data);
          break;
      }
    });
    
    // Start streaming
    console.log("Starting stream...");
    streaming.Start();
    
    // Stream would run here...
    // In a real app, you'd wait for user input or a timer
    
    // Stop streaming
    console.log("Stopping stream...");
    streaming.Stop();
    
    // Clean up
    gameCapture.CallRelease();
    streamScene.CallRelease();
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

/**
 * Example 4: Recording with Custom Settings
 */
function exampleRecording() {
  obs.OBS_API_initAPI();
  
  try {
    // Create recording scene
    const recordScene = obs.osn.Scene.Create("Recording Scene");
    
    // Add sources
    const displaySource = obs.osn.Input.Create("display_capture", "Display", {});
    recordScene.AddSource(displaySource.CallGetId());
    
    const micSource = obs.osn.Input.Create("wasapi_input_capture", "Microphone", {});
    recordScene.AddSource(micSource.CallGetId());
    
    // Create video encoder for recording
    const videoEncoder = obs.osn.VideoEncoder.Create("obs_x264", "Recording Encoder", {
      rate_control: "CBR",
      bitrate: 6000,
      keyint_sec: 2,
      preset: "veryfast",
      profile: "high"
    });
    
    // Create recording instance
    const recording = new obs.osn.Recording();
    
    // Configure recording
    recording.SetVideoEncoder(videoEncoder);
    recording.SetFilePath("C:/Recordings/output.mp4");
    
    // Set up signal handler
    recording.SetSignalHandler((signal, data) => {
      console.log(`Recording signal: ${signal}`, data);
      
      if (signal === "file_changed") {
        console.log("New recording file:", data.file);
      }
    });
    
    // Configure file splitting (split every 30 minutes)
    recording.SetEnableFileSplit(true);
    recording.SetSplitType("time");
    recording.SetSplitTime(1800); // 30 minutes in seconds
    
    // Start recording
    console.log("Starting recording...");
    recording.Start();
    
    // Record for 5 minutes (in real app, you'd wait for user input)
    setTimeout(() => {
      console.log("Stopping recording...");
      recording.Stop();
    }, 5 * 60 * 1000);
    
    // Clean up
    displaySource.CallRelease();
    micSource.CallRelease();
    recordScene.CallRelease();
    videoEncoder.Release();
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

// ============================================================================
// SCENE ITEM MANIPULATION
// ============================================================================

/**
 * Example 5: Scene Item Transformations
 */
function exampleSceneItemManipulation() {
  obs.OBS_API_initAPI();
  
  try {
    // Create scene
    const scene = obs.osn.Scene.Create("Transform Scene");
    
    // Create a color source
    const colorSource = obs.osn.Input.Create("color_source", "Color", {
      color: 0xFF0000, // Red
      width: 400,
      height: 300
    });
    const colorId = colorSource.CallGetId();
    
    // Add to scene and get the scene item
    scene.AddSource(colorId);
    const items = scene.GetItems();
    const colorItem = items[0]; // Assuming it's the first item
    
    // Transform the scene item
    colorItem.SetVisible(true);
    colorItem.SetPosition(100, 100);
    colorItem.SetScale(1.5, 1.5); // Scale to 150%
    colorItem.SetRotation(45); // Rotate 45 degrees
    
    // Set bounds
    colorItem.SetBounds(200, 150);
    colorItem.SetBoundsType(1); // Scale to bounds
    
    // Set crop
    colorItem.SetCrop(10, 10, 10, 10); // Crop 10px from all sides
    
    // Set blending
    colorItem.SetBlendingMode(1); // Normal blending
    
    // Move item in the stack
    colorItem.MoveTop(); // Move to top of stack
    // colorItem.MoveBottom(); // Move to bottom
    // colorItem.MoveUp(); // Move up one
    // colorItem.MoveDown(); // Move down one
    
    // Deferred updates for multiple changes
    colorItem.DeferUpdateBegin();
    colorItem.SetPosition(200, 200);
    colorItem.SetRotation(90);
    colorItem.SetScale(2.0, 2.0);
    colorItem.DeferUpdateEnd();
    
    // Clean up
    colorSource.CallRelease();
    scene.CallRelease();
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

/**
 * Example 6: Audio Control
 */
function exampleAudioControl() {
  obs.OBS_API_initAPI();
  
  try {
    // Create audio source
    const audioSource = obs.osn.Input.Create("wasapi_input_capture", "System Audio", {
      device_id: "default"
    });
    
    // Control audio properties
    audioSource.SetVolume(0.8); // 80% volume
    audioSource.SetMuted(false);
    
    // Get current volume
    const currentVolume = audioSource.GetVolume();
    console.log(`Current volume: ${currentVolume}`);
    
    // Create a fader for smooth volume control
    const fader = obs.osn.Fader.Create("fader_type");
    fader.Attach(audioSource.CallGetId());
    
    // Fade volume from 0% to 100% over 2 seconds
    fader.SetDezibel(-96); // Start at 0% (-96 dB is silence)
    
    // In a real app, you'd animate this over time
    setTimeout(() => {
      fader.SetDezibel(0); // 100% volume (0 dB)
    }, 2000);
    
    // Create a volmeter to monitor audio levels
    const volmeter = obs.osn.Volmeter.Create();
    volmeter.Attach(audioSource.CallGetId());
    
    // Clean up
    setTimeout(() => {
      fader.Detach();
      fader.Destroy();
      volmeter.Detach();
      volmeter.Destroy();
      audioSource.CallRelease();
    }, 3000);
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

// ============================================================================
// ADVANCED EXAMPLES
// ============================================================================

/**
 * Example 7: Multiple Scenes and Transitions
 */
function exampleSceneTransitions() {
  obs.OBS_API_initAPI();
  
  try {
    // Create two scenes
    const scene1 = obs.osn.Scene.Create("Scene 1");
    const scene2 = obs.osn.Scene.Create("Scene 2");
    
    // Add different sources to each scene
    const source1 = obs.osn.Input.Create("color_source", "Blue", { color: 0x0000FF });
    scene1.AddSource(source1.CallGetId());
    
    const source2 = obs.osn.Input.Create("color_source", "Green", { color: 0x00FF00 });
    scene2.AddSource(source2.CallGetId());
    
    // Create a transition
    const transition = obs.osn.Transition.Create("fade_transition", "Fade", {
      duration: 1000 // 1 second fade
    });
    
    // Set up scene switching with transition
    function switchToScene(scene) {
      transition.Set(scene.CallGetId());
      transition.Start(1000); // 1 second transition
    }
    
    // Switch between scenes
    switchToScene(scene1);
    
    setTimeout(() => {
      switchToScene(scene2);
    }, 3000);
    
    setTimeout(() => {
      switchToScene(scene1);
    }, 6000);
    
    // Clean up
    setTimeout(() => {
      source1.CallRelease();
      source2.CallRelease();
      scene1.CallRelease();
      scene2.CallRelease();
      transition.CallRelease();
    }, 9000);
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

/**
 * Example 8: Filters and Effects
 */
function exampleFilters() {
  obs.OBS_API_initAPI();
  
  try {
    // Create a source
    const source = obs.osn.Input.Create("color_source", "Source", { color: 0xFFFFFF });
    
    // Create a filter
    const filter = obs.osn.Filter.Create("color_filter", "Color Correction", {
      brightness: 1.2,
      contrast: 1.1,
      saturation: 0.9
    });
    
    // Add filter to source
    source.AddFilter(filter.CallGetId());
    
    // Get all filters on the source
    const filters = source.Filters();
    console.log(`Source has ${filters.length} filters`);
    
    // Update filter settings
    filter.CallUpdate({
      brightness: 1.5,
      contrast: 1.2
    });
    
    // Remove filter
    source.RemoveFilter(filter.CallGetId());
    
    // Clean up
    filter.CallRelease();
    source.CallRelease();
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

// ============================================================================
// ERROR HANDLING AND BEST PRACTICES
// ============================================================================

/**
 * Example 9: Proper Error Handling
 */
function exampleErrorHandling() {
  // Always wrap OBS operations in try-finally
  obs.OBS_API_initAPI();
  
  try {
    // Check if initialization succeeded
    // (In real code, check return values)
    
    // Create resources
    const scene = obs.osn.Scene.Create("Test Scene");
    
    if (!scene) {
      throw new Error("Failed to create scene");
    }
    
    // Use resources...
    
    // Always release resources
    scene.CallRelease();
    
  } catch (error) {
    console.error("OBS operation failed:", error);
    // Handle error appropriately
    
  } finally {
    // Always clean up, even if errors occurred
    obs.OBS_API_destroyOBS_API();
  }
}

/**
 * Example 10: Performance Monitoring
 */
function examplePerformanceMonitoring() {
  obs.OBS_API_initAPI();
  
  try {
    // Monitor performance periodically
    const performanceInterval = setInterval(() => {
      const stats = obs.OBS_API_getPerformanceStatistics();
      console.log("Performance stats:", stats);
      
      const cpu = obs.osn.Global.GetCPUPercentage();
      const memory = obs.osn.Global.GetMemoryUsage();
      const frames = obs.osn.Global.GetLaggedFrames();
      
      console.log(`CPU: ${cpu}%, Memory: ${memory} bytes, Lagged frames: ${frames}`);
    }, 5000); // Every 5 seconds
    
    // Do other work...
    
    // Clean up interval
    setTimeout(() => {
      clearInterval(performanceInterval);
    }, 30000); // Stop after 30 seconds
    
  } finally {
    obs.OBS_API_destroyOBS_API();
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Uncomment examples to run them
// Note: These are examples and need proper error handling in production

// exampleBasicSetup();
// exampleCreateScene();
// exampleStreaming();
// exampleRecording();
// exampleSceneItemManipulation();
// exampleAudioControl();
// exampleSceneTransitions();
// exampleFilters();
// exampleErrorHandling();
// examplePerformanceMonitoring();

console.log("OBS Studio Node.js API Examples loaded");
console.log("Uncomment examples in the code to run them");