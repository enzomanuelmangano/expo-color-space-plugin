#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

type ColorSpace = 'displayP3' | 'SRGB';

interface ApplyOptions {
  colorSpace?: ColorSpace;
  silent?: boolean;
}

/**
 * Detects which Expo config file exists in the current directory
 */
function detectConfigFile(): string | null {
  const configFiles = ['app.json', 'app.config.js', 'app.config.ts'];

  for (const file of configFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

/**
 * Prompts user to select a color space
 */
async function promptColorSpace(): Promise<ColorSpace> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\nWhich color space would you like to use?');
    console.log('1. displayP3 (default) - Wide color gamut, more vibrant colors');
    console.log('2. SRGB - Standard color space\n');

    rl.question('Enter choice (1 or 2, default: 1): ', (answer) => {
      rl.close();
      resolve(answer.trim() === '2' ? 'SRGB' : 'displayP3');
    });
  });
}

/**
 * Checks if plugin is already in the config
 */
function isPluginInConfig(plugins: any[]): boolean {
  if (!Array.isArray(plugins)) return false;

  return plugins.some((plugin) => {
    if (typeof plugin === 'string') {
      return plugin === 'expo-color-space-plugin';
    }
    if (Array.isArray(plugin) && plugin.length > 0) {
      return plugin[0] === 'expo-color-space-plugin';
    }
    return false;
  });
}

/**
 * Modifies app.json to add the plugin
 */
function modifyAppJson(filePath: string, colorSpace: ColorSpace): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);

    if (!config.expo) {
      config.expo = {};
    }

    if (!config.expo.plugins) {
      config.expo.plugins = [];
    }

    // Check if plugin already exists
    if (isPluginInConfig(config.expo.plugins)) {
      console.log('✓ Plugin is already configured in app.json');
      return false;
    }

    // Add the plugin
    config.expo.plugins.push(['expo-color-space-plugin', { colorSpace }]);

    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');

    return true;
  } catch (error) {
    throw new Error(`Failed to modify app.json: ${error}`);
  }
}

/**
 * Modifies app.config.js or app.config.ts to add the plugin
 */
function modifyAppConfigJs(filePath: string, colorSpace: ColorSpace): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if plugin is already mentioned in the file
    if (content.includes('expo-color-space-plugin')) {
      console.log('✓ Plugin is already configured in', path.basename(filePath));
      return false;
    }

    const pluginEntry = `["expo-color-space-plugin", { "colorSpace": "${colorSpace}" }]`;

    // Try to find the plugins array and add to it
    // Pattern 1: plugins: [ ... ]
    const pluginsArrayRegex = /(plugins:\s*\[)/;
    if (pluginsArrayRegex.test(content)) {
      content = content.replace(
        pluginsArrayRegex,
        `$1\n      ${pluginEntry},`
      );
      fs.writeFileSync(filePath, content);
      return true;
    }

    // Pattern 2: "plugins": [ ... ] (JSON style in JS)
    const pluginsArrayJsonRegex = /("plugins":\s*\[)/;
    if (pluginsArrayJsonRegex.test(content)) {
      content = content.replace(
        pluginsArrayJsonRegex,
        `$1\n      ${pluginEntry},`
      );
      fs.writeFileSync(filePath, content);
      return true;
    }

    // Pattern 3: expo: { ... } without plugins array
    const expoObjectRegex = /(expo:\s*\{)/;
    if (expoObjectRegex.test(content)) {
      content = content.replace(
        expoObjectRegex,
        `$1\n    plugins: [\n      ${pluginEntry}\n    ],`
      );
      fs.writeFileSync(filePath, content);
      return true;
    }

    console.log('⚠️  Could not automatically modify', path.basename(filePath));
    console.log('Please manually add the following to your plugins array:');
    console.log(`  ${pluginEntry}`);
    return false;

  } catch (error) {
    throw new Error(`Failed to modify ${path.basename(filePath)}: ${error}`);
  }
}

/**
 * Main apply function
 */
async function apply(options: ApplyOptions = {}): Promise<void> {
  try {
    // Detect config file
    const configFile = detectConfigFile();

    if (!configFile) {
      console.error('❌ No Expo config file found (app.json, app.config.js, or app.config.ts)');
      console.error('Please run this command from your Expo project root directory.');
      process.exit(1);
    }

    console.log('✓ Found config file:', path.basename(configFile));

    // Get color space preference
    const colorSpace = options.colorSpace || await promptColorSpace();

    // Modify the appropriate config file
    const ext = path.extname(configFile);
    let modified = false;

    if (ext === '.json') {
      modified = modifyAppJson(configFile, colorSpace);
    } else if (ext === '.js' || ext === '.ts') {
      modified = modifyAppConfigJs(configFile, colorSpace);
    }

    if (modified) {
      console.log(`\n✅ Successfully added expo-color-space-plugin with ${colorSpace} color space!`);
      console.log('\nNext steps:');
      console.log('  1. Run: bunx expo prebuild --clean');
      console.log('  2. Build your iOS app to see the changes\n');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'apply') {
    // Parse options
    const options: ApplyOptions = {};

    const colorSpaceArg = args.find(arg => arg.startsWith('--colorSpace='));
    if (colorSpaceArg) {
      const value = colorSpaceArg.split('=')[1] as ColorSpace;
      if (value === 'displayP3' || value === 'SRGB') {
        options.colorSpace = value;
      } else {
        console.error('❌ Invalid colorSpace. Use "displayP3" or "SRGB"');
        process.exit(1);
      }
    }

    await apply(options);
  } else {
    console.log('expo-color-space-plugin CLI\n');
    console.log('Usage:');
    console.log('  bunx expo-color-space-plugin apply [options]\n');
    console.log('Options:');
    console.log('  --colorSpace=<displayP3|SRGB>  Set color space without prompting\n');
    console.log('Example:');
    console.log('  bunx expo-color-space-plugin apply');
    console.log('  bunx expo-color-space-plugin apply --colorSpace=displayP3');
  }
}

main();
