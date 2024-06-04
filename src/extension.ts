import * as vscode from "vscode";

import { clearLintsOnDirty, lintWorkspace } from "./linter/lintAddon";

let diagnosticCollection: vscode.DiagnosticCollection;
let workspace: vscode.WorkspaceFolder;

export function getDiagnosticCollection() {
  return diagnosticCollection;
}

export function getWorkspaceFolder() {
  return workspace;
}

export async function activate(context: vscode.ExtensionContext) {
  
  // if no workspace is open, do not activate the linter.
  const topmostWorkspace = vscode.workspace.workspaceFolders?.at(0);
  if(!topmostWorkspace){
      return;
  }
  workspace = topmostWorkspace;

  diagnosticCollection = vscode.languages.createDiagnosticCollection("addons-linter");
  lintWorkspace();

  const changeLintDisposable = vscode.workspace.onDidChangeTextDocument(
    clearLintsOnDirty
  );
  const updateLintDisposable = vscode.workspace.onDidSaveTextDocument(
    lintWorkspace
  );

  context.subscriptions.push(
    updateLintDisposable,
    changeLintDisposable
  );
}

export function deactivate() {
  // Nothing to do yet
}