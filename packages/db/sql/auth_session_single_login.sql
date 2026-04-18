DELETE s1
FROM auth_session s1
INNER JOIN auth_session s2
  ON s1.user_id = s2.user_id
 AND (
   s1.created_at < s2.created_at
   OR (s1.created_at = s2.created_at AND s1.id < s2.id)
 );

ALTER TABLE `auth_session`
  DROP INDEX `idx_auth_session_user_id`,
  ADD UNIQUE KEY `uk_auth_session_user_id` (`user_id`);
