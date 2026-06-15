create policy "team_state_select" on team_state
  for select using (auth.uid() = user_id);

create policy "team_state_insert" on team_state
  for insert with check (auth.uid() = user_id);

create policy "team_state_update" on team_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "team_state_delete" on team_state
  for delete using (auth.uid() = user_id);
