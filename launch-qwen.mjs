process.env.BEADFORM_PROVIDER='ollama';
process.env.OLLAMA_MODEL||='qwen3-vl:4b';
await import('./launch.mjs');
