function json(data, status = 200, headers = {}) {

    return new Response(
        JSON.stringify(data, null, 2),
        {
            status,

            headers: {
                "content-type":
                    "application/json; charset=utf-8",

                "cache-control":
                    "no-store",

                ...headers
            }
        }
    );
}


function text(data, status = 200, headers = {}) {

    return new Response(
        data,
        {
            status,

            headers: {
                "content-type":
                    "text/plain; charset=utf-8",

                ...headers
            }
        }
    );
}


function normalizeQuery(value) {

    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ');
}


async function getStats(env) {

    const count = await env.DB
        .prepare(`
            SELECT COUNT(*) AS count
            FROM tracks
        `)
        .first();


    const cursor = await env.DB
        .prepare(`
            SELECT value
            FROM index_state
            WHERE key = 'last_telegram_message_id'
        `)
        .first();


    return {

        tracks:
            Number(count?.count || 0),

        lastTelegramMessageId:
            Number(cursor?.value || 0)
    };
}


async function searchTracks(
    env,
    query,
    limit
) {

    const q = normalizeQuery(query);

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );


    /*
     * No search query.
     *
     * Return newest tracks.
     */

    if (!q) {

        const result =
            await env.DB
                .prepare(`
                    SELECT

                        id,
                        title,
                        artist,
                        album,
                        format,
                        duration,
                        bitrate,
                        sample_rate,
                        channels,
                        is_atmos

                    FROM tracks

                    ORDER BY
                        telegram_message_id DESC

                    LIMIT ?
                `)
                .bind(safeLimit)
                .all();


        return result.results || [];
    }


    const pattern = `%${q}%`;


    const result =
        await env.DB
            .prepare(`
                SELECT

                    id,
                    title,
                    artist,
                    album,
                    format,
                    duration,
                    bitrate,
                    sample_rate,
                    channels,
                    is_atmos

                FROM tracks

                WHERE

                    title LIKE ?
                    COLLATE NOCASE

                    OR artist LIKE ?
                    COLLATE NOCASE

                    OR album LIKE ?
                    COLLATE NOCASE

                    OR file_name LIKE ?
                    COLLATE NOCASE


                ORDER BY

                    CASE

                        WHEN title LIKE ?
                        COLLATE NOCASE
                        THEN 0

                        WHEN artist LIKE ?
                        COLLATE NOCASE
                        THEN 1

                        ELSE 2

                    END,

                    telegram_message_id DESC


                LIMIT ?
            `)
            .bind(
                pattern,
                pattern,
                pattern,
                pattern,

                pattern,
                pattern,

                safeLimit
            )
            .all();


    return result.results || [];
}


async function getTrack(
    env,
    id
) {

    return await env.DB
        .prepare(`
            SELECT

                id,
                telegram_message_id,

                title,
                artist,
                album,

                file_name,
                format,
                mime_type,

                duration,
                file_size,

                bitrate,
                sample_rate,
                channels,

                is_atmos

            FROM tracks

            WHERE id = ?
        `)
        .bind(id)
        .first();
}


export default {

    async fetch(request, env) {

        const url =
            new URL(request.url);

        const path =
            url.pathname;


        /*
         * We currently expose GET APIs.
         */

        if (request.method !== 'GET') {

            return text(
                'Method Not Allowed',
                405,
                {
                    allow: 'GET'
                }
            );
        }


        /*
         * Health
         */

        if (path === '/health') {

            return json({
                ok: true,
                service:
                    'bitchord-cloudflare',

                environment:
                    env.ENVIRONMENT || 'unknown'
            });
        }


        /*
         * BitChord manifest
         */

        if (path === '/manifest.json') {

            return json({

                id:
                    'joyboy6996.bitchord-cloudflare',

                version:
                    '1.0.0',

                name:
                    'BitChord Cloudflare',

                description:
                    'Cloudflare-native BitChord music provider',

                resources: [
                    'catalog'
                ]
            });
        }


        /*
         * Database statistics
         */

        if (path === '/api/stats') {

            try {

                const stats =
                    await getStats(env);

                return json(stats);

            } catch (error) {

                return json(
                    {
                        error:
                            error.message
                    },
                    500
                );
            }
        }


        /*
         * Search
         *
         * /api/search?q=arijit
         */

        if (path === '/api/search') {

            try {

                const tracks =
                    await searchTracks(
                        env,

                        url.searchParams
                            .get('q'),

                        url.searchParams
                            .get('limit')
                    );


                return json({

                    query:
                        normalizeQuery(
                            url.searchParams
                                .get('q')
                        ),

                    count:
                        tracks.length,

                    tracks
                });


            } catch (error) {

                return json(
                    {
                        error:
                            error.message
                    },
                    500
                );
            }
        }


        /*
         * Single track
         *
         * /api/track/123
         */

        if (
            path.startsWith(
                '/api/track/'
            )
        ) {

            const id =
                decodeURIComponent(
                    path.slice(
                        '/api/track/'.length
                    )
                );


            if (!id) {

                return json(
                    {
                        error:
                            'Missing track id'
                    },
                    400
                );
            }


            try {

                const track =
                    await getTrack(
                        env,
                        id
                    );


                if (!track) {

                    return json(
                        {
                            error:
                                'Track not found'
                        },
                        404
                    );
                }


                return json(track);


            } catch (error) {

                return json(
                    {
                        error:
                            error.message
                    },
                    500
                );
            }
        }


        return text(
            'Not Found',
            404
        );
    }
};