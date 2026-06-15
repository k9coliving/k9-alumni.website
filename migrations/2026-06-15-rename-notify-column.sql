-- Rename the newsletter-notify column to match the form wording ("Let me know
-- about future newsletters"). No data change — just the column name.
--
-- Run once in the Supabase SQL editor. Deploy the matching code at the same time:
-- the app reads/writes `notify_for_future_newsletters` after this rename.

alter table newsletter_submissions
  rename column notify_for_next_newsletter to notify_for_future_newsletters;
