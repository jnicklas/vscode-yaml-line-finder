import * as vscode from "vscode";
import { getYamlLineNumber } from "./get-yaml-line-number";

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
          vscode.window.showInformationMessage(`Found key at line ${location.line}`);
        } else {
          vscode.window.showWarningMessage(`Key '${key}' not found in the file`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error finding key: ${error instanceof Error ? error.message : String(error)}`
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
      const translationFilePaths = config.get<Record<string, string>>(
        "translationFilePath",
        {}
      );

      const translationFilePath = translationFilePaths[languageId];
      if (!translationFilePath) {
        vscode.window.showErrorMessage(
          `No translation file path configured for language '${languageId}'`
        );
        return;
      }

      // Get the word under the cursor
      const selection = editor.selection;
      const word = editor.document.getWordRangeAtPosition(selection.active);

      if (!word) {
        vscode.window.showErrorMessage("No word selected under cursor");
        return;
      }

      const key = editor.document.getText(word);

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
          translationFilePath
        ).fsPath;

        const location = getYamlLineNumber(resolvedPath, key);
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
