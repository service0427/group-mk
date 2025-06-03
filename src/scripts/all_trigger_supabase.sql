-- Trigger: enforce_single_global_setting_trigger on cash_global_settings
CREATE TRIGGER enforce_single_global_setting_trigger
CREATE TRIGGER enforce_single_global_setting_trigger BEFORE INSERT ON public.cash_global_settings FOR EACH ROW EXECUTE FUNCTION enforce_single_global_setting();

-- Trigger: chat_message_inserted on chat_messages
CREATE TRIGGER chat_message_inserted
CREATE TRIGGER chat_message_inserted AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION notify_chat_message();

-- Trigger: set_current_worklog on claude_worklogs
CREATE TRIGGER set_current_worklog
CREATE TRIGGER set_current_worklog BEFORE INSERT OR UPDATE ON public.claude_worklogs FOR EACH ROW EXECUTE FUNCTION handle_worklog_current();

-- Trigger: set_user_slot_number on slots
CREATE TRIGGER set_user_slot_number
CREATE TRIGGER set_user_slot_number BEFORE INSERT ON public.slots FOR EACH ROW WHEN ((new.user_slot_number IS NULL)) EXECUTE FUNCTION generate_user_slot_number();

-- Trigger: sync_user_role_trigger on users
CREATE TRIGGER sync_user_role_trigger
CREATE TRIGGER sync_user_role_trigger AFTER UPDATE OF role ON public.users FOR EACH ROW EXECUTE FUNCTION sync_user_role_to_auth();