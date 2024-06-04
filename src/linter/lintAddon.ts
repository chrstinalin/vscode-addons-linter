import * as linter from "addons-linter";
import * as vscode from "vscode";

import Message, { MessageType } from "../config/message";
import { getDiagnosticCollection } from "../extension";
import { getFullUri, getUri } from "../utils/getUri";

async function formatNotice (rootPath: string, n: Message) {
    const typeToSeverity = (type: MessageType) => {
        switch(type){
            case "error": return vscode.DiagnosticSeverity.Error;
            case "notice": return vscode.DiagnosticSeverity.Information;
            case "warning": return vscode.DiagnosticSeverity.Warning;
        }
    };

    const fileUri = getFullUri(rootPath, n.file);
    const buffer = await vscode.workspace.fs.readFile(fileUri) || new Uint8Array();
    const fileText = buffer?.toString()?.split("\n");
    const lineNumber = n.line ? n.line - 1 : 0;
    const lineText = fileText?.at(lineNumber);

    const startChar = n.line ? lineText?.match(/\S/)?.index : 0; 
    const endChar = n.line ? lineText?.length : 0;
    const startPosition = new vscode.Position(lineNumber, startChar ?? 0);
    const endPosition = new vscode.Position(lineNumber, endChar ?? 0);
    const range = new vscode.Range(startPosition, endPosition);
    
    const diagnostic: vscode.Diagnostic = 
    {
        range,
        severity: typeToSeverity(n._type),
        message: n.message,
        source: "addons-linter",
        code: n.code
    };
    
    return diagnostic;
}

export async function lintWorkspace(){
    
    const { rootPath } = getUri();

    const linterOptions: linter.Options = {
        config: {
                _: [rootPath],
                logLevel: process.env.VERBOSE ? "debug" : "fatal",
                stack: Boolean(process.env.VERBOSE),
                pretty: true,
                warningsAsErrors: false,
                metadata: false,
                output: "none",
                boring: false,
                selfHosted: false
            },
        runAsBinary: false,
    };

    const instance = linter.createInstance(linterOptions);
    const lintResults = await instance.run();

    const diagnosticCollection = getDiagnosticCollection();
    const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();

    const populateDiagnostic = async (messages: Message[]) => {
        for (const message of messages) {
            const diagnostic = await formatNotice(rootPath, message);
            if (diagnosticMap.has(message.file)) {
                diagnosticMap.get(message.file)?.push(diagnostic);            
            } else {
                diagnosticMap.set(message.file, [diagnostic]);
            }
        }
    };

    await populateDiagnostic(lintResults.errors as Message[]);
    await populateDiagnostic(lintResults.warnings as Message[]);
    await populateDiagnostic(lintResults.notices as Message[]);

    diagnosticMap.forEach((diagnostics, file) => {
        const uri = getFullUri(rootPath, file);
        diagnosticCollection.set(uri, diagnostics);
    });
}

export async function clearLintsOnDirty(event: vscode.TextDocumentChangeEvent){
    const { document } = event;
    if(document.isDirty){
        const diagnosticCollection = getDiagnosticCollection();
        diagnosticCollection.delete(document.uri);
    }
}