// =============================================================
//  Helpers para enlaces de YouTube
// =============================================================

// Extrae el ID de un video de YouTube desde varias formas de URL
export const getYoutubeId = (url) => {
    if (!url) return null
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&]+)/,
        /(?:youtu\.be\/)([^?]+)/,
        /(?:youtube\.com\/embed\/)([^?]+)/,
        /(?:youtube\.com\/shorts\/)([^?]+)/,
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) return match[1]
    }
    return null
}

// Devuelve la URL para incrustar (embed)
export const getYoutubeEmbedUrl = (url) => {
    const id = getYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : null
}

// Valida si una URL parece de YouTube
export const esYoutube = (url) => getYoutubeId(url) !== null
