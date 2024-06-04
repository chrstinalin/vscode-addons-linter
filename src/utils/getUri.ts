import { Uri } from "vscode";

import { getWorkspaceFolder } from "../extension";

export function getUri(docUri?: Uri) {
  const docPath = docUri?.fsPath;
  console.log("docpath", docPath);
  const rootPath = getWorkspaceFolder().uri.fsPath;
  console.log("split path", docPath?.split(rootPath));
  const filepath = docPath?.split(rootPath)?.at(1)?.substring(1);
  return { rootPath, filepath };
}

export function getFullUri(rootPath: string, filepath: string){
  return Uri.file(`${rootPath}/${filepath}`);
}