INSERT INTO `chat_conversation` (
  `user_id`,
  `peer_id`,
  `unread_count`,
  `last_message`,
  `last_message_at`,
  `created_at`,
  `updated_at`
)
SELECT
  base.user_id,
  base.peer_id,
  unread.unread_count,
  latest.content AS last_message,
  latest.created_at AS last_message_at,
  CURRENT_TIMESTAMP(3) AS created_at,
  CURRENT_TIMESTAMP(3) AS updated_at
FROM (
  SELECT sender_id AS user_id, receiver_id AS peer_id FROM chat_message
  UNION
  SELECT receiver_id AS user_id, sender_id AS peer_id FROM chat_message
) base
JOIN (
  SELECT
    t.user_id,
    t.peer_id,
    cm.content,
    cm.created_at
  FROM (
    SELECT
      pair.user_id,
      pair.peer_id,
      MAX(pair.last_time) AS last_time
    FROM (
      SELECT sender_id AS user_id, receiver_id AS peer_id, created_at AS last_time FROM chat_message
      UNION ALL
      SELECT receiver_id AS user_id, sender_id AS peer_id, created_at AS last_time FROM chat_message
    ) pair
    GROUP BY pair.user_id, pair.peer_id
  ) t
  JOIN chat_message cm
    ON (
      (cm.sender_id = t.user_id AND cm.receiver_id = t.peer_id)
      OR (cm.sender_id = t.peer_id AND cm.receiver_id = t.user_id)
    )
   AND cm.created_at = t.last_time
) latest
  ON latest.user_id = base.user_id
 AND latest.peer_id = base.peer_id
JOIN (
  SELECT
    receiver_id AS user_id,
    sender_id AS peer_id,
    COUNT(*) AS unread_count
  FROM chat_message
  WHERE is_read = 0
  GROUP BY receiver_id, sender_id
) unread
  ON unread.user_id = base.user_id
 AND unread.peer_id = base.peer_id
ON DUPLICATE KEY UPDATE
  unread_count = VALUES(unread_count),
  last_message = VALUES(last_message),
  last_message_at = VALUES(last_message_at),
  updated_at = CURRENT_TIMESTAMP(3);

INSERT INTO `chat_conversation` (
  `user_id`,
  `peer_id`,
  `unread_count`,
  `last_message`,
  `last_message_at`,
  `created_at`,
  `updated_at`
)
SELECT
  latest.user_id,
  latest.peer_id,
  0 AS unread_count,
  latest.content AS last_message,
  latest.created_at AS last_message_at,
  CURRENT_TIMESTAMP(3) AS created_at,
  CURRENT_TIMESTAMP(3) AS updated_at
FROM (
  SELECT
    t.user_id,
    t.peer_id,
    cm.content,
    cm.created_at
  FROM (
    SELECT
      pair.user_id,
      pair.peer_id,
      MAX(pair.last_time) AS last_time
    FROM (
      SELECT sender_id AS user_id, receiver_id AS peer_id, created_at AS last_time FROM chat_message
      UNION ALL
      SELECT receiver_id AS user_id, sender_id AS peer_id, created_at AS last_time FROM chat_message
    ) pair
    GROUP BY pair.user_id, pair.peer_id
  ) t
  JOIN chat_message cm
    ON (
      (cm.sender_id = t.user_id AND cm.receiver_id = t.peer_id)
      OR (cm.sender_id = t.peer_id AND cm.receiver_id = t.user_id)
    )
   AND cm.created_at = t.last_time
) latest
ON DUPLICATE KEY UPDATE
  last_message = VALUES(last_message),
  last_message_at = VALUES(last_message_at),
  updated_at = CURRENT_TIMESTAMP(3);
