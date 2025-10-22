import * as vscode from "vscode";
import { getYamlLineNumber } from "./get-yaml-line-number";

type TranslationFile = {
  path: string;
  languages: string[];
  keyPrefix?: string;
};

/**
 * Extracts the full dotted key path from the cursor position.
 * For example, if cursor is on "hello.foo.bar", it returns the entire key path.
 */
function getFullKeyPathAtCursor(
  editor: vscode.TextEditor,
  position: vscode.Position
): string | null {
  const line = editor.document.lineAt(position.line).text;
  const column = position.character;

  // Find the start of the key path by going backwards until we hit a non-word, non-dot character
  let startIdx = column;
  while (startIdx > 0 && /[\w.]/.test(line[startIdx - 1])) {
    startIdx--;
  }

  // Find the end of the key path by going forwards until we hit a non-word, non-dot character
  let endIdx = column;
  while (endIdx < line.length && /[\w.]/.test(line[endIdx])) {
    endIdx++;
  }

  // Extract the key path
  const keyPath = line.substring(startIdx, endIdx);

  // Ensure we have a valid key (not just dots, and contains at least one word character)
  if (keyPath && /\w/.test(keyPath)) {
    return keyPath;
  }

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  // Command: Find YAML key in current file
  const findKeyCommand = vscode.commands.registerCommand(
    "yamlLineFinder.findKeyInCurrentFile",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const filePath = editor.document.fileName;

      // Show input prompt for the key
      const key = await vscode.window.showInputBox({
        placeHolder: "Enter the YAML key path (e.g., 'server.database.user')",
        title: "Find YAML Key",
      });

      if (!key) {
        return; // User cancelled
      }

      try {
        const location = getYamlLineNumber(filePath, key);
        if (location) {
          // Jump to the line
          const line = location.line - 1; // VSCode uses 0-based line numbering
          const range = new vscode.Range(line, 0, line, 0);
          editor.selection = new vscode.Selection(range.start, range.start);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
          vscode.window.showInformationMessage(
            `Found key at line ${location.line}`
          );
        } else {
          vscode.window.showWarningMessage(
            `Key '${key}' not found in the file`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error finding key: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  // Command: Jump to translation file
  const jumpToTranslationCommand = vscode.commands.registerCommand(
    "yamlLineFinder.jumpToTranslationFile",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const languageId = editor.document.languageId;
      const config = vscode.workspace.getConfiguration("yamlLineFinder");
      const translationFiles = config.get<TranslationFile[]>(
        "translationFiles",
        []
      );

      const translationFile = translationFiles.find((file) =>
        file.languages.includes(languageId)
      );

      if (!translationFile?.path) {
        vscode.window.showErrorMessage(
          `No translation file configured for language '${languageId}'`
        );
        return;
      }

      // Get the full key path (including dots) under the cursor
      const selection = editor.selection;
      const key = getFullKeyPathAtCursor(editor, selection.active);

      if (!key) {
        vscode.window.showErrorMessage("No key found under cursor");
        return;
      }

      try {
        // Resolve the translation file path relative to the workspace root
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
          editor.document.uri
        );
        if (!workspaceFolder) {
          vscode.window.showErrorMessage("No workspace folder open");
          return;
        }

        const resolvedPath = vscode.Uri.joinPath(
          workspaceFolder.uri,
          translationFile.path
        ).fsPath;

        const location = getYamlLineNumber(
          resolvedPath,
          [translationFile.keyPrefix, key].filter(Boolean).join(".")
        );
        if (location) {
          // Open the translation file and jump to the line
          const doc = await vscode.workspace.openTextDocument(location.path);
          const editor = await vscode.window.showTextDocument(doc);
          const line = location.line - 1; // VSCode uses 0-based line numbering
          const range = new vscode.Range(line, 0, line, 0);
          editor.selection = new vscode.Selection(range.start, range.start);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } else {
          vscode.window.showWarningMessage(
            `Key '${key}' not found in translation file`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error jumping to translation file: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  context.subscriptions.push(findKeyCommand, jumpToTranslationCommand);
}

export function deactivate() {}
