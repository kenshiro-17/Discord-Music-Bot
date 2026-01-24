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
    "Nee enthu thenga aada ee kaanikkunne? ",
    "Vaa... avide chennittu samsarikkaam... ",
];

const errorPrefixes = [
    "Ayye... ",
    "Podey... ",
    "Nee theerenu... ",
    "Enthuvaadey ithu? ",
];

/**
 * Transforms a standard message into Thankan Chettan style
 */
export function styleResponse(message: string, type: 'success' | 'error' | 'info' = 'info'): string {
    // Exact phrase mapping for specific events
    if (message.includes("Playing")) {
        const songName = message.replace('Playing', '').trim();
        return `🎵 **Thankan Chettan's Vibe:**\nPaattu: **${songName}**\n\n*Ketto... ishtapettillenkilum mindaathirunno.*`;
    }

    if (message.includes("Added to queue")) {
        const songName = message.replace('Added to queue:', '').trim();
        return `✅ **Queue ilittu:**\n**${songName}**\n\n*Samayam aakumbol kelpikkum. Thithappan varatte.*`;
    }

    if (message.includes("Joined")) {
        return `🔊 **Vannu:**\nNjan voice channel il kerittundu. Paattu idu... allel njan angottu varum.`;
    }

    if (message.includes("Left")) {
        return `👋 **Poyi:**\nNjan pokuva. Ini avide kidannu bahalam vekkathe.`;
    }

    if (message.includes("Queue finished")) {
        return `⏹️ **Theernu:**\nQueue theernu. Ini onnumilla. Veettil po.`;
    }

    if (message.includes("Paused")) {
        return `⏸️ **Nirthi:**\nPaattu nirthi. Ini entha?`;
    }

    if (message.includes("Resumed")) {
        return `▶️ **Thudangi:**\nVeendum thudangi. Mindaathirunnu kelkku.`;
    }

    if (message.includes("Skipped")) {
        return `⏭️ **Maatti:**\nAa paattu maatti. Aduthathu varatte.`;
    }

    if (type === 'error') {
        const prefix = errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)];
        return `⚠️ **Prashnam:**\n${prefix}\n${message}\n\n*Nee enthu paniya kaniche?*`;
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
        "Nee ethra valiya kombanaayaalum... Thankan chettante munnil onnumalla.",
        "Churuli... ithu vere lokam aanu.",
        "Nee aara... Joy-o?",
        "Avide nikkada... njan varunnu.",
        "Eda... nee enthaada nokkunne?",
        "Sathyathil aara nee?",
        "Vazhi thetti vannathaano?",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

