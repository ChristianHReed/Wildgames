/* memcpy, memmove and memset for the WebAssembly build made without the Rust wasm32 target (tools/build_core.sh):
   the compiler calls these for array copies and clears, and with no C library linked they have to come from somewhere. */
typedef unsigned long size_t;
void *memcpy(void *d, const void *s, size_t n){ unsigned char *a = d; const unsigned char *b = s; while (n--) *a++ = *b++; return d; }
void *memmove(void *d, const void *s, size_t n){ unsigned char *a = d; const unsigned char *b = s; if (a < b) while (n--) *a++ = *b++; else { a += n; b += n; while (n--) *--a = *--b; } return d; }
void *memset(void *d, int c, size_t n){ unsigned char *a = d; while (n--) *a++ = (unsigned char)c; return d; }
int memcmp(const void *x, const void *y, size_t n){ const unsigned char *a = x, *b = y; for (; n; n--, a++, b++) if (*a != *b) return *a - *b; return 0; }
