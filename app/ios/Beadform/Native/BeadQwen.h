#pragma once
#include <stddef.h>
#ifdef __cplusplus
extern "C" {
#endif
// All calls except cancel must be serialized. cancel is atomic and thread safe.
typedef struct bf_qwen bf_qwen;
bf_qwen * bf_qwen_create(void);
void bf_qwen_destroy(bf_qwen * engine);
void bf_qwen_cancel(bf_qwen * engine);
void bf_qwen_reset_cancel(bf_qwen * engine);
void bf_qwen_unload(bf_qwen * engine);
int bf_qwen_load(bf_qwen * engine, const char * model_path, const char * adapter_path,
                 int gpu_layers, char * error, size_t error_size);
// Returns only a complete, grammar-constrained recipe; truncation is an error.
int bf_qwen_recipe(bf_qwen * engine, const char * system, const char * prompt,
                   char * output, size_t output_size, char * error, size_t error_size);
#ifdef __cplusplus
}
#endif
