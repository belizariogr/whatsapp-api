/** Mensagens de debug do libsignal (Baileys) que usam console.* diretamente. */
const LIBSIGNAL_CONSOLE_PREFIXES = [
    'Closing session:',
    'Opening session:',
    'Session already closed',
    'Session already open',
    'Removing old closed session:',
    'Migrating session to:',
] as const;

export function isLibsignalConsoleNoise(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return LIBSIGNAL_CONSOLE_PREFIXES.some(
        (prefix) => value.startsWith(prefix) || value.includes(prefix),
    );
}

let installed = false;

/** Evita logs verbosos do libsignal que expõem material criptográfico no console. */
export function suppressLibsignalConsoleLogs(): void {
    if (installed) return;
    installed = true;

    for (const method of ['info', 'warn'] as const) {
        const original = console[method].bind(console);
        console[method] = (...args: unknown[]) => {
            if (isLibsignalConsoleNoise(args[0])) return;
            original(...args);
        };
    }
}

suppressLibsignalConsoleLogs();
