/**
 * Thankan Chettan Persona Utility
 * Based on the character from the movie Churuli.
 * Style: Rough, authoritative, uses "Thankan Chettante..." references, intense, direct.
 */

// Randomized prefixes/suffixes to add flavor
const prefixes = [
    "Eda monae... ",
    "Nee aara... ",
    "Churuli ilottu vaa... ",
    "Thankan chettan parayunnu... ",
    "Dhaivame... ",
];

const suffixes = [
    " ...ketto?",
    " ...manasilayo?",
    " ...Thankan chettante vaka.",
    " ...ini mindaruthu.",
];

/**
 * Transforms a standard message into Thankan Chettan style
 */
export function styleResponse(message: string, type: 'success' | 'error' | 'info' = 'info'): string {
    // Map common phrases to character specific dialogue
    // Note: Using Manglish (Malayalam in English script) for wider readability/impact

    if (message.includes("Playing")) {
        return `🎵 **Thankan Chettan's Vibe:**\nPlaying ${message.replace('Playing', '').trim()}... Ketto?`;
    }

    if (message.includes("Added to queue")) {
        return `✅ **Queue ilittu:**\n${message.replace('Added to queue', '').trim()}... Ini onnum parayanda.`;
    }

    if (message.includes("Joined")) {
        return `🔊 **Vannu:**\nNjan voice channel il kerittundu. Paattu idu... allel...`;
    }

    if (type === 'error') {
        return `⚠️ **Ayye...**\n${message}\nNee enthu paniya kaniche?`;
    }

    // Fallback for generic messages
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}${message}`;
}

/**
 * Get a random "Thankan Chettan" quote
 */
export function getThankanQuote(): string {
    const quotes = [
        "Thankan chettante andi!",
        "Ividuthe niyamam Thankan chettan aanu.",
        "Nee ethra valiya kombanaayaalum...",
        "Churuli... ithu vere lokam aanu.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}
