#include "BeadQwen.h"
#if __has_include(<llama/llama.h>)
#include <llama/llama.h>
#else
#include "llama.h"
#endif
#include <algorithm>
#include <atomic>
#include <cstdio>
#include <cstring>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

struct bf_qwen {
    std::atomic<bool> cancelled{false};
    llama_model * model = nullptr;
    llama_context * context = nullptr;
    llama_adapter_lora * adapter = nullptr;
};
static std::once_flag backend;
static bool aborted(void * ptr) { return static_cast<bf_qwen *>(ptr)->cancelled.load(); }
static bool loading(float, void * ptr) { return !aborted(ptr); }
static int fail(char * error, size_t size, const char * message) {
    if (error && size) std::snprintf(error, size, "%s", message);
    return -1;
}
bf_qwen * bf_qwen_create() { return new (std::nothrow) bf_qwen; }
void bf_qwen_cancel(bf_qwen * e) { if (e) e->cancelled.store(true); }
void bf_qwen_reset_cancel(bf_qwen * e) { if (e) e->cancelled.store(false); }
void bf_qwen_unload(bf_qwen * e) {
    if (!e) return;
    if (e->context) llama_free(e->context);
    if (e->adapter) llama_adapter_lora_free(e->adapter);
    if (e->model) llama_model_free(e->model);
    e->context = nullptr; e->adapter = nullptr; e->model = nullptr;
}
void bf_qwen_destroy(bf_qwen * e) { bf_qwen_unload(e); delete e; }
int bf_qwen_load(bf_qwen * e, const char * model, const char * adapter,
                 int gpu_layers, char * error, size_t size) {
    if (!e || !model || !adapter) return fail(error, size, "Missing model or adapter path.");
    bf_qwen_unload(e);
    try {
        std::call_once(backend, [] { llama_backend_init(); });
        auto mp = llama_model_default_params();
        mp.n_gpu_layers = gpu_layers;
        mp.load_mode = LLAMA_LOAD_MODE_MMAP;
        mp.progress_callback = loading; mp.progress_callback_user_data = e;
        e->model = llama_model_load_from_file(model, mp);
        if (!e->model) throw std::runtime_error(aborted(e) ? "Cancelled." : "Cannot load Qwen. Check available memory and model files.");
        e->adapter = llama_adapter_lora_init(e->model, adapter);
        if (!e->adapter) throw std::runtime_error("Cannot load the matching Beadform adapter.");
        auto cp = llama_context_default_params();
        cp.n_ctx = 2048; cp.n_batch = 128; cp.n_ubatch = 128;
        cp.n_threads = cp.n_threads_batch = std::max(1, std::min(4, int(std::thread::hardware_concurrency()) - 2));
        cp.abort_callback = aborted; cp.abort_callback_data = e;
        e->context = llama_init_from_model(e->model, cp);
        if (!e->context) throw std::runtime_error("Cannot allocate Qwen context. Close other apps and try again.");
        float scale = 1.0f;
        if (llama_set_adapters_lora(e->context, &e->adapter, 1, &scale) != 0)
            throw std::runtime_error("Cannot activate the trained adapter.");
        if (aborted(e)) throw std::runtime_error("Cancelled.");
        return 0;
    } catch (const std::exception & ex) { bf_qwen_unload(e); return fail(error, size, ex.what()); }
}
// Same four fields as training/local-image-system.json; semantic validation follows.
static const char * grammar = R"GBNF(
root ::= "{" ws "\"stitch\"" ws ":" ws stitch ws "," ws "\"shape\"" ws ":" ws shape ws "," ws "\"width\"" ws ":" ws number ws "," ws "\"rows\"" ws ":" ws number ws "}"
stitch ::= "\"peyote\"" | "\"brick\"" | "\"ladder\"" | "\"raw\"" | "\"square\"" | "\"unknown\""
shape ::= "\"rectangle\"" | "\"triangle\"" | "\"strip\"" | "\"unknown\""
number ::= [0-9] | "1" [0-2]
ws ::= [ \t\n\r]{0,4}
)GBNF";
int bf_qwen_recipe(bf_qwen * e, const char * system, const char * prompt,
                   char * output, size_t capacity, char * error, size_t size) {
    if (output && capacity) output[0] = 0;
    if (!e || !e->context || !output || !capacity || !system || !prompt)
        return fail(error, size, "Load the local model first.");
    try {
        const auto * vocab = llama_model_get_vocab(e->model);
        const auto * tmpl = llama_model_chat_template(e->model, nullptr);
        if (!tmpl) throw std::runtime_error("The model has no chat template.");
        const llama_chat_message messages[] = {{"system", system}, {"user", prompt}};
        std::vector<char> formatted(std::strlen(system) + std::strlen(prompt) + 2048);
        int n = llama_chat_apply_template(tmpl, messages, 2, true, formatted.data(), int(formatted.size()));
        if (n < 0) throw std::runtime_error("Unsupported Qwen chat template.");
        if (n >= int(formatted.size())) {
            formatted.resize(n + 1);
            n = llama_chat_apply_template(tmpl, messages, 2, true, formatted.data(), int(formatted.size()));
        }
        if (n <= 0 || n >= int(formatted.size())) throw std::runtime_error("Could not format the request.");
        std::vector<llama_token> tokens(2048);
        int count = llama_tokenize(vocab, formatted.data(), n, tokens.data(), int(tokens.size()), true, true);
        constexpr int max_output = 128;
        if (count <= 0 || count + max_output >= int(llama_n_ctx(e->context)))
            throw std::runtime_error("Description is too long. Use a shorter request.");
        llama_memory_clear(llama_get_memory(e->context), true);
        auto sampler = std::unique_ptr<llama_sampler, decltype(&llama_sampler_free)>(
            llama_sampler_chain_init(llama_sampler_chain_default_params()), llama_sampler_free);
        if (!sampler) throw std::runtime_error("Cannot allocate sampler.");
        auto * constrained = llama_sampler_init_grammar(vocab, grammar, "root");
        if (!constrained) throw std::runtime_error("Cannot constrain the recipe output.");
        llama_sampler_chain_add(sampler.get(), constrained);
        llama_sampler_chain_add(sampler.get(), llama_sampler_init_greedy());
        for (int i = 0; i < count; i += 128) {
            if (aborted(e)) throw std::runtime_error("Cancelled.");
            auto batch = llama_batch_get_one(tokens.data() + i, std::min(128, count - i));
            if (llama_decode(e->context, batch)) throw std::runtime_error(aborted(e) ? "Cancelled." : "Qwen prompt evaluation failed.");
        }
        std::string result;
        bool ended = false;
        for (int i = 0; i < max_output; ++i) {
            if (aborted(e)) throw std::runtime_error("Cancelled.");
            llama_token token = llama_sampler_sample(sampler.get(), e->context, -1);
            if (llama_vocab_is_eog(vocab, token)) { ended = true; break; }
            std::vector<char> piece(256);
            int length = llama_token_to_piece(vocab, token, piece.data(), int(piece.size()), 0, false);
            if (length < 0) { piece.resize(-length); length = llama_token_to_piece(vocab, token, piece.data(), int(piece.size()), 0, false); }
            if (length < 0) throw std::runtime_error("Cannot decode a Qwen token.");
            result.append(piece.data(), length);
            if (result.size() >= capacity) throw std::runtime_error("Recipe exceeded its output buffer.");
            auto batch = llama_batch_get_one(&token, 1);
            if (llama_decode(e->context, batch)) throw std::runtime_error(aborted(e) ? "Cancelled." : "Qwen generation failed.");
        }
        if (!ended) throw std::runtime_error("Qwen returned an incomplete recipe. Try again.");
        if (aborted(e)) throw std::runtime_error("Cancelled.");
        std::memcpy(output, result.c_str(), result.size() + 1);
        return 0;
    } catch (const std::exception & ex) {
        if (e && e->context) llama_memory_clear(llama_get_memory(e->context), true);
        return fail(error, size, ex.what());
    }
}
