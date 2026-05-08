-- Example seed data for local/dev usage.
-- Replace <USER_ID> with a real authenticated user id.

insert into profiles (id, full_name, currency)
values ('<USER_ID>', 'Demo User', 'USD')
on conflict (id) do nothing;

insert into accounts (id, user_id, name, type, initial_balance, current_balance)
values
  (gen_random_uuid(), '<USER_ID>', 'Main Account', 'checking', 2000, 2000),
  (gen_random_uuid(), '<USER_ID>', 'Credit Card', 'credit', 0, 0);

insert into categories (id, user_id, name, color, type)
values
  (gen_random_uuid(), '<USER_ID>', 'Salary', '#16a34a', 'income'),
  (gen_random_uuid(), '<USER_ID>', 'Groceries', '#ef4444', 'expense'),
  (gen_random_uuid(), '<USER_ID>', 'Rent', '#f59e0b', 'expense');

insert into monthly_forecasts (id, user_id, month, projected_income, projected_expense, projected_balance)
values
  (gen_random_uuid(), '<USER_ID>', to_char(current_date, 'YYYY-MM'), 5000, 3200, 1800),
  (gen_random_uuid(), '<USER_ID>', to_char(current_date + interval '1 month', 'YYYY-MM'), 5000, 3100, 1900),
  (gen_random_uuid(), '<USER_ID>', to_char(current_date + interval '2 month', 'YYYY-MM'), 5000, 3000, 2000);
