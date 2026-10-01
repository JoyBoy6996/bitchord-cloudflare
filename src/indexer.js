export async function getCursor(env) {
    const row = await env.DB
        .prepare(`
            SELECT value
            FROM index_state
            WHERE key = 'last_telegram_message_id'
        `)
        .first();

    return Number(row?.value || 0);
}


export async function setCursor(env, messageId) {
    await env.DB
        .prepare(`
            INSERT INTO index_state
            (
                key,
                value,
                updated_at
            )
            VALUES
            (
                'last_telegram_message_id',
                ?,
                unixepoch()
            )

            ON CONFLICT(key)
            DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
        `)
        .bind(String(messageId))
        .run();
}


export async function upsertTrack(env, track) {

    const now = Math.floor(Date.now() / 1000);

    await env.DB
        .prepare(`
            INSERT INTO tracks
            (
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
                is_atmos,
                indexed_at,
                updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(id)
            DO UPDATE SET

                telegram_message_id =
                    excluded.telegram_message_id,

                title =
                    excluded.title,

                artist =
                    excluded.artist,

                album =
                    excluded.album,

                file_name =
                    excluded.file_name,

                format =
                    excluded.format,

                mime_type =
                    excluded.mime_type,

                duration =
                    excluded.duration,

                file_size =
                    excluded.file_size,

                bitrate =
                    excluded.bitrate,

                sample_rate =
                    excluded.sample_rate,

                channels =
                    excluded.channels,

                is_atmos =
                    excluded.is_atmos,

                updated_at =
                    excluded.updated_at
        `)
        .bind(
            String(track.id),

            Number(track.telegram_message_id),

            track.title || '',
            track.artist || '',
            track.album || '',

            track.file_name || '',
            track.format || '',
            track.mime_type || '',

            Number(track.duration || 0),
            Number(track.file_size || 0),

            Number(track.bitrate || 0),
            Number(track.sample_rate || 0),
            Number(track.channels || 0),

            track.is_atmos ? 1 : 0,

            now,
            now
        )
        .run();
}