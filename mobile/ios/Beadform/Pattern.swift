import Foundation
import Combine

struct BeadPattern: Codable, Identifiable {
    var id = UUID()
    var title: String
    var rows: [[String]]
    var steps: [String]
    var created = Date()
    var beadCount: Int { rows.reduce(0) { $0 + $1.count } }

    // Original bounded brick triangle. No model output or inferred physical success.
    static func triangle(width: Int = 6, rowCount: Int = 4) -> BeadPattern {
        precondition((3...12).contains(width) && (2..<width).contains(rowCount))
        let rows = (0..<rowCount).map { r in (1...(width-r)).map { "B\(r+1)-\($0)" } }
        var steps = [String]()
        let foundation = rows[0]
        var moves = ["Pick up \(foundation[0]) and \(foundation[1]).", "Pass through \(foundation[0]), then \(foundation[1])."]
        for i in 2..<foundation.count {
            moves.append("Pick up \(foundation[i]); pass through \(foundation[i-1]), then \(foundation[i]).")
        }
        steps.append("Ladder foundation\n" + moves.joined(separator: "\n"))
        for r in 1..<rowCount {
            let anchors = Array(rows[r-1].reversed()), ids = rows[r]
            var rowMoves = ["Pick up \(ids[0]) and \(ids[1]).", "Go under the existing thread bridge between \(anchors[1]) and \(anchors[2]); pass through \(ids[1]), then \(ids[0]), then \(ids[1])."]
            if ids.count > 2 {
                for i in 2..<ids.count {
                    rowMoves.append("Pick up \(ids[i]); go under the bridge between \(anchors[i]) and \(anchors[i+1]); pass through \(ids[i]).")
                }
            }
            steps.append("Brick row \(r+1)\n" + rowMoves.joined(separator: "\n"))
        }
        return BeadPattern(title: "Little brick triangle", rows: rows, steps: steps)
    }
}

@MainActor
final class PatternStore: ObservableObject {
    @Published var patterns: [BeadPattern] = []
    @Published var storageMessage: String?
    private var file: URL { URL.documentsDirectory.appending(path: "patterns.json") }
    init() {
        do { patterns = try JSONDecoder().decode([BeadPattern].self, from: Data(contentsOf: file)) }
        catch { if FileManager.default.fileExists(atPath: file.path) { storageMessage = "Saved patterns could not be read. The file has been preserved." } }
    }
    func save(_ pattern: BeadPattern) {
        guard !patterns.contains(where: { $0.id == pattern.id }) else { return }
        let updated = [pattern] + patterns
        do { try JSONEncoder().encode(updated).write(to: file, options: .atomic); patterns = updated; storageMessage = "Saved on this iPhone." }
        catch { storageMessage = "Could not save this pattern: \(error.localizedDescription)" }
    }
}
