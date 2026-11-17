// Runs the identical C ABI used by Swift; no HTTP server.
#include "BeadQwen.h"
#include <cassert>
#include <thread>
#include <chrono>
#include <fstream>
#include <iostream>
#include <iterator>
#include <memory>
int main(int argc, char ** argv) {
    if (argc != 4) { std::cerr << "Usage: native-smoke MODEL ADAPTER SYSTEM.txt\n"; return 2; }
    std::ifstream input(argv[3]);
    const std::string system((std::istreambuf_iterator<char>(input)), std::istreambuf_iterator<char>());
    if (system.empty()) return 2;
    std::unique_ptr<bf_qwen, decltype(&bf_qwen_destroy)> engine(bf_qwen_create(), bf_qwen_destroy);
    assert(engine);
    char error[1024] = {}, output[2048] = {};
    assert(bf_qwen_recipe(engine.get(), system.c_str(), "brick triangle", output, sizeof(output), error, sizeof(error)) != 0);
    bf_qwen_reset_cancel(engine.get());
    if (bf_qwen_load(engine.get(), argv[1], argv[2], 0, error, sizeof(error))) { std::cerr << error << '\n'; return 1; }
    bf_qwen_cancel(engine.get());
    assert(bf_qwen_recipe(engine.get(), system.c_str(), "brick triangle", output, sizeof(output), error, sizeof(error)) != 0);
    assert(output[0] == 0);
    bf_qwen_reset_cancel(engine.get());
    std::thread canceller([&] {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        bf_qwen_cancel(engine.get());
    });
    const int cancelled = bf_qwen_recipe(engine.get(), system.c_str(), "A brick stitch triangle, width 6, rows 4.", output, sizeof(output), error, sizeof(error));
    canceller.join();
    assert(cancelled != 0 && output[0] == 0);
    bf_qwen_reset_cancel(engine.get());
    if (bf_qwen_recipe(engine.get(), system.c_str(), "A flat brick stitch triangle, foundation width 6 beads, 4 rows.", output, sizeof(output), error, sizeof(error))) {
        std::cerr << error << '\n'; return 1;
    }
    std::cout << output << '\n';
    bf_qwen_unload(engine.get());
    assert(bf_qwen_recipe(engine.get(), system.c_str(), "brick triangle", output, sizeof(output), error, sizeof(error)) != 0);
    return 0;
}
