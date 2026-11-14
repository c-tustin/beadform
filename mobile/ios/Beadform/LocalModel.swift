import Foundation
import Combine

// Runtime boundary: never call a localhost server or hosted API from the phone.
// A native llama.cpp integration must verify the model/adapter pair, enforce the
// bounded recipe schema, then send the recipe to the shared compiler/checker.
@MainActor
final class LocalModel: ObservableObject {
    enum Asset: String, CaseIterable, Identifiable {
        case model = "Qwen model", projector = "Vision projector", adapter = "Beadform adapter"
        var id: String { rawValue }
        var filename: String {
            switch self {
            case .model: return "qwen.gguf"
            case .projector: return "mmproj.gguf"
            case .adapter: return "beadform-adapter.gguf"
            }
        }
    }
    @Published var message = "Native Qwen runtime is not linked in this draft."
    @Published var installed: Set<Asset> = []
    private var directory: URL { URL.applicationSupportDirectory.appending(path: "Models") }
    init() { refresh() }
    func refresh() {
        installed = Set(Asset.allCases.filter { FileManager.default.fileExists(atPath: directory.appending(path: $0.filename).path) })
    }
    func importAsset(_ asset: Asset, from url: URL) {
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        do {
            let input = try FileHandle(forReadingFrom: url)
            defer { try? input.close() }
            guard try input.read(upToCount: 4) == Data("GGUF".utf8) else {
                message = "Choose a GGUF model file."; return
            }
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            // Copy to a temporary file first; preserve an existing asset on failure.
            let destination = directory.appending(path: asset.filename)
            let staging = directory.appending(path: UUID().uuidString + ".tmp")
            defer { try? FileManager.default.removeItem(at: staging) }
            try FileManager.default.copyItem(at: url, to: staging)
            if FileManager.default.fileExists(atPath: destination.path) {
                _ = try FileManager.default.replaceItemAt(destination, withItemAt: staging)
            } else { try FileManager.default.moveItem(at: staging, to: destination) }
            refresh()
            message = "File stored on this iPhone. Compatibility and inference remain unverified."
        } catch { message = "Import failed: \(error.localizedDescription)" }
    }
}
