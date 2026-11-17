import Foundation
import Combine
import CryptoKit

private enum ModelFiles {
    static func digest(_ url: URL) throws -> String {
        let input = try FileHandle(forReadingFrom: url)
        defer { try? input.close() }
        var hash = SHA256()
        while true {
            try Task.checkCancellation()
            let data = try input.read(upToCount: 4 * 1024 * 1024) ?? Data()
            if data.isEmpty { break }
            hash.update(data: data)
        }
        return hash.finalize().map { String(format: "%02x", $0) }.joined()
    }
    static func copy(_ source: URL, to destination: URL, expected: String) throws {
        let access = source.startAccessingSecurityScopedResource()
        defer { if access { source.stopAccessingSecurityScopedResource() } }
        let input = try FileHandle(forReadingFrom: source)
        defer { try? input.close() }
        guard try input.read(upToCount: 4) == Data("GGUF".utf8) else { throw QwenFailure(message: "Choose a GGUF model file.") }
        try input.seek(toOffset: 0)
        try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
        let staging = destination.deletingLastPathComponent().appending(path: UUID().uuidString + ".tmp")
        guard FileManager.default.createFile(atPath: staging.path, contents: nil) else { throw QwenFailure(message: "Cannot create model file. Check free storage.") }
        defer { try? FileManager.default.removeItem(at: staging) }
        let output = try FileHandle(forWritingTo: staging)
        defer { try? output.close() }
        var hash = SHA256()
        while true {
            try Task.checkCancellation()
            let data = try input.read(upToCount: 4 * 1024 * 1024) ?? Data()
            if data.isEmpty { break }
            hash.update(data: data)
            try output.write(contentsOf: data)
        }
        try output.synchronize()
        guard hash.finalize().map({ String(format: "%02x", $0) }).joined() == expected else {
            throw QwenFailure(message: "This file does not match the verified Qwen/Beadform weights. Your previous file has been preserved.")
        }
        try Task.checkCancellation()
        if FileManager.default.fileExists(atPath: destination.path) { _ = try FileManager.default.replaceItemAt(destination, withItemAt: staging) }
        else { try FileManager.default.moveItem(at: staging, to: destination) }
        var local = destination
        var values = URLResourceValues(); values.isExcludedFromBackup = true
        try? local.setResourceValues(values)
    }
}

extension NativeRuntime {
    func verifyAndLoad(model: URL, adapter: URL, modelHash: String, adapterHash: String, cpuOnly: Bool) throws {
        guard try ModelFiles.digest(model) == modelHash, try ModelFiles.digest(adapter) == adapterHash else {
            throw QwenFailure(message: "Model integrity check failed. Import the matching model and adapter again.")
        }
        try Task.checkCancellation()
        try load(model: model.path, adapter: adapter.path, cpuOnly: cpuOnly)
    }
    func importFile(_ source: URL, to destination: URL, expected: String) throws {
        unload()
        try ModelFiles.copy(source, to: destination, expected: expected)
    }
}

@MainActor
final class LocalModel: ObservableObject {
    enum Asset: String, CaseIterable, Identifiable {
        case model = "Qwen model", adapter = "Beadform adapter"
        var id: String { rawValue }
        var filename: String { self == .model ? "qwen.gguf" : "beadform-adapter.gguf" }
    }
    private struct Manifest: Decodable {
        let files: [String: String]
        let converted_adapter_sha256: String
    }
    @Published var message = "Import Qwen and the matching Beadform adapter, then load the model."
    @Published var installed: Set<Asset> = []
    @Published private(set) var ready = false
    @Published private(set) var working = false
    @Published var cpuOnly = false
    private var runtime: NativeRuntime?
    private var task: Task<Void, Never>?
    private var operation = UUID()
    private var directory: URL { URL.applicationSupportDirectory.appending(path: "Models") }
    init() {
        do { runtime = try NativeRuntime() }
        catch { message = error.localizedDescription }
        refresh()
    }
    func refresh() {
        installed = Set(Asset.allCases.filter { FileManager.default.fileExists(atPath: directory.appending(path: $0.filename).path) })
    }
    private func readHashes() throws -> (String, String) {
        guard let url = Bundle.main.url(forResource: "model-manifest", withExtension: "json") else { throw QwenFailure(message: "Missing bundled model manifest.") }
        let m = try JSONDecoder().decode(Manifest.self, from: Data(contentsOf: url))
        guard let hash = m.files["Qwen3VL-2B-Instruct-Q8_0.gguf"] else { throw QwenFailure(message: "Invalid model manifest.") }
        return (hash, m.converted_adapter_sha256)
    }
    func importAsset(_ asset: Asset, from url: URL) {
        guard !working, let runtime else { return }
        do {
            let hashes = try readHashes(), expected = asset == .model ? hashes.0 : hashes.1
            let destination = directory.appending(path: asset.filename)
            ready = false; working = true
            let id = UUID(); operation = id
            message = "Copying and checking \(asset.rawValue.lowercased())… Keep the app open."
            runtime.prepare()
            task = Task {
                do {
                    try await runtime.importFile(url, to: destination, expected: expected)
                    guard operation == id else { return }
                    message = "Verified file stored on this iPhone. Load the model when both files are present."
                } catch { if operation == id { message = error is CancellationError ? "Import cancelled." : error.localizedDescription } }
                if operation == id { working = false; refresh() }
            }
        } catch { message = error.localizedDescription }
    }
    func load() {
        guard !working, let runtime else { return }
        do {
            let hashes = try readHashes(), model = directory.appending(path: Asset.model.filename), adapter = directory.appending(path: Asset.adapter.filename)
            #if targetEnvironment(simulator)
            let cpu = true
            #else
            let cpu = cpuOnly
            #endif
            let id = UUID(); operation = id; ready = false; working = true
            message = "Verifying files and loading Qwen… First load can take a while."
            runtime.prepare()
            task = Task {
                do {
                    try await runtime.verifyAndLoad(model: model, adapter: adapter, modelHash: hashes.0, adapterHash: hashes.1, cpuOnly: cpu)
                    try Task.checkCancellation()
                    guard operation == id else { return }
                    ready = true; message = "Qwen and the trained Beadform adapter loaded on this iPhone."
                } catch {
                    await runtime.unload()
                    if operation == id { ready = false; message = error is CancellationError ? "Loading cancelled." : error.localizedDescription }
                }
                if operation == id { working = false }
            }
        } catch { message = error.localizedDescription }
    }
    func generate(prompt: String, width: Int, rows: Int, completion: @escaping (BeadPattern) -> Void) {
        guard ready, !working, let runtime else { return }
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, prompt.utf8.count <= 2000 else {
            message = "Enter a short design description (up to 2,000 UTF-8 bytes)."; return
        }
        let id = UUID(); operation = id; working = true; message = "Qwen is selecting a stitch on this iPhone…"
        runtime.prepare()
        task = Task {
            let start = Date()
            do {
                guard let url = Bundle.main.url(forResource: "stitch-system", withExtension: "json"),
                      let instructions = try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any],
                      let system = instructions["system"] as? String else { throw QwenFailure(message: "Missing model instructions.") }
                let recipe = try await runtime.recipe(system: system, prompt: prompt + "\nRequested dimensions: width \(width); rows \(rows).")
                try Task.checkCancellation()
                guard operation == id else { return }
                let pattern = try PatternCompiler.compile(recipe, width: width, rows: rows)
                message = "Draft generated and digitally checked in \(Int(Date().timeIntervalSince(start))) seconds. Physical sampling is still required."
                completion(pattern)
            } catch {
                if operation == id { message = error is CancellationError ? "Generation cancelled." : error.localizedDescription }
            }
            if operation == id { working = false }
        }
    }
    func unload() {
        guard let runtime else { return }
        operation = UUID(); let id = operation
        task?.cancel(); runtime.cancel(); ready = false; working = true
        message = "Stopping Qwen and releasing memory…"
        task = Task {
            await runtime.unload()
            guard operation == id else { return }
            working = false; refresh(); message = "Qwen unloaded. Your saved patterns remain available offline."
        }
    }
}
