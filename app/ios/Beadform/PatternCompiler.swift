import Foundation
import JavaScriptCore

@MainActor
struct PatternCompiler {
    static func compile(_ recipe: String, width: Int, rows: Int) throws -> BeadPattern {
        struct Recipe: Decodable { let stitch: String; let shape: String; let width: Int; let rows: Int }
        let selected = try JSONDecoder().decode(Recipe.self, from: Data(recipe.utf8))
        guard selected.width == width, selected.rows == rows else {
            throw QwenFailure(message: "Qwen did not return your requested dimensions. Try a clearer description or different dimensions.")
        }
        guard let url = Bundle.main.url(forResource: "pattern-engine", withExtension: "js"),
              let context = JSContext() else { throw QwenFailure(message: "The bundled pattern compiler is missing.") }
        var failure: String?
        context.exceptionHandler = { _, error in failure = error?.toString() ?? "Pattern compilation failed." }
        context.evaluateScript(try String(contentsOf: url, encoding: .utf8))
        guard failure == nil,
              let value = context.objectForKeyedSubscript("mobileCompile")?.call(withArguments: [recipe]),
              failure == nil, let json = value.toString(), let data = json.data(using: .utf8) else {
            throw QwenFailure(message: failure ?? "The pattern could not be checked.")
        }
        struct Compiled: Decodable {
            let title: String; let technique: String; let source: String
            let rows: [[String]]; let beadPositions: [BeadPosition]; let steps: [String]
        }
        let compiled = try JSONDecoder().decode(Compiled.self, from: data)
        guard !compiled.rows.isEmpty, !compiled.steps.isEmpty else { throw QwenFailure(message: "No usable pattern was generated.") }
        return BeadPattern(title: compiled.title, rows: compiled.rows, steps: compiled.steps,
                           technique: compiled.technique, source: compiled.source, beadPositions: compiled.beadPositions)
    }
}
