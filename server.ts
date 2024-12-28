import { serveFile } from 'jsr:@std/http/file-server'

Deno.serve((request) => {
    const path = new URL(request.url).pathname

    try {
        return serveFile(request, '.' + path)
    } catch {
        return new Response('404 Not Found', { status: 404 })
    }
})
