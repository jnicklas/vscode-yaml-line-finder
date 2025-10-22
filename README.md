# YAML Line Finder

A VSCode extension that helps you quickly find and jump to YAML keys in your files and translation files.

## Features

- **Find YAML key in current file**: Open a prompt to search for a YAML key and jump to the line where it's defined
- **Jump to translation file**: Jump from a string in your code to the corresponding key in a configured translation file

## Commands

### YAML key: find in current file
- Command ID: `yamlLineFinder.findKeyInCurrentFile`
- Opens an input prompt asking for a YAML key path (using dot notation, e.g., `server.database.user`)
- Jumps to the line where the key is defined in the current file

### YAML: jump to translation file
- Command ID: `yamlLineFinder.jumpToTranslationFile`
- Uses the word under the cursor as the YAML key
- Jumps to that key in the configured translation file for the current file type
- Requires `translationFilePath` configuration

## Configuration

### `yamlLineFinder.translationFilePath`

An object mapping file types to translation file paths. This allows you to configure different translation files for different languages.

**Type**: `object`
**Default**: `{}`
**Scope**: Workspace

**Example configuration in `.vscode/settings.json`**:

```json
{
  "yamlLineFinder.translationFilePath": {
    "javascript": "src/locales/en.yaml",
    "typescript": "src/locales/en.yaml",
    "python": "locales/en.yaml"
  }
}
```

In this example:
- When you're editing a JavaScript file and run "YAML: jump to translation file", it will look for keys in `src/locales/en.yaml`
- When you're editing a TypeScript file, it will also look in `src/locales/en.yaml`
- When you're editing a Python file, it will look in `locales/en.yaml`

## Usage Example

### Finding a key in the current file

1. Open a YAML file (or any text file containing YAML)
2. Run the command "YAML key: find in current file"
3. Type the key path you're looking for (e.g., `users.admin.name`)
4. The editor will jump to the line where that key is defined

### Jumping to a translation file

1. Open a JavaScript/TypeScript file that's configured to use a translation file
2. Place your cursor on a word (the translation key)
3. Run the command "YAML: jump to translation file"
4. The editor will open the translation file and jump to the line where the key is defined

## Requirements

- VSCode 1.90.0 or higher
- Node.js (for development)

## Development

### Installation

```bash
npm install
```

### Building

```bash
npm run compile
```

### Development mode with watch

```bash
npm run watch
```

## License

MIT
