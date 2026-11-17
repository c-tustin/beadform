import Foundation

struct QwenFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

// Pointer lifetime is retained by the actor. Only the atomic cancellation flag
// may be touched outside that actor; native load/generate/unload stay serialized.
private final class EngineHandle: @unchecked Sendable {
    let pointer: OpaquePointer
    init() throws {
        guard let pointer = bf_qwen_create() else { throw QwenFailure(message: "Cannot allocate Qwen runtime.") }
        self.pointer = pointer
    }
    deinit { bf_qwen_destroy(pointer) }
}
actor NativeRuntime {
    private nonisolated let handle: EngineHandle
    init() throws { handle = try EngineHandle() }
    nonisolated func cancel() { bf_qwen_cancel(handle.pointer) }
    nonisolated func prepare() { bf_qwen_reset_cancel(handle.pointer) }
    func unload() { bf_qwen_unload(handle.pointer) }
    func load(model: String, adapter: String, cpuOnly: Bool) throws {
        var error = [CChar](repeating: 0, count: 1024)
        let errorCapacity = error.count
        let result = bf_qwen_load(handle.pointer, model, adapter, cpuOnly ? 0 : 99, &error, errorCapacity)
        guard result == 0 else { throw QwenFailure(message: String(cString: error)) }
    }
    func recipe(system: String, prompt: String) throws -> String {
        var error = [CChar](repeating: 0, count: 1024)
        var output = [CChar](repeating: 0, count: 2048)
        let outputCapacity = output.count, errorCapacity = error.count
        let result = bf_qwen_recipe(handle.pointer, system, prompt, &output, outputCapacity, &error, errorCapacity)
        guard result == 0 else { throw QwenFailure(message: String(cString: error)) }
        return String(cString: output)
    }
}
