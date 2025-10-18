# Expo Color Space Plugin 🎨

An Expo config plugin that lets you easily enable P3 Color Space for your app (iOS only). 

📌 By default, React Native renders all colors in the sRGB color space. With this plugin, you can switch to Display P3, a wide-gamut color space to achieve richer and more vibrant colors.

⚠️ Note: If exact color matching with your design files is critical, stick with sRGB. Switching to Display P3 may cause colors in your app to appear more saturated than in your design tools.

<img width="3993" height="3600" alt="color-space" src="https://github.com/user-attachments/assets/adde0ce3-9739-40c5-9290-8e91bcd4d150" />

## Requirements

- Expo SDK 53+

## Installation

```bash
bun add -D expo-color-space-plugin
```

## Quick Setup (Recommended)

After installation, run the apply command to automatically add the plugin to your Expo config:

```bash
bunx expo-color-space-plugin apply
```

This will:
- Detect your Expo config file (`app.json`, `app.config.js`, or `app.config.ts`)
- Prompt you to choose a color space (displayP3 or SRGB)
- Automatically add the plugin to your config

You can also specify the color space directly:

```bash
bunx expo-color-space-plugin apply --colorSpace=displayP3
```

## Manual Setup

Alternatively, you can manually add the plugin to your `app.config.js`/`app.config.ts`/`app.json`:

```javascript
export default {
  expo: {
    name: "Your App",
    slug: "your-app",
    // ... other config
    plugins: [
      // ... other plugins
      "expo-color-space-plugin"
      // Or with custom color space:
      // ["expo-color-space-plugin", { "colorSpace": "displayP3" | "SRGB" }]
    ]
  }
}
```

#### Configuration Options

- `colorSpace` (optional): The color space to apply. Options are:
  - `"displayP3"` (default from package) - Display P3 color space for wide color gamut
  - `"SRGB"` - Standard RGB color space (you get this by default without this plugin)

### 2. Rebuild your iOS app

After adding the plugin, you need to prebuild your iOS app:

```bash
bunx expo prebuild --clean
```

## How it works

There's no real magic here 😅. The plugin [simply adds a single line of code to your iOS AppDelegate](https://github.com/facebook/react-native/pull/42831#issuecomment-2569264896) to set the default color space.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

